/**
 * Thermal Printer Service using WebUSB
 * Supports ESC/POS compatible thermal printers (58mm and 80mm)
 * Works in both development and production environments
 */

// ============================================================================
// ESC/POS COMMANDS
// ============================================================================

const ESC = 0x1b
const GS = 0x1d

const COMMANDS = {
  // Initialize printer
  INIT: [ESC, 0x40],
  
  // Text alignment
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  
  // Text size
  NORMAL: [ESC, 0x21, 0x00],
  DOUBLE_HEIGHT: [ESC, 0x21, 0x10],
  DOUBLE_WIDTH: [ESC, 0x21, 0x20],
  DOUBLE_SIZE: [ESC, 0x21, 0x30],
  
  // Text style
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  UNDERLINE_ON: [ESC, 0x2d, 0x01],
  UNDERLINE_OFF: [ESC, 0x2d, 0x00],
  
  // Line feed
  LINE_FEED: [0x0a],
  
  // Cut paper
  CUT_PAPER: [GS, 0x56, 0x00],
  CUT_PARTIAL: [GS, 0x56, 0x01],
  
  // Open cash drawer (if connected)
  OPEN_DRAWER: [ESC, 0x70, 0x00, 0x19, 0xfa],
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface TicketData {
  // Company info
  empresaNombre: string
  empresaDireccion?: string
  empresaTelefono?: string
  
  // Ticket info
  ticketNumero: string
  fecha: string
  hora: string
  
  // Customer info
  socioNombre: string
  socioCodigo: string
  
  // Product/Service info
  membresiaNombre: string
  duracionDias: number
  fechaInicio: string
  fechaVencimiento: string
  
  // Payment info
  precioBase: number
  descuento?: number
  total: number
  metodoPago: string
  
  // Footer
  mensajeFinal?: string
}

export interface PrinterInfo {
  vendorId: number
  productId: number
  name: string
}

// ============================================================================
// THERMAL PRINTER CLASS
// ============================================================================

export class ThermalPrinter {
  private device: USBDevice | null = null
  private endpoint: USBEndpoint | null = null
  
  /**
   * Request access to thermal printer via WebUSB
   */
  async connect(): Promise<boolean> {
    try {
      // Check if WebUSB is supported
      if (!navigator.usb) {
        throw new Error('WebUSB no está soportado en este navegador. Use Chrome, Edge o Opera.')
      }
      
      // Request device from user
      this.device = await navigator.usb.requestDevice({
        filters: [
          // Common thermal printer vendors
          { vendorId: 0x0416 }, // CUSTOM
          { vendorId: 0x04b8 }, // EPSON
          { vendorId: 0x05b}, // STAR
          { vendorId: 0x28e9 }, // GOOJPRT
          { vendorId: 0x0483 }, // Generic STM32
          { vendorId: 0x1fc9 }, // Generic Chinese printers
        ]
      })
      
      if (!this.device) {
        return false
      }
      
      // Open device
      await this.device.open()
      
      // Select configuration
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1)
      }
      
      // Claim interface
      await this.device.claimInterface(0)
      
      // Find OUT endpoint
      const endpoints = this.device.configuration?.interfaces[0].alternate.endpoints || []
      this.endpoint = endpoints.find((ep: any) => ep.direction === 'out') || null
      
      if (!this.endpoint) {
        throw new Error('No se encontró endpoint de salida en la impresora')
      }
      
      console.log('✅ Impresora conectada:', {
        name: this.device.productName,
        manufacturer: this.device.manufacturerName,
        vendorId: this.device.vendorId,
        productId: this.device.productId
      })
      
      return true
    } catch (error: any) {
      console.error('❌ Error conectando impresora:', error)
      throw new Error(error.message || 'No se pudo conectar con la impresora')
    }
  }
  
  /**
   * Try to connect to a previously authorized printer automatically
   * Returns true if successfully connected, false if no saved device found
   */
  async connectToSavedDevice(): Promise<boolean> {
    try {
      // Check if WebUSB is supported
      if (!navigator.usb) {
        return false
      }
      
      // Si ya hay un dispositivo conectado y funcionando, retornar true sin reconectar
      if (this.device && this.endpoint && this.device.opened) {
        console.log('✅ Impresora ya estaba conectada y lista')
        return true
      }
      
      // Si hay un dispositivo pero no está bien configurado, desconectar primero
      if (this.device) {
        console.log('🔄 Limpiando conexión anterior...')
        await this.disconnect()
      }
      
      // Get previously authorized devices
      const devices = await navigator.usb.getDevices()
      
      if (devices.length === 0) {
        console.log('📭 No hay impresoras previamente autorizadas')
        return false
      }
      
      // Try to connect to the first authorized printer
      this.device = devices[0]
      
      console.log('🔄 Conectando a impresora guardada:', {
        name: this.device.productName,
        vendorId: this.device.vendorId,
        productId: this.device.productId,
        opened: this.device.opened
      })
      
      // Si el dispositivo ya está abierto, cerrarlo primero para reiniciar la conexión
      if (this.device.opened) {
        console.log('⚠️ Dispositivo ya estaba abierto, cerrando para reiniciar...')
        try {
          await this.device.close()
          // Esperar un momento para que el cierre se complete
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (closeError) {
          console.warn('Error al cerrar dispositivo (se ignorará):', closeError)
          // Continuamos de todos modos
        }
      }
      
      // Open device
      await this.device.open()
      
      // Select configuration
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1)
      }
      
      // Claim interface
      await this.device.claimInterface(0)
      
      // Find OUT endpoint
      const endpoints = this.device.configuration?.interfaces[0].alternate.endpoints || []
      this.endpoint = endpoints.find((ep: any) => ep.direction === 'out') || null
      
      if (!this.endpoint) {
        throw new Error('No se encontró endpoint de salida en la impresora')
      }
      
      console.log('✅ Impresora reconectada automáticamente')
      
      return true
    } catch (error: any) {
      console.error('❌ Error conectando a impresora guardada:', error)
      
      // Limpiar estado en caso de error
      if (this.device) {
        try {
          if (this.device.opened) {
            await this.device.close()
          }
        } catch (cleanupError) {
          console.warn('Error en limpieza de dispositivo:', cleanupError)
        }
      }
      
      this.device = null
      this.endpoint = null
      return false
    }
  }
  
  /**
   * Disconnect from printer
   */
  async disconnect(): Promise<void> {
    try {
      if (this.device) {
        // Solo intentar cerrar si está abierto
        if (this.device.opened) {
          await this.device.close()
          console.log('🔌 Impresora desconectada')
        } else {
          console.log('🔌 Dispositivo ya estaba cerrado')
        }
        this.device = null
        this.endpoint = null
      }
    } catch (error) {
      console.error('Error desconectando impresora:', error)
      // Limpiar estado de todos modos
      this.device = null
      this.endpoint = null
    }
  }
  
  /**
   * Check if printer is connected
   */
  isConnected(): boolean {
    return this.device !== null && this.endpoint !== null
  }
  
  /**
   * Send raw bytes to printer
   */
  private async sendBytes(data: number[]): Promise<void> {
    if (!this.device || !this.endpoint) {
      throw new Error('Impresora no conectada')
    }
    
    try {
      const buffer = new Uint8Array(data)
      await this.device.transferOut(this.endpoint.endpointNumber, buffer)
    } catch (error) {
      console.error('Error enviando datos a impresora:', error)
      throw new Error('Error al enviar datos a la impresora')
    }
  }
  
  /**
   * Send text to printer
   */
  private async sendText(text: string): Promise<void> {
    // Convert string to bytes (Latin-1 encoding for special characters)
    const encoder = new TextEncoder()
    const bytes = Array.from(encoder.encode(text))
    await this.sendBytes(bytes)
  }
  
  /**
   * Send command to printer
   */
  private async sendCommand(...commands: number[][]): Promise<void> {
    const bytes = commands.flat()
    await this.sendBytes(bytes)
  }
  
  /**
   * Print line separator
   */
  private async printSeparator(char: string = '-', length: number = 32): Promise<void> {
    await this.sendText(char.repeat(length))
    await this.sendCommand(COMMANDS.LINE_FEED)
  }
  
  /**
   * Print centered text
   */
  private async printCentered(text: string): Promise<void> {
    await this.sendCommand(COMMANDS.ALIGN_CENTER)
    await this.sendText(text)
    await this.sendCommand(COMMANDS.LINE_FEED)
    await this.sendCommand(COMMANDS.ALIGN_LEFT)
  }
  
  /**
   * Print line with label and value
   */
  private async printLine(label: string, value: string): Promise<void> {
    await this.sendText(`${label}: ${value}`)
    await this.sendCommand(COMMANDS.LINE_FEED)
  }
  
  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  /**
   * Print ticket for membership purchase
   */
  async printTicket(data: TicketData): Promise<void> {
    try {
      if (!this.isConnected()) {
        throw new Error('Impresora no conectada. Conecte la impresora primero.')
      }
      
      console.log('🖨️ Imprimiendo ticket...', data)
      
      // Initialize printer
      await this.sendCommand(COMMANDS.INIT)
      
      // Header - Company name
      await this.sendCommand(COMMANDS.DOUBLE_SIZE, COMMANDS.BOLD_ON)
      await this.printCentered(data.empresaNombre)
      await this.sendCommand(COMMANDS.NORMAL, COMMANDS.BOLD_OFF)
      
      if (data.empresaDireccion) {
        await this.printCentered(data.empresaDireccion)
      }
      if (data.empresaTelefono) {
        await this.printCentered(`Tel: ${data.empresaTelefono}`)
      }
      
      await this.sendCommand(COMMANDS.LINE_FEED)
      await this.printSeparator('=', 32)
      
      // Ticket info
      await this.printCentered('COMPROBANTE DE PAGO')
      await this.printCentered('MEMBRESIA')
      await this.sendCommand(COMMANDS.LINE_FEED)
      
      await this.printLine('Ticket', `#${data.ticketNumero}`)
      await this.printLine('Fecha', data.fecha)
      await this.printLine('Hora', data.hora)
      
      await this.printSeparator()
      
      // Customer info
      await this.sendCommand(COMMANDS.BOLD_ON)
      await this.sendText('CLIENTE')
      await this.sendCommand(COMMANDS.BOLD_OFF, COMMANDS.LINE_FEED)
      await this.printLine('Nombre', data.socioNombre)
      await this.printLine('Codigo', data.socioCodigo)
      
      await this.printSeparator()
      
      // Membership details
      await this.sendCommand(COMMANDS.BOLD_ON)
      await this.sendText('MEMBRESIA')
      await this.sendCommand(COMMANDS.BOLD_OFF, COMMANDS.LINE_FEED)
      await this.printLine('Plan', data.membresiaNombre)
      await this.printLine('Duracion', `${data.duracionDias} dias`)
      await this.printLine('Inicia', data.fechaInicio)
      await this.printLine('Vence', data.fechaVencimiento)
      
      await this.printSeparator()
      
      // Payment details
      await this.printLine('Precio', this.formatCurrency(data.precioBase))
      
      if (data.descuento && data.descuento > 0) {
        await this.printLine('Descuento', `-${this.formatCurrency(data.descuento)}`)
      }
      
      await this.printSeparator()
      
      // Total
      await this.sendCommand(COMMANDS.DOUBLE_HEIGHT, COMMANDS.BOLD_ON)
      await this.printLine('TOTAL', this.formatCurrency(data.total))
      await this.sendCommand(COMMANDS.NORMAL, COMMANDS.BOLD_OFF)
      
      await this.printLine('Metodo Pago', data.metodoPago)
      
      await this.printSeparator('=', 32)
      
      // Footer message
      if (data.mensajeFinal) {
        await this.sendCommand(COMMANDS.LINE_FEED)
        await this.printCentered(data.mensajeFinal)
      }
      
      await this.printCentered('¡Gracias por su preferencia!')
      await this.printCentered('www.hexodus.com')
      
      // Feed and cut
      await this.sendCommand(
        COMMANDS.LINE_FEED,
        COMMANDS.LINE_FEED,
        COMMANDS.LINE_FEED,
        COMMANDS.CUT_PARTIAL
      )
      
      console.log('✅ Ticket impreso correctamente')
    } catch (error: any) {
      console.error('❌ Error imprimiendo ticket:', error)
      throw new Error(error.message || 'Error al imprimir el ticket')
    }
  }
  
  /**
   * Test print
   */
  async testPrint(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Impresora no conectada')
    }
    
    await this.sendCommand(COMMANDS.INIT)
    await this.sendCommand(COMMANDS.DOUBLE_SIZE, COMMANDS.BOLD_ON)
    await this.printCentered('PRUEBA')
    await this.sendCommand(COMMANDS.NORMAL, COMMANDS.BOLD_OFF)
    await this.printCentered('Impresora funcionando')
    await this.printCentered('correctamente')
    await this.sendCommand(
      COMMANDS.LINE_FEED,
      COMMANDS.LINE_FEED,
      COMMANDS.LINE_FEED,
      COMMANDS.CUT_PARTIAL
    )
    
    console.log('✅ Impresión de prueba completada')
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let printerInstance: ThermalPrinter | null = null

