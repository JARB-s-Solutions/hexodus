import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import type {
  Producto,
  ProductoExtendido,
  ProductoAPI,
  CreateProductoRequest,
  CreateProductoResponse,
  UpdateProductoRequest,
  UpdateProductoResponse,
  GetProductosResponse,
  ProductoResponse,
  DashboardStatsProductos,
} from '@/lib/types/productos'
import { mapProductoFromAPI, mapProductoDetalleFromAPI, mapProductoToAPI } from '@/lib/types/productos'

/**
 * Servicio para gestionar productos del inventario
 */
export class ProductosService {
  /**
   * Obtener todos los productos con estadísticas del dashboard
   */
  static async getAll(): Promise<{ productos: Producto[], stats: DashboardStatsProductos, pagination: GetProductosResponse['pagination'] }> {
    console.log('🔄 GET /api/productos - Obteniendo todos los productos')
    
    const response = await apiGet<GetProductosResponse>('/productos')
    console.log('✅ Response de productos:', {
      message: response.message,
      total: response.data?.length,
      stats: response.dashboard_stats,
      pagination: response.pagination
    })
    
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('⚠️ Response no contiene array de productos:', response)
      return { 
        productos: [], 
        stats: response.dashboard_stats,
        pagination: response.pagination
      }
    }
    
    const productos = response.data.map(mapProductoFromAPI)
    console.log(`✅ ${productos.length} productos mapeados correctamente`)
    
    return {
      productos,
      stats: response.dashboard_stats,
      pagination: response.pagination
    }
  }

  /**
   * Obtener un producto por ID (con detalle completo)
   */
  static async getById(id: number): Promise<ProductoExtendido> {
    console.log(`🔄 GET /api/productos/${id} - Obteniendo detalle del producto`)
    
    const response = await apiGet<ProductoResponse>(`/productos/${id}`)
    console.log('✅ Response de detalle producto:', response)
    
    if (!response.data) {
      throw new Error('No se encontró el producto')
    }
    
    return mapProductoDetalleFromAPI(response.data)
  }

  /**
   * Crear un nuevo producto
   */
  static async create(data: CreateProductoRequest): Promise<CreateProductoResponse['data']> {
    console.log('🆕 POST /api/productos - Creando nuevo producto')
    console.log('📤 Payload:', data)
    
    const response = await apiPost<CreateProductoResponse>('/productos', data)
    console.log('✅ Producto creado exitosamente:', response)
    
    if (!response.data) {
      throw new Error('No se recibió respuesta válida del servidor')
    }
    
    return response.data
  }

  /**
   * Actualizar un producto existente
   */
  static async update(id: number, data: UpdateProductoRequest): Promise<void> {
    console.log(`✏️ PUT /api/productos/${id} - Actualizando producto`)
    console.log('📤 Datos a actualizar:', data)
    
    const response = await apiPut<UpdateProductoResponse>(`/productos/${id}`, data)
    console.log('✅ Response del servidor:', response)
    console.log('✅ Mensaje:', response.message)
  }

  /**
   * Eliminar un producto (soft delete o hard delete según backend)
   */
  static async delete(id: number): Promise<void> {
    console.log(`❌ DELETE /api/productos/${id} - Eliminando producto`)
    
    await apiDelete(`/productos/${id}`)
    console.log('✅ Producto eliminado exitosamente')
  }

  /**
   * Actualizar stock de un producto
   */
  static async updateStock(id: number, cantidad: number): Promise<ProductoExtendido> {
    console.log(`📦 PUT /api/productos/${id}/stock - Actualizando stock`)
    console.log('📤 Nueva cantidad:', cantidad)
    
    // Nota: Ajustar el endpoint según lo que implemente el backend
    const response = await apiPut<ProductoResponse>(`/productos/${id}`, {
      stock_actual: cantidad
    })
    
    if (!response.data) {
      return await this.getById(id)
    }
    
    return mapProductoDetalleFromAPI(response.data)
  }

  /**
   * Actualizar estado del producto (activo/inactivo)
   */
  static async updateStatus(id: number, status: 'activo' | 'inactivo'): Promise<ProductoExtendido> {
    console.log(`🔄 PUT /api/productos/${id}/status - Actualizando estado`)
    console.log('📤 Nuevo estado:', status)
    
    const response = await apiPut<ProductoResponse>(`/productos/${id}`, {
      status
    })
    
    if (!response.data) {
      return await this.getById(id)
    }
    
    return mapProductoDetalleFromAPI(response.data)
  }
}
