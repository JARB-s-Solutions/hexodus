/**
 * Tipos para el módulo de Ventas
 */

// ============================================================================
// API TYPES (snake_case - como vienen del backend)
// ============================================================================

/**
 * Venta tal como viene del API (lista)
 */
export interface VentaAPI {
  id: number
  id_venta: string
  cliente: string
  productos_resumen: string
  total: number
  fecha_hora: string
  metodo_pago: string
  status: 'exitosa' | 'cancelada' | 'pendiente'
}

/**
 * Estadísticas del dashboard para ventas
 */
export interface DashboardStatsVentas {
  ventas_dia: {
    total: number
    porcentaje_vs_ayer: number
  }
  transacciones: {
    total: number
    promedio_ticket: number
  }
  productos_vendidos: {
    total: number
    porcentaje_vs_ayer: number
  }
  ventas_mes: {
    total: number
    meta_alcanzada: number
  }
}

/**
 * Barra resumen de las ventas
 */
export interface SummaryBarVentas {
  rango: string
  total_filtrado: number
  ventas_count: number
}

/**
 * Paginación de la respuesta
 */
export interface PaginationVentas {
  current_page: number
  limit: number
  total_records: number
  total_pages: number
}

/**
 * Respuesta completa del endpoint GET /api/ventas
 */
export interface GetVentasResponse {
  message: string
  dashboard_stats: DashboardStatsVentas
  summary_bar: SummaryBarVentas
  data: VentaAPI[]
  pagination: PaginationVentas
}

/**
 * Producto para la petición de crear venta
 */
export interface ProductoVentaRequest {
  producto_id: number
  cantidad: number
}

/**
 * Request para crear una venta
 */
export interface CreateVentaRequest {
  socio_id: number | null  // null para público general
  metodo_pago_id: number
  productos: ProductoVentaRequest[]
}

/**
 * Response de crear venta
 */
export interface CreateVentaResponse {
  message: string
  data: {
    venta_id: number
    total_cobrado: string
  }
}

/**
 * Producto en el detalle de una venta (API)
 */
export interface ProductoDetalleVentaAPI {
  id_detalle: number
  nombre: string
  precio_unitario: number
  cantidad: number
  subtotal: number
}

/**
 * Datos del detalle de venta (API)
 */
export interface DetalleVentaDataAPI {
  id_venta: number
  id_venta_str: string
  cliente: string
  fecha_hora: string
  metodo_pago: string
  total: number
  total_articulos: number
  productos: ProductoDetalleVentaAPI[]
}

/**
 * Response completa del endpoint GET /api/ventas/:id
 */
export interface GetDetalleVentaResponse {
  message: string
  data: DetalleVentaDataAPI
}

// ============================================================================
// FRONTEND TYPES (camelCase - para uso en componentes)
// ============================================================================

/**
 * Tipo de método de pago
 */
export type MetodoPago = 'Efectivo' | 'Tarjeta' | 'Transferencia SPEI' | 'Digital'

/**
 * Estado de la venta
 */
export type StatusVenta = 'exitosa' | 'cancelada' | 'pendiente'

/**
 * Venta para uso en el frontend
 */
export interface Venta {
  id: number
  idVenta: string
  cliente: string
  productosResumen: string
  total: number
  fechaHora: string
  metodoPago: MetodoPago
  status: StatusVenta
}

/**
 * Producto en el detalle de una venta (Frontend)
 */
export interface ProductoDetalleVenta {
  idDetalle: number
  nombre: string
  precioUnitario: number
  cantidad: number
  subtotal: number
}

/**
 * Detalle completo de una venta (Frontend)
 */
export interface DetalleVenta {
  idVenta: number
  idVentaStr: string
  cliente: string
  fechaHora: string
  metodoPago: string
  total: number
  totalArticulos: number
  productos: ProductoDetalleVenta[]
}

/**
 * Stats del dashboard adaptadas al frontend
 */
