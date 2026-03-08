/**
 * Thermal Printer Service using WebUSB
 * Supports ESC/POS compatible thermal printers (58mm and 80mm)
 * Works in both development and production environments
 */

import { ConfiguracionService, type ConfiguracionGimnasio } from './configuracion'

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
// IMAGE PROCESSING UTILITIES
// ============================================================================

/**
 * Load image from URL and convert to HTMLImageElement
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    // Detectar tipo de URL
    const isBase64 = url.startsWith('data:')
    const isExternalUrl = url.startsWith('http://') || url.startsWith('https://')
    
    // Solo usar crossOrigin para URLs externas (no para base64 ni rutas locales)
    if (isExternalUrl) {
      img.crossOrigin = 'anonymous'
    }
    
    img.onload = () => {
      console.log('✅ Imagen cargada exitosamente')
      resolve(img)
    }
    
    img.onerror = () => {
      if (isExternalUrl) {
        console.warn('⚠️ Error con CORS, intentando sin crossOrigin...')
        
        // Retry without crossOrigin for external URLs
        const img2 = new Image()
        img2.onload = () => {
          console.log('✅ Imagen cargada sin CORS')
          resolve(img2)
        }
        img2.onerror = () => {
          console.error('❌ Error cargando imagen:', url)
          reject(new Error('No se pudo cargar la imagen. Verifica la URL y que sea accesible públicamente.'))
        }
        img2.src = url
      } else {
        console.error('❌ Error cargando imagen:', url)
        reject(new Error('No se pudo cargar la imagen. Verifica que el archivo sea válido.'))
      }
    }
    
    img.src = url
  })
}

/**
 * Convert image to monochrome bitmap for thermal printer
 * @param imageUrl URL of the image
 * @param maxWidth Maximum width in pixels (default 384 for 58mm printer)
 */
async function imageToThermalBitmap(imageUrl: string, maxWidth: number = 384): Promise<number[]> {
  try {
    // Normalizar URL: si es una URL completa de nuestros assets, convertirla a ruta local
    let processedUrl = imageUrl
    
    // Detectar si es una URL completa que apunta a nuestros assets del proyecto
    if (imageUrl.includes('/assets/') || imageUrl.includes('/public/')) {
      // Extraer solo la ruta después del dominio
      const urlObj = new URL(imageUrl, window.location.origin)
      processedUrl = urlObj.pathname
      console.log('🔄 URL externa detectada, extrayendo ruta local:', processedUrl)
    }
    
    // Si es una ruta local (empieza con /), convertirla a base64 primero para evitar CORS
    if (processedUrl.startsWith('/') && !processedUrl.startsWith('//')) {
      console.log('🔄 Convirtiendo ruta local a base64...')
      try {
        const response = await fetch(processedUrl)
        const blob = await response.blob()
        processedUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        console.log('✅ Ruta local convertida a base64')
      } catch (fetchError) {
        console.error('❌ Error convirtiendo ruta local:', fetchError)
        throw new Error('No se pudo cargar la imagen local')
      }
    }
    
    // Load image
    const img = await loadImage(processedUrl)
    
    // Calculate scaled dimensions (maintain aspect ratio)
    let width = img.width
    let height = img.height
    
    if (width > maxWidth) {
      height = Math.floor((height * maxWidth) / width)
      width = maxWidth
    }
    
    console.log(`🖼️ Logo: ${img.width}x${img.height} → ${width}x${height}`)
    
    // Create canvas and draw image with high quality smoothing
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('No se pudo crear contexto de canvas')
    }
    
    // Enable high quality image smoothing
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    // Draw image scaled
    ctx.drawImage(img, 0, 0, width, height)
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height)
    const pixels = imageData.data
    
    // Convert to grayscale with proper luminance formula and handle transparency
    const grayPixels: number[] = []
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const a = pixels[i + 3]
      
      // Use luminance formula for better grayscale conversion
      let gray = 0.299 * r + 0.587 * g + 0.114 * b
      
      // Handle transparency - consider white background
      if (a < 255) {
        const alpha = a / 255
        gray = gray * alpha + 255 * (1 - alpha)
      }
      
      grayPixels.push(gray)
    }
    
    // Apply Floyd-Steinberg dithering for better quality
    const monochrome: number[][] = []
    for (let y = 0; y < height; y++) {
      const row: number[] = []
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        const oldPixel = grayPixels[idx]
        const newPixel = oldPixel < 128 ? 0 : 255
        row.push(newPixel === 0 ? 1 : 0) // 1 = black, 0 = white
        
        // Calculate error
        const error = oldPixel - newPixel
        
        // Distribute error to neighboring pixels (Floyd-Steinberg)
        if (x + 1 < width) {
          grayPixels[idx + 1] += error * 7 / 16
        }
        if (y + 1 < height) {
          if (x > 0) {
            grayPixels[idx + width - 1] += error * 3 / 16
          }
          grayPixels[idx + width] += error * 5 / 16
          if (x + 1 < width) {
            grayPixels[idx + width + 1] += error * 1 / 16
          }
        }
      }
      monochrome.push(row)
    }
    
    // Convert monochrome matrix to bitmap bytes
    const bytesPerLine = Math.ceil(width / 8)
    const bitmap: number[] = []
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < bytesPerLine; x++) {
        let byte = 0
        
        for (let bit = 0; bit < 8; bit++) {
          const pixelX = x * 8 + bit
          
          if (pixelX < width && monochrome[y][pixelX] === 1) {
            byte |= (1 << (7 - bit))
          }
        }
        
        bitmap.push(byte)
      }
    }
    
    // Return ESC/POS bitmap command: GS v 0 m xL xH yL yH [data]
    // IMPORTANTE: xL xH es el ancho en BYTES, no en píxeles
    const xL = bytesPerLine & 0xff
    const xH = (bytesPerLine >> 8) & 0xff
    const yL = height & 0xff
    const yH = (height >> 8) & 0xff
    
    return [GS, 0x76, 0x30, 0x00, xL, xH, yL, yH, ...bitmap]
  } catch (error) {
    console.error('Error convirtiendo imagen a bitmap:', error)
    return []
  }
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

