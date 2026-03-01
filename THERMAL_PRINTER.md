# Impresora Térmica WebUSB - Documentación

## 📋 Descripción General

Sistema de impresión de tickets de membresía utilizando impresoras térmicas USB vía WebUSB API. Funciona tanto en desarrollo (localhost) como en producción (HTTPS).

## 🌟 Características

- ✅ Conexión directa USB sin drivers adicionales
- ✅ Compatible con impresoras ESC/POS estándar (58mm y 80mm)
- ✅ Impresión automática después del pago de membresía
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

### 1. Registro de Socio con Pago

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
Usuario conecta impresora USB
    ↓
Clic en "Conectar Impresora"
    ↓
Navegador solicita permiso USB
    ↓
Usuario aprueba dispositivo
    ↓
Clic en "Imprimir Ticket"
    ↓
Ticket impreso ✅
```

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

### Primera Vez (Permisos)

1. Conectar impresora USB y encenderla
2. Abrir formulario de registro de socio
3. Completar pago exitosamente
4. En modal de impresión, clic "Conectar Impresora"
5. Navegador muestra lista de dispositivos USB
6. Seleccionar impresora térmica
7. Clic "Conectar"

### Subsecuentes Impresiones

Una vez otorgado el permiso, el navegador recuerda el dispositivo y la conexión es más rápida.

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

// Conectar impresora
await printer.connect()

// Verificar conexión
const isConnected = printer.isConnected()

// Imprimir ticket
await printer.printTicket(ticketData)

// Desconectar
await printer.disconnect()

// Impresión de prueba
await printer.testPrint()
```

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

### "No se encontró endpoint de salida"
- **Causa**: Impresora no compatible con perfil USB estándar
- **Solución**: Verificar que sea impresora ESC/POS

### Impresión con caracteres extraños
- **Causa**: Encoding incorrecto
- **Solución**: Verificar que impresora use codificación Latin-1 o UTF-8

### Papel no corta automáticamente
- **Causa**: Impresora no tiene autocortador
- **Solución**: Cortar manualmente o usar `COMMANDS.CUT_PAPER` en lugar de `COMMANDS.CUT_PARTIAL`

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

- [ ] Soporte para impresión de códigos de barras
- [ ] Soporte para códigos QR
- [ ] Impresión de logos (requiere conversión de imagen a comandos ESC/POS)
- [ ] Cola de impresión para múltiples tickets
- [ ] Configuración de ancho de papel (58mm vs 80mm)
- [ ] Guardado de preferencias de impresora
- [ ] Re-impresión de tickets históricos
- [ ] Vista previa de ticket antes de imprimir

## 📄 Licencia

Este código es parte del sistema Hexodus y está protegido bajo las políticas de la empresa.

## 👨‍💻 Soporte

Para problemas o preguntas sobre la impresora térmica:
1. Verificar este documento primero
2. Revisar logs en consola del navegador
3. Contactar al equipo de desarrollo

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0.0
