// ------- Types -------

export type TipoMovimiento = "ingreso" | "egreso"
export type TipoPago = "efectivo" | "transferencia" | "tarjeta"

export interface Movimiento {
  id: string
  tipo: TipoMovimiento
  concepto: string
  total: number
  tipoPago: TipoPago
  fecha: string      // YYYY-MM-DD
  hora: string       // HH:MM
  usuario: string
  observaciones?: string
}

// ------- Seeded PRNG (mulberry32) for deterministic SSR-safe data -------

function createSeededRandom(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const seededRandom = createSeededRandom(3333)

// ------- Helpers -------

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)]
}

function randomBetween(min: number, max: number): number {
  return Math.floor(seededRandom() * (max - min + 1)) + min
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + seededRandom() * (end.getTime() - start.getTime()))
}

function formatDateISO(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatTime(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
}

// ------- Demo Data Config -------

const conceptosIngreso = [
  "Pago de membresia mensual",
  "Pago de membresia trimestral",
  "Pago de membresia anual",
  "Clase personal de yoga",
  "Clase personal de spinning",
  "Clase de crossfit grupal",
  "Inscripcion nuevo socio",
  "Renta de locker mensual",
  "Venta de suplementos",
  "Venta de accesorios",
  "Evento especial",
  "Ingreso por publicidad",
  "Cobro de visita por dia",
]

const conceptosEgreso = [
  "Pago de renta del local",
  "Pago de energia electrica",
  "Pago de agua",
  "Servicio de limpieza",
  "Mantenimiento de equipo",
  "Compra de equipo nuevo",
  "Compra de suplementos (inventario)",
  "Pago de nomina",
  "Servicio de internet",
  "Licencia de software",
  "Marketing y publicidad",
  "Insumos de oficina",
  "Reparacion de instalaciones",
  "Seguro del local",
  "Comisiones bancarias",
]

const usuarios = [
  "Admin",
  "Carlos Ramirez",
  "Ana Martinez",
  "Luis Hernandez",
  "Sofia Torres",
]

const tiposPago: TipoPago[] = ["efectivo", "transferencia", "tarjeta"]

// ------- Generate Demo Movimientos -------

export function generateMovimientos(count: number, referenceDate: Date): Movimiento[] {
  const movimientos: Movimiento[] = []
  const oneYearAgo = new Date(Date.UTC(referenceDate.getUTCFullYear() - 1, referenceDate.getUTCMonth(), 1))

  for (let i = 0; i < count; i++) {
    const fecha = randomDate(oneYearAgo, referenceDate)
    const isIngreso = seededRandom() > 0.45 // ~55% ingresos, 45% egresos
    const tipo: TipoMovimiento = isIngreso ? "ingreso" : "egreso"
    const concepto = isIngreso ? randomItem(conceptosIngreso) : randomItem(conceptosEgreso)

    let total: number
    if (isIngreso) {
      // Ingresos range: 100 - 8,000
      total = randomBetween(100, 8000)
    } else {
      // Egresos range: 200 - 25,000 (rent, payroll can be high)
      total = randomBetween(200, 25000)
    }

    movimientos.push({
      id: `MOV-${String(i + 1).padStart(4, "0")}`,
      tipo,
      concepto,
      total,
      tipoPago: randomItem(tiposPago),
      fecha: formatDateISO(fecha),
      hora: formatTime(fecha),
      usuario: randomItem(usuarios),
      observaciones: seededRandom() > 0.7 ? `Nota del movimiento #${i + 1}` : undefined,
    })
  }

  return movimientos.sort((a, b) => {
    const dateCompare = b.fecha.localeCompare(a.fecha)
    if (dateCompare !== 0) return dateCompare
    return b.hora.localeCompare(a.hora)
  })
}

// ------- Filter Helpers -------

export function filterMovimientos(
  movimientos: Movimiento[],
  filters: {
    busqueda?: string
    tipo?: string
    tipoPago?: string
    fechaInicio?: string
    fechaFin?: string
  }
): Movimiento[] {
  let result = [...movimientos]

  if (filters.busqueda) {
    const q = filters.busqueda.toLowerCase()
    result = result.filter(
      (m) =>
        m.concepto.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.usuario.toLowerCase().includes(q)
    )
  }

  if (filters.tipo && filters.tipo !== "todos") {
    result = result.filter((m) => m.tipo === filters.tipo)
  }

  if (filters.tipoPago && filters.tipoPago !== "todos") {
    result = result.filter((m) => m.tipoPago === filters.tipoPago)
  }

  if (filters.fechaInicio) {
    result = result.filter((m) => m.fecha >= filters.fechaInicio!)
  }

  if (filters.fechaFin) {
    result = result.filter((m) => m.fecha <= filters.fechaFin!)
  }

  return result
}

// ------- KPI Calculations -------

export interface MovimientoKpis {
  totalIngresos: number
  totalEgresos: number
  balanceNeto: number
  totalMovimientos: number
  cambioIngresos?: number
  cambioEgresos?: number
  cambioBalance?: number
}

export function calcularKpis(
  movimientos: Movimiento[],
  prevMovimientos?: Movimiento[]
): MovimientoKpis {
  const ingresos = movimientos.filter((m) => m.tipo === "ingreso")
  const egresos = movimientos.filter((m) => m.tipo === "egreso")

  const totalIngresos = ingresos.reduce((sum, m) => sum + m.total, 0)
  const totalEgresos = egresos.reduce((sum, m) => sum + m.total, 0)
  const balanceNeto = totalIngresos - totalEgresos

  let cambioIngresos: number | undefined
  let cambioEgresos: number | undefined
  let cambioBalance: number | undefined

  if (prevMovimientos) {
    const prevIngresos = prevMovimientos.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.total, 0)
    const prevEgresos = prevMovimientos.filter((m) => m.tipo === "egreso").reduce((s, m) => s + m.total, 0)
    const prevBalance = prevIngresos - prevEgresos

    cambioIngresos = prevIngresos > 0 ? ((totalIngresos - prevIngresos) / prevIngresos) * 100 : undefined
    cambioEgresos = prevEgresos > 0 ? ((totalEgresos - prevEgresos) / prevEgresos) * 100 : undefined
    cambioBalance = prevBalance !== 0 ? ((balanceNeto - prevBalance) / Math.abs(prevBalance)) * 100 : undefined
  }

  return {
    totalIngresos,
    totalEgresos,
    balanceNeto,
    totalMovimientos: movimientos.length,
    cambioIngresos,
    cambioEgresos,
    cambioBalance,
  }
}

