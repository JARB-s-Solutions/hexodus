// ============================================================
// TIPOS — ALERTAS DEL SISTEMA
// ============================================================

export interface AlertaConfig {
  id: string
  alertaVencimientosActiva: boolean
  alertaVencimientosDias: number
  alertaStockActiva: boolean
  alertaStockMinimo: number
  alertaInactividadActiva: boolean
  alertaInactividadDias: number
  alertaPagosActiva: boolean
  updatedAt: string
}

export interface AlertaConfigResponse {
  success: boolean
  data: AlertaConfig
}

export interface AlertaSocio {
  id: number
  nombreCompleto: string
  codigoSocio: string
  fotoUrl: string | null
}

export type AlertaTipo =
  | 'vencimiento_membresia'
  | 'stock_bajo'
  | 'inactividad_socio'
  | 'pago_pendiente'
  | string

export type AlertaEstado = 'activa' | 'vista' | 'resuelta' | 'descartada' | string
export type AlertaPrioridad = 'baja' | 'media' | 'alta' | 'urgente'

export interface AlertaItem {
  id: string
  tipo: AlertaTipo
  estado: AlertaEstado
  prioridad: AlertaPrioridad
  titulo: string
  descripcion: string
  socioId: number | null
  productoId: number | null
  membresiaSocioId: number | null
  datosAdicionales: unknown | null
  vistaPorId: number | null
  fechaVista: string | null
  resueltaPorId: number | null
  fechaResolucion: string | null
  notasResolucion: string | null
  createdAt: string
  updatedAt: string
  socio: AlertaSocio | null
  producto: unknown | null
}

export interface AlertasResumen {
  baja: number
  media: number
  alta: number
  urgente: number
  total: number
}

export interface AlertasResponse {
  success: boolean
  data: AlertaItem[]
  resumen: AlertasResumen
}

export interface ResolverAlertaResponse {
  success: boolean
  message: string
  data: AlertaItem
}

export interface ActualizarConfigBody {
  alertaVencimientosActiva?: boolean
  alertaVencimientosDias?: number
  alertaStockActiva?: boolean
  alertaStockMinimo?: number
  alertaInactividadActiva?: boolean
  alertaInactividadDias?: number
  alertaPagosActiva?: boolean
}
