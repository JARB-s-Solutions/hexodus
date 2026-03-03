# Módulo de Métodos de Pago

## Descripción

Este módulo permite gestionar los métodos de pago del sistema desde la sección de configuración. Se integra con la API externa de Hexodus para obtener y crear métodos de pago.

## Ubicación

- **Tab de configuración**: Accesible desde `Configuración > Métodos de Pago`
- **Ruta**: `/configuracion` (tab "Métodos de Pago")
- **Integración**: También usado en el módulo de Ventas para filtrar transacciones

## Archivos Implementados

### 1. Servicio API
**Ubicación**: `lib/services/metodos-pago.ts`

Funciones principales:
- `getMetodosPago()`: Obtiene todos los métodos de pago
- `createMetodoPago(nombre)`: Crea un nuevo método de pago

**API Endpoints**:
- `GET https://hexodusapi.vercel.app/api/metodos-pago`
- `POST https://hexodusapi.vercel.app/api/metodos-pago`

### 2. Componente UI
**Ubicación**: `components/configuracion/metodos-pago-tab.tsx`

Características:
- Tabla con listado de métodos de pago
- Botón "Agregar Método" con modal
- Estados de carga y error
- Toast notifications para feedback
- Auto-reload al crear nuevo método

### 3. Navegación
**Actualizados**:
- `components/configuracion/config-tabs.tsx`: Agregado tab "metodosPago"
- `app/configuracion/page.tsx`: Import y renderizado del componente

### 4. Integración con Ventas
**Actualizados**:
- `components/ventas/ventas-toolbar.tsx`: Select dinámico de métodos de pago
- `lib/services/ventas.ts`: Parámetro `metodo_pago` agregado
- `app/page.tsx` (Ventas): Filtrado por método de pago desde backend

**Flujo de filtrado**:
1. Usuario selecciona método de pago en toolbar
2. Se envía parámetro `metodo_pago` a la API
3. Backend retorna ventas filtradas
4. Ejemplo: `GET /api/ventas?metodo_pago=Transferencia SPEI`

## Autenticación

### ⚠️ IMPORTANTE: Configuración del Token

El servicio requiere un token Bearer para autenticación. Está configurado para usar la misma key que el sistema de autenticación del proyecto (`auth_token`):

```typescript
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}
```

**El token se guarda automáticamente al iniciar sesión**, por lo que no necesitas configurarlo manualmente.

### Opciones de Configuración

#### Opción 1: localStorage (Actual)
```typescript
// Guardar token después del login
localStorage.setItem("authToken", "tu_token_aqui")

// El servicio lo leerá automáticamente
```

#### Opción 2: Context/Store Global
Si tu sistema usa un Context o store (Zustand, Redux, etc.):

```typescript
// lib/services/metodos-pago.ts
import { useAuthStore } from "@/store/auth" // Ejemplo

function getAuthToken(): string | null {
  return useAuthStore.getState().token
}
```

#### Opción 3: Cookies
```typescript
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("authToken="))
    ?.split("=")[1] || null
}
```

### ✅ Token Automático

**El token se configura automáticamente** cuando el usuario inicia sesión en el sistema. No necesitas hacer nada adicional.

**Para verificar que tienes un token válido**:
```typescript
// En la consola del navegador
console.log(localStorage.getItem("auth_token"))
```

**Si el token no existe**, simplemente:
1. Cierra sesión (si tienes sesión)
2. Vuelve a iniciar sesión
3. El token se guardará automáticamente

## Estructura de Datos

### MetodoPago Interface
```typescript
interface MetodoPago {
  id: string
  nombre: string
  activo?: boolean
  createdAt?: string
}
```

### Request POST
```json
{
  "nombre": "Transferencia SPEI"
}
```

### Response GET
```json
[
  {
    "id": "1",
    "nombre": "Efectivo",
    "activo": true,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "2",
    "nombre": "Tarjeta",
    "activo": true,
    "createdAt": "2024-01-16T14:20:00Z"
  }
]
```

## Manejo de Errores

El servicio maneja varios tipos de errores:

- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Sin permisos
- **400 Bad Request**: Datos inválidos
- **Network errors**: Problemas de conexión

Todos los errores se muestran al usuario mediante toast notifications.

## UI/UX

### Estados Visuales

1. **Loading**: Spinner mientras carga métodos
2. **Empty State**: Mensaje cuando no hay métodos
3. **Error State**: Mensaje de error con botón "Reintentar"
4. **Success State**: Tabla con métodos listados

### Tabla de Métodos

Columnas:
- **Nombre**: Con ícono CreditCard
- **Estado**: Badge verde (Activo) / gris (Inactivo)
- **Fecha Creación**: Formato DD MMM YYYY

### Modal Crear Método

- Input de texto para nombre
- Validación: no vacío
- Enter para guardar rápido
- Loading state en botón guardar

## Testing

### Verificar Integración

1. **Navegar** a Configuración
2. **Click** en tab "Métodos de Pago"
3. **Verificar** que cargue la lista (si hay datos)
4. **Click** en "Agregar Método"
5. **Ingresar** nombre y guardar
6. **Verificar** que aparezca en la tabla

### Casos de Error a Probar

1. Sin token: Debe mostrar error de autenticación
2. Token inválido: Debe mostrar error 401
3. Nombre vacío: Debe deshabilitar botón guardar
4. Error de red: Debe mostrar error con botón reintentar

## Próximas Mejoras

- [ ] Editar métodos existentes
- [ ] Eliminar métodos
- [ ] Activar/desactivar métodos
- [ ] Búsqueda y filtros
- [ ] Paginación para muchos métodos
- [ ] Ordenamiento por columna
- [ ] Reordenar prioridad de métodos

## Notas Importantes

1. **Token Automático**: El token se guarda automáticamente al iniciar sesión
2. **API Externa**: Los endpoints consumen la API de Hexodus (no local)
3. **No afecta config local**: Este tab no usa el sistema config/onChange de otros tabs
4. **Standalone**: Funciona independiente de otros tabs de configuración
5. **Autenticación compartida**: Usa el mismo sistema de auth que el resto de la app

## Soporte

Si encuentras problemas:
1. Verifica que hayas iniciado sesión correctamente
2. Revisa que el token exista: `localStorage.getItem("auth_token")`
3. Revisa la consola del navegador para errores de red
4. Verifica que la API externa esté disponible
5. Si el error persiste, cierra sesión e inicia sesión nuevamente
