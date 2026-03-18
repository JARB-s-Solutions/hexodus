"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
  LineChart,
  Line,
} from "recharts"
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Layers,
} from "lucide-react"
import { formatCurrency } from "@/lib/reportes-data"

const PIE_COLORS = ["#FF3B3B", "#00BFFF", "#4BB543", "#FFD700", "#A855F7", "#FF6B35", "#00D4AA", "#FF69B4"]

const tooltipStyle = {
  backgroundColor: "#1C1C20",
  border: "1px solid #2A2A30",
  borderRadius: "8px",
  color: "#E0E0E0",
  fontSize: "12px",
}

interface GraficasReportesProps {
  ventasPorMes: { mes: string; total: number }[]
  gastosPorMes: { mes: string; total: number }[]
  membresiasPorMes: { mes: string; total: number }[]
  gastosPorCategoria: { categoria: string; total: number }[]
  membresiasPorPlan: { plan: string; cantidad: number; total: number }[]
  tipoReporte: string
}

/**
 * Formatea fechas del backend (YYYY-MM-DD o YYYY-MM) a formato legible
 */
function formatMonth(fecha: string): string {
  const parts = fecha.split("-")
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  
  if (parts.length === 3) {
    // Formato completo: YYYY-MM-DD
    const [year, month, day] = parts
    const monthName = months[parseInt(month, 10) - 1]
    return `${parseInt(day, 10)} ${monthName}`
  } else if (parts.length === 2) {
    // Formato mensual: YYYY-MM
    const [year, month] = parts
    const monthName = months[parseInt(month, 10) - 1]
    return `${monthName} ${year.slice(2)}`
  }
  
  return fecha
}

