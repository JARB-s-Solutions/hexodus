/**
 * Servicio de Asistencias
 * Maneja todas las operaciones relacionadas con el registro y consulta de asistencias
 */

import { AuthService } from '../auth'

export interface RegistroFacialRequest {
  tipo: 'IN' | 'OUT'
  kioskId: string
  faceDescriptor: number[]
}

export interface RegistroManualRequest {
  clave: string         // Código del socio, ej: "SOC-274495"
  tipo: 'IN' | 'OUT'    // Tipo de registro
  notas?: string        // Notas u observaciones opcionales
}

export interface FiltrosAsistenciasHoy {
  tipo?: 'IN' | 'OUT' | string
  buscar?: string
  limite?: number
}

export interface FiltrosHistorialSocio {
  desde?: string
  hasta?: string
  limite?: number
  pagina?: number
}

// Respuesta real del endpoint de validación facial
export interface RegistroAsistenciaResponse {
  success: boolean
  message?: string
  data?: {
    socio: {
      id: number
      codigo_socio: string
      nombre_completo: string
      foto_perfil_url: string | null
      membresia: string
      fecha_fin_membresia: string
    }
    asistencia: {
      id: number
      tipo: 'IN' | 'OUT'
      timestamp: string
      confidence: string
    }
  }
  error?: string
}

// Respuesta real de la API - Endpoint /hoy
export interface AsistenciasHoyResponse {
  success: boolean
  data: {
    fecha: string  // "2026-03-09"
    asistencias: Array<{
      id: string
      socio_nombre: string
      codigo_socio: string  // "SOC-959917" - NO tiene socio_id
      foto_perfil_url?: string
      hora: string         // "03:03:36" - SOLO HORA, no timestamp completo
      tipo: 'IN' | 'OUT'
      metodo: 'facial' | 'manual'
      confidence?: number
    }>
    resumen: {
      total_asistencias: number
      entradas: number
      salidas: number
      socios_activos_ahora: number
      promedio_confidence: number
    }
  }
}

// Respuesta del historial general - Endpoint /asistencia
export interface HistorialAsistenciasResponse {
  success: boolean
  data: {
    asistencias: Array<{
      id: string
      socio_id: string     // Sí tiene socio_id numérico
      socio_nombre: string
      codigo_socio: string
      timestamp: string    // "2026-03-09T03:03:36.774Z" - TIMESTAMP COMPLETO ISO
      tipo: 'IN' | 'OUT'
      metodo: 'facial' | 'manual'
      confidence?: number
      kiosk_id?: string
      validador_manual?: string | null
      notas?: string | null
    }>
    pagination: {
      total: number
      page: number
      limit: number
      total_pages: number
    }
  }
}

export interface FiltrosHistorial {
  pagina?: number    // Nombre en español para consistencia con la app
  limite?: number    // Nombre en español para consistencia con la app
  fecha_inicio?: string
  fecha_fin?: string
  metodo?: 'facial' | 'manual'
  search?: string
}

export interface KpisAsistenciasResponse {
  success: boolean
  data: {
    total_asistencias: number
    entradas: number
    salidas: number
    socios_activos_ahora: number
    promedio_confidence: number
  }
}

export interface HistorialSocioResponse {
  success: boolean
  data: {
    socio: {
      id: number
      codigoSocio: string
      nombreCompleto: string
      fotoUrl: string | null
    }
    asistencias: Array<{
      id: number
      timestamp: string
      tipo: 'IN' | 'OUT'
      metodo: 'facial' | 'manual'
      confidence: number | null
    }>
    estadisticas: {
      total_mostradas: number
      ultima_asistencia: string
    }
  }
}

export interface EstadisticasResponse {
  success: boolean
  periodo: string
  desde: string
  hasta: string
  data: {
    total_asistencias: number
    socios_asistieron: number
    promedio_diario: number
    dias_mas_activos: Array<{ fecha: string; asistencias: number }>
    horarios_pico: Array<{ hora: string; promedio: number }>
    metodo_registro: {
      facial: number
      manual: number
    }
    tasa_denegacion: number
    motivos_denegacion: {
      membresia_vencida: number
      sin_membresia: number
      sin_pago: number
      no_registrado: number
    }
  }
}