// ------- Comparison Periods -------

export interface PeriodoComparacion {
  label: string
  labelAnterior: string
  inicio: string
  fin: string
  anteriorInicio: string
  anteriorFin: string
}

export function getPeriodosComparacion(referenceDate: Date): PeriodoComparacion[] {
  const now = referenceDate
  const today = formatDateISO(now)

  // Dia vs dia anterior
  const yesterday = new Date(now)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const dayBefore = new Date(now)
  dayBefore.setUTCDate(dayBefore.getUTCDate() - 2)

  // Mes actual vs mes anterior
  const mesInicio = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const mesAnteriorInicio = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const mesAnteriorFin = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))

  // Trimestre actual vs trimestre anterior
  const qMonth = Math.floor(now.getUTCMonth() / 3) * 3
  const trimInicio = new Date(Date.UTC(now.getUTCFullYear(), qMonth, 1))
  const trimAntInicio = new Date(Date.UTC(now.getUTCFullYear(), qMonth - 3, 1))
  const trimAntFin = new Date(Date.UTC(now.getUTCFullYear(), qMonth, 0))

  // Semestre actual vs semestre anterior
  const sMonth = now.getUTCMonth() < 6 ? 0 : 6
  const semInicio = new Date(Date.UTC(now.getUTCFullYear(), sMonth, 1))
  const semAntInicio = new Date(Date.UTC(sMonth === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear(), sMonth === 0 ? 6 : 0, 1))
  const semAntFin = new Date(Date.UTC(now.getUTCFullYear(), sMonth, 0))

  // Ano actual vs ano anterior
  const anoInicio = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
  const anoAntInicio = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1))
  const anoAntFin = new Date(Date.UTC(now.getUTCFullYear() - 1, 11, 31))

  return [
    {
      label: "Hoy",
      labelAnterior: "Ayer",
      inicio: today,
      fin: today,
      anteriorInicio: formatDateISO(yesterday),
      anteriorFin: formatDateISO(yesterday),
    },
    {
      label: "Este Mes",
      labelAnterior: "Mes Anterior",
      inicio: formatDateISO(mesInicio),
      fin: today,
      anteriorInicio: formatDateISO(mesAnteriorInicio),
      anteriorFin: formatDateISO(mesAnteriorFin),
    },
    {
      label: "Este Trimestre",
      labelAnterior: "Trim. Anterior",
      inicio: formatDateISO(trimInicio),
      fin: today,
      anteriorInicio: formatDateISO(trimAntInicio),
      anteriorFin: formatDateISO(trimAntFin),
    },
    {
      label: "Este Semestre",
      labelAnterior: "Sem. Anterior",
      inicio: formatDateISO(semInicio),
      fin: today,
      anteriorInicio: formatDateISO(semAntInicio),
      anteriorFin: formatDateISO(semAntFin),
    },
    {
      label: "Este Ano",
      labelAnterior: "Ano Anterior",
      inicio: formatDateISO(anoInicio),
      fin: today,
      anteriorInicio: formatDateISO(anoAntInicio),
      anteriorFin: formatDateISO(anoAntFin),
    },
  ]
}

// ------- CSV Export -------

export function exportMovimientosCSV(
  movimientos: Movimiento[],
  kpis: MovimientoKpis,
  rangoLabel: string
) {
  const lines: string[] = []

  lines.push("REPORTE DE MOVIMIENTOS - " + rangoLabel)
  lines.push(`Generado: ${new Date().toLocaleString("es-MX")}`)
  lines.push("")

  // Resumen
  lines.push("RESUMEN")
  lines.push("Concepto,Monto")
  lines.push(`Total Ingresos,"$${kpis.totalIngresos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}"`)
  lines.push(`Total Egresos,"$${kpis.totalEgresos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}"`)
  lines.push(`Balance Neto,"$${kpis.balanceNeto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}"`)
  lines.push(`Total Movimientos,${kpis.totalMovimientos}`)
  lines.push("")

  // Detail table
  lines.push("DETALLE DE MOVIMIENTOS")
  lines.push("Folio,Fecha,Hora,Tipo,Concepto,Total,Tipo Pago,Usuario,Observaciones")
  for (const m of movimientos) {
    const obs = m.observaciones ? `"${m.observaciones}"` : ""
    lines.push(
      `${m.id},${m.fecha},${m.hora},${m.tipo === "ingreso" ? "Ingreso" : "Egreso"},"${m.concepto}","$${m.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}",${m.tipoPago},${m.usuario},${obs}`
    )
  }

  const csvContent = lines.join("\n")
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `movimientos_${rangoLabel.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
