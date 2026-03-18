// ============================================================
// Reportes Data Layer
// Types, demo data generation, and analytics helpers
// ============================================================

export type TipoReporte = "ventas" | "gastos" | "utilidad" | "membresias"

export interface GastoItem {
  id: string
  concepto: string
  categoria: string
  monto: number
  fecha: string
}

export interface MembresiaIngreso {
  id: string
  socio: string
  plan: string
  monto: number
  fecha: string
}

export interface ReporteResumen {
  periodo: string
  ventas: number
  gastos: number
  utilidad: number
  membresias: number
  transacciones: number
  socios: number
}

// ------- Categories -------

const categoriasGastos = [
  "Nomina",
  "Renta",
  "Servicios (Luz/Agua)",
  "Mantenimiento Equipo",
  "Limpieza",
  "Marketing",
  "Seguros",
  "Insumos",
  "Reparaciones",
  "Software/Licencias",
]

const conceptosGastos: Record<string, string[]> = {
  Nomina: ["Salario entrenadores", "Salario recepcion", "Bonos personal"],
  Renta: ["Renta mensual local"],
  "Servicios (Luz/Agua)": ["Recibo de luz", "Recibo de agua", "Internet"],
  "Mantenimiento Equipo": ["Mantenimiento caminadoras", "Aceite para maquinas", "Repuesto polea"],
  Limpieza: ["Servicio de limpieza", "Productos limpieza"],
  Marketing: ["Publicidad redes", "Flyers impresos", "Evento promocional"],
  Seguros: ["Seguro local", "Seguro equipo"],
  Insumos: ["Toallas", "Gel antibacterial", "Papel higienico"],
  Reparaciones: ["Reparacion aire acondicionado", "Reparacion regaderas"],
  "Software/Licencias": ["Licencia sistema", "Dominio web"],
}

const planes = [
  { nombre: "Basico Mensual", precio: 499 },
  { nombre: "Premium Mensual", precio: 799 },
  { nombre: "VIP Mensual", precio: 1199 },
  { nombre: "Basico Trimestral", precio: 1299 },
  { nombre: "Premium Trimestral", precio: 2099 },
  { nombre: "VIP Anual", precio: 9999 },
]

const nombresPersonas = [
  "Carlos Ramirez", "Ana Martinez", "Luis Hernandez", "Maria Lopez",
  "Jorge Garcia", "Sofia Torres", "Roberto Diaz", "Elena Morales",
  "Fernando Castro", "Patricia Ruiz", "Miguel Vargas", "Lucia Romero",
  "Diego Flores", "Camila Ortiz", "Andres Mendez", "Valentina Cruz",
  "Ricardo Gutierrez", "Isabella Reyes", "Pedro Salazar", "Natalia Vega",
  "Oscar Medina", "Daniela Soto", "Alejandro Rios", "Monica Fuentes",
]

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

const seededRandom = createSeededRandom(7777)

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

// ------- Data Generation -------

