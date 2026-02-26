// ================================================
// SERVICIO DE API PARA MEMBRESÍAS
// ================================================

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api'
import type {
  Membresia,
  MembresiaAPI,
  CreateMembresia,
  UpdateMembresia,
  SearchMembresiaParams,
  GetMembresiasResponse,
  MembresiaResponse,
  UpdateStatusResponse,
} from '@/lib/types/membresias'
import { mapMembresiaFromAPI } from '@/lib/types/membresias'

/**
 * Servicio para manejar las operaciones de membresías
 */
export class MembresiasService {
  private static readonly BASE_PATH = '/membresias'

  /**
   * Obtener todas las membresías
   */
  static async getAll(): Promise<Membresia[]> {
    try {
      console.log('🔄 Obteniendo todas las membresías...')
      const response = await apiGet<any>(this.BASE_PATH)
      console.log('✅ API Response completa:', JSON.stringify(response, null, 2))
      
      // La API puede devolver directamente un array o un objeto con propiedad membresias o data
      let membresiasAPI: MembresiaAPI[] = []
      
      if (Array.isArray(response)) {
        console.log('📦 Response es un array directo')
        membresiasAPI = response
      } else if (response.membresias) {
        console.log('📦 Response tiene propiedad "membresias"')
        membresiasAPI = response.membresias
      } else if (response.data) {
        console.log('📦 Response tiene propiedad "data"')
        membresiasAPI = response.data
      } else {
        console.warn('⚠️  Response no tiene formato esperado:', response)
      }
      
      console.log(`✅ Total de membresías obtenidas: ${membresiasAPI.length}`)
      
      // Convertir de API format a Frontend format
      const mapped = membresiasAPI.map(mapMembresiaFromAPI)
      console.log('✅ Membresías mapeadas:', mapped)
      return mapped
    } catch (error) {
      console.error('❌ Error en getAll membresias:', error)
      throw error
    }
  }

  /**
   * Obtener una membresía por ID
   */
  static async getById(id: number): Promise<Membresia> {
    const response = await apiGet<MembresiaResponse>(`${this.BASE_PATH}/${id}`)
    const membresiaData = response.membresia || response.data
    return mapMembresiaFromAPI(membresiaData)
  }

  /**
   * Buscar membresías con filtros
   */
  static async search(params: SearchMembresiaParams): Promise<Membresia[]> {
    const queryParams = new URLSearchParams()
    
    if (params.min_precio !== undefined) {
      queryParams.append('min_precio', params.min_precio.toString())
    }
    if (params.max_precio !== undefined) {
      queryParams.append('max_precio', params.max_precio.toString())
    }
    if (params.estado) {
      queryParams.append('estado', params.estado)
    }
    if (params.search) {
      queryParams.append('search', params.search)
    }
    if (params.tipo_dias !== undefined) {
      queryParams.append('tipo_dias', params.tipo_dias.toString())
    }

    const queryString = queryParams.toString()
    const endpoint = queryString ? `${this.BASE_PATH}?${queryString}` : this.BASE_PATH
    
    const response = await apiGet<GetMembresiasResponse>(endpoint)
    const membresiasAPI = response.membresias || response.data || []
    return membresiasAPI.map(mapMembresiaFromAPI)
  }

  /**
   * Crear una nueva membresía
   */
  static async create(data: CreateMembresia): Promise<Membresia> {
    try {
      console.log('🆕 Creando nueva membresía...')
      console.log('📤 Payload a enviar:', JSON.stringify(data, null, 2))
      
      const response = await apiPost<MembresiaResponse>(this.BASE_PATH, data)
      console.log('✅ Respuesta de creación:', JSON.stringify(response, null, 2))
      
      // La respuesta puede venir como response.membresia (snake_case) o response.data (camelCase)
      const membresiaData = response.membresia || response.data
      return mapMembresiaFromAPI(membresiaData)
    } catch (error) {
      console.error('❌ Error al crear membresía:', error)
      throw error
    }
  }

  /**
   * Actualizar una membresía existente
   */
  static async update(id: number, data: UpdateMembresia): Promise<Membresia> {
    try {
      console.log('✏️  Actualizando membresía...')
      console.log('🔑 ID:', id, '(tipo:', typeof id, ')')
      console.log('📤 Payload a enviar:', JSON.stringify(data, null, 2))
      
      const response = await apiPut<MembresiaResponse>(`${this.BASE_PATH}/${id}`, data)
      console.log('✅ Respuesta de actualización:', JSON.stringify(response, null, 2))
      
      // La respuesta puede venir como response.membresia (snake_case) o response.data (camelCase)
      const membresiaData = response.membresia || response.data
      return mapMembresiaFromAPI(membresiaData)
    } catch (error) {
      console.error('❌ Error al actualizar membresía:', error)
      throw error
    }
  }

  /**
   * Actualizar el estado de una membresía (activo/inactivo)
   */
  static async updateStatus(id: number, estado: 'activo' | 'inactivo'): Promise<Membresia | null> {
    console.log('Actualizando estado de membresía:', { id, estado, idType: typeof id })
    const response = await apiPatch<UpdateStatusResponse>(
      `${this.BASE_PATH}/${id}/status`,
      { status: estado }
    )
    const membresiaData = response.membresia || response.data
    return membresiaData ? mapMembresiaFromAPI(membresiaData) : null
  }

  /**
   * Eliminar una membresía
   */
  static async delete(id: number): Promise<void> {
    await apiDelete(`${this.BASE_PATH}/${id}`)
  }
}