export interface ConfiguracionAsistenciasResponse {
  success: boolean
  data: {
    reconocimiento_facial_activo: boolean
    umbral_confianza_minimo: number
    registro_manual_activo: boolean
    tiempo_reseteo_pantalla: number
    sonido_habilitado: boolean
    validar_membresia: boolean
    alertar_proximo_vencimiento: boolean
    dias_alerta_vencimiento: number
    permitir_acceso_vencido: boolean
    registrar_hora_salida: boolean
  }
}

class AsistenciaServiceClass {
  private baseURL: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://hexodusapi.vercel.app/api'
  }

  /**
   * Obtener headers con autenticación
   */
  private getAuthHeaders(): HeadersInit {
    const token = AuthService.getToken()
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    }
  }

  /**
   * Registrar asistencia mediante reconocimiento facial
   * POST /api/asistencia/validar
   * @param request - Objeto con tipo ('IN'|'OUT'), kioskId y faceDescriptor (array de 128 números)
   */
  async registrarFacial(request: RegistroFacialRequest): Promise<RegistroAsistenciaResponse> {
    try {
      const response = await fetch(`${this.baseURL}/asistencia/validar`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Error al validar asistencia facial')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('[AsistenciaService] Error en registrarFacial:', error)
      throw error
    }
  }

  /**
   * Registrar asistencia manualmente con código de socio
   */
  async registrarManual(request: RegistroManualRequest): Promise<RegistroAsistenciaResponse> {
    try {
      const response = await fetch(`${this.baseURL}/asistencia/manual`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al registrar asistencia manual')
      }

      return await response.json()
    } catch (error) {
      console.error('[AsistenciaService] Error en registrarManual:', error)
      throw error
    }
  }

  /**
   * Obtener asistencias del día actual
   */
  async obtenerAsistenciasHoy(filtros?: FiltrosAsistenciasHoy): Promise<AsistenciasHoyResponse> {
    try {
      const params = new URLSearchParams()
      if (filtros?.tipo) params.append('tipo', filtros.tipo)
      if (filtros?.buscar) params.append('buscar', filtros.buscar)
      if (filtros?.limite) params.append('limite', String(filtros.limite))

      const queryString = params.toString()
      const url = `${this.baseURL}/asistencia/hoy${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Error al obtener asistencias del día')
      }

      return await response.json()
    } catch (error) {
      console.error('[AsistenciaService] Error en obtenerAsistenciasHoy:', error)
      throw error
    }
  }

  /**
   * Obtener historial general de asistencias con filtros y paginación
   */
  async obtenerHistorial(filtros?: FiltrosHistorial): Promise<HistorialAsistenciasResponse> {
    try {
      const params = new URLSearchParams()
      // Mapear nombres en español a inglés para la API
      if (filtros?.pagina) params.append('page', String(filtros.pagina))
      if (filtros?.limite) params.append('limit', String(filtros.limite))
      if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio)
      if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin)
      if (filtros?.metodo) params.append('metodo', filtros.metodo)
      if (filtros?.search) params.append('search', filtros.search)

      const queryString = params.toString()
      const url = `${this.baseURL}/asistencia${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Error al obtener historial de asistencias')
      }

      return await response.json()
    } catch (error) {
      console.error('[AsistenciaService] Error en obtenerHistorial:', error)
      throw error
    }
  }

  /**
   * Obtener KPIs de asistencias
   * Usa los datos de asistencias del día para calcular KPIs
   */
  async obtenerKpis(fecha?: string): Promise<KpisAsistenciasResponse> {
    try {
      // Obtener asistencias del día para calcular KPIs
      const response = await this.obtenerAsistenciasHoy()
      
      if (!response.success) {
        throw new Error('Error al obtener datos para KPIs')
      }

      // Retornar directamente el resumen que ya viene con los KPIs
      return {
        success: true,
        data: response.data.resumen
      }
    } catch (error) {
      console.error('[AsistenciaService] Error en obtenerKpis:', error)
      throw error
    }
  }

  /**
   * Obtener historial de asistencias de un socio específico
   */
  async obtenerHistorialSocio(
    socioId: string,
    filtros?: FiltrosHistorialSocio
  ): Promise<HistorialSocioResponse> {
    try {
      const params = new URLSearchParams()
      if (filtros?.desde) params.append('desde', filtros.desde)
      if (filtros?.hasta) params.append('hasta', filtros.hasta)
      if (filtros?.limite) params.append('limite', String(filtros.limite))
      if (filtros?.pagina) params.append('pagina', String(filtros.pagina))

      const queryString = params.toString()
      const url = `${this.baseURL}/asistencia/socio/${socioId}${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Error al obtener historial del socio')
      }

      return await response.json()
    } catch (error) {
      console.error('[AsistenciaService] Error en obtenerHistorialSocio:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas generales de asistencias
   */
  async obtenerEstadisticas(periodo: 'hoy' | 'semana' | 'mes' | 'anual' = 'mes'): Promise<EstadisticasResponse> {
    try {
      const response = await fetch(`${this.baseURL}/asistencias/estadisticas?periodo=${periodo}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas de asistencias')
      }

      return await response.json()
    } catch (error) {
      console.error('[AsistenciaService] Error en obtenerEstadisticas:', error)
      throw error
    }
  }

  /**
   * Exportar asistencias en formato específico
   */
  async exportar(
    formato: 'csv' | 'excel' | 'pdf',
    filtros?: {
      desde?: string
      hasta?: string
      tipo?: string
    }
  ): Promise<void> {
    try {
      const params = new URLSearchParams()
      params.append('formato', formato)
      if (filtros?.desde) params.append('desde', filtros.desde)
      if (filtros?.hasta) params.append('hasta', filtros.hasta)
      if (filtros?.tipo) params.append('tipo', filtros.tipo)

      const response = await fetch(`${this.baseURL}/asistencias/exportar?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Error al exportar asistencias')
      }

      // Descargar archivo
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const timestamp = new Date().toISOString().split('T')[0]
      link.setAttribute('download', `asistencias-${timestamp}.${formato}`)
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[AsistenciaService] Error en exportar:', error)
      throw error
    }
  }

  /**
   * Obtener configuración del sistema de asistencias
   */
  async obtenerConfiguracion(): Promise<ConfiguracionAsistenciasResponse> {
    try {
      const response = await fetch(`${this.baseURL}/asistencias/configuracion`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Error al obtener configuración de asistencias')
      }

      return await response.json()
    } catch (error) {
      console.error('[AsistenciaService] Error en obtenerConfiguracion:', error)
      throw error
    }
  }

  /**
   * Actualizar configuración del sistema de asistencias
   */
  async actualizarConfiguracion(config: Partial<ConfiguracionAsistenciasResponse['data']>): Promise<ConfiguracionAsistenciasResponse> {
    try {
      const response = await fetch(`${this.baseURL}/asistencias/configuracion`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar configuración')
      }

      return await response.json()
    } catch (error) {
      console.error('[AsistenciaService] Error en actualizarConfiguracion:', error)
      throw error
    }
  }

  /**
   * Buscar socio por código (para registro manual)
   */
  async buscarSocioPorCodigo(codigo: string): Promise<{
    success: boolean
    data?: {
      id: string
      nombre: string
      codigo: string
      foto: string | null
      email: string
      telefono: string
      membresia: {
        tipo: string
        fecha_vencimiento: string
        estado: 'vigente' | 'vencida' | 'proximo_vencer'
        dias_restantes: number
      }
    }
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseURL}/socios/buscar/${codigo}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Socio no encontrado')
      }

      return await response.json()
    } catch (error) {
      console.error('[AsistenciaService] Error en buscarSocioPorCodigo:', error)
      throw error
    }
  }
}

// Exportar instancia singleton
export const AsistenciaService = new AsistenciaServiceClass()

/**
 * Helper: Comprimir imagen antes de enviar al backend
 */
export async function comprimirImagen(base64: string, maxWidth: number = 500): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = base64
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height
      
      // Calcular nuevas dimensiones manteniendo aspect ratio
      if (width > height && width > maxWidth) {
        height *= maxWidth / width
        width = maxWidth
      } else if (height > maxWidth) {
        width *= maxWidth / height
        height = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo obtener contexto del canvas'))
        return
      }
      
      ctx.drawImage(img, 0, 0, width, height)
      
      // Comprimir a JPEG con calidad 0.8
      const comprimida = canvas.toDataURL('image/jpeg', 0.8)
      resolve(comprimida)
    }
    
    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'))
    }
  })
}
