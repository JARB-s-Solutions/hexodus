# Impresora Térmica WebUSB - Documentación

## 📋 Descripción General

Sistema de impresión de tickets de membresía utilizando impresoras térmicas USB vía WebUSB API. Funciona tanto en desarrollo (localhost) como en producción (HTTPS).

## 🌟 Características

- ✅ Conexión directa USB sin drivers adicionales
- ✅ Compatible con impresoras ESC/POS estándar (58mm y 80mm)
- ✅ **Impresión automática después del primer emparejamiento**
- ✅ Primera vez: Solicita permiso USB y empareja impresora
- ✅ Siguientes veces: Conecta e imprime automáticamente sin intervención
- ✅ Formato profesional con todos los detalles del ticket
- ✅ Manejo de errores robusto
- ✅ Funciona en Chrome, Edge y Opera

## 🖨️ Impresoras Compatibles

### Marcas Probadas
- Epson TM-series (TM-T20, TM-T88)
- Star Micronics
- GOOJPRT
- Custom
- Impresoras genéricas chinas 58mm/80mm

### Vendor IDs Soportados
- `0x0416` - CUSTOM
- `0x04b8` - EPSON  
- `0x05b0` - STAR
- `0x28e9` - GOOJPRT
- `0x0483` - Generic STM32
- `0x1fc9` - Generic Chinese printers

## 🔧 Requisitos Técnicos

### Navegadores Soportados
- ✅ Chrome/Chromium (v61+)
- ✅ Microsoft Edge (v79+)
- ✅ Opera (v48+)
- ❌ Firefox (WebUSB no soportado)
- ❌ Safari (WebUSB no soportado)

### Entornos
- ✅ **Desarrollo**: http://localhost (WebUSB permitido)
- ✅ **Producción**: HTTPS (requerido por WebUSB)
- ❌ HTTP en producción (bloqueado por seguridad)

### Hardware
- Puerto USB disponible
- Impresora térmica ESC/POS
- Cable USB (tipo A a tipo B o micro-USB según modelo)

## 📦 Archivos Creados

```
lib/
  services/
    thermal-printer.ts      # Servicio principal de impresión
  types/
    webusb.d.ts            # Definiciones TypeScript para WebUSB

components/
  socios/
    imprimir-ticket-modal.tsx  # Modal de impresión
    socio-modal.tsx            # Modificado para integrar impresión
    checkout-socio-modal.tsx   # Modificado para pasar método de pago
```

## 🚀 Flujo de Uso

### 1. Primera Vez (Emparejamiento)

```
Usuario completa formulario
    ↓
Selecciona membresía y fecha
    ↓
Confirma pago (elige método)
    ↓
Sistema registra socio ✅
    ↓
Sistema muestra modal de impresión
    ↓
Sistema intenta auto-conectar (no encuentra impresora)
    ↓
Usuario conecta impresora USB física
    ↓
Clic en "Conectar Impresora"
    ↓
Navegador solicita permiso USB 🔐
    ↓
Usuario APRUEBA dispositivo (¡importante!)
    ↓
Clic en "Imprimir Ticket"
    ↓
Ticket impreso ✅
    ↓
Navegador RECUERDA el dispositivo
```

### 2. Siguientes Veces (Automático) 🚀

```
Usuario completa formulario
    ↓
Selecciona membresía y fecha
    ↓
Confirma pago (elige método)
    ↓
Sistema registra socio ✅
    ↓
Sistema muestra modal de impresión
    ↓
Sistema auto-conecta a impresora guardada ⚡
    ↓
Sistema imprime automáticamente ⚡
    ↓
Ticket impreso ✅
    ↓
Modal se cierra solo después de 2 segundos
```

**✨ Todo el proceso toma ~3 segundos después del primer emparejamiento**

### 2. Contenido del Ticket

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     HEXODUS GYM
   Av. Principal #123
   Tel: +52 555 123 4567
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   COMPROBANTE DE PAGO
        MEMBRESIA
        
Ticket: #1234567890
Fecha: 18/12/2024
Hora: 02:30 PM

--------------------------------
CLIENTE
Nombre: Juan Pérez González
Codigo: SOC-001

--------------------------------
MEMBRESIA
Plan: Mensual Completo
Duracion: 30 dias
Inicia: 18/12/2024
Vence: 17/01/2025

--------------------------------
Precio: $500.00
Descuento: -$50.00
--------------------------------
TOTAL: $450.00
Metodo Pago: Efectivo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

¡Bienvenido al equipo Hexodus!
    ¡Gracias por tu preferencia!
        www.hexodus.com
        
        
