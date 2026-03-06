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
import { mapCategoriaFromAPI, generarPrefijoAutomatico } from '@/lib/types/categorias'

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
   * NOTA: El backend solo acepta { nombre }, pero el frontend maneja campos adicionales
   */
  static async create(formData: CategoriaFormData): Promise<Categoria> {
    console.log('🔄 POST /api/categorias - Creando categoría', formData)
    
    // El backend solo acepta nombre
    const requestData: CreateCategoriaRequest = {
      nombre: formData.nombre.trim()
    }
    
    console.log('  Enviando al backend:', requestData)
    
    const response = await apiPost<CategoriaResponse>('/categorias', requestData)
    console.log('✅ Categoría creada en backend:', response.data)
    
    // Mapear respuesta y agregar valores del frontend
    const categoria = mapCategoriaFromAPI(response.data)
    
    // Aplicar valores del formulario que no vienen del backend
    if (formData.prefijo) {
      categoria.prefijo = formData.prefijo.toUpperCase()
    } else {
      // Generar prefijo automático basado en el nombre
      categoria.prefijo = generarPrefijoAutomatico(formData.nombre)
    }
    
    if (formData.color) {
      categoria.color = formData.color
    }
    
    if (formData.descripcion) {
      categoria.descripcion = formData.descripcion.trim()
    }
    
    if (formData.estado) {
      categoria.estado = formData.estado
    }
    
    console.log('✅ Categoría enriquecida con datos del frontend:', categoria)
    
    return categoria
  }

  /**
   * Actualizar categoría existente
   * NOTA: El backend solo acepta { nombre }, pero el frontend maneja campos adicionales
   */
  static async update(id: number, formData: CategoriaFormData): Promise<Categoria> {
    console.log(`🔄 PUT /api/categorias/${id} - Actualizando categoría`, formData)
    
    // El backend solo acepta nombre
    const requestData: UpdateCategoriaRequest = {
      nombre: formData.nombre?.trim()
    }
    
    console.log('  Enviando al backend:', requestData)
    
    const response = await apiPut<CategoriaResponse>(`/categorias/${id}`, requestData)
    console.log('✅ Categoría actualizada en backend:', response.data)
    
    // Mapear respuesta y aplicar valores del frontend
    const categoria = mapCategoriaFromAPI(response.data)
    
    // Aplicar valores del formulario que no vienen del backend
    if (formData.prefijo) {
      categoria.prefijo = formData.prefijo.toUpperCase()
    }
    
    if (formData.color) {
      categoria.color = formData.color
    }
    
    if (formData.descripcion !== undefined) {
      categoria.descripcion = formData.descripcion.trim() || undefined
    }
    
    if (formData.estado) {
      categoria.estado = formData.estado
    }
    
    console.log('✅ Categoría enriquecida con datos del frontend:', categoria)
    
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
