# ISSUE: Error WebUSB al conectar impresora térmica - Access denied en USBDevice.open

**Área:** Frontend - Impresión térmica / Tickets / WebUSB  
**Prioridad:** Alta  
**Estado:** Pendiente de decisión técnica  
**Fecha:** 2026-05-27

## Resumen

Al intentar conectar la impresora térmica desde el frontend aparece el error:

```txt
Failed to execute 'open' on 'USBDevice': Access denied.
```

El error ocurre cuando el servicio intenta ejecutar `device.open()` sobre el dispositivo USB seleccionado o recuperado por el navegador.

Este problema no parece venir del backend. Es un problema de integración entre navegador, WebUSB, sistema operativo, driver de la impresora y arquitectura de impresión.

## Evidencia en código

Archivo: `lib/services/thermal-printer.ts`

El flujo manual de conexión hace:

```ts
this.device = await navigator.usb.requestDevice(...)
await this.device.open()
```

El flujo automático hace:

```ts
const devices = await navigator.usb.getDevices()
this.device = devices[0]
await this.device.open()
```

El error reportado ocurre exactamente en `await this.device.open()`.

También los modales intentan reconectar automáticamente al abrir:

- `components/socios/imprimir-ticket-modal.tsx`
- `components/ventas/imprimir-ticket-venta-modal.tsx`

Ambos ejecutan `printer.connectToSavedDevice()` desde un `useEffect`.

## Diagnóstico probable

La causa más probable es que la impresora térmica está siendo controlada por el sistema operativo como impresora normal.

En Windows, muchas impresoras térmicas USB se instalan con un driver de impresión y quedan tomadas por el spooler de Windows. Cuando eso ocurre, Chrome/Edge puede mostrar el dispositivo en el selector WebUSB, pero al intentar abrirlo con `device.open()` el sistema operativo responde `Access denied`.

En términos prácticos:

- El navegador ve el USB.
- El usuario puede otorgar permiso.
- Pero el sistema operativo no permite que Chrome abra el dispositivo porque ya está reclamado por otro driver o proceso.

## Causas posibles

1. **Driver/spooler de Windows tiene tomada la impresora**
   - Muy probable.
   - La impresora aparece instalada en "Impresoras y escáneres".
   - Chrome no puede tomar control directo del dispositivo USB.

2. **Otro proceso tiene abierta la impresora**
   - Software del fabricante.
   - Panel de pruebas.
   - Cola de impresión de Windows.
   - Otra pestaña o instancia del navegador.

3. **Permiso USB revocado o inconsistente**
   - El sitio tiene permiso guardado, pero el dispositivo cambió de puerto, driver o identificador.
   - `getDevices()` recupera un dispositivo que ya no puede abrirse.

4. **La impresora usa una clase USB bloqueada o no compatible con WebUSB**
   - Algunas interfaces USB de tipo printer no funcionan bien con WebUSB desde Chrome.
   - WebUSB no puede "desenganchar" drivers del sistema operativo como sí puede hacerse en entornos nativos.

5. **Reconexión automática demasiado optimista**
   - El modal intenta abrir la impresora automáticamente desde `useEffect`.
   - Aunque `getDevices()` está permitido sin gesto de usuario, la experiencia falla silenciosamente si el dispositivo ya no es abrible.
   - Esto puede dejar estados confusos para el usuario.

6. **Selección automática del primer dispositivo autorizado**
   - `connectToSavedDevice()` usa `devices[0]`.
   - Si hay más de un USB autorizado, puede intentar abrir un dispositivo incorrecto.

7. **Vendor ID incorrecto para Star**
   - En código aparece `{ vendorId: 0x05b }`.
   - En documentación se indica `0x05b0`.
   - Esto no explica el `Access denied`, pero sí puede impedir detectar algunos modelos correctamente.

## Punto importante

WebUSB no es equivalente a imprimir usando el driver normal del sistema operativo.

Para imprimir por WebUSB, el navegador necesita acceso crudo al dispositivo USB. Si Windows ya lo administra como impresora, normalmente WebUSB queda bloqueado.

## Soluciones posibles

### Opción 1 - Recomendada para producción: puente local de impresión

Usar un servicio local instalado en la computadora del gimnasio para imprimir.

Opciones:

- QZ Tray.
- Aplicación local Node/Electron.
- Servicio local propio en `localhost` que reciba el ticket y escriba a la impresora.
- Motor local existente ampliado para manejar impresión.

Flujo recomendado:

