// ============================================================
// SERVICIO DE REPORTES FINANCIEROS
// ============================================================

// URL base de la API - Similar a la configuración en lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hexodusapi.vercel.app/api'

// ============================================================
// TIPOS
// ============================================================

/**
 * Periodos válidos para reportes
 */
export type PeriodoReporte = 
  | 'Hoy' 
  | 'Esta Semana' 
  | 'Este Mes' 
  | 'Este Trimestre' 
  | 'Este Semestre' 
  | 'Este Ano' 
  | 'Personalizado'

/**
 * Tipos de reporte válidos
 */
export type TipoReporte = 
  | 'Reporte Completo' 
  | 'Ventas' 
  | 'Gastos' 
  | 'Utilidad' 
  | 'Membresias'

/**
 * Parámetros para consulta de gráficas
 */
export interface GraficasParams {
  periodo: PeriodoReporte
  tipo_reporte?: TipoReporte
  fecha_inicio?: string  // YYYY-MM-DD (requerido si periodo es 'Personalizado')
  fecha_fin?: string     // YYYY-MM-DD (requerido si periodo es 'Personalizado')
}

/**
 * Tendencia financiera por fecha
 */
export interface TendenciaFinanciera {
  fecha: string
  ventas?: number
  gastos?: number
  utilidad?: number
  membresias?: number
}

/**
 * Gasto por categoría
 */
export interface GastoPorCategoria {
  categoria: string
  monto: number
}

/**
 * Membresía por plan
 */
export interface MembresiaPorPlan {
  plan: string
  cantidad: number
  ingresos_generados: number
}

/**
 * Venta vs Gasto por fecha
 */
export interface VentaVsGasto {
  fecha: string
  ventas: number
  gastos: number
}

/**
 * Respuesta de endpoint de gráficas
 */
export interface GraficasResponse {
  message: string
  filtros_aplicados: {
    periodo: string
    tipo_reporte: string
  }
  data: {
    tendencia_financiera: TendenciaFinanciera[]
    gastos_por_categoria: {
      mostrar: boolean
      datos: GastoPorCategoria[]
    }
    membresias_por_plan: {
      mostrar: boolean
      datos: MembresiaPorPlan[]
    }
    ventas_vs_gastos: {
      mostrar: boolean
      datos: VentaVsGasto[]
    }
  }
}

/**
 * Respuesta de endpoint de KPIs financieros
 */
export interface KpisResponse {
  message: string
  filtros_aplicados: {
    periodo: string
    tipo_reporte: string
  }
  data: {
    kpis_superiores: {
      ingresos: {
        total: number
        porcentaje: number
      }
      gastos: {
        total: number
        porcentaje: number
      }
      utilidad_neta: {
        total: number
        porcentaje: number
      }
      membresias: {
        total: number
        porcentaje: number
        socios_activos: number
      }
    }
    desglose_ingresos: {
      mostrar: boolean
      total_ingresos: number
      saldo_neto: number
      grafica: {
        ventas: {
          total: number
          porcentaje_grafica: number
          porcentaje_vs_anterior: number
        }
        membresias: {
          total: number
          porcentaje_grafica: number
          porcentaje_vs_anterior: number
        }
      }
    }
    tarjetas_detalle: {
      ventas: {
        mostrar: boolean
        total: number
        transacciones: number
        porcentaje_vs_anterior: number
        anterior_texto: string
      }
      gastos: {
        mostrar: boolean
        total: number
        movimientos: number
        porcentaje_vs_anterior: number
        anterior_texto: string
      }
      utilidad: {
        mostrar: boolean
        total: number
        margen: number
        porcentaje_vs_anterior: number
        anterior_texto: string
      }
      membresias: {
        mostrar: boolean
        total: number
        socios_activos: number
        porcentaje_vs_anterior: number
        anterior_texto: string
      }
    }
    top_gastos?: Array<{
      categoria: string
      monto: number
    }>
    rendimiento_planes?: Array<{
      plan: string
      cantidad: number
    }>
    insights?: Array<{
      tipo: string
      texto: string
    }>
    barra_inferior?: {
      periodo_texto: string
      rango_fechas: string
      ingresos_totales: number
      utilidad_neta: number
    }
  }
}