export function generateGastos(count: number, startDate: Date, endDate: Date): GastoItem[] {
  const gastos: GastoItem[] = []
  for (let i = 0; i < count; i++) {
    const categoria = randomItem(categoriasGastos)
    const conceptos = conceptosGastos[categoria] || [categoria]
    const fecha = randomDate(startDate, endDate)
    gastos.push({
      id: `G-${String(i + 1).padStart(4, "0")}`,
      concepto: randomItem(conceptos),
      categoria,
      monto: categoria === "Nomina"
        ? randomBetween(8000, 25000)
        : categoria === "Renta"
        ? randomBetween(15000, 35000)
        : randomBetween(200, 8000),
      fecha: formatDateISO(fecha),
    })
  }
  return gastos.sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export function generateMembresias(count: number, startDate: Date, endDate: Date): MembresiaIngreso[] {
  const membresias: MembresiaIngreso[] = []
  for (let i = 0; i < count; i++) {
    const plan = randomItem(planes)
    const fecha = randomDate(startDate, endDate)
    membresias.push({
      id: `M-${String(i + 1).padStart(4, "0")}`,
      socio: randomItem(nombresPersonas),
      plan: plan.nombre,
      monto: plan.precio + randomBetween(-50, 50),
      fecha: formatDateISO(fecha),
    })
  }
  return membresias.sort((a, b) => b.fecha.localeCompare(a.fecha))
}

// ------- Filtering -------

export function filterByDateRange<T extends { fecha: string }>(items: T[], inicio: string, fin: string): T[] {
  return items.filter((item) => item.fecha >= inicio && item.fecha <= fin)
}

export function sumField<T>(items: T[], getter: (item: T) => number): number {
  return items.reduce((sum, item) => sum + getter(item), 0)
}

// ------- Period Calculations -------

export function getDateRange(periodo: string, fechaInicio?: string, fechaFin?: string, referenceDate?: Date): {
  inicio: string
  fin: string
  anteriorInicio: string
  anteriorFin: string
  label: string
  labelAnterior: string
} {
  const now = referenceDate ?? new Date(Date.UTC(2026, 1, 21, 12, 0, 0))
  const today = formatDateISO(now)

  switch (periodo) {
    case "dia": {
      const yesterday = new Date(now)
      yesterday.setUTCDate(yesterday.getUTCDate() - 1)
      const dayBefore = new Date(now)
      dayBefore.setUTCDate(dayBefore.getUTCDate() - 2)
      return {
        inicio: today,
        fin: today,
        anteriorInicio: formatDateISO(yesterday),
        anteriorFin: formatDateISO(yesterday),
        label: "Hoy",
        labelAnterior: "Ayer",
      }
    }
    case "semana": {
      const startOfWeek = new Date(now)
      startOfWeek.setUTCDate(now.getUTCDate() - now.getUTCDay())
      const prevWeekEnd = new Date(startOfWeek)
      prevWeekEnd.setUTCDate(prevWeekEnd.getUTCDate() - 1)
      const prevWeekStart = new Date(prevWeekEnd)
      prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 6)
      return {
        inicio: formatDateISO(startOfWeek),
        fin: today,
        anteriorInicio: formatDateISO(prevWeekStart),
        anteriorFin: formatDateISO(prevWeekEnd),
        label: "Esta Semana",
        labelAnterior: "Semana Anterior",
      }
    }
    case "mes": {
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      const prevMonthEnd = new Date(startOfMonth)
      prevMonthEnd.setUTCDate(prevMonthEnd.getUTCDate() - 1)
      const prevMonthStart = new Date(Date.UTC(prevMonthEnd.getUTCFullYear(), prevMonthEnd.getUTCMonth(), 1))
      return {
        inicio: formatDateISO(startOfMonth),
        fin: today,
        anteriorInicio: formatDateISO(prevMonthStart),
        anteriorFin: formatDateISO(prevMonthEnd),
        label: "Este Mes",
        labelAnterior: "Mes Anterior",
      }
    }
    case "trimestre": {
      const currentQ = Math.floor(now.getUTCMonth() / 3)
      const startOfQ = new Date(Date.UTC(now.getUTCFullYear(), currentQ * 3, 1))
      const prevQEnd = new Date(startOfQ)
      prevQEnd.setUTCDate(prevQEnd.getUTCDate() - 1)
      const prevQStart = new Date(Date.UTC(prevQEnd.getUTCFullYear(), Math.floor(prevQEnd.getUTCMonth() / 3) * 3, 1))
      return {
        inicio: formatDateISO(startOfQ),
        fin: today,
        anteriorInicio: formatDateISO(prevQStart),
        anteriorFin: formatDateISO(prevQEnd),
        label: "Este Trimestre",
        labelAnterior: "Trimestre Anterior",
      }
    }
    case "semestre": {
      const currentSem = now.getUTCMonth() < 6 ? 0 : 1
      const startOfSem = new Date(Date.UTC(now.getUTCFullYear(), currentSem * 6, 1))
      const prevSemEnd = new Date(startOfSem)
      prevSemEnd.setUTCDate(prevSemEnd.getUTCDate() - 1)
      const prevSemStart = new Date(Date.UTC(prevSemEnd.getUTCFullYear(), prevSemEnd.getUTCMonth() < 6 ? 0 : 6, 1))
      return {
        inicio: formatDateISO(startOfSem),
        fin: today,
        anteriorInicio: formatDateISO(prevSemStart),
        anteriorFin: formatDateISO(prevSemEnd),
        label: "Este Semestre",
        labelAnterior: "Semestre Anterior",
      }
    }
    case "anual": {
      const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
      const prevYearStart = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1))
      const prevYearEnd = new Date(Date.UTC(now.getUTCFullYear() - 1, 11, 31))
      return {
        inicio: formatDateISO(startOfYear),
        fin: today,
        anteriorInicio: formatDateISO(prevYearStart),
        anteriorFin: formatDateISO(prevYearEnd),
        label: "Este Ano",
        labelAnterior: "Ano Anterior",
      }
    }
    case "personalizado": {
      if (fechaInicio && fechaFin) {
        const daysDiff = Math.floor(
          (new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24)
        )
        const anteriorFin = new Date(fechaInicio + "T12:00:00Z")
        anteriorFin.setUTCDate(anteriorFin.getUTCDate() - 1)
        const anteriorInicio = new Date(anteriorFin)
        anteriorInicio.setUTCDate(anteriorInicio.getUTCDate() - daysDiff)
        return {
          inicio: fechaInicio,
          fin: fechaFin,
          anteriorInicio: formatDateISO(anteriorInicio),
          anteriorFin: formatDateISO(anteriorFin),
          label: "Personalizado",
          labelAnterior: "Periodo Anterior",
        }
      }
      // fallback to month
      const sm = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      const pme = new Date(sm)
      pme.setUTCDate(pme.getUTCDate() - 1)
      const pms = new Date(Date.UTC(pme.getUTCFullYear(), pme.getUTCMonth(), 1))
      return {
        inicio: formatDateISO(sm),
        fin: today,
        anteriorInicio: formatDateISO(pms),
        anteriorFin: formatDateISO(pme),
        label: "Este Mes",
        labelAnterior: "Mes Anterior",
      }
    }
    default:
      return getDateRange("mes")
  }
}

