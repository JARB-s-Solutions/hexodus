/**
 * Tipos para el módulo de Productos/Inventario
 */

// ============================================================================
// API TYPES (snake_case - como vienen del backend)
// ============================================================================

/**
 * Producto tal como viene del API (lista)
 */
export interface ProductoAPI {
  id: number
  codigo: string
  nombre: string
  marca: string
  categoria: string        // Nombre de la categoría (legacy)
  categoria_id?: number    // ID de la categoría (REQUERIDO desde backend actualizado)
  precio_compra: number
  precio_venta: number
  stock_actual: number
  alerta_stock: boolean
  status: 'activo' | 'inactivo'
}

/**
 * Detalle completo del producto como viene del API
 */
export interface ProductoDetalleAPI {
  id: number
  codigo: string
  nombre: string
  marca: string
  categoria: string        // Nombre de la categoría (legacy)
  categoria_id?: number    // ID de la categoría (REQUERIDO desde backend actualizado)
  status: 'activo' | 'inactivo'
  precio_venta: number
  precio_compra: number
  margen_monetario: number
  margen_porcentaje: number
  stock_actual: number
  stock_minimo: number
  ultima_actualizacion: string
  descripcion: string
}

/**
 * Estadísticas del dashboard de productos
 */
export interface DashboardStatsProductos {
  total_productos: {
    valor: number
    etiqueta: string
  }
  stock_bajo: {
    valor: number
    etiqueta: string
  }
  valor_total: {
    valor: number
    etiqueta: string
  }
  categorias: {
    valor: number
    etiqueta: string
  }
}

/**
 * Response de GET /api/productos
 */
export interface GetProductosResponse {
  message: string
  dashboard_stats: DashboardStatsProductos
  data: ProductoAPI[]
  pagination: {
    current_page: number
    limit: number
    total_records: number
    total_pages: number
  }
}

/**
 * Response de GET /api/productos/:id
 */
export interface ProductoResponse {
  message: string
  data: ProductoDetalleAPI
}

/**
 * Request para crear/actualizar producto
 * Formato esperado por el API
 */
export interface CreateProductoRequest {
  codigo?: string
  nombre: string
  marca: string
  categoria_id: number
  precio_compra: number
  precio_venta: number
  stock_inicial: number
  stock_minimo: number
  descripcion?: string
}

/**
 * Response de creación de producto
 */
export interface CreateProductoResponse {
  message: string
  data: {
    id: number
    codigo: string
  }
}

/**
 * Request para actualizar un producto (formato del API)
 */
export interface UpdateProductoRequest {
  id: number
  codigo: string
  nombre: string
  marca: string
  categoria_id: number     // ✅ Usar ID de categoría (actualizado según backend specs)
  precio_compra: number
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  alerta_stock: boolean
  status: 'activo' | 'inactivo'
  descripcion: string
}

/**
 * Response de actualización de producto
 */
export interface UpdateProductoResponse {
  message: string
}

// ============================================================================
// FRONTEND TYPES (camelCase - para uso en componentes)
// ============================================================================

/**
 * Producto para uso en el frontend
 */
export interface Producto {
  id: number
  codigo: string
  nombre: string
  marca: string
  categoria: string
  categoriaId?: number     // ✅ ID de categoría (si viene del backend)
  precioCompra: number
  precioVenta: number
  stockActual: number
  alertaStock: boolean
  status: 'activo' | 'inactivo'
}

/**
 * Producto extendido para componentes (con campos adicionales calculados)
 */
export interface ProductoExtendido extends Producto {
  estadoStock: EstadoStock
  stockMinimo: number
  activo: boolean
  ubicacion: string
  descripcion: string
  fechaActualizacion: string
  margenMonetario?: number
  margenPorcentaje?: number
  categoriaId?: number // ID numérico de la categoría del API
}

/**
 * Estados de stock calculados en el frontend
 */
export type EstadoStock = 'disponible' | 'bajo' | 'agotado'

/**
 * Información de categorías
 */