// Legacy type alias for backwards compatibility
export type ResumenResponse = KpisResponse

/**
 * Item de comparación individual (para uso interno del componente)
 */
export interface ComparacionItem {
  label: string
  actual: number
  anterior: number
}

/**
 * Detalle de una comparación individual del backend
 */
export interface ComparacionDetalle {
  actual: number
  anterior: number
  diferencia: number
  porcentaje: number
  es_positivo: boolean
}

/**
 * Insight generado por el backend
 */
export interface Insight {
  tipo: 'positivo' | 'negativo' | 'neutral'
  texto: string
}

/**
 * Respuesta de endpoint de comparaciones
 */
export interface ComparacionesResponse {
  message: string
  filtros_aplicados: {
    periodo: string
    tab_seleccionada: string
  }
  data: {
    titulo_grafica: string
    comparaciones: {
      ventas: ComparacionDetalle
      gastos: ComparacionDetalle
      utilidad: ComparacionDetalle
      membresias: ComparacionDetalle
    }
    resumen_indicadores: {
      positivos: number
      negativos: number
    }
    insights: Insight[]
  }
}

/**
 * Reporte del historial del backend
 */
export interface ReporteHistorialBackend {
  id: string
  nombre: string
  tipo: string
  periodo: string
  fecha_generado: string
  estado: 'generado' | 'descargado'
  formato: 'Excel'
  resumen: {
    ventas: number
    gastos: number
    utilidad: number
  }
}

/**
 * Respuesta de endpoint de historial de reportes
 */
export interface HistorialResponse {
  message: string
  data: {
    reportes: ReporteHistorialBackend[]
    paginacion: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
}

// ============================================================
// MAPPERS - Frontend → Backend
// ============================================================

/**
 * Mapea periodo del frontend al formato del backend
 */
export function mapPeriodoToBackend(periodo: string): PeriodoReporte {
  const mapper: Record<string, PeriodoReporte> = {
    'dia': 'Hoy',
    'semana': 'Esta Semana',
    'mes': 'Este Mes',
    'trimestre': 'Este Trimestre',
    'semestre': 'Este Semestre',
    'anual': 'Este Ano',
    'personalizado': 'Personalizado',
  }
  
  return mapper[periodo.toLowerCase()] || 'Este Mes'
}

/**
 * Mapea tipo de reporte del frontend al formato del backend
 */
export function mapTipoReporteToBackend(tipo: string): TipoReporte {
  const mapper: Record<string, TipoReporte> = {
    'todos': 'Reporte Completo',
    'ventas': 'Ventas',
    'gastos': 'Gastos',
    'utilidad': 'Utilidad',
    'membresias': 'Membresias',
  }
  
  return mapper[tipo.toLowerCase()] || 'Reporte Completo'
}

/**
 * Mapea tab seleccionada del frontend al formato del backend
 */
export function mapTabSeleccionadaToBackend(tab: string): string {
  const mapper: Record<string, string> = {
    'actual': 'periodo seleccionado',
    'mes': 'mes vs mes anterior',
    'trimestre': 'trimestre vs anterior',
    'semestre': 'semestre vs anterior',
    'anual': 'ano vs anterior',
  }
  
  return mapper[tab.toLowerCase()] || 'periodo seleccionado'
}

// ============================================================
// SERVICIO
// ============================================================

export class ReportesService {
  /**
   * Obtener datos de gráficas financieras
   */
  static async getGraficas(params: {
    periodo: string
    tipoReporte?: string
    fechaInicio?: string
    fechaFin?: string
  }): Promise<GraficasResponse> {
    try {
      // Mapear parámetros al formato del backend
      const periodoBackend = mapPeriodoToBackend(params.periodo)
      const tipoReporteBackend = params.tipoReporte 
        ? mapTipoReporteToBackend(params.tipoReporte)
        : 'Reporte Completo'

      // Construir query params
      const queryParams = new URLSearchParams({
        periodo: periodoBackend,
      })

      // Agregar tipo_reporte solo si no es "Reporte Completo" (default del backend)
      if (tipoReporteBackend !== 'Reporte Completo') {
        queryParams.append('tipo_reporte', tipoReporteBackend)
      }

      // Agregar fechas si el periodo es personalizado
      if (periodoBackend === 'Personalizado') {
        if (params.fechaInicio) {
          queryParams.append('fecha_inicio', params.fechaInicio)
        }
        if (params.fechaFin) {
          queryParams.append('fecha_fin', params.fechaFin)
        }
      }

      const url = `${API_BASE_URL}/financiero/graficas?${queryParams.toString()}`
      
      console.log('📊 GET /api/financiero/graficas')
      console.log('   Parámetros:', {
        periodo: periodoBackend,
        tipo_reporte: tipoReporteBackend,
        fecha_inicio: params.fechaInicio,
        fecha_fin: params.fechaFin,
      })

      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.warn('⚠️  No hay token de autenticación. Saltando petición.')
        // Retornar estructura vacía en lugar de lanzar error
        return {
          message: 'Sin token de autenticación',
          filtros_aplicados: {
            periodo: periodoBackend,
            tipo_reporte: tipoReporteBackend,
          },
          data: {
            tendencia_financiera: [],
            gastos_por_categoria: { mostrar: false, datos: [] },
            membresias_por_plan: { mostrar: false, datos: [] },
            ventas_vs_gastos: { mostrar: false, datos: [] },
          },
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Error en respuesta:', response.status, errorData)
        throw new Error(errorData.message || `Error ${response.status} al obtener gráficas`)
      }

      const data: GraficasResponse = await response.json()
      
      console.log('✅ Gráficas obtenidas exitosamente')
      console.log('   Response completo:', JSON.stringify(data, null, 2))
      console.log('   Filtros aplicados:', data.filtros_aplicados)
      console.log('   Tendencia financiera:', data.data.tendencia_financiera.length, 'registros')
      console.log('   Gastos por categoría:', data.data.gastos_por_categoria.datos.length, 'categorías')
      console.log('   Membresías por plan:', data.data.membresias_por_plan.datos.length, 'planes')
      console.log('   Ventas vs Gastos:', data.data.ventas_vs_gastos.datos.length, 'registros')

      return data
    } catch (error: any) {
      console.error('❌ Error obteniendo gráficas:', error)
      throw error
    }
  }