// ------- Aggregation by month (for charts) -------

export function aggregateByMonth(items: { fecha: string; monto: number }[]): { mes: string; total: number }[] {
  const map = new Map<string, number>()
  for (const item of items) {
    const mes = item.fecha.substring(0, 7) // YYYY-MM
    map.set(mes, (map.get(mes) || 0) + item.monto)
  }
  return Array.from(map.entries())
    .map(([mes, total]) => ({ mes, total }))
    .sort((a, b) => a.mes.localeCompare(b.mes))
}

export function aggregateGastosByCategoria(gastos: GastoItem[]): { categoria: string; total: number }[] {
  const map = new Map<string, number>()
  for (const g of gastos) {
    map.set(g.categoria, (map.get(g.categoria) || 0) + g.monto)
  }
  return Array.from(map.entries())
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total)
}

export function aggregateMembresiasByPlan(membresias: MembresiaIngreso[]): { plan: string; cantidad: number; total: number }[] {
  const map = new Map<string, { cantidad: number; total: number }>()
  for (const m of membresias) {
    const existing = map.get(m.plan) || { cantidad: 0, total: 0 }
    map.set(m.plan, { cantidad: existing.cantidad + 1, total: existing.total + m.monto })
  }
  return Array.from(map.entries())
    .map(([plan, data]) => ({ plan, ...data }))
    .sort((a, b) => b.total - a.total)
}

