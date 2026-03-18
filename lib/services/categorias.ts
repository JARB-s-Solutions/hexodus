import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import type { 
  Categoria, 
  GetCategoriasResponse,
  GetCategoriaResponse,
  CreateCategoriaRequest,
  UpdateCategoriaRequest,
  CategoriaResponse,
  DeleteCategoriaResponse,
  CategoriaStats,
  GetCategoriaStatsResponse,
  CategoriaFormData
} from '@/lib/types/categorias'
import { mapCategoriaFromAPI, mapCategoriaToAPI } from '@/lib/types/categorias'

/**
 * Servicio para gestionar categorías
 */
export class CategoriasService {
  /**
   * Obtener todas las categorías
   */
  static async getAll(): Promise<Categoria[]> {
    console.log('🔄 GET /api/categorias - Obteniendo categorías')
    
    const response = await apiGet<GetCategoriasResponse>('/categorias')
    console.log('✅ Response de categorías:', {
      message: response.message,
      total: response.data?.length
    })
    
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('⚠️ Response no contiene array de categorías:', response)
      return []
    }
    
    const categorias = response.data.map(mapCategoriaFromAPI)
    console.log(`✅ ${categorias.length} categorías mapeadas correctamente`, categorias)
    
    return categorias
  }

  /**
   * Obtener una categoría por ID
   */
  static async getById(id: number): Promise<Categoria> {
    console.log(`🔄 GET /api/categorias/${id} - Obteniendo categoría`)
    
    const response = await apiGet<GetCategoriaResponse>(`/categorias/${id}`)
    console.log('✅ Categoría obtenida:', response.data)
    
    return mapCategoriaFromAPI(response.data)
  }

  /**
   * Crear nueva categoría
   * El backend ya acepta todos los campos: nombre, prefijo, color, descripcion, estado
   */
  static async create(formData: CategoriaFormData): Promise<Categoria> {
    console.log('🔄 POST /api/categorias - Creando categoría', formData)
    
    // Mapear datos del formulario al formato del API
    const requestData: CreateCategoriaRequest = mapCategoriaToAPI(formData)
    
    console.log('  Enviando al backend:', requestData)
    
    const response = await apiPost<CategoriaResponse>('/categorias', requestData)
    console.log('✅ Categoría creada:', response.data)
    
    // Mapear respuesta del backend
    const categoria = mapCategoriaFromAPI(response.data)
    console.log('✅ Categoría mapeada:', categoria)
    
    return categoria
  }

  /**
   * Actualizar categoría existente
   * El backend ya acepta todos los campos: nombre, prefijo, color, descripcion, estado
   */
  static async update(id: number, formData: CategoriaFormData): Promise<Categoria> {
    console.log(`🔄 PUT /api/categorias/${id} - Actualizando categoría`, formData)
    
    // Mapear datos del formulario al formato del API
    const requestData: UpdateCategoriaRequest = {
      nombre: formData.nombre?.trim(),
      prefijo: formData.prefijo?.trim().toUpperCase(),
      color: formData.color,
      descripcion: formData.descripcion?.trim(),
      estado: formData.estado,
    }
    
    console.log('  Enviando al backend:', requestData)
    
    const response = await apiPut<CategoriaResponse>(`/categorias/${id}`, requestData)
    console.log('✅ Categoría actualizada:', response.data)
    
    // Mapear respuesta del backend
    const categoria = mapCategoriaFromAPI(response.data)
    console.log('✅ Categoría mapeada:', categoria)
    
    return categoria
  }

  /**
   * Eliminar categoría
   */
  static async delete(id: number): Promise<void> {
    console.log(`🔄 DELETE /api/categorias/${id} - Eliminando categoría`)
    
    await apiDelete<DeleteCategoriaResponse>(`/categorias/${id}`)
    console.log('✅ Categoría eliminada')
  }

  /**
   * Obtener estadísticas de una categoría
   */
  static async getStats(id: number): Promise<CategoriaStats> {
    console.log(`🔄 GET /api/categorias/${id}/stats - Obteniendo estadísticas`)
    
    const response = await apiGet<GetCategoriaStatsResponse>(`/categorias/${id}/stats`)
    console.log('✅ Estadísticas obtenidas:', response.data)
    
    return response.data
  }

  /**
   * Validar si un prefijo está disponible
   */
  static async validarPrefijo(prefijo: string, excludeId?: number): Promise<boolean> {
    try {
      const categorias = await this.getAll()
      const prefijoExiste = categorias.some(
        cat => cat.prefijo === prefijo.toUpperCase() && cat.id !== excludeId
      )
      return !prefijoExiste
    } catch (error) {
      console.error('Error validando prefijo:', error)
      return false
    }
  }

  /**
   * Validar si un nombre está disponible
   */
  static async validarNombre(nombre: string, excludeId?: number): Promise<boolean> {
    try {
      const categorias = await this.getAll()
      const nombreExiste = categorias.some(
        cat => cat.nombre.toLowerCase() === nombre.toLowerCase() && cat.id !== excludeId
      )
      return !nombreExiste
    } catch (error) {
      console.error('Error validando nombre:', error)
      return false
    }
  }
}
