import { apiGet, apiPost } from '@/lib/api'
import type {
  GetVentasResponse,
  VentasData,
  CreateVentaRequest,
  CreateVentaResponse,
  GetDetalleVentaResponse,
  DetalleVenta,
  mapVentasDataFromAPI,
} from '@/lib/types/ventas'
import { mapVentasDataFromAPI as mapperFunction, mapDetalleVentaFromAPI } from '@/lib/types/ventas'

/**
 * Servicio para gestionar ventas
 */
export class VentasService {
  /**
   * Obtener todas las ventas con estadísticas
   */
  static async getAll(): Promise<VentasData> {
    console.log('📊 GET /api/ventas - Obteniendo ventas')
    
    const response = await apiGet<GetVentasResponse>('/ventas')
    console.log('✅ Response del servidor:', response)
    console.log('📈 Dashboard Stats:', response.dashboard_stats)
    console.log('📋 Summary Bar:', response.summary_bar)
    console.log('📄 Ventas obtenidas:', response.data.length)
    console.log('📃 Paginación:', response.pagination)
    
    const ventasData = mapperFunction(response)
    console.log('✅ Datos mapeados al frontend:', ventasData)
    
    return ventasData
  }

  /**
   * Crear una nueva venta
   */
  static async create(data: CreateVentaRequest): Promise<CreateVentaResponse['data']> {
    console.log('🛍️ POST /api/ventas - Creando venta')
    console.log('📤 Datos a enviar:', data)
    
    const response = await apiPost<CreateVentaResponse>('/ventas', data)
    console.log('✅ Venta creada:', response)
    console.log('💵 Total cobrado:', response.data.total_cobrado)
    console.log('🎫 ID venta:', response.data.venta_id)
    
    return response.data
  }

  /**
   * Obtener detalle de una venta específica
   */
  static async getById(id: number): Promise<DetalleVenta> {
    console.log(`🔍 GET /api/ventas/${id} - Obteniendo detalle de venta`)
    
    const response = await apiGet<GetDetalleVentaResponse>(`/ventas/${id}`)
    console.log('✅ Response del servidor:', response)
    console.log('📋 Detalle obtenido:', {
      idVenta: response.data.id_venta_str,
      cliente: response.data.cliente,
      total: response.data.total,
      productos: response.data.productos.length
    })
    
    const detalleVenta = mapDetalleVentaFromAPI(response.data)
    console.log('✅ Detalle mapeado al frontend:', detalleVenta)
    
    return detalleVenta
  }
}