// ------- Percentage change -------

export function calcCambio(actual: number, anterior: number): number {
  if (anterior === 0) return actual > 0 ? 100 : 0
  return ((actual - anterior) / anterior) * 100
}

// ------- Format -------

export function formatCurrency(amount: number): string {
  const fixed = Math.round(amount).toString()
  const formatted = fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `$${formatted}`
}

export function formatCurrencyFull(amount: number): string {
  const fixed = amount.toFixed(2)
  const [intPart, decPart] = fixed.split(".")
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `$${formatted}.${decPart}`
}

// ------- CSV Export for Reportes -------

export function exportReporteToCSV(
  data: {
    ventasPorMes: { mes: string; total: number }[]
    gastosPorMes: { mes: string; total: number }[]
    membresiasPorMes: { mes: string; total: number }[]
    gastosPorCategoria: { categoria: string; total: number }[]
    membresiasPorPlan: { plan: string; cantidad: number; total: number }[]
    resumen: { ventas: number; gastos: number; utilidad: number; membresias: number; socios: number }
  },
  rangoLabel: string
) {
  const lines: string[] = []

  // Header
  lines.push(`REPORTE FINANCIERO - ${rangoLabel}`)
  lines.push(`Generado: ${new Date().toLocaleString("es-MX")}`)
  lines.push("")
  lines.push("=" .repeat(50))
  lines.push("")

  // Resumen General
  lines.push("RESUMEN GENERAL")
  lines.push("Concepto,Monto")
  lines.push(`Ventas Totales,"${data.resumen.ventas.toFixed(2)}"`)
  lines.push(`Gastos Totales,"${data.resumen.gastos.toFixed(2)}"`)
  lines.push(`Utilidad Neta,"${data.resumen.utilidad.toFixed(2)}"`)
  lines.push(`Ingresos por Membresias,"${data.resumen.membresias.toFixed(2)}"`)
  lines.push(`Total Socios,${data.resumen.socios}`)
  lines.push("")

  // Desglose de Ingresos
  const totalIngresos = data.resumen.ventas + data.resumen.membresias
  lines.push("DESGLOSE DE INGRESOS POR FUENTE")
  lines.push("Fuente,Monto,Porcentaje del Total")
  if (totalIngresos > 0) {
    lines.push(`Ventas de Productos,"${data.resumen.ventas.toFixed(2)}","${((data.resumen.ventas / totalIngresos) * 100).toFixed(1)}%"`)
    lines.push(`Membresias,"${data.resumen.membresias.toFixed(2)}","${((data.resumen.membresias / totalIngresos) * 100).toFixed(1)}%"`)
    lines.push(`TOTAL INGRESOS,"${totalIngresos.toFixed(2)}","100%"`)
  }
  lines.push("")
  lines.push(`Saldo Neto (Ingresos - Gastos),"${(totalIngresos - data.resumen.gastos).toFixed(2)}"`)
  const margen = data.resumen.ventas > 0 ? ((data.resumen.utilidad / data.resumen.ventas) * 100).toFixed(1) : "0"
  lines.push(`Margen de Utilidad,"${margen}%"`)
  lines.push("")

  // Ventas por Mes
  lines.push("VENTAS POR MES")
  lines.push("Mes,Total")
  for (const v of data.ventasPorMes) {
    lines.push(`${v.mes},"${v.total.toFixed(2)}"`)
  }
  if (data.ventasPorMes.length > 0) {
    const totalMes = data.ventasPorMes.reduce((s, v) => s + v.total, 0)
    lines.push(`TOTAL,"${totalMes.toFixed(2)}"`)
  }
  lines.push("")

  // Gastos por Mes
  lines.push("GASTOS POR MES")
  lines.push("Mes,Total")
  for (const g of data.gastosPorMes) {
    lines.push(`${g.mes},"${g.total.toFixed(2)}"`)
  }
  if (data.gastosPorMes.length > 0) {
    const totalGMes = data.gastosPorMes.reduce((s, g) => s + g.total, 0)
    lines.push(`TOTAL,"${totalGMes.toFixed(2)}"`)
  }
  lines.push("")

  // Utilidad por Mes
  lines.push("UTILIDAD POR MES (Ventas + Membresias - Gastos)")
  lines.push("Mes,Ventas,Gastos,Membresias,Utilidad")
  const allMonths = new Set<string>()
  data.ventasPorMes.forEach((v) => allMonths.add(v.mes))
  data.gastosPorMes.forEach((g) => allMonths.add(g.mes))
  data.membresiasPorMes.forEach((m) => allMonths.add(m.mes))
  const sortedMonths = Array.from(allMonths).sort()
  for (const mes of sortedMonths) {
    const v = data.ventasPorMes.find((x) => x.mes === mes)?.total || 0
    const g = data.gastosPorMes.find((x) => x.mes === mes)?.total || 0
    const m = data.membresiasPorMes.find((x) => x.mes === mes)?.total || 0
    const u = v + m - g
    lines.push(`${mes},"${v.toFixed(2)}","${g.toFixed(2)}","${m.toFixed(2)}","${u.toFixed(2)}"`)
  }
  lines.push("")

  // Gastos por Categoria
  lines.push("GASTOS POR CATEGORIA")
  lines.push("Categoria,Total,Porcentaje")
  const totalGastosCat = data.gastosPorCategoria.reduce((s, g) => s + g.total, 0)
  for (const gc of data.gastosPorCategoria) {
    const pct = totalGastosCat > 0 ? ((gc.total / totalGastosCat) * 100).toFixed(1) : "0"
    lines.push(`"${gc.categoria}","${gc.total.toFixed(2)}","${pct}%"`)
  }
  lines.push("")

  // Membresias por Plan
  lines.push("MEMBRESIAS POR PLAN")
  lines.push("Plan,Cantidad Socios,Total Ingresos,Porcentaje")
  const totalMembPlan = data.membresiasPorPlan.reduce((s, m) => s + m.total, 0)
  for (const mp of data.membresiasPorPlan) {
    const pct = totalMembPlan > 0 ? ((mp.total / totalMembPlan) * 100).toFixed(1) : "0"
    lines.push(`"${mp.plan}",${mp.cantidad},"${mp.total.toFixed(2)}","${pct}%"`)
  }

  const BOM = "\uFEFF"
  const csvContent = BOM + lines.join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `reporte_financiero_${rangoLabel.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ------- Income Source Breakdown -------

export interface IngresoFuente {
  fuente: string
  monto: number
  porcentaje: number
  color: string
}

export function calcularIngresosPorFuente(
  totalVentas: number,
  totalMembresias: number
): IngresoFuente[] {
  const totalIngresos = totalVentas + totalMembresias
  if (totalIngresos === 0) return []

  const fuentes: IngresoFuente[] = [
    {
      fuente: "Ventas de Productos",
      monto: totalVentas,
      porcentaje: (totalVentas / totalIngresos) * 100,
      color: "#4BB543",
    },
    {
      fuente: "Membresias",
      monto: totalMembresias,
      porcentaje: (totalMembresias / totalIngresos) * 100,
      color: "#00BFFF",
    },
  ]

  return fuentes.sort((a, b) => b.monto - a.monto)
}

// ------- Aggregation by day (for daily charts) -------

export function aggregateByDay(items: { fecha: string; monto: number }[]): { dia: string; total: number }[] {
  const map = new Map<string, number>()
  for (const item of items) {
    map.set(item.fecha, (map.get(item.fecha) || 0) + item.monto)
  }
  return Array.from(map.entries())
    .map(([dia, total]) => ({ dia, total }))
    .sort((a, b) => a.dia.localeCompare(b.dia))
}
