import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { getMetodosPago as getMetodosPagoConfiguracion } from '@/lib/services/metodos-pago'
import type {
  Socio,
  SocioAPI,
  CreateSocioRequest,
  CreateSocioResponse,
  CotizarRequest,
  CotizacionResponse,
  GetSociosResponse,
  SocioResponse,
  DashboardStatsSocios,
  MetodoPago,
  HistorialPagosResponse,
} from '@/lib/types/socios'
import { mapSocioFromAPI, mapSocioListItemFromAPI } from '@/lib/types/socios'

/**
 * Servicio para gestionar socios
 */
export class SociosService {
  /**
   * Obtener todos los socios con estadísticas del dashboard
   */
  static async getAll(): Promise<{ socios: Socio[], stats: DashboardStatsSocios }> {
    console.log('🔄 GET /api/socios - Obteniendo todos los socios')

    const limitePorPagina = 100
    let paginaActual = 1
    let totalPaginas = 1
    const sociosAcumulados: GetSociosResponse['data'] = []
    let dashboardStats: DashboardStatsSocios | undefined

    while (paginaActual <= totalPaginas) {
      const response = await apiGet<GetSociosResponse>(`/socios?page=${paginaActual}&limit=${limitePorPagina}`)

      if (!dashboardStats) {
        dashboardStats = response.dashboard_stats
      }

      if (Array.isArray(response.data)) {
        sociosAcumulados.push(...response.data)
      }

      const totalPaginasBackend = response.pagination?.total_pages
      totalPaginas = typeof totalPaginasBackend === 'number' && totalPaginasBackend > 0
        ? totalPaginasBackend
        : 1

      console.log(`📄 Página ${paginaActual}/${totalPaginas} cargada. Socios acumulados: ${sociosAcumulados.length}`)
      paginaActual += 1
    }

    console.log('✅ Response de socios:', {
      total: sociosAcumulados.length,
      stats: dashboardStats
    })

    const stats = dashboardStats ?? {
      total_socios: { valor: 0, etiqueta: 'Total Socios' },
      socios_activos: { valor: 0, etiqueta: 'Activos' },
      vencidos: { valor: 0, etiqueta: 'Vencidos' },
      vencen_en_7_dias: { valor: 0, etiqueta: 'Vencen en 7 días' },
    }

    if (sociosAcumulados.length === 0) {
      console.warn('⚠️ No se recibieron socios al paginar la API')
      return {
        socios: [],
        stats,
      }
    }

    const socios = sociosAcumulados.map(mapSocioListItemFromAPI)
    console.log(`✅ ${socios.length} socios mapeados correctamente`)

    return {
      socios,
      stats
    }
  }

  /**
   * Obtener un socio por ID
   */
  static async getById(id: number): Promise<Socio> {
    console.log(`🔄 GET /api/socios/${id} - Obteniendo socio`)
    
    const response = await apiGet<SocioResponse>(`/socios/${id}`)
    console.log('✅ Respuesta API cruda:', response)
    console.log('📋 Datos del socio (response.data):', response.data)
    console.log('🏷️ Campo plan_id en API:', {
      plan_id: response.data.plan_id,
      tipo: typeof response.data.plan_id,
      membresia: response.data.membresia
    })
    
    if (!response.data) {
      throw new Error('No se encontró el socio')
    }
    
    const socioMapeado = mapSocioFromAPI(response.data)
    console.log('🔄 Socio después de mapear:', socioMapeado)
    console.log('📅 Fechas contrato mapeadas:', {
      inicioContrato: socioMapeado.inicioContrato,
      finContrato: socioMapeado.finContrato
    })
    console.log('🆔 Plan ID mapeado:', {
      planId: socioMapeado.planId,
      tipo: typeof socioMapeado.planId,
      esCero: socioMapeado.planId === 0
    })
    
    return socioMapeado
  }

  /**
   * Cotizar membresía (PASO 2)
   * Obtiene el desglose de cobro sin crear al socio
   */
  static async cotizar(data: CotizarRequest): Promise<CotizacionResponse['data']> {
    console.log('🔄 POST /api/socios/cotizar - Cotizando membresía')
    console.log('📤 Datos a enviar:', data)
    
    const response = await apiPost<CotizacionResponse>('/socios/cotizar', data)
    console.log('✅ Cotización obtenida:', response)
    
    if (!response.data) {
      throw new Error('No se pudo obtener la cotización')
    }
    
    return response.data
  }

  /**
   * Crear un nuevo socio (PASO 4)
   * Envía todos los datos incluyendo el estado de pago
   */
  static async create(data: CreateSocioRequest): Promise<CreateSocioResponse['data']> {
    console.log('🆕 POST /api/socios - Creando nuevo socio')
    console.log('📤 Payload completo:', data)
    
    const response = await apiPost<CreateSocioResponse>('/socios', data)
    console.log('✅ Socio creado exitosamente:', response)
    
    if (!response.data) {
      throw new Error('No se recibió respuesta válida del servidor')
    }
    
    return response.data
  }