export interface DashboardStats {
  ventasDia: {
    total: number
    porcentajeVsAyer: number
  }
  transacciones: {
    total: number
    promedioTicket: number
  }
  productosVendidos: {
    total: number
    porcentajeVsAyer: number
  }
  ventasMes: {
    total: number
    metaAlcanzada: number
  }
}

/**
 * Barra resumen adaptada al frontend
 */
export interface SummaryBar {
  rango: string
  totalFiltrado: number
  ventasCount: number
}

/**
 * Paginación adaptada al frontend
 */
export interface Pagination {
  currentPage: number
  limit: number
  totalRecords: number
  totalPages: number
}

/**
 * Datos completos de ventas para el frontend
 */
export interface VentasData {
  ventas: Venta[]
  dashboardStats: DashboardStats
  summaryBar: SummaryBar
  pagination: Pagination
}

// ============================================================================
// ANÁLISIS DE VENTAS
// ============================================================================

/**
 * Comparación actual vs anterior del análisis
 */
export interface ComparacionAnalisis {
  actual: {
    total: number
    transacciones: number
  }
  anterior: {
    total: number
    transacciones: number
  }
  variacion_porcentaje: number
}

/**
 * Tendencia de ventas por fecha
 */
export interface TendenciaVenta {
  fecha: string
  total: number
}

/**
 * Top productos vendidos
 */
export interface TopProducto {
  nombre: string
  cantidad_vendida: number
  ingreso_generado: number
}

/**
 * Métodos de pago con estadísticas
 */
export interface MetodoPagoAnalisis {
  nombre: string
  transacciones: number
  monto_total: number
}

/**
 * Respuesta completa del análisis de ventas
 */
export interface AnalisisVentasResponse {
  message: string
  data: {
    comparacion_actual: ComparacionAnalisis
    tendencia_ventas: TendenciaVenta[]
    top_productos: TopProducto[]
    metodos_pago: MetodoPagoAnalisis[]
    insights: string[]
  }
}

/**
 * Datos de análisis para el frontend
 */
export interface AnalisisVentasData {
  comparacionActual: ComparacionAnalisis
  tendenciaVentas: TendenciaVenta[]
  topProductos: TopProducto[]
  metodosPago: MetodoPagoAnalisis[]
  insights: string[]
}

// ============================================================================
// MAPPER FUNCTIONS
// ============================================================================

/**
 * Mapea una venta del API al formato del frontend
 */
export function mapVentaFromAPI(apiVenta: VentaAPI): Venta {
  return {
    id: apiVenta.id,
    idVenta: apiVenta.id_venta,
    cliente: apiVenta.cliente,
    productosResumen: apiVenta.productos_resumen,
    total: apiVenta.total,
    fechaHora: apiVenta.fecha_hora,
    metodoPago: apiVenta.metodo_pago as MetodoPago,
    status: apiVenta.status,
  }
}

/**
 * Mapea las estadísticas del dashboard del API al formato del frontend
 */
export function mapDashboardStatsFromAPI(apiStats: DashboardStatsVentas): DashboardStats {
  return {
    ventasDia: {
      total: apiStats.ventas_dia.total,
      porcentajeVsAyer: apiStats.ventas_dia.porcentaje_vs_ayer,
    },
    transacciones: {
      total: apiStats.transacciones.total,
      promedioTicket: apiStats.transacciones.promedio_ticket,
    },
    productosVendidos: {
      total: apiStats.productos_vendidos.total,
      porcentajeVsAyer: apiStats.productos_vendidos.porcentaje_vs_ayer,
    },
    ventasMes: {
      total: apiStats.ventas_mes.total,
      metaAlcanzada: apiStats.ventas_mes.meta_alcanzada,
    },
  }
}

/**
 * Mapea la barra resumen del API al formato del frontend
 */
export function mapSummaryBarFromAPI(apiSummary: SummaryBarVentas): SummaryBar {
  return {
    rango: apiSummary.rango,
    totalFiltrado: apiSummary.total_filtrado,
    ventasCount: apiSummary.ventas_count,
  }
}

