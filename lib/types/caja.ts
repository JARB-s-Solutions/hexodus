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
