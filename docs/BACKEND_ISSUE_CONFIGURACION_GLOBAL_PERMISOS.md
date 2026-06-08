# ISSUE: Lectura global de configuración bloqueada por permiso administrativo

**Área:** Backend - Configuración / Permisos / UX global  
**Prioridad:** Alta  
**Estado:** Pendiente de corrección en backend  
**Fecha:** 2026-05-26

## Resumen

Los usuarios que no tienen el permiso `configuracion.ver` reciben una alerta de "Acceso denegado" al navegar entre pantallas, aunque no estén intentando entrar al módulo de configuración.

La causa es que el frontend sincroniza configuración global del sistema al montar la aplicación, pero el backend protege `GET /api/configuracion/sistema` con el permiso administrativo `configuracion.ver`.

Esto mezcla dos casos de uso distintos:

1. **Administrar configuración:** ver/editar el módulo de configuración.
2. **Consumir configuración global:** aplicar colores, logos, nombre del sistema y datos de ticket en cualquier módulo.

El segundo caso debe estar disponible para cualquier usuario autenticado, aunque no pueda ver ni administrar el módulo de configuración.

## Flujo esperado

1. El administrador configura el sistema: colores, logos, nombre del negocio, datos de ticket, mensajes, etc.
2. Cualquier usuario autenticado puede consumir esa configuración global.
3. Solo usuarios con permisos de configuración pueden entrar al módulo de configuración y editar/restablecer valores.

## Comportamiento actual

1. El usuario inicia sesión con un rol operativo sin `configuracion.ver`.
2. El frontend monta providers globales.
3. `ThemeProvider` llama a `ThemeService.sincronizarConBackend()`.
4. `ThemeService` llama a `ConfiguracionService.obtenerConfiguracionUnificada()`.
5. El frontend hace `GET /api/configuracion/sistema`.
6. El backend responde `403` porque la ruta exige `configuracion.ver`.
7. `lib/api.ts` dispara el evento global `api:forbidden`.
8. El usuario ve el toast de acceso denegado al cambiar de pantallas, aunque no realizó una acción administrativa.

## Evidencia en código

### Frontend

`components/theme-provider-custom.tsx`

- `ThemeProvider` se monta en `app/layout.tsx`.
- Al montar ejecuta `ThemeService.sincronizarConBackend()`.

`lib/services/theme.ts`

- `sincronizarConBackend()` llama a `ConfiguracionService.obtenerConfiguracionUnificada()`.

`lib/services/configuracion.ts`

- `obtenerConfiguracionUnificada()` llama a `GET /configuracion/sistema`.

`lib/api.ts`

- Cuando una petición responde `403`, se dispara `api:forbidden`.
- `ForbiddenToast` muestra la alerta global de acceso denegado.

### Backend

`src/routes/configuracionRoutes.js`

```js
router.use(verificarToken);
router.get('/sistema', verificarPermiso("configuracion", "ver"), getConfiguracion);
```

La ruta requiere token, lo cual es correcto, pero además exige `configuracion.ver`, lo cual es incorrecto para lectura global de runtime.

## Causa raíz

La ruta `GET /api/configuracion/sistema` está diseñada como si solo perteneciera al módulo administrativo de configuración, pero en la práctica funciona como endpoint global de runtime para toda la app.

La autorización está demasiado estricta para una lectura que no modifica datos y que necesitan todos los usuarios autenticados.

## Requerimiento técnico

Separar explícitamente:

### Lectura global de configuración

Debe requerir solo usuario autenticado.

Ejemplos de rutas posibles:

- `GET /api/configuracion/sistema/publica`
- `GET /api/configuracion/runtime`
- o mantener `GET /api/configuracion/sistema` solo con `verificarToken`

Esta ruta debe devolver únicamente campos seguros de consumo global, por ejemplo:

- `colorPrincipal`
- `colorSecundario`
- `modoTema`
- `nombreSistema`
- `logoSistema`
- `gimnasioNombre`
- `gimnasioDomicilio`
- `gimnasioTelefono`
- `gimnasioRFC`
- `gimnasioLogo`
- `ticketFooter`
- `ticketMensajeAgradecimiento`
- `updatedAt`

No debe exponer metadatos administrativos innecesarios, como `updatedBy`, información interna del usuario actualizador o datos de auditoría.

### Administración de configuración

Debe seguir protegida por permisos:

- Ver pantalla de configuración: `configuracion.ver`
- Editar configuración: `configuracion.editar`
- Eliminar logos: `configuracion.editar`
- Restablecer valores: `configuracion.editar`

Las rutas de escritura no deben relajarse.

## Propuesta recomendada

Crear una ruta nueva de solo lectura global:

```js
router.get('/sistema/runtime', getConfiguracionRuntime);
```

Como `router.use(verificarToken)` ya se aplica antes, esta ruta queda disponible solo para usuarios autenticados, pero no exige `configuracion.ver`.

Luego dejar la ruta administrativa actual para el módulo de configuración:

```js
router.get('/sistema', verificarPermiso("configuracion", "ver"), getConfiguracion);
```

Ventaja:

- No se rompe el contrato actual del módulo administrativo.
- El frontend puede migrar `ThemeService` y servicios de ticket a `/configuracion/sistema/runtime`.
- La intención de seguridad queda clara.

## Criterios de aceptación

1. Un usuario autenticado sin `configuracion.ver` puede obtener la configuración global necesaria para tema y ticket.
2. Ese usuario no ve toasts de "Acceso denegado" al cambiar entre pantallas por sincronización de configuración.
3. Ese usuario sigue sin poder entrar al módulo `/configuracion`.
4. Ese usuario no puede editar, eliminar logos ni restablecer configuración.
5. El administrador conserva acceso completo al módulo de configuración.
6. La respuesta global no incluye campos administrativos innecesarios.
7. El frontend puede seguir aplicando colores, logos y nombre del sistema en cualquier rol.
8. La impresión de tickets puede leer datos del negocio sin requerir permiso de configuración.

## Casos de prueba sugeridos

### Caso 1: Usuario operativo sin configuración.ver

- Iniciar sesión con rol sin `configuracion.ver`.
- Navegar a dashboard, socios, ventas e inventario.
- Resultado esperado: no aparece toast de acceso denegado por configuración.
- Resultado esperado: el tema, logo y nombre del sistema se cargan correctamente.

### Caso 2: Usuario operativo intenta abrir configuración

- Ir manualmente a `/configuracion`.
- Resultado esperado: el frontend redirige o bloquea la vista.
- Resultado esperado: backend sigue denegando rutas administrativas protegidas.

### Caso 3: Usuario operativo intenta editar configuración por API

- Intentar `PATCH /api/configuracion/sistema/apariencia`.
- Resultado esperado: `403`.

### Caso 4: Administrador

- Iniciar sesión como administrador.
- Abrir configuración.
- Editar apariencia y datos de ticket.
- Resultado esperado: cambios guardados correctamente.
- Resultado esperado: otros roles pueden consumir los cambios en lectura global.

## Riesgo de no corregir

- Mala experiencia para usuarios operativos.
- Toasts falsos de acceso denegado en flujos normales.
- Confusión sobre permisos reales.
- Posible ocultamiento de errores legítimos, porque el usuario se acostumbra a ver alertas de permiso.
- Acoplamiento incorrecto entre configuración visual global y módulo administrativo.

## Nota para frontend

Cuando el backend exponga la ruta global, el frontend debe apuntar la sincronización automática de tema/ticket a esa ruta. El módulo `/configuracion` puede seguir usando las rutas administrativas actuales.
