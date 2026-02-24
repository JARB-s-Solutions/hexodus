"use client"

import { useState, useMemo, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { ReportesHeader } from "@/components/reportes/reportes-header"
import { KpiReportes } from "@/components/reportes/kpi-reportes"
import { ReportesFilters } from "@/components/reportes/reportes-filters"
import { Comparaciones } from "@/components/reportes/comparaciones"
import { GraficasReportes } from "@/components/reportes/graficas-reportes"
import { InsightsReportes } from "@/components/reportes/insights-reportes"
import { DesgloseIngresos } from "@/components/reportes/desglose-ingresos"
import { HistorialReportes, type ReporteHistorial } from "@/components/reportes/historial-reportes"
import { GenerarReporteModal, type ReporteConfig } from "@/components/reportes/generar-reporte-modal"
import { TrendingUp, TrendingDown } from "lucide-react"
import {
  generateGastos,
  generateMembresias,
  getDateRange,
  filterByDateRange,
  sumField,
  aggregateByMonth,
  aggregateGastosByCategoria,
  aggregateMembresiasByPlan,
  exportReporteToCSV,
  formatCurrency,
  calcCambio,
  type TipoReporte,
} from "@/lib/reportes-data"
import {
  generateVentas,
  getTotalVentas,
} from "@/lib/ventas-data"

// ------- Generate all demo data with fixed reference dates for SSR safety -------
const FIXED_REF = new Date(Date.UTC(2026, 1, 21, 12, 0, 0))
const oneYearAgo = new Date(Date.UTC(2025, 1, 1))
const allVentas = generateVentas(500, FIXED_REF)
const allGastos = generateGastos(300, oneYearAgo, FIXED_REF)
const allMembresias = generateMembresias(400, oneYearAgo, FIXED_REF)

// Helper to compute comparison items for a given period
function buildComparacionItems(
  ventasArr: typeof allVentas,
  gastosArr: typeof allGastos,
  membresiasArr: typeof allMembresias,
  range: ReturnType<typeof getDateRange>
) {
  const vAct = ventasArr.filter((v) => v.fecha >= range.inicio && v.fecha <= range.fin)
  const vAnt = ventasArr.filter((v) => v.fecha >= range.anteriorInicio && v.fecha <= range.anteriorFin)
  const gAct = filterByDateRange(gastosArr, range.inicio, range.fin)
  const gAnt = filterByDateRange(gastosArr, range.anteriorInicio, range.anteriorFin)
  const mAct = filterByDateRange(membresiasArr, range.inicio, range.fin)
  const mAnt = filterByDateRange(membresiasArr, range.anteriorInicio, range.anteriorFin)

  const tV = getTotalVentas(vAct)
  const tVa = getTotalVentas(vAnt)
  const tG = sumField(gAct, (g) => g.monto)
  const tGa = sumField(gAnt, (g) => g.monto)
  const tM = sumField(mAct, (m) => m.monto)
  const tMa = sumField(mAnt, (m) => m.monto)

  return [
    { label: "Ventas Totales", actual: tV, anterior: tVa },
    { label: "Gastos Totales", actual: tG, anterior: tGa },
    { label: "Utilidad Neta", actual: tV + tM - tG, anterior: tVa + tMa - tGa },
    { label: "Ingresos Membresias", actual: tM, anterior: tMa },
  ]
}

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState("mes")
  const [tipoReporte, setTipoReporte] = useState<TipoReporte | "todos">("todos")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [activeTab, setActiveTab] = useState<"resumen" | "graficas" | "comparaciones" | "historial">("resumen")
  const [modalGenerar, setModalGenerar] = useState(false)
  const [reportesHistorial, setReportesHistorial] = useState<ReporteHistorial[]>([])

  // Date ranges
  const dateRange = useMemo(
    () => getDateRange(periodo, fechaInicio, fechaFin),
    [periodo, fechaInicio, fechaFin]
  )

  // ------ Current period data ------
  const ventasPeriodo = useMemo(
    () => allVentas.filter((v) => v.fecha >= dateRange.inicio && v.fecha <= dateRange.fin),
    [dateRange]
  )
  const gastosPeriodo = useMemo(
    () => filterByDateRange(allGastos, dateRange.inicio, dateRange.fin),
    [dateRange]
  )
  const membresiasPeriodo = useMemo(
    () => filterByDateRange(allMembresias, dateRange.inicio, dateRange.fin),
    [dateRange]
  )

  // ------ Previous period data ------
  const ventasAnterior = useMemo(
    () => allVentas.filter((v) => v.fecha >= dateRange.anteriorInicio && v.fecha <= dateRange.anteriorFin),
    [dateRange]
  )
  const gastosAnterior = useMemo(
    () => filterByDateRange(allGastos, dateRange.anteriorInicio, dateRange.anteriorFin),
    [dateRange]
  )
  const membresiasAnterior = useMemo(
    () => filterByDateRange(allMembresias, dateRange.anteriorInicio, dateRange.anteriorFin),
    [dateRange]
  )

  // ------ Totals ------
  const totalVentas = useMemo(() => getTotalVentas(ventasPeriodo), [ventasPeriodo])
  const totalGastos = useMemo(() => sumField(gastosPeriodo, (g) => g.monto), [gastosPeriodo])
  const totalMembresias = useMemo(() => sumField(membresiasPeriodo, (m) => m.monto), [membresiasPeriodo])
  const totalUtilidad = totalVentas + totalMembresias - totalGastos

  const totalVentasAnt = useMemo(() => getTotalVentas(ventasAnterior), [ventasAnterior])
  const totalGastosAnt = useMemo(() => sumField(gastosAnterior, (g) => g.monto), [gastosAnterior])
  const totalMembresiasAnt = useMemo(() => sumField(membresiasAnterior, (m) => m.monto), [membresiasAnterior])
  const totalUtilidadAnt = totalVentasAnt + totalMembresiasAnt - totalGastosAnt

  // ------ Aggregations for charts ------
  const ventasMensuales = useMemo(() => {
    const mapped = ventasPeriodo.map((v) => ({ fecha: v.fecha, monto: v.total }))
    return aggregateByMonth(mapped)
  }, [ventasPeriodo])

  const gastosMensuales = useMemo(() => {
    const mapped = gastosPeriodo.map((g) => ({ fecha: g.fecha, monto: g.monto }))
    return aggregateByMonth(mapped)
  }, [gastosPeriodo])

  const membresiasMensuales = useMemo(() => {
    const mapped = membresiasPeriodo.map((m) => ({ fecha: m.fecha, monto: m.monto }))
    return aggregateByMonth(mapped)
  }, [membresiasPeriodo])

  const gastosPorCategoria = useMemo(
    () => aggregateGastosByCategoria(gastosPeriodo),
    [gastosPeriodo]
  )

  const membresiasPorPlan = useMemo(
    () => aggregateMembresiasByPlan(membresiasPeriodo),
    [membresiasPeriodo]
  )

  // Unique socios
  const sociosActivos = useMemo(() => {
    const unique = new Set(membresiasPeriodo.map((m) => m.socio))
    return unique.size
  }, [membresiasPeriodo])

  // Top gasto category
  const topGasto = gastosPorCategoria[0]
  const topPlan = membresiasPorPlan[0]

  // ------ Multi-period comparisons ------
  const comparacionesPeriodos = useMemo(() => {
    const periods = [
      { tipo: "mes", label: "Mes vs Mes Anterior" },
      { tipo: "trimestre", label: "Trimestre vs Anterior" },
      { tipo: "semestre", label: "Semestre vs Anterior" },
      { tipo: "anual", label: "Ano vs Anterior" },
    ].filter((p) => p.tipo !== periodo)

    return periods.map((p) => {
      const range = getDateRange(p.tipo)
      return {
        tipo: p.tipo,
        label: p.label,
        labelAnterior: range.labelAnterior,
        items: buildComparacionItems(allVentas, allGastos, allMembresias, range),
      }
    })
  }, [periodo])

  // ------ Handlers ------
  const handleLimpiar = useCallback(() => {
    setPeriodo("mes")
    setTipoReporte("todos")
    setFechaInicio("")
    setFechaFin("")
  }, [])

  const handleExportar = useCallback(() => {
    exportReporteToCSV(
      {
        ventasPorMes: ventasMensuales,
        gastosPorMes: gastosMensuales,
        membresiasPorMes: membresiasMensuales,
        gastosPorCategoria,
        membresiasPorPlan,
        resumen: {
          ventas: totalVentas,
          gastos: totalGastos,
          utilidad: totalUtilidad,
          membresias: totalMembresias,
          socios: sociosActivos,
        },
      },
      dateRange.label
    )
  }, [
    ventasMensuales,
    gastosMensuales,
    membresiasMensuales,
    gastosPorCategoria,
    membresiasPorPlan,
    totalVentas,
    totalGastos,
    totalUtilidad,
    totalMembresias,
    sociosActivos,
    dateRange.label,
  ])

  const handleGenerarReporte = useCallback((config: ReporteConfig) => {
    const range = getDateRange("personalizado", config.fechaInicio, config.fechaFin)
    const vAct = allVentas.filter((v) => v.fecha >= range.inicio && v.fecha <= range.fin)
    const gAct = filterByDateRange(allGastos, range.inicio, range.fin)
    const mAct = filterByDateRange(allMembresias, range.inicio, range.fin)
    const tV = getTotalVentas(vAct)
    const tG = sumField(gAct, (g) => g.monto)
    const tM = sumField(mAct, (m) => m.monto)

    const newReporte: ReporteHistorial = {
      id: `RPT-${String(reportesHistorial.length + 1).padStart(4, "0")}`,
      nombre: config.nombre,
      tipo: config.tipo === "completo" ? "completo" : config.tipo,
      periodo: `${config.fechaInicio} a ${config.fechaFin}`,
      fechaGenerado: new Date().toLocaleString("es-MX"),
      estado: "generado",
      formato: "Excel",
      resumen: {
        ventas: tV,
        gastos: tG,
        utilidad: tV + tM - tG,
      },
    }

    setReportesHistorial((prev) => [newReporte, ...prev])

    // Auto export the CSV
    const ventasMapped = vAct.map((v) => ({ fecha: v.fecha, monto: v.total }))
    const gastosMapped = gAct.map((g) => ({ fecha: g.fecha, monto: g.monto }))
    const membMapped = mAct.map((m) => ({ fecha: m.fecha, monto: m.monto }))
    const uniqueSocios = new Set(mAct.map((m) => m.socio))

    exportReporteToCSV(
      {
        ventasPorMes: aggregateByMonth(ventasMapped),
        gastosPorMes: aggregateByMonth(gastosMapped),
        membresiasPorMes: aggregateByMonth(membMapped),
        gastosPorCategoria: aggregateGastosByCategoria(gAct),
        membresiasPorPlan: aggregateMembresiasByPlan(mAct),
        resumen: {
          ventas: tV,
          gastos: tG,
          utilidad: tV + tM - tG,
          membresias: tM,
          socios: uniqueSocios.size,
        },
      },
      config.nombre
    )
  }, [reportesHistorial.length])

  const handleDescargarReporte = useCallback((reporte: ReporteHistorial) => {
    setReportesHistorial((prev) =>
      prev.map((r) => (r.id === reporte.id ? { ...r, estado: "descargado" as const } : r))
    )
    // Re-trigger the export for this period
    handleExportar()
  }, [handleExportar])

  const handleEliminarReporte = useCallback((id: string) => {
    setReportesHistorial((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="reportes" />

      <main className="flex-1 flex flex-col min-h-0">
        <ReportesHeader />

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-5">
          {/* KPIs */}
          <KpiReportes
            ventas={totalVentas}
            ventasAnterior={totalVentasAnt}
            gastos={totalGastos}
            gastosAnterior={totalGastosAnt}
            utilidad={totalUtilidad}
            utilidadAnterior={totalUtilidadAnt}
            membresias={totalMembresias}
            membresiasAnterior={totalMembresiasAnt}
            socios={sociosActivos}
            labelAnterior={dateRange.labelAnterior}
          />

          {/* Tabs */}
          <div
            className="flex items-center gap-1 bg-card rounded-lg p-1 w-fit overflow-x-auto"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
          >
            {(
              [
                { key: "resumen", label: "Resumen General" },
                { key: "graficas", label: "Graficas" },
                { key: "comparaciones", label: "Comparaciones" },
                { key: "historial", label: "Historial" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground glow-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content layout: 1/4 filters + 3/4 main */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Left - Filters */}
            <div className="lg:col-span-1">
              <ReportesFilters
                periodo={periodo}
                onPeriodoChange={setPeriodo}
                tipoReporte={tipoReporte}
                onTipoReporteChange={setTipoReporte}
                fechaInicio={fechaInicio}
                onFechaInicioChange={setFechaInicio}
                fechaFin={fechaFin}
                onFechaFinChange={setFechaFin}
                onLimpiar={handleLimpiar}
                onExportar={handleExportar}
                onNuevoReporte={() => setModalGenerar(true)}
              />
            </div>

            {/* Right - Main content */}
            <div className="lg:col-span-3">
              {/* ====== RESUMEN GENERAL TAB ====== */}
              {activeTab === "resumen" && (
                <div className="space-y-5">
                  {/* Income Breakdown - always show on "todos" or relevant types */}
                  {(tipoReporte === "todos" || tipoReporte === "ventas" || tipoReporte === "membresias") && (
                    <DesgloseIngresos
                      totalVentas={totalVentas}
                      totalMembresias={totalMembresias}
                      totalVentasAnt={totalVentasAnt}
                      totalMembresiasAnt={totalMembresiasAnt}
                      totalGastos={totalGastos}
                      labelAnterior={dateRange.labelAnterior}
                    />
                  )}

                  {/* Summary cards grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {(tipoReporte === "todos" || tipoReporte === "ventas") && (
                      <SummaryCard
                        title="Ventas"
                        total={totalVentas}
                        anterior={totalVentasAnt}
                        count={ventasPeriodo.length}
                        countLabel="transacciones"
                        color="success"
                        labelAnterior={dateRange.labelAnterior}
                      />
                    )}
                    {(tipoReporte === "todos" || tipoReporte === "gastos") && (
                      <SummaryCard
                        title="Gastos"
                        total={totalGastos}
                        anterior={totalGastosAnt}
                        count={gastosPeriodo.length}
                        countLabel="movimientos"
                        color="primary"
                        invertChange
                        labelAnterior={dateRange.labelAnterior}
                      />
                    )}
                    {(tipoReporte === "todos" || tipoReporte === "utilidad") && (
                      <SummaryCard
                        title="Utilidad Neta"
                        total={totalUtilidad}
                        anterior={totalUtilidadAnt}
                        count={null}
                        countLabel=""
                        color={totalUtilidad >= 0 ? "accent" : "destructive"}
                        extra={`Margen: ${totalVentas > 0 ? ((totalUtilidad / totalVentas) * 100).toFixed(1) : "0"}%`}
                        labelAnterior={dateRange.labelAnterior}
                      />
                    )}
                    {(tipoReporte === "todos" || tipoReporte === "membresias") && (
                      <SummaryCard
                        title="Membresias"
                        total={totalMembresias}
                        anterior={totalMembresiasAnt}
                        count={sociosActivos}
                        countLabel="socios activos"
                        color="accent"
                        labelAnterior={dateRange.labelAnterior}
                      />
                    )}
                  </div>

                  {/* Insights */}
                  <InsightsReportes
                    ventas={totalVentas}
                    ventasAnterior={totalVentasAnt}
                    gastos={totalGastos}
                    gastosAnterior={totalGastosAnt}
                    utilidad={totalUtilidad}
                    utilidadAnterior={totalUtilidadAnt}
                    membresias={totalMembresias}
                    membresiasAnterior={totalMembresiasAnt}
                    socios={sociosActivos}
                    topGasto={topGasto?.categoria || "N/A"}
                    topGastoMonto={topGasto?.total || 0}
                    topPlan={topPlan?.plan || "N/A"}
                    topPlanSocios={topPlan?.cantidad || 0}
                    periodo={periodo}
                  />

                  {/* Quick breakdown tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {(tipoReporte === "todos" || tipoReporte === "gastos") && (
                      <div
                        className="bg-card rounded-xl p-5"
                        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
                      >
                        <h3 className="text-sm font-semibold text-foreground mb-4">Top Categorias de Gasto</h3>
                        <div className="space-y-3">
                          {gastosPorCategoria.slice(0, 5).map((g) => {
                            const maxTotal = gastosPorCategoria[0]?.total || 1
                            const pct = (g.total / maxTotal) * 100
                            return (
                              <div key={g.categoria}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-foreground">{g.categoria}</span>
                                  <span className="text-xs font-medium text-primary">{formatCurrency(g.total)}</span>
                                </div>
                                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {(tipoReporte === "todos" || tipoReporte === "membresias") && (
                      <div
                        className="bg-card rounded-xl p-5"
                        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
                      >
                        <h3 className="text-sm font-semibold text-foreground mb-4">Planes de Membresia</h3>
                        <div className="space-y-3">
                          {membresiasPorPlan.slice(0, 5).map((mp) => {
                            const maxTotal = membresiasPorPlan[0]?.total || 1
                            const pct = (mp.total / maxTotal) * 100
                            return (
                              <div key={mp.plan}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-foreground truncate flex-1 mr-2">{mp.plan}</span>
                                  <span className="text-xs text-muted-foreground mr-2">{mp.cantidad} socios</span>
                                  <span className="text-xs font-medium text-accent">{formatCurrency(mp.total)}</span>
                                </div>
                                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-accent rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ====== GRAFICAS TAB ====== */}
              {activeTab === "graficas" && (
                <GraficasReportes
                  ventasPorMes={ventasMensuales}
                  gastosPorMes={gastosMensuales}
                  membresiasPorMes={membresiasMensuales}
                  gastosPorCategoria={gastosPorCategoria}
                  membresiasPorPlan={membresiasPorPlan}
                  tipoReporte={tipoReporte}
                />
              )}

              {/* ====== COMPARACIONES TAB ====== */}
              {activeTab === "comparaciones" && (
                <div className="space-y-5">
                  <Comparaciones
                    items={[
                      { label: "Ventas Totales", actual: totalVentas, anterior: totalVentasAnt },
                      { label: "Gastos Totales", actual: totalGastos, anterior: totalGastosAnt },
                      { label: "Utilidad Neta", actual: totalUtilidad, anterior: totalUtilidadAnt },
                      { label: "Ingresos Membresias", actual: totalMembresias, anterior: totalMembresiasAnt },
                    ]}
                    labelActual={dateRange.label}
                    labelAnterior={dateRange.labelAnterior}
                    comparacionesPeriodos={comparacionesPeriodos}
                  />

                  <InsightsReportes
                    ventas={totalVentas}
                    ventasAnterior={totalVentasAnt}
                    gastos={totalGastos}
                    gastosAnterior={totalGastosAnt}
                    utilidad={totalUtilidad}
                    utilidadAnterior={totalUtilidadAnt}
                    membresias={totalMembresias}
                    membresiasAnterior={totalMembresiasAnt}
                    socios={sociosActivos}
                    topGasto={topGasto?.categoria || "N/A"}
                    topGastoMonto={topGasto?.total || 0}
                    topPlan={topPlan?.plan || "N/A"}
                    topPlanSocios={topPlan?.cantidad || 0}
                    periodo={periodo}
                  />
                </div>
              )}

              {/* ====== HISTORIAL TAB ====== */}
              {activeTab === "historial" && (
                <HistorialReportes
                  reportes={reportesHistorial}
                  onDescargar={handleDescargarReporte}
                  onEliminar={handleEliminarReporte}
                />
              )}
            </div>
          </div>

          {/* Summary footer */}
          <div
            className="bg-card rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
          >
            <div className="flex items-center gap-6 text-xs flex-wrap">
              <span className="text-muted-foreground">
                Periodo: <span className="text-foreground font-medium">{dateRange.label}</span>
              </span>
              <span className="text-muted-foreground">
                Rango: <span className="text-foreground font-medium">{dateRange.inicio}</span> a{" "}
                <span className="text-foreground font-medium">{dateRange.fin}</span>
              </span>
              <span className="text-muted-foreground">
                Ingresos:{" "}
                <span className="text-accent font-bold">
                  {formatCurrency(totalVentas + totalMembresias)}
                </span>
              </span>
              <span className="text-muted-foreground">
                Utilidad:{" "}
                <span className={`font-bold ${totalUtilidad >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(totalUtilidad)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Generate Report Modal */}
      <GenerarReporteModal
        open={modalGenerar}
        onClose={() => setModalGenerar(false)}
        onGenerar={handleGenerarReporte}
      />
    </div>
  )
}

// ======= Summary Card Sub-component =======

function SummaryCard({
  title,
  total,
  anterior,
  count,
  countLabel,
  color,
  invertChange,
  extra,
  labelAnterior,
}: {
  title: string
  total: number
  anterior: number
  count: number | null
  countLabel: string
  color: string
  invertChange?: boolean
  extra?: string
  labelAnterior: string
}) {
  const cambio = calcCambio(total, anterior)
  const isPositive = invertChange ? cambio <= 0 : cambio >= 0

  const colorClasses: Record<string, string> = {
    success: "border-success/30",
    primary: "border-primary/30",
    accent: "border-accent/30",
    destructive: "border-destructive/30",
  }

  const titleColors: Record<string, string> = {
    success: "text-success",
    primary: "text-primary",
    accent: "text-accent",
    destructive: "text-destructive",
  }

  return (
    <div
      className={`bg-card rounded-xl p-5 border-l-4 ${colorClasses[color] || "border-border"}`}
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${titleColors[color] || "text-foreground"}`}>
        {title}
      </p>
      <p className="text-2xl font-bold text-foreground mb-1">{formatCurrency(total)}</p>

      <div className="flex items-center justify-between">
        <div>
          {count !== null && (
            <p className="text-xs text-muted-foreground">{count} {countLabel}</p>
          )}
          {extra && <p className="text-xs text-muted-foreground">{extra}</p>}
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-semibold ${
            isPositive ? "text-success" : "text-destructive"
          }`}
        >
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {cambio >= 0 ? "+" : ""}{cambio.toFixed(1)}%
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mt-1">
        vs {labelAnterior}: {formatCurrency(anterior)}
      </p>
    </div>
  )
}
