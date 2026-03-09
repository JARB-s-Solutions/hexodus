import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
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
    
    const response = await apiGet<GetSociosResponse>('/socios')
    console.log('✅ Response de socios:', {
      message: response.message,
      total: response.data?.length,
      stats: response.dashboard_stats
    })
    
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('⚠️ Response no contiene array de socios:', response)
      return { socios: [], stats: response.dashboard_stats }
    }
    
    const socios = response.data.map(mapSocioListItemFromAPI)
    console.log(`✅ ${socios.length} socios mapeados correctamente`)
    
    return {
      socios,
      stats: response.dashboard_stats
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
    
    const response = await apiGet<any>('/metodos-pago')
    console.log('✅ Métodos de pago obtenidos:', response)
    console.log('📋 Estructura completa de response:', JSON.stringify(response, null, 2))
    
    // La API puede devolver los datos en response.data o directamente en response
    let metodos = response.data || response
    
    console.log('📋 Metodos extraídos:', metodos)
    
    if (!Array.isArray(metodos)) {
      console.warn('⚠️ Los métodos no son un array:', metodos)
      return []
    }
    
    // Validar que cada método tenga las propiedades necesarias
    const metodosValidos = metodos.filter((m: any) => {
      const esValido = m && typeof m === 'object' && (m.metodo_pago_id || m.id)
      if (!esValido) {
        console.warn('⚠️ Método inválido encontrado:', m)
      }
      return esValido
    })
    
    // Normalizar los datos si vienen con 'id' en lugar de 'metodo_pago_id'
    const metodosNormalizados: MetodoPago[] = metodosValidos.map((m: any) => ({
      metodo_pago_id: m.metodo_pago_id || m.id,
      nombre: m.nombre || 'Método desconocido',
      descripcion: m.descripcion,
      activo: m.activo !== undefined ? m.activo : true
    }))
    
    console.log('✅ Métodos normalizados:', metodosNormalizados)
    
    return metodosNormalizados
  }
}