  /**
   * Actualizar un socio existente
   */
  static async update(id: number, data: Partial<CreateSocioRequest>): Promise<Socio> {
    console.log(`✏️ PUT /api/socios/${id} - Actualizando socio`)
    console.log('📤 Datos a actualizar:', data)
    
    const response = await apiPut<SocioResponse>(`/socios/${id}`, data)
    console.log('✅ Respuesta del servidor:', response)
    
    // Si el backend devuelve solo { message: "..." } sin data, recargar el socio
    if (!response.data) {
      console.log('⚠️ No hay data en response, recargando socio...')
      return await this.getById(id)
    }
    
    return mapSocioFromAPI(response.data)
  }

  /**
   * Eliminar un socio (soft delete)
   */
  static async delete(id: number): Promise<void> {
    console.log(`❌ DELETE /api/socios/${id} - Eliminando socio`)
    
    await apiDelete(`/socios/${id}`)
    console.log('✅ Socio eliminado exitosamente')
  }

  /**
   * Actualizar estado del socio
   */
  static async updateEstado(id: number, estado: 'activo' | 'inactivo' | 'suspendido'): Promise<Socio> {
    console.log(`🔄 PUT /api/socios/${id}/estado - Actualizando estado`)
    console.log('📤 Nuevo estado:', estado)
    
    const response = await apiPut<SocioResponse>(`/socios/${id}/estado`, { estado })
    console.log('✅ Estado actualizado:', response)
    
    if (!response.data) {
      throw new Error('No se pudo actualizar el estado')
    }
    
    return mapSocioFromAPI(response.data)
  }

  /**
   * Registrar pago de membresía pendiente en caja
   * POST /api/socios/:id/pagar-membresia
   */
  static async pagarMembresiaPendiente(id: number, metodoPagoId: number): Promise<string> {
    console.log(`💰 POST /api/socios/${id}/pagar-membresia - Registrando pago de adeudo`)
    console.log('📤 metodo_pago_id:', metodoPagoId)

    const response = await apiPost<{ message?: string }>(`/socios/${id}/pagar-membresia`, {
      metodo_pago_id: metodoPagoId,
    })

    const mensaje = response?.message || 'Pago registrado correctamente en caja.'
    console.log('✅ Pago de adeudo registrado:', mensaje)
    return mensaje
  }

  /**
   * Buscar socios por nombre o código
   */
  static async buscar(query: string): Promise<Array<{
    id: number
    nombre: string
    codigo: string
    foto?: string
    membresia?: string
  }>> {
    console.log(`🔍 GET /api/socios?search=${query} - Buscando socios`)
    
    if (!query || query.trim().length < 2) {
      return []
    }
    
    const response = await apiGet<GetSociosResponse>(`/socios?search=${encodeURIComponent(query.trim())}`)
    console.log('✅ Resultados de búsqueda:', response)
    console.log('📋 Data completa:', response.data)
    console.log('📋 Primer socio:', response.data?.[0])
    
    if (!response.data || !Array.isArray(response.data)) {
      return []
    }
    
    // Mapear a formato simplificado para el buscador
    // SocioListItemAPI usa 'clave' y 'nombre', no 'codigo_socio' y 'nombre_completo'
    const resultados = response.data.slice(0, 10).map((socio) => {
      console.log('🔄 Mapeando socio:', {
        socio_id: socio.socio_id,
        nombre: socio.nombre,
        clave: socio.clave,
        membresia: socio.membresia
      })
      
      return {
        id: socio.socio_id,
        nombre: socio.nombre,
        codigo: socio.clave,
        foto: undefined, // SocioListItemAPI no tiene foto_perfil_url
        membresia: socio.membresia || undefined,
      }
    })
    
    console.log('✅ Resultados mapeados:', resultados)
    return resultados
  }

  /**
   * Obtener historial de pagos de un socio
   * GET /api/socios/:id/historial-pagos
   */
  static async getHistorialPagos(id: number): Promise<HistorialPagosResponse['data']> {
    console.log(`🔄 GET /api/socios/${id}/historial-pagos - Obteniendo historial de pagos`)

    const response = await apiGet<HistorialPagosResponse>(`/socios/${id}/historial-pagos`)
    console.log('✅ Historial de pagos obtenido:', response)

    if (!response.data) {
      throw new Error('No se pudo obtener el historial de pagos')
    }

    return response.data
  }
}

/**
 * Servicio para métodos de pago
 */
export class MetodosPagoService {
  /**
   * Obtener todos los métodos de pago activos
   */
  static async getAll(): Promise<MetodoPago[]> {
    console.log('🔄 GET /api/metodos-pago - Obteniendo métodos de pago')

    const metodos = await getMetodosPagoConfiguracion()

    // Checkout necesita un ID numerico para enviar metodo_pago_id.
    const metodosNormalizados: MetodoPago[] = metodos
      .map((m) => {
        const numericId =
          m.metodo_pago_id !== undefined
            ? m.metodo_pago_id
            : Number.isFinite(Number(m.id))
            ? Number(m.id)
            : undefined

        if (!numericId) return null

        return {
          metodo_pago_id: numericId,
          nombre: m.nombre || 'Metodo desconocido',
          activo: m.activo !== undefined ? m.activo : true,
        }
      })
      .filter((m): m is MetodoPago => m !== null)

    console.log('✅ Métodos normalizados para checkout:', metodosNormalizados)
    return metodosNormalizados
  }
}
