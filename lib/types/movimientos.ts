// ============================================================
// TIPOS FRONTEND (camelCase) - Mantener compatibilidad
// ============================================================

export type TipoMovimiento = "ingreso" | "egreso"
export type TipoPago = "efectivo" | "transferencia" | "tarjeta"

export interface Movimiento {
  id: string
  folio?: string
  tipo: TipoMovimiento
  concepto: string
  total: number
  tipoPago: TipoPago
  fecha: string // YYYY-MM-DD
  hora: string // HH:MM
  usuario: string
  observaciones?: string
}

export interface MovimientoKpis {
  totalIngresos: number
  totalEgresos: number
  balanceNeto: number
  totalMovimientos: number
  // Comparaciones con período anterior (opcional)
  cambioIngresos?: number
  cambioEgresos?: number
  cambioBalance?: number
}

export interface PeriodoComparacion {
  label: string
  fechaInicio: string
  fechaFin: string
  anteriorInicio: string
  anteriorFin: string
}

// ============================================================
// TIPOS API (snake_case) - Backend Response
// ============================================================

export interface MovimientoAPI {
  id: number
  folio: string
  fecha_hora?: string | null // ISO 8601: "2026-03-04T03:43:06.029Z"
  fecha?: string | null
  created_at?: string | null
  tipo: "Ingreso" | "Egreso"
  concepto: string
  nota_movimiento: string | null
  monto: number
  metodo?: string | null // "N/A", "Efectivo", "Tarjeta", "Transferencia SPEI", etc.
  metodo_pago?: string | null
  metodo_pago_nombre?: string | null
  // Variantes observadas para nombre del socio en payloads de membresías
  socio_nombre?: string | null
  nombre_socio?: string | null
  socio?: {
    nombre?: string | null
    nombre_completo?: string | null
  } | null
  responsable: string
}

export interface DashboardStats {
  total_ingresos: number
  total_egresos: number
  balance_neto: number
  total_movimientos: number
}

export interface PaginationInfo {
  current_page: number
  limit: number
  total_records: number
  total_pages: number
}

export interface MovimientosResponse {
  message: string
  dashboard_stats: DashboardStats
  data: MovimientoAPI[]
  pagination: PaginationInfo
}

// ============================================================
// MAPPERS: API (snake_case) → Frontend (camelCase)
// ============================================================

/**
 * Convierte el formato de método de pago del API a formato frontend
 */
export function mapMetodoPago(metodoAPI?: string | null): TipoPago {
  const metodoLower = (metodoAPI || "").toLowerCase()
  
  if (metodoLower.includes("efectivo")) return "efectivo"
  if (metodoLower.includes("tarjeta")) return "tarjeta"
  if (metodoLower.includes("transfer") || metodoLower.includes("spei")) return "transferencia"
  
  // Default: si es "N/A" o desconocido, asumimos efectivo
  return "efectivo"
}


function getMetodoPagoRaw(apiMov: MovimientoAPI): string | null {
  if (apiMov.metodo) return apiMov.metodo
  if (apiMov.metodo_pago) return apiMov.metodo_pago
  if (apiMov.metodo_pago_nombre) return apiMov.metodo_pago_nombre
  return null
}

function getFechaHoraRaw(apiMov: MovimientoAPI): string | null {
  if (apiMov.fecha_hora) return apiMov.fecha_hora
  if (apiMov.created_at) return apiMov.created_at
  if (apiMov.fecha) return apiMov.fecha
  return null
}

function getSocioNombreRaw(apiMov: MovimientoAPI): string | null {
  const nombre =
    apiMov.socio_nombre ||
    apiMov.nombre_socio ||
    apiMov.socio?.nombre_completo ||
    apiMov.socio?.nombre ||
    null

  if (!nombre) return null
  return nombre.trim() || null
}

function incluirNombreSocioEnConcepto(concepto: string, socioNombre: string | null): string {
  if (!socioNombre) return concepto

  const conceptoLower = concepto.toLowerCase()
  const nombreLower = socioNombre.toLowerCase()

  if (conceptoLower.includes(nombreLower)) return concepto

  // Caso típico: "Renovación de socio SOC-615561 - Plan: Visita"
  if (/socio\s+SOC-\d+/i.test(concepto)) {
    return concepto.replace(/(socio\s+SOC-\d+)/i, `$1 - ${socioNombre}`)
  }

  // Fallback: si el concepto está relacionado a socio, añadir nombre al final
  if (conceptoLower.includes("socio")) {
    return `${concepto} - ${socioNombre}`
  }

  return concepto
}

