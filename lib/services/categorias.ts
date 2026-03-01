import { apiGet } from '@/lib/api'
import type { Categoria, GetCategoriasResponse } from '@/lib/types/categorias'
import { mapCategoriaFromAPI } from '@/lib/types/categorias'

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
}