  /**
   * Obtener resumen financiero (KPIs)
   */
  static async getResumen(params: {
    periodo: string
    tipoReporte?: string
    fechaInicio?: string
    fechaFin?: string
  }): Promise<ResumenResponse> {
    try {
      // Mapear parámetros de frontend a backend
      const periodoBackend = mapPeriodoToBackend(params.periodo)
      const tipoReporteBackend = params.tipoReporte 
        ? mapTipoReporteToBackend(params.tipoReporte)
        : 'Reporte Completo'

      // Construir query params
      const queryParams = new URLSearchParams({
        periodo: periodoBackend,
      })

      // Solo agregar tipo_reporte si no es el default
      if (tipoReporteBackend !== 'Reporte Completo') {
        queryParams.append('tipo_reporte', tipoReporteBackend)
      }

      // Si es periodo personalizado, agregar fechas
      if (periodoBackend === 'Personalizado') {
        if (params.fechaInicio) {
          queryParams.append('fecha_inicio', params.fechaInicio)
        }
        if (params.fechaFin) {
          queryParams.append('fecha_fin', params.fechaFin)
        }
      }

      const url = `${API_BASE_URL}/financiero/resumen?${queryParams.toString()}`
      
      console.log('📊 GET /api/financiero/resumen')
      console.log('   Parámetros:', {
        periodo: periodoBackend,
        tipo_reporte: tipoReporteBackend,
        fecha_inicio: params.fechaInicio,
        fecha_fin: params.fechaFin,
      })
      console.log('   URL:', url)

      // Obtener token de autenticación
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.warn('⚠️  No hay token de autenticación. Saltando petición.')
        // Retornar estructura vacía en lugar de lanzar error
        return {
          message: 'Sin token de autenticación',
          filtros_aplicados: {
            periodo: periodoBackend,
            tipo_reporte: tipoReporteBackend,
          },
          data: {
            kpis_superiores: {
              ingresos: { total: 0, porcentaje: 0 },
              gastos: { total: 0, porcentaje: 0 },
              utilidad_neta: { total: 0, porcentaje: 0 },
              membresias: { total: 0, porcentaje: 0, socios_activos: 0 }
            },
            desglose_ingresos: {
              mostrar: false,
              total_ingresos: 0,
              saldo_neto: 0,
              grafica: {
                ventas: { total: 0, porcentaje_grafica: 0, porcentaje_vs_anterior: 0 },
                membresias: { total: 0, porcentaje_grafica: 0, porcentaje_vs_anterior: 0 }
              }
            },
            tarjetas_detalle: {
              ventas: { mostrar: false, total: 0, transacciones: 0, porcentaje_vs_anterior: 0, anterior_texto: "" },
              gastos: { mostrar: false, total: 0, movimientos: 0, porcentaje_vs_anterior: 0, anterior_texto: "" },
              utilidad: { mostrar: false, total: 0, margen: 0, porcentaje_vs_anterior: 0, anterior_texto: "" },
              membresias: { mostrar: false, total: 0, socios_activos: 0, porcentaje_vs_anterior: 0, anterior_texto: "" }
            }
          },
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data: KpisResponse = await response.json()
      
      console.log('✅ Resumen obtenido exitosamente')
      console.log('   Response completo:', JSON.stringify(data, null, 2))
      console.log('   Filtros aplicados:', data.filtros_aplicados)
      
      // Verificar si la respuesta tiene la estructura esperada
      if (data.data.kpis_superiores) {
        console.log('   Estructura: kpis_superiores detectada')
        console.log('   Ingresos:', data.data.kpis_superiores.ingresos.total)
        console.log('   Gastos:', data.data.kpis_superiores.gastos.total)
        console.log('   Utilidad neta:', data.data.kpis_superiores.utilidad_neta.total)
        console.log('   Membresías:', data.data.kpis_superiores.membresias.total)
        console.log('   Socios activos:', data.data.kpis_superiores.membresias.socios_activos)
      } else {
        console.log('   Estructura: formato desconocido')
        console.log('   Data keys:', Object.keys(data.data))
      }

      return data
    } catch (error: any) {
      console.error('❌ Error obteniendo KPIs:', error)
      throw error
    }
  }

  /**
   * Alias para getResumen() - Obtener KPIs financieros
   * Usa el endpoint /api/financiero/kpis
   */
  static async getKpis(params: {
    periodo: string
    tipoReporte?: string
    fechaInicio?: string
    fechaFin?: string
  }): Promise<KpisResponse> {
    return this.getResumen(params)
  }

  /**
   * Obtener comparaciones financieras
   */
  static async getComparaciones(params: {
    periodo: string
    tabSeleccionada: string
  }): Promise<ComparacionesResponse> {
    try {
      // Mapear parámetros de frontend a backend
      const periodoBackend = mapPeriodoToBackend(params.periodo)
      const tabBackend = mapTabSeleccionadaToBackend(params.tabSeleccionada)

      // Construir query params
      const queryParams = new URLSearchParams({
        periodo: periodoBackend,
        tab_seleccionada: tabBackend,
      })

      const url = `${API_BASE_URL}/financiero/comparaciones?${queryParams.toString()}`
      
      console.log('📊 GET /api/financiero/comparaciones')
      console.log('   Parámetros:', {
        periodo: periodoBackend,
        tab_seleccionada: tabBackend,
      })
      console.log('   URL:', url)

      // Obtener token de autenticación
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.warn('⚠️  No hay token de autenticación. Saltando petición.')
        // Retornar estructura vacía en lugar de lanzar error
        return {
          message: 'Sin token de autenticación',
          filtros_aplicados: {
            periodo: periodoBackend,
            tab_seleccionada: tabBackend,
          },
          data: {
            titulo_grafica: '',
            comparaciones: {
              ventas: { actual: 0, anterior: 0, diferencia: 0, porcentaje: 0, es_positivo: true },
              gastos: { actual: 0, anterior: 0, diferencia: 0, porcentaje: 0, es_positivo: true },
              utilidad: { actual: 0, anterior: 0, diferencia: 0, porcentaje: 0, es_positivo: true },
              membresias: { actual: 0, anterior: 0, diferencia: 0, porcentaje: 0, es_positivo: true },
            },
            resumen_indicadores: {
              positivos: 0,
              negativos: 0,
            },
            insights: [],
          },
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data: ComparacionesResponse = await response.json()
      
      console.log('✅ Comparaciones obtenidas exitosamente')
      console.log('   Título gráfica:', data.data.titulo_grafica)
      console.log('   Filtros aplicados:', data.filtros_aplicados)
      console.log('   Resumen indicadores:', data.data.resumen_indicadores)
      console.log('   Insights:', data.data.insights.length, 'items')
      console.log('   Comparaciones:')
      console.log('     - Ventas:', data.data.comparaciones.ventas.actual, 'vs', data.data.comparaciones.ventas.anterior)
      console.log('     - Gastos:', data.data.comparaciones.gastos.actual, 'vs', data.data.comparaciones.gastos.anterior)
      console.log('     - Utilidad:', data.data.comparaciones.utilidad.actual, 'vs', data.data.comparaciones.utilidad.anterior)
      console.log('     - Membresías:', data.data.comparaciones.membresias.actual, 'vs', data.data.comparaciones.membresias.anterior)

      return data
    } catch (error: any) {
      console.error('❌ Error obteniendo comparaciones:', error)
      throw error
    }
  }

  /**
   * Obtener historial de reportes
   */
  static async getHistorialReportes(params: {
    page?: number
    limit?: number
  }): Promise<HistorialResponse> {
    try {
      const page = params.page || 1
      const limit = params.limit || 10

      // Construir query params
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })

      const url = `${API_BASE_URL}/financiero/historial-reportes?${queryParams.toString()}`
      
      console.log('📊 GET /api/financiero/historial-reportes')
      console.log('   Parámetros:', { page, limit })
      console.log('   URL:', url)

      // Obtener token de autenticación
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.warn('⚠️  No hay token de autenticación. Saltando petición.')
        // Retornar estructura vacía en lugar de lanzar error
        return {
          message: 'Sin token de autenticación',
          data: {
            reportes: [],
            paginacion: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0,
            },
          },
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data: HistorialResponse = await response.json()
      
      console.log('✅ Historial de reportes obtenido exitosamente')
      console.log('   Response completo:', JSON.stringify(data, null, 2))
      console.log('   Tipo de data:', typeof data)
      console.log('   Es array?', Array.isArray(data))
      
      // Manejar respuesta directa de array (API sin estructura completa)
      if (Array.isArray(data)) {
        console.warn('⚠️  Respuesta es array directo, creando estructura wrapper')
        return {
          message: 'Historial obtenido',
          data: {
            reportes: data,
            paginacion: {
              total: data.length,
              page: 1,
              limit: data.length,
              totalPages: 1,
            },
          },
        }
      }
      
      console.log('   data.data existe?', !!data.data)
      console.log('   data.data.paginacion existe?', !!data.data?.paginacion)
      console.log('   data.data.reportes existe?', !!data.data?.reportes)
      
      // Validar estructura de respuesta
      if (!data.data) {
        console.warn('⚠️  Respuesta sin data, usando estructura vacía')
        return {
          message: data.message || 'Sin datos',
          data: {
            reportes: [],
            paginacion: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0,
            },
          },
        }
      }
      
      if (!data.data.paginacion) {
        console.warn('⚠️  Respuesta sin paginación, creando estructura por defecto')
        data.data.paginacion = {
          total: data.data.reportes?.length || 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        }
      }
      
      console.log('   Total reportes:', data.data?.paginacion?.total || 0)
      console.log('   Página actual:', data.data?.paginacion?.page || 1, 'de', data.data?.paginacion?.totalPages || 1)
      console.log('   Reportes en esta página:', data.data?.reportes?.length || 0)

      return data
    } catch (error: any) {
      console.error('❌ Error obteniendo historial de reportes:', error)
      throw error
    }
  }

