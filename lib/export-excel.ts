import type { Venta } from "./ventas-data"
import { formatCurrency, getMetodoPagoLabel } from "./ventas-data"

// ============================================================
// REPORTE FINANCIERO CSV  — formato idéntico al generado por el sistema
// ============================================================

export interface ReporteFinancieroData {
  nombre: string
  periodo: string
  resumen: {
    ventas: number
    gastos: number
    utilidad: number
    membresias: number
    socios: number
  }
  graficas: {
    ventasPorMes: { mes: string; total: number }[]
    gastosPorMes: { mes: string; total: number }[]
    membresiasPorMes: { mes: string; total: number }[]
    gastosPorCategoria: { categoria: string; total: number }[]
    membresiasPorPlan: { plan: string; cantidad: number; total: number }[]
  }
}

function fmtNum(n: number): string {
  return n.toFixed(2)
}

function fmtPct(n: number): string {
  return n.toFixed(1) + "%"
}

function row(...cells: string[]): string {
  return cells.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")
}

export function exportReporteFinancieroToCSV(data: ReporteFinancieroData): void {
  const { nombre, periodo, resumen, graficas } = data
  const now = new Date()
  const fechaGenerado = now.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }) + ", " + now.toLocaleTimeString("es-MX", { hour12: true })

  const totalIngresos = resumen.ventas + resumen.membresias
  const pctVentas = totalIngresos > 0 ? (resumen.ventas / totalIngresos) * 100 : 0
  const pctMembresias = totalIngresos > 0 ? (resumen.membresias / totalIngresos) * 100 : 0
  const margen = resumen.ventas > 0 ? (resumen.utilidad / resumen.ventas) * 100 : 0

  // ---- Merge monthly data ----
  const allMonths = Array.from(
    new Set([
      ...graficas.ventasPorMes.map((v) => v.mes),
      ...graficas.gastosPorMes.map((g) => g.mes),
      ...graficas.membresiasPorMes.map((m) => m.mes),
    ])
  ).sort()

  const totalVentasMes = graficas.ventasPorMes.reduce((s, v) => s + v.total, 0)
  const totalGastosMes = graficas.gastosPorMes.reduce((s, g) => s + g.total, 0)
  const totalGastosCategoria = graficas.gastosPorCategoria.reduce((s, g) => s + g.total, 0)
  const totalMembresiasPlan = graficas.membresiasPorPlan.reduce((s, m) => s + m.total, 0)

  const lines: string[] = []

  // Header
  lines.push(`REPORTE FINANCIERO - ${nombre}`)
  lines.push(`Generado: ${fechaGenerado}`)
  lines.push("")
  lines.push("==================================================")
  lines.push("")

  // Resumen General
  lines.push("RESUMEN GENERAL")
  lines.push("Concepto,Monto")
  lines.push(row("Ventas Totales", fmtNum(resumen.ventas)))
  lines.push(row("Gastos Totales", fmtNum(resumen.gastos)))
  lines.push(row("Utilidad Neta", fmtNum(resumen.utilidad)))
  lines.push(row("Ingresos por Membresias", fmtNum(resumen.membresias)))
  lines.push(row("Total Socios", String(resumen.socios)))
  lines.push("")

  // Desglose de ingresos
  lines.push("DESGLOSE DE INGRESOS POR FUENTE")
  lines.push("Fuente,Monto,Porcentaje del Total")
  lines.push(row("Ventas de Productos", fmtNum(resumen.ventas), fmtPct(pctVentas)))
  lines.push(row("Membresias", fmtNum(resumen.membresias), fmtPct(pctMembresias)))
  lines.push(row("TOTAL INGRESOS", fmtNum(totalIngresos), "100%"))
  lines.push("")
  lines.push(row("Saldo Neto (Ingresos - Gastos)", fmtNum(resumen.utilidad)))
  lines.push(row("Margen de Utilidad", fmtPct(margen)))
  lines.push("")

  // Ventas por mes
  if (allMonths.length > 0) {
    lines.push("VENTAS POR MES")
    lines.push("Mes,Total")
    graficas.ventasPorMes.forEach((v) => lines.push(row(v.mes, fmtNum(v.total))))
    lines.push(row("TOTAL", fmtNum(totalVentasMes)))
    lines.push("")

    // Gastos por mes
    lines.push("GASTOS POR MES")
    lines.push("Mes,Total")
    graficas.gastosPorMes.forEach((g) => lines.push(row(g.mes, fmtNum(g.total))))
    lines.push(row("TOTAL", fmtNum(totalGastosMes)))
    lines.push("")

    // Utilidad por mes
    lines.push("UTILIDAD POR MES (Ventas + Membresias - Gastos)")
    lines.push("Mes,Ventas,Gastos,Membresias,Utilidad")
    allMonths.forEach((mes) => {
      const v = graficas.ventasPorMes.find((x) => x.mes === mes)?.total ?? 0
      const g = graficas.gastosPorMes.find((x) => x.mes === mes)?.total ?? 0
      const m = graficas.membresiasPorMes.find((x) => x.mes === mes)?.total ?? 0
      const u = v + m - g
      lines.push(row(mes, fmtNum(v), fmtNum(g), fmtNum(m), fmtNum(u)))
    })
    lines.push("")
  }

  // Gastos por categoría
  if (graficas.gastosPorCategoria.length > 0) {
    lines.push("GASTOS POR CATEGORIA")
    lines.push("Categoria,Total,Porcentaje")
    graficas.gastosPorCategoria.forEach((c) => {
      const pct = totalGastosCategoria > 0 ? (c.total / totalGastosCategoria) * 100 : 0
      lines.push(row(c.categoria, fmtNum(c.total), fmtPct(pct)))
    })
    lines.push("")
  }

  // Membresías por plan
  if (graficas.membresiasPorPlan.length > 0) {
    lines.push("MEMBRESIAS POR PLAN")
    lines.push("Plan,Cantidad Socios,Total Ingresos,Porcentaje")
    graficas.membresiasPorPlan.forEach((p) => {
      const pct = totalMembresiasPlan > 0 ? (p.total / totalMembresiasPlan) * 100 : 0
      lines.push(row(p.plan, String(p.cantidad), fmtNum(p.total), fmtPct(pct)))
    })
  }

  const csvContent = lines.join("\n")
  const BOM = "\uFEFF"
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  const filename = `reporte_financiero_${nombre.replace(/\s+/g, "_")}_${now.toISOString().split("T")[0]}.csv`
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportVentasToCSV(ventas: Venta[], filename: string = "ventas") {
  const headers = ["ID", "Cliente", "Productos", "Cantidad Items", "Total", "Fecha", "Hora", "Metodo de Pago"]

  const rows = ventas.map((v) => [
    v.id,
    v.cliente,
    v.productos.map((p) => `${p.nombre} x${p.cantidad}`).join("; "),
    v.productos.reduce((sum, p) => sum + p.cantidad, 0).toString(),
    formatCurrency(v.total),
    v.fecha,
    v.hora,
    getMetodoPagoLabel(v.metodoPago),
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n")

  // Add BOM for Excel encoding
  const BOM = "\uFEFF"
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
