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

    const limitePorPagina = 100
    let paginaActual = 1
    let totalPaginas = 1
    const productosAcumulados: GetProductosResponse['data'] = []
    let dashboardStats: DashboardStatsProductos | undefined
    let ultimaPaginacion: GetProductosResponse['pagination'] = {
      current_page: 1,
      limit: limitePorPagina,
      total_records: 0,
      total_pages: 1,
    }

    while (paginaActual <= totalPaginas) {
      const response = await apiGet<GetProductosResponse>(`/productos?page=${paginaActual}&limit=${limitePorPagina}`)

      console.log('✅ Response de productos:', {
        message: response.message,
        total: response.data?.length,
        stats: response.dashboard_stats,
        pagination: response.pagination
      })

      if (!dashboardStats) {
        dashboardStats = response.dashboard_stats
      }

      if (Array.isArray(response.data)) {
        productosAcumulados.push(...response.data)
      } else {
        console.warn(`⚠️ La página ${paginaActual} no devolvió un arreglo de productos`)
      }

      const paginacion = response.pagination
      if (paginacion) {
        ultimaPaginacion = paginacion
      }

      const totalPaginasBackend = paginacion?.total_pages
      totalPaginas = typeof totalPaginasBackend === 'number' && totalPaginasBackend > 0
        ? totalPaginasBackend
        : 1

      console.log(`📄 Página ${paginaActual}/${totalPaginas} cargada. Productos acumulados: ${productosAcumulados.length}`)
      paginaActual += 1
    }

    const stats = dashboardStats ?? {
      total_productos: { valor: 0, etiqueta: 'Total productos' },
      stock_bajo: { valor: 0, etiqueta: 'Stock bajo' },
      valor_total: { valor: 0, etiqueta: 'Valor total' },
      categorias: { valor: 0, etiqueta: 'Categorías' },
    }

    if (productosAcumulados.length === 0) {
      console.warn('⚠️ No se recibieron productos al paginar la API')
      return {
        productos: [],
        stats,
        pagination: ultimaPaginacion,
      }
    }

    const productos = productosAcumulados.map(mapProductoFromAPI)
    console.log(`✅ ${productos.length} productos mapeados correctamente`)

    return {
      productos,
      stats,
      pagination: {
        ...ultimaPaginacion,
        current_page: 1,
        limit: productos.length || ultimaPaginacion.limit,
        total_records: Math.max(ultimaPaginacion.total_records, productos.length),
        total_pages: 1,
      }
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