export function getPrinterInstance(): ThermalPrinter {
  if (!printerInstance) {
    printerInstance = new ThermalPrinter()
  }
  return printerInstance
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if WebUSB is supported in current browser
 */
export function isWebUSBSupported(): boolean {
  return 'usb' in navigator
}

/**
 * Get list of connected USB devices (requires permission)
 */
export async function getConnectedPrinters(): Promise<USBDevice[]> {
  if (!navigator.usb) {
    return []
  }
  
  try {
    const devices = await navigator.usb.getDevices()
    return devices
  } catch (error) {
    console.error('Error getting USB devices:', error)
    return []
  }
}

/**
 * Format ticket data from socio and membership info
 */
export function formatTicketData(
  socioData: any,
  membresiaData: any,
  metodoPago: string,
  ticketNumero?: string
): TicketData {
  const now = new Date()
  
  return {
    empresaNombre: 'HEXODUS GYM',
    empresaDireccion: 'Av. Principal #123, Ciudad',
    empresaTelefono: '+52 555 123 4567',
    
    ticketNumero: ticketNumero || `${now.getTime()}`,
    fecha: now.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    hora: now.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    
    socioNombre: socioData.nombre || socioData.personal?.nombre_completo || 'N/A',
    socioCodigo: socioData.codigoSocio || 'N/A',
    
    membresiaNombre: membresiaData.nombre_plan || membresiaData.nombre || 'N/A',
    duracionDias: membresiaData.duracion_dias || membresiaData.duracionDias || 0,
    fechaInicio: membresiaData.fecha_inicio || new Date().toLocaleDateString('es-MX'),
    fechaVencimiento: membresiaData.fecha_vencimiento || 'N/A',
    
    precioBase: membresiaData.desglose_cobro?.precio_regular || membresiaData.precioBase || 0,
    descuento: membresiaData.desglose_cobro?.ahorro || 0,
    total: membresiaData.desglose_cobro?.total_a_pagar || membresiaData.total || 0,
    metodoPago: metodoPago,
    
    mensajeFinal: '¡Bienvenido al equipo Hexodus!'
  }
}
