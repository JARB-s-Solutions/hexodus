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
      const response = await apiGet<any>(this.BASE_PATH)
      console.log('API Response:', response)
      
      // La API puede devolver directamente un array o un objeto con propiedad membresias
      let membresiasAPI: MembresiaAPI[] = []
      
      if (Array.isArray(response)) {
        membresiasAPI = response
      } else if (response.membresias) {
        membresiasAPI = response.membresias
      } else if (response.data) {
        membresiasAPI = response.data
      }
      
      console.log('Membresias API:', membresiasAPI)
      
      // Convertir de API format a Frontend format
      return membresiasAPI.map(mapMembresiaFromAPI)
    } catch (error) {
      console.error('Error en getAll membresias:', error)
      throw error
    }
  }

  /**
   * Obtener una membresía por ID
   */
  static async getById(id: number): Promise<Membresia> {
    const response = await apiGet<MembresiaResponse>(`${this.BASE_PATH}/${id}`)
    return mapMembresiaFromAPI(response.membresia)
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
    console.log('Creating membresia with data:', data)
    const response = await apiPost<MembresiaResponse>(this.BASE_PATH, data)
    console.log('Create response:', response)
    return mapMembresiaFromAPI(response.membresia)
  }

  /**
   * Actualizar una membresía existente
   */
  static async update(id: number, data: UpdateMembresia): Promise<Membresia> {
    console.log('Update service - ID:', id, 'Data:', data)
    const response = await apiPut<MembresiaResponse>(`${this.BASE_PATH}/${id}`, data)
    console.log('Update response:', response)
    return mapMembresiaFromAPI(response.membresia)
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
    return response.membresia ? mapMembresiaFromAPI(response.membresia) : null
  }

  /**
   * Eliminar una membresía
   */
  static async delete(id: number): Promise<void> {
    await apiDelete(`${this.BASE_PATH}/${id}`)
  }
}