/**
 * Convierte MovimientoAPI (backend) a Movimiento (frontend)
 */
export function mapMovimientoFromAPI(apiMov: MovimientoAPI): Movimiento {
  const metodoRaw = getMetodoPagoRaw(apiMov)
  const fechaHoraRaw = getFechaHoraRaw(apiMov)
  const socioNombreRaw = getSocioNombreRaw(apiMov)
  const conceptoConNombre = incluirNombreSocioEnConcepto(apiMov.concepto, socioNombreRaw)

  console.log("🔄 Mapeando movimiento del API:", {
    folio: apiMov.folio,
    tipo: apiMov.tipo,
    concepto: conceptoConNombre,
    monto: apiMov.monto,
    metodo: metodoRaw,
    fecha_hora: fechaHoraRaw,
  })

  const metodoRaw = getMetodoPagoRaw(apiMov)
  const fechaHoraRaw = getFechaHoraRaw(apiMov)

  // Parsear fecha_hora: "2026-03-04T03:43:06.029Z"
  const fechaHora = fechaHoraRaw ? new Date(fechaHoraRaw) : null
  const fechaEsValida = !!fechaHora && !Number.isNaN(fechaHora.getTime())
  const fecha = fechaEsValida ? fechaHora.toISOString().split("T")[0] : ""
  const hora = fechaEsValida ? fechaHora.toTimeString().slice(0, 5) : ""

  const movimientoMapeado = {
    id: apiMov.folio, // Usar folio como ID único
    folio: apiMov.folio,
    tipo: (apiMov.tipo || "Ingreso").toLowerCase() as TipoMovimiento,
    concepto: conceptoConNombre,
    total: apiMov.monto,
    tipoPago: mapMetodoPago(metodoRaw),
    fecha,
    hora,
    usuario: apiMov.responsable,
    observaciones: apiMov.nota_movimiento || undefined,
  }

  console.log("✅ Movimiento mapeado:", movimientoMapeado)

  return movimientoMapeado
}

/**
 * Convierte DashboardStats (backend) a MovimientoKpis (frontend)
 */
export function mapKpisFromAPI(stats: DashboardStats): MovimientoKpis {
  console.log("📊 Mapeando KPIs del API:", stats)

  const kpisMapeados = {
    totalIngresos: stats.total_ingresos,
    totalEgresos: stats.total_egresos,
    balanceNeto: stats.balance_neto,
    totalMovimientos: stats.total_movimientos,
  }

  console.log("✅ KPIs mapeados:", kpisMapeados)

  return kpisMapeados
}

/**
 * Convierte array de MovimientoAPI a array de Movimiento
 */
export function mapMovimientosFromAPI(apiMovs: MovimientoAPI[]): Movimiento[] {
  console.log("📋 Mapeando lista de movimientos del API:", apiMovs.length, "movimientos")
  
  const movimientos = apiMovs.map(mapMovimientoFromAPI)
  
  console.log("✅ Lista de movimientos mapeados:", movimientos.length, "movimientos")
  console.log("  Resumen:")
  console.log("    - Ingresos:", movimientos.filter(m => m.tipo === "ingreso").length)
  console.log("    - Egresos:", movimientos.filter(m => m.tipo === "egreso").length)
  
  return movimientos
}

// ============================================================
// TIPOS PARA FILTROS Y PARÁMETROS DE CONSULTA
// ============================================================

export interface MovimientosFiltros {
  busqueda: string
  tipo: "todos" | "ingreso" | "egreso"
  tipoPago: TipoPago | ""
  fechaInicio: string
  fechaFin: string
}

export interface GetMovimientosParams {
  page?: number
  limit?: number
  tipo?: "Ingresos" | "Egresos" | "Todos"
  metodo_pago?: string
  search?: string
  fecha_inicio?: string // YYYY-MM-DD
  fecha_fin?: string // YYYY-MM-DD
}

// ============================================================
// TIPOS PARA CREAR/EDITAR MOVIMIENTOS
// ============================================================

export interface CreateMovimientoData {
  tipo_movimiento: "ingreso" | "gasto"
  concepto_id: number
  total: number
  metodo_pago_id: number
  observaciones?: string
}