export const categoriaInfo: Record<string, { nombre: string; color: string; bg: string }> = {
  'Proteinas': { nombre: "Proteínas", color: "text-purple-300", bg: "bg-purple-500/15" },
  'Suplementos': { nombre: "Suplementos", color: "text-purple-300", bg: "bg-purple-500/15" },
  'Equipamiento': { nombre: "Equipamiento", color: "text-orange-300", bg: "bg-orange-500/15" },
  'Accesorios': { nombre: "Accesorios", color: "text-blue-300", bg: "bg-blue-500/15" },
  'Ropa': { nombre: "Ropa Deportiva", color: "text-pink-300", bg: "bg-pink-500/15" },
  'Bebidas': { nombre: "Bebidas", color: "text-teal-300", bg: "bg-teal-500/15" },
  'Otros': { nombre: "Otros", color: "text-gray-300", bg: "bg-gray-500/15" },
}

/**
 * Información de estados de stock
 */
export const estadoStockInfo: Record<EstadoStock, { nombre: string; color: string; bg: string }> = {
  disponible: { nombre: "Disponible", color: "text-[#22C55E]", bg: "bg-[#22C55E]/15" },
  bajo: { nombre: "Stock Bajo", color: "text-[#FBB424]", bg: "bg-[#FBB424]/15" },
  agotado: { nombre: "Sin Stock", color: "text-[#EF4444]", bg: "bg-[#EF4444]/15" },
}

// ============================================================================
// MAPPER FUNCTIONS
// ============================================================================

/**
 * Mapea un producto del API al formato del frontend
 */
export function mapProductoFromAPI(apiProducto: ProductoAPI): Producto {
  return {
    id: apiProducto.id,
    codigo: apiProducto.codigo,
    nombre: apiProducto.nombre,
    marca: apiProducto.marca,
    categoria: apiProducto.categoria,
    categoriaId: apiProducto.categoria_id,  // ✅ Capturar categoria_id del backend
    precioCompra: apiProducto.precio_compra,
    precioVenta: apiProducto.precio_venta,
    stockActual: apiProducto.stock_actual,
    alertaStock: apiProducto.alerta_stock,
    status: apiProducto.status,
  }
}

/**
 * Mapea el detalle completo de un producto del API al formato extendido del frontend
 */
export function mapProductoDetalleFromAPI(apiProducto: ProductoDetalleAPI): ProductoExtendido {
  const alertaStock = apiProducto.stock_actual <= apiProducto.stock_minimo
  
  return {
    id: apiProducto.id,
    codigo: apiProducto.codigo,
    nombre: apiProducto.nombre,
    marca: apiProducto.marca,
    categoria: apiProducto.categoria,
    categoriaId: apiProducto.categoria_id,  // ✅ Capturar categoria_id del backend
    precioCompra: apiProducto.precio_compra,
    precioVenta: apiProducto.precio_venta,
    stockActual: apiProducto.stock_actual,
    alertaStock,
    status: apiProducto.status,
    estadoStock: calcularEstadoStock(apiProducto.stock_actual, alertaStock),
    stockMinimo: apiProducto.stock_minimo,
    activo: apiProducto.status === 'activo',
    ubicacion: 'N/A',
    descripcion: apiProducto.descripcion || '',
    fechaActualizacion: apiProducto.ultima_actualizacion,
    margenMonetario: apiProducto.margen_monetario,
    margenPorcentaje: apiProducto.margen_porcentaje,
  }
}

/**
 * Mapea un producto del frontend al formato del API para creación
 * @param producto Producto a mapear
 * @param categoriasMap Mapeo opcional de nombre de categoría a ID (si no se provee, usa mapeo por defecto)
 */