1. Frontend genera los datos del ticket.
2. Frontend envía el ticket a un servicio local.
3. Servicio local imprime usando el driver del sistema operativo o acceso nativo ESC/POS.
4. El navegador ya no necesita abrir USB directamente.

Ventajas:

- Funciona mejor en Windows.
- Aprovecha drivers existentes.
- Menos problemas de permisos del navegador.
- Mejor para operación diaria de recepción.

### Opción 2 - WebUSB avanzado con driver WinUSB

Configurar la impresora para que use un driver compatible con acceso USB crudo, por ejemplo WinUSB usando Zadig.

Advertencias:

- Requiere intervención técnica en la PC.
- Puede hacer que la impresora deje de funcionar como impresora normal en Windows.
- No es ideal para clientes no técnicos.
- Debe probarse por modelo exacto de impresora.

### Opción 3 - Web Serial si la impresora expone puerto COM

Algunas impresoras térmicas USB aparecen como puerto serial COM.

En ese caso, Web Serial suele ser más estable que WebUSB:

- `navigator.serial.requestPort()`
- abrir puerto COM
- enviar comandos ESC/POS por serial

Requiere confirmar que el modelo exponga interfaz serial.

### Opción 4 - Reducir automatismos y mejorar UX de WebUSB

Si se mantiene WebUSB temporalmente:

- No intentar autoabrir automáticamente en `useEffect` si hubo un error previo.
- Mostrar un diagnóstico claro cuando `device.open()` devuelva `Access denied`.
- Permitir "olvidar impresora guardada" y reconectar manualmente.
- Filtrar dispositivos guardados por `vendorId/productId`, no usar siempre `devices[0]`.
- Liberar interfaz antes de cerrar, cuando aplique.
- Corregir vendor ID de Star de `0x05b` a `0x05b0`.

Esto mejora la experiencia, pero no resuelve el bloqueo de fondo si Windows tiene tomada la impresora.

## Recomendación técnica

Para un gimnasio en producción, no se recomienda depender de WebUSB directo para impresión térmica.

La solución más profesional es usar un puente local de impresión. El proyecto ya tiene un patrón similar con el motor local de huella (`NEXT_PUBLIC_MOTOR_URL`). Se puede crear o extender un servicio local para impresión térmica:

```txt
Frontend Vercel
  -> http://localhost:<puerto>/printer/print
  -> Servicio local de impresión
  -> Driver/USB/ESC-POS
  -> Impresora térmica
```

Así el navegador deja de pelear con permisos USB y el sistema operativo imprime de forma nativa.

## Criterios de aceptación

1. El usuario puede imprimir tickets desde ventas y membresías sin error `Access denied`.
2. El sistema muestra un mensaje claro si la impresora está ocupada, sin driver compatible o no configurada.
3. La impresión funciona después de cerrar y abrir el navegador.
4. La solución no requiere cambiar permisos del navegador en cada impresión.
5. La solución funciona en la PC real del gimnasio con el modelo exacto de impresora.
6. Si se usa WebUSB, se documenta el driver requerido y el proceso de instalación.
7. Si se usa puente local, el frontend detecta disponibilidad del servicio local y muestra estado de conexión.

## Pruebas sugeridas

### Prueba 1: Confirmar driver/spooler

- Abrir "Impresoras y escáneres" en Windows.
- Revisar si la impresora aparece instalada como impresora normal.
- Cerrar cualquier software del fabricante.
- Limpiar cola de impresión.
- Reintentar conexión WebUSB.

Si sigue fallando, el driver probablemente bloquea acceso crudo.

### Prueba 2: Revocar permiso USB

- Ir a `chrome://settings/content/usbDevices`.
- Eliminar permisos guardados para el sitio.
- Desconectar y reconectar la impresora.
- Reintentar conexión desde el botón manual.

### Prueba 3: Otro navegador Chromium

- Probar en Chrome y Edge.
- Debe usarse HTTPS o localhost.

### Prueba 4: Confirmar modelo e IDs USB

- Revisar `vendorId` y `productId` reales desde DevTools o herramientas del sistema.
- Asegurar que el filtro del código incluya ese `vendorId`.

### Prueba 5: Probar puente local

- Crear una prueba mínima local que imprima texto ESC/POS usando Node o QZ Tray.
- Si imprime correctamente, confirmar que el problema no es el ticket sino WebUSB.

## Nota final

El mensaje `Access denied` después de seleccionar la impresora no significa necesariamente que el usuario negó el permiso. Muchas veces significa que el navegador tiene permiso del sitio, pero el sistema operativo no le permite abrir el dispositivo porque está siendo administrado por otro driver.