```

## 🔌 Conexión de Impresora

### Magia de la Reconexión Automática ✨

El sistema utiliza la API `navigator.usb.getDevices()` para recuperar dispositivos USB previamente autorizados. Una vez que el usuario aprueba un dispositivo la primera vez, el navegador lo recuerda y lo hace disponible para reconexiones automáticas.

**Cómo funciona:**
1. **Primera conexión**: Se llama a `navigator.usb.requestDevice()` que muestra el selector
2. **Usuario aprueba**: El navegador guarda el permiso asociado al sitio web
3. **Siguientes conexiones**: Se llama a `navigator.usb.getDevices()` que devuelve dispositivos guardados
4. **Auto-reconexión**: El sistema conecta automáticamente sin mostrar el selector

**Importante:**
- Los permisos se guardan por dominio/sitio web
- Los permisos persisten entre sesiones del navegador
- El usuario puede revocar permisos desde Configuración del navegador
- Funciona incluso si el usuario desconecta y reconecta la impresora USB

### Primera Vez (Permisos)

1. Conectar impresora USB y encenderla
2. Abrir formulario de registro de socio
3. Completar pago exitosamente
4. En modal de impresión, clic "Conectar Impresora"
5. Navegador muestra lista de dispositivos USB
6. Seleccionar impresora térmica
7. Clic "Conectar"
8. **¡El navegador recuerda este dispositivo!**

### Subsecuentes Impresiones

Una vez otorgado el permiso:
- ✅ El modal detecta automáticamente la impresora guardada
- ✅ Conecta automáticamente sin solicitar permiso
- ✅ Imprime automáticamente el ticket
- ✅ Cierra el modal automáticamente después de confirmar
- ⚡ **Todo en ~3 segundos sin intervención del usuario**

## 🎯 Comandos ESC/POS Implementados

```typescript
// Inicialización
ESC @ - Reiniciar impresora

// Alineación
ESC a 0 - Izquierda
ESC a 1 - Centro
ESC a 2 - Derecha

// Tamaño de texto
ESC ! 0x00 - Normal
ESC ! 0x10 - Doble altura
ESC ! 0x20 - Doble ancho
ESC ! 0x30 - Doble tamaño

// Estilo
ESC E 1 - Negrita ON
ESC E 0 - Negrita OFF
ESC - 1 - Subrayado ON
ESC - 0 - Subrayado OFF

// Corte de papel
GS V 0 - Corte completo
GS V 1 - Corte parcial
```

## 📝 API de Servicio

### `ThermalPrinter` (Clase Principal)

```typescript
// Crear instancia
const printer = new ThermalPrinter()

// Conectar impresora (muestra selector USB)
await printer.connect()

// Conectar a impresora guardada automáticamente (sin selector)
const conectado = await printer.connectToSavedDevice()
if (conectado) {
  console.log('✅ Reconectado automáticamente')
} else {
  console.log('📭 No hay impresora guardada')
}

// Verificar conexión
const isConnected = printer.isConnected()

// Imprimir ticket
await printer.printTicket(ticketData)

// Desconectar
await printer.disconnect()

// Impresión de prueba
await printer.testPrint()
```

### `connectToSavedDevice()` - Reconexión Automática

Este método intenta conectarse a una impresora previamente autorizada sin mostrar el selector USB.

**Retorno:**
- `true`: Se conectó exitosamente a un dispositivo guardado
- `false`: No hay dispositivos guardados o la conexión falló

**Uso típico:**
```typescript
const printer = getPrinterInstance()

// Intentar reconexión automática al abrir modal
const autoConectado = await printer.connectToSavedDevice()

if (autoConectado) {
  // Imprimir automáticamente
  await printer.printTicket(ticketData)
} else {
  // Mostrar botón para conexión manual
  mostrarBotonConectar()
}
```

**Casos de uso:**
- ✅ Impresión automática después del primer emparejamiento
- ✅ Reconexión silenciosa en background
- ✅ Verificar disponibilidad de impresora sin molestar al usuario
- ✅ Optimizar flujos de trabajo repetitivos

### `formatTicketData` (Helper)

```typescript
import { formatTicketData } from '@/lib/services/thermal-printer'

const ticketData = formatTicketData(
  socioData,      // Datos del socio
  membresiaData,  // Datos de la membresía
  metodoPago,     // Nombre del método de pago
  ticketNumero    // Número de ticket (opcional)
)
```

### `getPrinterInstance` (Singleton)

```typescript
import { getPrinterInstance } from '@/lib/services/thermal-printer'