export interface VentaProducto {
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface VentaTicketData {
  // Company info
  empresaNombre: string
  empresaDireccion?: string
  empresaTelefono?: string
  
  // Ticket info
  ticketNumero: string
  fecha: string
  hora: string
  
  // Customer info
  clienteNombre: string
  
  // Products
  productos: VentaProducto[]
  
  // Payment info
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
  private configuracionGimnasio: ConfiguracionGimnasio | null = null
  
  /**
   * Obtener configuración del gimnasio (con cache)
   */
  private async obtenerConfiguracion(): Promise<ConfiguracionGimnasio> {
    // Si ya tenemos la configuración cacheada, usarla
    if (this.configuracionGimnasio) {
      return this.configuracionGimnasio
    }
    
    try {
      const response = await ConfiguracionService.obtenerConfiguracion()
      this.configuracionGimnasio = response.data
      return this.configuracionGimnasio
    } catch (error) {
      console.warn('⚠️ No se pudo obtener configuración del gimnasio, usando valores por defecto')
      // Valores por defecto si falla la carga
      return {
        gimnasioNombre: 'GYM FITNESS',
        gimnasioDomicilio: 'Av. Principal #123',
        gimnasioTelefono: '+52 123 456 7890',
        gimnasioRFC: 'GYM123456ABC',
        gimnasioLogo: '/assets/images/icon-printers.png',
        ticketFooter: '¡Gracias por tu visita!',
        ticketMensajeAgradecimiento: 'Te esperamos pronto'
      }
    }
  }
  
  /**
   * Limpiar cache de configuración (útil después de guardar cambios)
   */
  public limpiarCacheConfiguracion(): void {
    this.configuracionGimnasio = null
  }
  
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
   * Print image from URL (converted to bitmap)
   */
  private async printImage(imageUrl: string, maxWidth: number = 384): Promise<boolean> {
    try {
      console.log('🖼️ Procesando imagen para impresión...', imageUrl)
      
      // Convert image to thermal bitmap
      const bitmap = await imageToThermalBitmap(imageUrl, maxWidth)
      
      if (bitmap.length === 0) {
        console.warn('⚠️ No se pudo convertir la imagen, continuando sin logo...')
        return false
      }
      
      console.log(`📊 Tamaño del bitmap: ${bitmap.length} bytes`)
      
      // Center alignment for image
      await this.sendCommand(COMMANDS.ALIGN_CENTER)
      
      // Send bitmap data in chunks to avoid buffer overflow
      const CHUNK_SIZE = 1024 // 1KB chunks
      const CHUNK_DELAY = 20 // 20ms between chunks
      
      // Send command header first
      const headerSize = 8 // GS v 0 m xL xH yL yH = 8 bytes
      const header = bitmap.slice(0, headerSize)
      await this.sendBytes(header)
      await new Promise(resolve => setTimeout(resolve, 10)) // Initial delay
      
      // Send image data in chunks
      for (let i = headerSize; i < bitmap.length; i += CHUNK_SIZE) {
        const chunk = bitmap.slice(i, Math.min(i + CHUNK_SIZE, bitmap.length))
        await this.sendBytes(chunk)
        
        // Delay between chunks
        if (i + CHUNK_SIZE < bitmap.length) {
          await new Promise(resolve => setTimeout(resolve, CHUNK_DELAY))
        }
      }
      
      // Wait for image to finish processing
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Add line feed after image
      await this.sendCommand(COMMANDS.LINE_FEED)
      
      // Reset alignment
      await this.sendCommand(COMMANDS.ALIGN_LEFT)
      
      console.log('✅ Imagen enviada a la impresora')
      return true
    } catch (error) {
      console.error('❌ Error imprimiendo imagen:', error)
      console.warn('⚠️ Continuando impresión sin logo...')
      // Continue printing even if image fails
      return false
    }
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
      
      // Obtener configuración del gimnasio
      const config = await this.obtenerConfiguracion()
      
      // Initialize printer
      await this.sendCommand(COMMANDS.INIT)
      
      // Print logo if exists (usando GS v 0 con dithering Floyd-Steinberg)
      if (config.gimnasioLogo) {
        await this.printImage(config.gimnasioLogo, 150)
      }
      
      // Header - Company name (usar configuración) - TAMAÑO NORMAL BOLD
      await this.sendCommand(COMMANDS.BOLD_ON)
      await this.printCentered(config.gimnasioNombre)
      await this.sendCommand(COMMANDS.BOLD_OFF)
      
      if (config.gimnasioDomicilio) {
        await this.printCentered(config.gimnasioDomicilio)
      }
      if (config.gimnasioTelefono) {
        await this.printCentered(`Tel: ${config.gimnasioTelefono}`)
      }
      if (config.gimnasioRFC) {
        await this.printCentered(`RFC: ${config.gimnasioRFC}`)
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
      await this.printLine('Clave', data.socioCodigo)
      
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
      
      // Footer message (usar configuración)
      await this.sendCommand(COMMANDS.LINE_FEED)
      
      if (config.ticketFooter) {
        await this.printCentered(config.ticketFooter)
      }
      
      if (config.ticketMensajeAgradecimiento) {
        await this.printCentered(config.ticketMensajeAgradecimiento)
      }
      
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
   * Print venta ticket
   */
  async printVentaTicket(data: VentaTicketData): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Impresora no conectada')
    }
    
    try {
      // Obtener configuración del gimnasio
      const config = await this.obtenerConfiguracion()
      
      // Initialize
      await this.sendCommand(COMMANDS.INIT)
      
      // Print logo if exists (usando GS v 0 con dithering Floyd-Steinberg)
      if (config.gimnasioLogo) {
        await this.printImage(config.gimnasioLogo, 150)
      }
      
      // Header (usar configuración) - TAMAÑO NORMAL BOLD
      await this.sendCommand(COMMANDS.BOLD_ON)
      await this.printCentered(config.gimnasioNombre)
      await this.sendCommand(COMMANDS.BOLD_OFF)
      
      if (config.gimnasioDomicilio) {
        await this.printCentered(config.gimnasioDomicilio)
      }
      if (config.gimnasioTelefono) {
        await this.printCentered(`Tel: ${config.gimnasioTelefono}`)
      }
      if (config.gimnasioRFC) {
        await this.printCentered(`RFC: ${config.gimnasioRFC}`)
      }
      
      await this.printSeparator('=', 32)
      
      // Ticket info
      await this.sendCommand(COMMANDS.BOLD_ON)
      await this.printCentered('TICKET DE VENTA')
      await this.sendCommand(COMMANDS.BOLD_OFF)
      await this.printLine('Ticket', data.ticketNumero)
      await this.printLine('Fecha', data.fecha)
      await this.printLine('Hora', data.hora)
      
      await this.printSeparator()
      
      // Customer info
      await this.sendCommand(COMMANDS.BOLD_ON)
      await this.sendText('CLIENTE')
      await this.sendCommand(COMMANDS.BOLD_OFF, COMMANDS.LINE_FEED)
      await this.printLine('Nombre', data.clienteNombre)
      
      await this.printSeparator()
      
      // Products
      await this.sendCommand(COMMANDS.BOLD_ON)
      await this.sendText('PRODUCTOS')
      await this.sendCommand(COMMANDS.BOLD_OFF, COMMANDS.LINE_FEED, COMMANDS.LINE_FEED)
      
      for (const producto of data.productos) {
        // Nombre del producto
        await this.sendCommand(COMMANDS.ALIGN_LEFT)
        await this.sendText(producto.nombre)
        await this.sendCommand(COMMANDS.LINE_FEED)
        
        // Cantidad x Precio = Subtotal
        const linea = `${producto.cantidad} x ${this.formatCurrency(producto.precioUnitario)} = ${this.formatCurrency(producto.subtotal)}`
        await this.sendText(linea)
        await this.sendCommand(COMMANDS.LINE_FEED, COMMANDS.LINE_FEED)
      }
      
      await this.printSeparator()
      
      // Total
      await this.sendCommand(COMMANDS.DOUBLE_HEIGHT, COMMANDS.BOLD_ON)
      await this.printLine('TOTAL', this.formatCurrency(data.total))
      await this.sendCommand(COMMANDS.NORMAL, COMMANDS.BOLD_OFF)
      
      await this.printLine('Metodo Pago', data.metodoPago)
      
      await this.printSeparator('=', 32)
      
      // Footer message (usar configuración)
      await this.sendCommand(COMMANDS.LINE_FEED)
      
      if (config.ticketFooter) {
        await this.printCentered(config.ticketFooter)
      }
      
      if (config.ticketMensajeAgradecimiento) {
        await this.printCentered(config.ticketMensajeAgradecimiento)
      }
      
      // Feed and cut
      await this.sendCommand(
        COMMANDS.LINE_FEED,
        COMMANDS.LINE_FEED,
        COMMANDS.LINE_FEED,
        COMMANDS.CUT_PARTIAL
      )
      
      console.log('✅ Ticket de venta impreso correctamente')
    } catch (error: any) {
      console.error('❌ Error imprimiendo ticket de venta:', error)
      throw new Error(error.message || 'Error al imprimir el ticket de venta')
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
 * Format ISO date string to DD/MM/YYYY
 */
function formatFechaISO(fechaISO: string | undefined): string {
  if (!fechaISO) return 'N/A'
  
  try {
    // Extraer solo la parte de la fecha (YYYY-MM-DD) ignorando hora y zona horaria
    const fechaSolo = fechaISO.split('T')[0]
    const [year, month, day] = fechaSolo.split('-').map(Number)
    
    // Formatear como DD/MM/YYYY
    const dayStr = day.toString().padStart(2, '0')
    const monthStr = month.toString().padStart(2, '0')
    
    return `${dayStr}/${monthStr}/${year}`
  } catch (error) {
    console.error('Error formateando fecha:', fechaISO, error)
    return 'N/A'
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
    socioCodigo: socioData.codigoSocio || socioData.codigo || 'N/A',
    
    membresiaNombre: membresiaData.nombre_plan || membresiaData.nombre || 'N/A',
    duracionDias: membresiaData.duracion_dias || membresiaData.duracionDias || 0,
    fechaInicio: formatFechaISO(membresiaData.fecha_inicio),
    fechaVencimiento: formatFechaISO(membresiaData.fecha_vencimiento),
    
    precioBase: membresiaData.desglose_cobro?.precio_regular || membresiaData.precioBase || 0,
    descuento: membresiaData.desglose_cobro?.ahorro || 0,
    total: membresiaData.desglose_cobro?.total_a_pagar || membresiaData.total || 0,
    metodoPago: metodoPago,
    
    mensajeFinal: '¡Bienvenido al equipo Hexodus!'
  }
}

/**
 * Format venta ticket data from DetalleVenta
 */
export function formatVentaTicketData(
  detalleVenta: any,
  ticketNumero?: string
): VentaTicketData {
  const now = new Date()
  
  return {
    empresaNombre: 'HEXODUS GYM',
    empresaDireccion: 'Av. Principal #123, Ciudad',
    empresaTelefono: '+52 555 123 4567',
    
    ticketNumero: ticketNumero || detalleVenta.idVentaStr || `${now.getTime()}`,
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
    
    clienteNombre: detalleVenta.cliente || 'Cliente General',
    
    productos: detalleVenta.productos.map((p: any) => ({
      nombre: p.nombre,
      cantidad: p.cantidad,
      precioUnitario: p.precioUnitario,
      subtotal: p.subtotal
    })),
    
    total: detalleVenta.total,
    metodoPago: detalleVenta.metodoPago,
    
    mensajeFinal: '¡Vuelve pronto!'
  }
}