/**
 * Mapea la paginación del API al formato del frontend
 */
export function mapPaginationFromAPI(apiPagination: PaginationVentas): Pagination {
  return {
    currentPage: apiPagination.current_page,
    limit: apiPagination.limit,
    totalRecords: apiPagination.total_records,
    totalPages: apiPagination.total_pages,
  }
}

/**
 * Mapea la respuesta completa del API al formato del frontend
 */
export function mapVentasDataFromAPI(apiResponse: GetVentasResponse): VentasData {
  return {
    ventas: apiResponse.data.map(mapVentaFromAPI),
    dashboardStats: mapDashboardStatsFromAPI(apiResponse.dashboard_stats),
    summaryBar: mapSummaryBarFromAPI(apiResponse.summary_bar),
    pagination: mapPaginationFromAPI(apiResponse.pagination),
  }
}

/**
 * Corrige una fecha que viene en formato "YYYY-MM-DD" del backend
 * Evita el problema de conversión de zona horaria UTC restando un día
 */
function corregirFechaUTC(fechaString: string): string {
  if (!fechaString || !fechaString.includes('-')) return fechaString
  
  // El backend devuelve fechas con un día de adelanto debido a conversión UTC
  // Necesitamos restar un día para mostrar la fecha correcta
  const partes = fechaString.split('T')[0].split('-')
  if (partes.length === 3) {
    const [year, month, day] = partes.map(Number)
    // Crear fecha en UTC (como viene del backend)
    const fecha = new Date(Date.UTC(year, month - 1, day))
    // Restar un día (corregir el adelanto)
    fecha.setUTCDate(fecha.getUTCDate() - 1)
    // Retornar en formato YYYY-MM-DD
    const y = fecha.getUTCFullYear()
    const m = String(fecha.getUTCMonth() + 1).padStart(2, '0')
    const d = String(fecha.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  
  return fechaString
}

/**
 * Mapea la respuesta del análisis de ventas
 */
export function mapAnalisisVentasFromAPI(apiResponse: AnalisisVentasResponse): AnalisisVentasData {
  return {
    comparacionActual: apiResponse.data.comparacion_actual,
    tendenciaVentas: apiResponse.data.tendencia_ventas.map(item => ({
      fecha: corregirFechaUTC(item.fecha),
      total: item.total,
    })),
    topProductos: apiResponse.data.top_productos,
    metodosPago: apiResponse.data.metodos_pago,
    insights: apiResponse.data.insights,
  }
}

/**
 * Mapea un producto del detalle de venta del API al formato del frontend
 */
export function mapProductoDetalleFromAPI(apiProducto: ProductoDetalleVentaAPI): ProductoDetalleVenta {
  return {
    idDetalle: apiProducto.id_detalle,
    nombre: apiProducto.nombre,
    precioUnitario: apiProducto.precio_unitario,
    cantidad: apiProducto.cantidad,
    subtotal: apiProducto.subtotal,
  }
}

/**
 * Mapea el detalle de venta del API al formato del frontend
 */
export function mapDetalleVentaFromAPI(apiDetalle: DetalleVentaDataAPI): DetalleVenta {
  return {
    idVenta: apiDetalle.id_venta,
    idVentaStr: apiDetalle.id_venta_str,
    cliente: apiDetalle.cliente,
    fechaHora: apiDetalle.fecha_hora,
    metodoPago: apiDetalle.metodo_pago,
    total: apiDetalle.total,
    totalArticulos: apiDetalle.total_articulos,
    productos: apiDetalle.productos.map(mapProductoDetalleFromAPI),
  }
}

/**
 * Formatea un valor de moneda
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value)
}

/**
 * Formatea una fecha y hora
 */
export function formatDateTime(dateTimeString: string): { fecha: string; hora: string } {
  const date = new Date(dateTimeString)
  
  const fecha = date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  
  const hora = date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
  
  return { fecha, hora }
}
