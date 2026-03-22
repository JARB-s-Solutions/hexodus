// ============================================================
// TIPOS PARA GESTIÓN DE CAJA
// ============================================================

// Estado de la caja (local, procesado)
export interface EstadoCaja {
  abierta: boolean
  corte_id: number | null
  monto_inicial: number
  monto_actual: number
  fecha_apertura: string | null // ISO 8601
  usuario: string
}

// Movimiento de caja
export interface MovimientoCaja {
  id: number
  fecha: string // ISO 8601
  concepto: string
  tipo: "ingreso" | "egreso"
  monto: number
  usuario: string
}

// ============================================================
// API REQUESTS
// ============================================================

// Request para abrir caja
export interface AbrirCajaData {
  monto_inicial: number
}

// Request para consultar estado de caja
export interface ConsultarCajaData {
  fecha_inicial: string // ISO 8601
  fecha_final: string // ISO 8601
}

// Request para cerrar caja
export interface CerrarCajaData {
  fecha_inicial: string // ISO 8601
  fecha_final: string // ISO 8601
  observacion?: string
}

// ============================================================
// API RESPONSES
// ============================================================

// Respuesta al abrir caja
export interface AbrirCajaResponse {
  message: string
  data: {
    corte_id: number
    fecha_apertura: string // ISO 8601
  }
}

// Respuesta al consultar estado de caja
export interface ConsultarCajaResponse {
  message: string
  resumen: {
    total_ingresos: number
    total_egresos: number
    efectivo_inicial: number
    efectivo_final: number
  }
  movimientos: MovimientoCaja[]
}

// Respuesta al cerrar caja
export interface CerrarCajaResponse {
  message: string
  data: {
    corte_id: number
    total_ingresos_amarrados: string
  }
}

// Error response genérico
export interface CajaErrorResponse {
  error: string
}

// ============================================================
// TIPOS PARA CORTES DE CAJA
// ============================================================

// Corte de caja tal como viene del API (snake_case)
export interface CorteAPI {
  id: number
  folio: string
  fecha_inicio: string // ISO 8601
  fecha_fin: string | null // ISO 8601 | null cuando la caja esta abierta
  ingresos: number
  egresos: number
  caja_inicial: number
  caja_final: number
  usuario: string
  fecha_creacion: string // ISO 8601
  observacion: string
  status: "abierto" | "cerrado"
}

// Movimiento de caja del API (detalle)
export interface MovimientoAPI {
  id: number
  folio_movimiento?: string
  fecha: string // ISO 8601
  concepto: string
  tipo: "ingreso" | "gasto" | "egreso"
  monto: number
  usuario: string
}

// Detalle completo de corte desde el API
export interface CorteDetalleAPI {
  id_corte: number
  folio: string
  estado: string
  fecha_inicio: string // ISO 8601
  fecha_fin: string | null // ISO 8601 | null cuando la caja esta abierta
  usuario: string
  creado: string // ISO 8601
  total_ingresos: number
  total_egresos: number
  caja_inicial: number
  caja_final: number
  observaciones: string
  movimientos: MovimientoAPI[]
}

// Respuesta del GET /api/caja/cortes/:id
export interface GetCorteDetalleResponse {
  message: string
  data: CorteDetalleAPI
}

// Dashboard stats para cortes
export interface DashboardStatsCortes {
  efectivo_caja: {
    total: number
    fondo: number
    variacion: number
  }
  total_hoy: {
    total: number
    transacciones: number
  }
  cortes_realizados: {
    total: number
    ultimo: string | null // ISO 8601
  }
}

// Paginación
export interface PaginationCortes {
  current_page: number
  limit: number
  total_records: number
  total_pages: number
}

// Respuesta completa del GET /api/caja/cortes
export interface GetCortesResponse {
  message: string
  dashboard_stats: DashboardStatsCortes
  data: CorteAPI[]
  pagination: PaginationCortes
}

// Corte de caja para uso en frontend (camelCase)
export interface CorteCaja {
  id: number
  folio: string
  fechaInicio: string
  fechaFin: string | null
  ingresos: number
  egresos: number
  cajaInicial: number
  cajaFinal: number
  usuario: string
  fechaCreacion: string
  observacion: string
  status: "abierto" | "cerrado"
}

// Movimiento de caja para uso en frontend (camelCase)
export interface Movimiento {
  id: number
  folioMovimiento?: string
  fecha: string
  concepto: string
  tipo: "ingreso" | "gasto" | "egreso"
  monto: number
  usuario: string
}

// Detalle completo de corte para frontend (camelCase)
export interface CorteDetalle {
  idCorte: number
  folio: string
  estado: string
  fechaInicio: string
  fechaFin: string | null
  usuario: string
  creado: string
  totalIngresos: number
  totalEgresos: number
  cajaInicial: number
  cajaFinal: number
  observaciones: string
  movimientos: Movimiento[]
}

// ============================================================
// MAPPER FUNCTIONS
// ============================================================

/**
 * Mapea un corte del API al formato del frontend
 */
export function mapCorteFromAPI(apiCorte: CorteAPI): CorteCaja {
  return {
    id: apiCorte.id,
    folio: apiCorte.folio,
    fechaInicio: apiCorte.fecha_inicio,
    fechaFin: apiCorte.fecha_fin,
    ingresos: apiCorte.ingresos,
    egresos: apiCorte.egresos,
    cajaInicial: apiCorte.caja_inicial,
    cajaFinal: apiCorte.caja_final,
    usuario: apiCorte.usuario,
    fechaCreacion: apiCorte.fecha_creacion,
    observacion: apiCorte.observacion,
    status: apiCorte.status,
  }
}

/**
 * Mapea un movimiento del API al formato del frontend
 */
export function mapMovimientoFromAPI(apiMovimiento: MovimientoAPI): Movimiento {
  return {
    id: apiMovimiento.id,
    folioMovimiento: apiMovimiento.folio_movimiento,
    fecha: apiMovimiento.fecha,
    concepto: apiMovimiento.concepto,
    tipo: apiMovimiento.tipo,
    monto: apiMovimiento.monto,
    usuario: apiMovimiento.usuario,
  }
}

/**
 * Mapea el detalle completo de un corte del API al formato del frontend
 */
export function mapCorteDetalleFromAPI(apiDetalle: CorteDetalleAPI): CorteDetalle {
  return {
    idCorte: apiDetalle.id_corte,
    folio: apiDetalle.folio,
    estado: apiDetalle.estado,
    fechaInicio: apiDetalle.fecha_inicio,
    fechaFin: apiDetalle.fecha_fin,
    usuario: apiDetalle.usuario,
    creado: apiDetalle.creado,
    totalIngresos: apiDetalle.total_ingresos,
    totalEgresos: apiDetalle.total_egresos,
    cajaInicial: apiDetalle.caja_inicial,
    cajaFinal: apiDetalle.caja_final,
    observaciones: apiDetalle.observaciones,
    movimientos: apiDetalle.movimientos.map(mapMovimientoFromAPI),
  }
}
