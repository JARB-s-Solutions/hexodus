// ============================================================
// SERVICIO DE REPORTES FINANCIEROS
// ============================================================

// URL base de la API - Similar a la configuración en lib/api.ts
const API_BASE_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://hexodusapi.vercel.app/api')
  : 'https://hexodusapi.vercel.app/api'

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
 * Respuesta de endpoint de resumen (KPIs financieros)
 */
export interface ResumenResponse {
  message: string
  filtros_aplicados: {
    periodo: string
    tipo_reporte: string
  }
  data: {
    ventas_actual: number
    ventas_anterior: number
    gastos_actual: number
    gastos_anterior: number
    utilidad_actual: number
    utilidad_anterior: number
    membresias_actual: number
    membresias_anterior: number
    socios_activos: number
  }
}

/**
 * Item de comparación individual
 */
export interface ComparacionItem {
  label: string
  actual: number
  anterior: number
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
    comparaciones: ComparacionItem[]
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
    'mes': 'mes vs mes anterior',
    'trimestre': 'trimestre vs anterior',
    'semestre': 'semestre vs anterior',
    'anual': 'año vs anterior',
  }
  
  return mapper[tab.toLowerCase()] || 'mes vs mes anterior'
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
            ventas_actual: 0,
            ventas_anterior: 0,
            gastos_actual: 0,
            gastos_anterior: 0,
            utilidad_actual: 0,
            utilidad_anterior: 0,
            membresias_actual: 0,
            membresias_anterior: 0,
            socios_activos: 0,
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

      const data: ResumenResponse = await response.json()
      
      console.log('✅ Resumen obtenido exitosamente')
      console.log('   Filtros aplicados:', data.filtros_aplicados)
      console.log('   Ventas actual:', data.data.ventas_actual)
      console.log('   Gastos actual:', data.data.gastos_actual)
      console.log('   Utilidad actual:', data.data.utilidad_actual)
      console.log('   Membresías actual:', data.data.membresias_actual)
      console.log('   Socios activos:', data.data.socios_activos)

      return data
    } catch (error: any) {
      console.error('❌ Error obteniendo resumen:', error)
      throw error
    }
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
            comparaciones: [],
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
      console.log('   Filtros aplicados:', data.filtros_aplicados)
      console.log('   Comparaciones:', data.data.comparaciones.length, 'items')

      return data
    } catch (error: any) {
      console.error('❌ Error obteniendo comparaciones:', error)
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