export function GraficasReportes({
  ventasPorMes,
  gastosPorMes,
  membresiasPorMes,
  gastosPorCategoria,
  membresiasPorPlan,
  tipoReporte,
}: GraficasReportesProps) {
  // Merge monthly data for the trend chart
  const trendData = useMemo(() => {
    const allMonths = new Set<string>()
    ventasPorMes.forEach((v) => allMonths.add(v.mes))
    gastosPorMes.forEach((g) => allMonths.add(g.mes))
    membresiasPorMes.forEach((m) => allMonths.add(m.mes))

    return Array.from(allMonths)
      .sort()
      .map((mes) => ({
        mes: formatMonth(mes),
        ventas: ventasPorMes.find((v) => v.mes === mes)?.total || 0,
        gastos: gastosPorMes.find((g) => g.mes === mes)?.total || 0,
        membresias: membresiasPorMes.find((m) => m.mes === mes)?.total || 0,
      }))
      .map((d) => ({
        ...d,
        utilidad: d.ventas + d.membresias - d.gastos,
      }))
  }, [ventasPorMes, gastosPorMes, membresiasPorMes])

  const showVentas = tipoReporte === "todos" || tipoReporte === "ventas" || tipoReporte === "utilidad"
  const showGastos = tipoReporte === "todos" || tipoReporte === "gastos" || tipoReporte === "utilidad"
  const showMembresias = tipoReporte === "todos" || tipoReporte === "membresias"
  const showUtilidad = tipoReporte === "todos" || tipoReporte === "utilidad"

  return (
    <div className="space-y-5">
      {/* Main Trend Chart - Ingresos vs Gastos vs Utilidad */}
      <div
        className="bg-card rounded-xl p-5"
        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Tendencia Financiera</h3>
        </div>

        {trendData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Sin datos para este periodo</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4BB543" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4BB543" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF3B3B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF3B3B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradUtilidad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00BFFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00BFFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" />
                <XAxis dataKey="mes" tick={{ fill: "#A0A0A0", fontSize: 11 }} stroke="#2A2A30" />
                <YAxis
                  tick={{ fill: "#A0A0A0", fontSize: 10 }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  stroke="#2A2A30"
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === "ventas"
                      ? "Ventas"
                      : name === "gastos"
                      ? "Gastos"
                      : name === "utilidad"
                      ? "Utilidad"
                      : "Membresias",
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", color: "#A0A0A0" }}
                  formatter={(value) =>
                    value === "ventas"
                      ? "Ventas"
                      : value === "gastos"
                      ? "Gastos"
                      : value === "utilidad"
                      ? "Utilidad"
                      : "Membresias"
                  }
                />
                {showVentas && (
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    stroke="#4BB543"
                    fill="url(#gradVentas)"
                    strokeWidth={2}
                  />
                )}
                {showGastos && (
                  <Area
                    type="monotone"
                    dataKey="gastos"
                    stroke="#FF3B3B"
                    fill="url(#gradGastos)"
                    strokeWidth={2}
                  />
                )}
                {showUtilidad && (
                  <Area
                    type="monotone"
                    dataKey="utilidad"
                    stroke="#00BFFF"
                    fill="url(#gradUtilidad)"
                    strokeWidth={2}
                  />
                )}
                {showMembresias && (
                  <Area
                    type="monotone"
                    dataKey="membresias"
                    stroke="#FFD700"
                    fill="none"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Two-column: Gastos by category + Membresias by plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gastos by category - Pie */}
        {(tipoReporte === "todos" || tipoReporte === "gastos" || tipoReporte === "utilidad") && (
          <div
            className="bg-card rounded-xl p-5"
            style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Gastos por Categoria</h3>
            </div>

            {gastosPorCategoria.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Sin datos</p>
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gastosPorCategoria.slice(0, 6).map((g) => ({
                          name: g.categoria,
                          value: g.total,
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {gastosPorCategoria.slice(0, 6).map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [formatCurrency(value), "Total"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 mt-2">
                  {gastosPorCategoria.slice(0, 6).map((g, i) => (
                    <div key={g.categoria} className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="flex-1 text-xs text-foreground truncate">{g.categoria}</span>
                      <span className="text-xs text-muted-foreground">{formatCurrency(g.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Membresias by plan - Bar */}
        {(tipoReporte === "todos" || tipoReporte === "membresias") && (
          <div
            className="bg-card rounded-xl p-5"
            style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Membresias por Plan</h3>
            </div>

            {membresiasPorPlan.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Sin datos</p>
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={membresiasPorPlan}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" />
                      <XAxis
                        dataKey="plan"
                        tick={{ fill: "#A0A0A0", fontSize: 9 }}
                        stroke="#2A2A30"
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis tick={{ fill: "#A0A0A0", fontSize: 10 }} stroke="#2A2A30" />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number, name: string) => {
                          if (name === "cantidad") return [value, "Suscripciones"]
                          return [formatCurrency(value), "Ingresos"]
                        }}
                      />
                      <Bar dataKey="cantidad" fill="#00BFFF" radius={[4, 4, 0, 0]} name="cantidad" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-3">
                  {membresiasPorPlan.map((mp) => (
                    <div key={mp.plan} className="flex items-center justify-between text-xs">
                      <span className="text-foreground truncate flex-1">{mp.plan}</span>
                      <span className="text-muted-foreground mx-2">{mp.cantidad} socios</span>
                      <span className="text-accent font-medium">{formatCurrency(mp.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Monthly comparison bar chart - Ventas vs Gastos side by side */}
      {(tipoReporte === "todos" || tipoReporte === "utilidad") && trendData.length > 0 && (
        <div
          className="bg-card rounded-xl p-5"
          style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-warning" />
            <h3 className="text-sm font-semibold text-foreground">Ventas vs Gastos por Mes</h3>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" />
                <XAxis dataKey="mes" tick={{ fill: "#A0A0A0", fontSize: 11 }} stroke="#2A2A30" />
                <YAxis
                  tick={{ fill: "#A0A0A0", fontSize: 10 }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  stroke="#2A2A30"
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === "ventas" ? "Ventas" : "Gastos",
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px" }}
                  formatter={(value) => (value === "ventas" ? "Ventas" : "Gastos")}
                />
                <Bar dataKey="ventas" fill="#4BB543" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" fill="#FF3B3B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
