// ============================================================
// SERVICIO DE CONFIGURACIÓN DEL GIMNASIO (LocalStorage)
// ============================================================

// ============================================================
// TIPOS
// ============================================================

export interface ConfiguracionGimnasio {
  gimnasioNombre: string
  gimnasioDomicilio: string
  gimnasioTelefono: string
  gimnasioRFC: string
  gimnasioLogo: string
  ticketFooter: string
  ticketMensajeAgradecimiento: string
}

export interface ConfiguracionResponse {
  message: string
  data: ConfiguracionGimnasio
}

// Configuración por defecto
const DEFAULT_CONFIG: ConfiguracionGimnasio = {
  gimnasioNombre: 'GYM FITNESS',
  gimnasioDomicilio: 'Av. Principal #123, Col. Centro, CP 12345',
  gimnasioTelefono: '+52 123 456 7890',
  gimnasioRFC: 'GYM123456ABC',
  gimnasioLogo: '/assets/images/icon-printers.png',
  ticketFooter: '¡Gracias por tu visita!',
  ticketMensajeAgradecimiento: 'Te esperamos pronto'
}

const STORAGE_KEY = 'hexodus_configuracion_gimnasio'

// ============================================================
// SERVICIO
// ============================================================

export class ConfiguracionService {
  /**
   * Obtener configuración del gimnasio desde localStorage
   */
  static async obtenerConfiguracion(): Promise<ConfiguracionResponse> {
    try {
      console.log('📋 Obteniendo configuración del gimnasio desde localStorage...')

      // Simular delay de red para consistencia
      await new Promise(resolve => setTimeout(resolve, 100))

      const stored = localStorage.getItem(STORAGE_KEY)
      
      if (stored) {
        const data = JSON.parse(stored) as ConfiguracionGimnasio
        console.log('✅ Configuración del gimnasio cargada desde localStorage')
        console.log('   Nombre:', data.gimnasioNombre)
        return {
          message: 'Configuración obtenida exitosamente',
          data
        }
      }

      // Si no hay configuración guardada, usar la por defecto
      console.log('📋 Usando configuración por defecto')
      return {
        message: 'Configuración por defecto',
        data: { ...DEFAULT_CONFIG }
      }
    } catch (error: any) {
      console.error('❌ Error obteniendo configuración del gimnasio:', error)
      // En caso de error, retornar configuración por defecto
      return {
        message: 'Configuración por defecto (error en lectura)',
        data: { ...DEFAULT_CONFIG }
      }
    }
  }

  /**
   * Guardar/actualizar configuración del gimnasio en localStorage
   */
  static async guardarConfiguracion(config: ConfiguracionGimnasio): Promise<ConfiguracionResponse> {
    try {
      console.log('💾 Guardando configuración del gimnasio en localStorage...')
      console.log('   Configuración:', config)

      // Simular delay de red para consistencia
      await new Promise(resolve => setTimeout(resolve, 150))

      // Guardar en localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))

      console.log('✅ Configuración del gimnasio guardada exitosamente')

      return {
        message: 'Configuración guardada exitosamente',
        data: config
      }
    } catch (error: any) {
      console.error('❌ Error guardando configuración del gimnasio:', error)
      throw new Error('Error al guardar la configuración. Por favor, intente nuevamente.')
    }
  }

  /**
   * Restaurar configuración por defecto
   */
  static async restaurarDefecto(): Promise<ConfiguracionResponse> {
    try {
      console.log('🔄 Restaurando configuración por defecto...')
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG))
      
      console.log('✅ Configuración restaurada a valores por defecto')
      
      return {
        message: 'Configuración restaurada exitosamente',
        data: { ...DEFAULT_CONFIG }
      }
    } catch (error: any) {
      console.error('❌ Error restaurando configuración:', error)
      throw new Error('Error al restaurar la configuración')
    }
  }
}