  /**
   * Generar un nuevo reporte
   */
  static async generarReporte(config: {
    nombre: string
    descripcion: string
    tipoReporte: string
    formato: string
    fechaInicio: string
    fechaFin: string
    incluirGraficos: boolean
    incluirDetalles: boolean
  }): Promise<any> {
    try {
      const url = `${API_BASE_URL}/financiero/generar-reporte`
      
      console.log('📊 POST /api/financiero/generar-reporte')
      console.log('   Configuración:', config)

      // Obtener token de autenticación
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor inicia sesión.')
      }

      const body = {
        nombre: config.nombre,
        descripcion: config.descripcion,
        tipo_reporte: config.tipoReporte,
        formato: config.formato,
        fecha_inicio: config.fechaInicio,
        fecha_fin: config.fechaFin,
        incluir_graficos: config.incluirGraficos,
        incluir_detalles: config.incluirDetalles,
      }

      console.log('   Body:', JSON.stringify(body, null, 2))

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log('✅ Reporte generado exitosamente')
      console.log('   Response completo:', JSON.stringify(data, null, 2))
      console.log('   Tiene data?', !!data.data)
      console.log('   Tiene data.id?', !!data.data?.id)
      console.log('   Tiene data.url_descarga?', !!data.data?.url_descarga)

      return data
    } catch (error: any) {
      console.error('❌ Error generando reporte:', error)
      throw error
    }
  }

  /**
   * Descargar un reporte del historial
   */
  static async descargarReporte(reporteId: string): Promise<void> {
    try {
      const url = `${API_BASE_URL}/financiero/descargar-reporte/${reporteId}`
      
      console.log('📥 GET /api/financiero/descargar-reporte/' + reporteId)

      // Obtener token de autenticación
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor inicia sesión.')
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      // Descargar archivo como blob
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Obtener nombre del archivo del header Content-Disposition o usar uno por defecto
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `reporte_${reporteId}.csv`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      console.log('✅ Reporte descargado:', filename)
    } catch (error: any) {
      console.error('❌ Error descargando reporte:', error)
      throw error
    }
  }

  /**
   * Eliminar un reporte del historial
   */
  static async eliminarReporte(reporteId: string): Promise<void> {
    try {
      const url = `${API_BASE_URL}/financiero/eliminar-reporte/${reporteId}`
      
      console.log('🗑️  DELETE /api/financiero/eliminar-reporte/' + reporteId)

      // Obtener token de autenticación
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor inicia sesión.')
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log('✅ Reporte eliminado exitosamente')
      console.log('   Response:', JSON.stringify(data, null, 2))

      return data
    } catch (error: any) {
      console.error('❌ Error eliminando reporte:', error)
      throw error
    }
  }

  /**
   * Transformar datos de backend a formato para gráficas
   */
  static transformGraficasData(response: GraficasResponse) {
    // Convertir tendencia financiera a formato de gráficas mensuales
    const tendenciaData = response.data.tendencia_financiera.map(item => ({
      fecha: item.fecha,
      ventas: item.ventas || 0,
      gastos: item.gastos || 0,
      membresias: item.membresias || 0,
      utilidad: item.utilidad || 0,
    }))

    // Separar en arrays individuales para cada métrica
    const ventasPorMes = tendenciaData.map(item => ({
      mes: item.fecha,
      total: item.ventas,
    }))

    const gastosPorMes = tendenciaData.map(item => ({
      mes: item.fecha,
      total: item.gastos,
    }))

    const membresiasPorMes = tendenciaData.map(item => ({
      mes: item.fecha,
      total: item.membresias,
    }))

    return {
      // Datos mensuales separados
      ventasPorMes,
      gastosPorMes,
      membresiasPorMes,

      // Gastos por categoría
      gastosPorCategoria: response.data.gastos_por_categoria.mostrar
        ? response.data.gastos_por_categoria.datos.map(item => ({
            categoria: item.categoria,
            total: item.monto,
          }))
        : [],

      // Membresías por plan
      membresiasPorPlan: response.data.membresias_por_plan.mostrar
        ? response.data.membresias_por_plan.datos.map(item => ({
            plan: item.plan,
            cantidad: item.cantidad,
            total: item.ingresos_generados,
          }))
        : [],

      // Ventas vs Gastos
      ventasVsGastos: response.data.ventas_vs_gastos.mostrar
        ? response.data.ventas_vs_gastos.datos.map(item => ({
            fecha: item.fecha,
            ventas: item.ventas,
            gastos: item.gastos,
          }))
        : [],

      // Flags de visibilidad
      mostrar: {
        gastosPorCategoria: response.data.gastos_por_categoria.mostrar,
        membresiasPorPlan: response.data.membresias_por_plan.mostrar,
        ventasVsGastos: response.data.ventas_vs_gastos.mostrar,
      },
    }
  }
}