export interface CreateMovimientoResponse {
  message: string
  data: {
    movimiento_id: number
    tipo: string
    monto: string
    saldo_restante_caja: number
  }
}

export interface UpdateMovimientoData extends CreateMovimientoData {
  id: number
}

// ============================================================
// CONCEPTOS DE MOVIMIENTOS
// ============================================================

export interface Concepto {
  id: number
  nombre: string
  tipo: "ingreso" | "gasto"
  status?: string // "activo" desde el API
}

// Respuesta del API para conceptos
export interface ConceptosResponse {
  message: string
  data: Concepto[]
}

// Datos para crear un concepto (POST /api/conceptos)
// Nota: el backend acepta "egreso" pero devuelve "gasto"
export interface CreateConceptoData {
  nombre: string
  tipo: "ingreso" | "egreso"
}

// Respuesta al crear un concepto
export interface CreateConceptoResponse {
  message: string
  data: {
    id: number
    nombre: string
    tipo: "gasto" | "ingreso"
    status: string
  }
}

// ============================================================
// COMPARACIONES DE MOVIMIENTOS
// ============================================================

export type PeriodoComparacionAPI = "Hoy" | "Este Mes" | "Este Trimestre" | "Este Semestre" | "Este Año"

export interface FilaComparacion {
  concepto: string // "Ingresos", "Egresos", "Balance", "Movimientos"
  actual: number
  anterior: number
  cambio_pct: number
}

export interface ComparacionData {
  labels_columnas: {
    actual: string // "ESTE TRIMESTRE"
    anterior: string // "TRIM. ANTERIOR"
  }
  filas: FilaComparacion[]
}

export interface ComparacionResponse {
  message: string
  data: ComparacionData
}

// Conceptos predefinidos (fallback si el API falla)
export const CONCEPTOS_INGRESO: Concepto[] = [
  { id: 1, nombre: "Pago de membresía mensual", tipo: "ingreso" },
  { id: 2, nombre: "Pago de membresía trimestral", tipo: "ingreso" },
  { id: 3, nombre: "Pago de membresía anual", tipo: "ingreso" },
  { id: 4, nombre: "Clase personal de yoga", tipo: "ingreso" },
  { id: 5, nombre: "Clase personal de spinning", tipo: "ingreso" },
  { id: 6, nombre: "Clase de crossfit grupal", tipo: "ingreso" },
  { id: 7, nombre: "Inscripción nuevo socio", tipo: "ingreso" },
  { id: 8, nombre: "Renta de locker mensual", tipo: "ingreso" },
  { id: 9, nombre: "Venta de suplementos", tipo: "ingreso" },
  { id: 10, nombre: "Venta de accesorios", tipo: "ingreso" },
  { id: 11, nombre: "Evento especial", tipo: "ingreso" },
  { id: 12, nombre: "Ingreso por publicidad", tipo: "ingreso" },
  { id: 13, nombre: "Cobro de visita por día", tipo: "ingreso" },
]

export const CONCEPTOS_GASTO: Concepto[] = [
  { id: 1, nombre: "Pago de renta del local", tipo: "gasto" },
  { id: 2, nombre: "Pago de energía eléctrica", tipo: "gasto" },
  { id: 3, nombre: "Pago de agua", tipo: "gasto" },
  { id: 4, nombre: "Servicio de limpieza", tipo: "gasto" },
  { id: 5, nombre: "Mantenimiento de equipo", tipo: "gasto" },
  { id: 6, nombre: "Compra de equipo nuevo", tipo: "gasto" },
  { id: 7, nombre: "Compra de suplementos (inventario)", tipo: "gasto" },
  { id: 8, nombre: "Pago de nómina", tipo: "gasto" },
  { id: 9, nombre: "Servicio de internet", tipo: "gasto" },
  { id: 10, nombre: "Licencia de software", tipo: "gasto" },
  { id: 11, nombre: "Marketing y publicidad", tipo: "gasto" },
  { id: 12, nombre: "Insumos de oficina", tipo: "gasto" },
  { id: 13, nombre: "Reparación de instalaciones", tipo: "gasto" },
  { id: 14, nombre: "Seguro del local", tipo: "gasto" },
  { id: 15, nombre: "Comisiones bancarias", tipo: "gasto" },
]