export function mapProductoToAPI(
  producto: Partial<ProductoExtendido>,
  categoriasMap?: Record<string, number>
): Partial<CreateProductoRequest> {
  // Si el producto ya tiene categoriaId, usarlo directamente
  let categoria_id: number | undefined = producto.categoriaId
  
  // Si no, intentar mapear desde el nombre de categoría
  if (!categoria_id && producto.categoria) {
    // Usar el mapeo provisto o el mapeo por defecto
    const mapeo = categoriasMap || {
      'Proteínas': 1,
      'Creatinas': 2,
      'Pre-Entreno': 3,
      'Vitaminas': 4,
      'Barras': 5,
      'Snacks': 6,
      'Bebidas': 7,
      'Accesorios': 8,
      'Otros': 9
    }
    categoria_id = mapeo[producto.categoria]
  }

  return {
    codigo: producto.codigo,
    nombre: producto.nombre,
    marca: producto.marca,
    categoria_id,
    precio_compra: producto.precioCompra,
    precio_venta: producto.precioVenta,
    stock_inicial: producto.stockActual,
    stock_minimo: producto.stockMinimo || 0,
    descripcion: producto.descripcion || '',
  }
}

/**
 * Mapea un producto del frontend al formato del API para actualización
 * @param producto Producto a mapear
 * @param categoriasMap Mapeo opcional de nombre de categoría a ID (para fallback)
 */
export function mapProductoToUpdateAPI(
  producto: Partial<ProductoExtendido>,
  categoriasMap?: Record<string, number>
): UpdateProductoRequest {
  if (!producto.id || !producto.codigo || !producto.nombre) {
    throw new Error('Faltan campos requeridos para actualizar el producto')
  }

  // Determinar categoria_id
  let categoria_id = producto.categoriaId
  
  // Si no tenemos categoriaId, intentar obtenerlo del mapeo
  if (!categoria_id && producto.categoria && categoriasMap) {
    categoria_id = categoriasMap[producto.categoria]
  }
  
  if (!categoria_id) {
    throw new Error('No se pudo determinar el ID de la categoría. Asegúrate de que el producto tiene categoriaId o proporciona categoriasMap')
  }

  return {
    id: producto.id,
    codigo: producto.codigo,
    nombre: producto.nombre,
    marca: producto.marca || '',
    categoria_id,  // ✅ Enviar ID de categoría (actualizado según backend specs)
    precio_compra: producto.precioCompra || 0,
    precio_venta: producto.precioVenta || 0,
    stock_actual: producto.stockActual || 0,
    stock_minimo: producto.stockMinimo || 0,
    alerta_stock: producto.alertaStock || false,
    status: producto.status || 'activo',
    descripcion: producto.descripcion || ''
  }
}

/**
 * Calcula el estado de stock basado en el stock actual
 */
export function calcularEstadoStock(stockActual: number, alertaStock: boolean): EstadoStock {
  if (stockActual === 0) return 'agotado'
  if (alertaStock) return 'bajo'
  return 'disponible'
}

/**
 * Extiende un Producto básico con campos calculados para los componentes
 */
export function extenderProducto(producto: Producto): ProductoExtendido {
  return {
    ...producto,
    categoriaId: producto.categoriaId,  // ✅ Preservar categoriaId si existe
    estadoStock: calcularEstadoStock(producto.stockActual, producto.alertaStock),
    stockMinimo: 5, // Valor por defecto, el API no lo retorna
    activo: producto.status === 'activo',
    ubicacion: 'N/A', // Ya no se usa, pero se mantiene para compatibilidad
    descripcion: '', // Ya no se usa, pero se mantiene para compatibilidad
    fechaActualizacion: new Date().toISOString(),
  }
}

/**
 * Convierte un ProductoExtendido a formato básico para enviar al API
 */
export function reducirProducto(productoExt: Partial<ProductoExtendido>): Partial<Producto> {
  const { estadoStock, stockMinimo, activo, ubicacion, descripcion, fechaActualizacion, ...producto } = productoExt
  return {
    ...producto,
    status: activo !== undefined ? (activo ? 'activo' : 'inactivo') : undefined,
  }
}

/**
 * Formatea un precio
 */
export function formatPrecio(n: number): string {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