const printer = getPrinterInstance()
await printer.connect()
```

## 🛠️ Configuración Avanzada

### Cambiar Información de Empresa

Editar [lib/services/thermal-printer.ts](../lib/services/thermal-printer.ts):

```typescript
return {
  empresaNombre: 'TU GIMNASIO',
  empresaDireccion: 'Tu dirección',
  empresaTelefono: 'Tu teléfono',
  // ...
}
```

### Agregar Nuevas Marcas de Impresoras

Agregar vendor ID en [lib/services/thermal-printer.ts](../lib/services/thermal-printer.ts):

```typescript
this.device = await navigator.usb.requestDevice({
  filters: [
    // ...impresoras existentes
    { vendorId: 0xABCD }, // Nueva marca
  ]
})
```

### Personalizar Formato del Ticket

Modificar método `printTicket` en [lib/services/thermal-printer.ts](../lib/services/thermal-printer.ts):

```typescript
async printTicket(data: TicketData): Promise<void> {
  // ... código existente
  
  // Agregar logo (si tienes comandos ESC/POS para imágenes)
  // await this.sendCommand(LOGO_COMMANDS)
  
  // Modificar formato de líneas
  await this.printLine('Custom Field', data.customValue)
  
  // ...
}
```

## 🐛 Troubleshooting

### "WebUSB no está soportado"
- **Causa**: Navegador incompatible
- **Solución**: Usar Chrome, Edge u Opera

### "Impresora no conectada"
- **Causa**: No se otorgó permiso USB
- **Solución**: Clic en "Conectar Impresora" y aprobar dispositivo

### La impresora no se conecta automáticamente
- **Causa**: Permisos USB no fueron guardados correctamente
- **Solución**: Desconectar, volver a conectar y aprobar nuevamente en el selector USB
- **Verificar**: Ir a Configuración del navegador → Privacidad → Permisos de sitio → USB

### "No se encontró endpoint de salida"
- **Causa**: Impresora no compatible con perfil USB estándar
- **Solución**: Verificar que sea impresora ESC/POS

### Impresión con caracteres extraños
- **Causa**: Encoding incorrecto
- **Solución**: Verificar que impresora use codificación Latin-1 o UTF-8

### Papel no corta automáticamente
- **Causa**: Impresora no tiene autocortador
- **Solución**: Cortar manualmente o usar `COMMANDS.CUT_PAPER` en lugar de `COMMANDS.CUT_PARTIAL`

### La impresora se desconecta frecuentemente
- **Causa**: Cable USB defectuoso o puerto USB con problemas de energía
- **Solución**: 
  - Probar con otro cable USB
  - Conectar a un puerto USB diferente
  - Usar hub USB con alimentación externa si es necesario

### Revocar permisos USB (para testing)
Si necesitas probar el flujo de primera conexión nuevamente:

**Chrome/Edge:**
1. Abrir DevTools (F12)
2. Ir a Application → Storage → Clear site data
3. O ir a chrome://settings/content/usbDevices
4. Buscar el sitio y eliminar permisos

**Método alternativo:**
1. Clic en el ícono de candado/información junto a la URL
2. Configuración del sitio → Permisos → USB
3. Eliminar dispositivos autorizados

## 🔒 Seguridad

### Permisos USB
- El usuario debe aprobar explícitamente cada dispositivo USB
- Los permisos se recuerdan por sitio web
- No se puede acceder a dispositivos sin interacción del usuario

### HTTPS Requerido
- WebUSB solo funciona en HTTPS en producción
- localhost está exento por razones de desarrollo
- Cualquier intento de uso en HTTP público será bloqueado

## 📊 Monitoreo y Logs

### Logs en Consola

```javascript
console.log('✅ Impresora conectada:', deviceInfo)
console.log('🖨️ Imprimiendo ticket...', ticketData)
console.log('✅ Ticket impreso correctamente')
console.error('❌ Error conectando impresora:', error)
```

### Eventos

```typescript
// En el futuro se pueden agregar listeners
printer.on('connected', () => {})
printer.on('disconnected', () => {})
printer.on('error', (error) => {})
```

## 🚧 Mejoras Futuras

- [x] ~~Auto-reconexión a impresora guardada~~ ✅ **IMPLEMENTADO**
- [x] ~~Impresión automática sin intervención del usuario~~ ✅ **IMPLEMENTADO**
- [ ] Soporte para impresión de códigos de barras
- [ ] Soporte para códigos QR
- [ ] Impresión de logos (requiere conversión de imagen a comandos ESC/POS)
- [ ] Cola de impresión para múltiples tickets
- [ ] Configuración de ancho de papel (58mm vs 80mm)
- [ ] Guardado de preferencias de impresora múltiples
- [ ] Re-impresión de tickets históricos
- [ ] Vista previa de ticket antes de imprimir
- [ ] Detección automática de impresoras USB conectadas

## 📄 Licencia

Este código es parte del sistema Hexodus y está protegido bajo las políticas de la empresa.

## 👨‍💻 Soporte

Para problemas o preguntas sobre la impresora térmica:
1. Verificar este documento primero
2. Revisar logs en consola del navegador
3. Contactar al equipo de desarrollo

---

**Última actualización**: Marzo 2026  
**Versión**: 2.0.0 🚀  
**Features**: Auto-reconexión e impresión automática implementadas
