"use client"

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
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  BarChart3,
  PieChart as PieChartIcon,
  Lightbulb,
  ArrowUpRight,
  Loader2,
} from "lucide-react"
import type { AnalisisVentasData } from "@/lib/types/ventas"
import { formatCurrency } from "@/lib/types/ventas"

interface VentasAnalyticsProps {
  analisisData: AnalisisVentasData
  periodoLabel: string
  loading?: boolean
}

const PIE_COLORS = ["#4BB543", "#00BFFF", "#A855F7", "#FFD700"]

export function VentasAnalytics({
  analisisData,
  periodoLabel,
  loading = false,
}: VentasAnalyticsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Cargando análisis de ventas...</p>
        </div>
      </div>
    )
  }

  const { comparacionActual, tendenciaVentas, topProductos, metodosPago, insights } = analisisData
  const variacionPorcentaje = comparacionActual.variacion_porcentaje

  return (
    <div className="space-y-5">
      {/* Comparison Card */}
      <div
        className="bg-card rounded-xl p-5 relative overflow-hidden"
        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent glow-accent" />
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpRight className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold text-accent uppercase tracking-wider">
            Comparacion {periodoLabel}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Periodo Actual</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(comparacionActual.actual.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              {comparacionActual.actual.transacciones} transacciones
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Periodo Anterior</p>
            <p className="text-xl font-bold text-muted-foreground">
              {formatCurrency(comparacionActual.anterior.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              {comparacionActual.anterior.transacciones} transacciones
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border">
          <div
            className={`flex items-center gap-1.5 text-sm font-semibold ${
              variacionPorcentaje >= 0 ? "text-success" : "text-destructive"
            }`}
          >
            {variacionPorcentaje >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {variacionPorcentaje >= 0 ? "+" : ""}
            {variacionPorcentaje.toFixed(1)}% vs periodo anterior
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div
        className="bg-card rounded-xl p-5"
        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Tendencia de Ventas</h3>
        </div>

        {tendenciaVentas.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            Sin datos para este periodo
          </p>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tendenciaVentas}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00BFFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00BFFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" />
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: "#A0A0A0", fontSize: 10 }}
                  tickFormatter={(val) => val.slice(5)}
                  stroke="#2A2A30"
                />
                <YAxis
                  tick={{ fill: "#A0A0A0", fontSize: 10 }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  stroke="#2A2A30"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1C1C20",
                    border: "1px solid #2A2A30",
                    borderRadius: "8px",
                    color: "#E0E0E0",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Ventas"]}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#00BFFF"
                  fillOpacity={1}
                  fill="url(#colorVentas)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Productos */}
      <div
        className="bg-card rounded-xl p-5"
        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">Top Productos</h3>
        </div>

        {topProductos.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Sin datos para este periodo
          </p>
        ) : (
          <>
            <div className="h-40 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#A0A0A0", fontSize: 10 }} stroke="#2A2A30" />
                  <YAxis
                    dataKey="nombre"
                    type="category"
                    width={100}
                    tick={{ fill: "#A0A0A0", fontSize: 9 }}
                    stroke="#2A2A30"
                  />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: "#1C1C20",
                      border: "1px solid #2A2A30",
                      borderRadius: "8px",
                      color: "#E0E0E0",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "cantidad_vendida") return [value, "Unidades"]
                      return [formatCurrency(value), "Ingresos"]
                    }}
                  />
                  <Bar dataKey="cantidad_vendida" fill="#FF3B3B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Ranking list */}
            <div className="space-y-2">
              {topProductos.map((p, i) => (
                <div key={p.nombre} className="flex items-center gap-2">
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i === 0
                        ? "bg-warning/20 text-warning"
                        : i === 1
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-xs text-foreground truncate">{p.nombre}</span>
                  <span className="text-xs font-medium text-primary">
                    {formatCurrency(p.ingreso_generado)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Payment Methods */}
      <div
        className="bg-card rounded-xl p-5"
        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Metodos de Pago</h3>
        </div>

        {metodosPago.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Sin datos</p>
        ) : (
          <>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metodosPago.map((m) => ({
                      name: m.nombre,
                      value: m.monto_total,
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={35}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {metodosPago.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#00BFFF",
                      border: "2px solid #34495E",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fill: "#FFFFFF",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Total"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 mt-2">
              {metodosPago.map((m, i) => (
                <div key={m.nombre} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="flex-1 text-xs text-foreground">{m.nombre}</span>
                  <span className="text-xs text-muted-foreground">{m.transacciones} txns</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Insights */}
      <div
        className="bg-card rounded-xl p-5"
        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">Insights de Ventas</h3>
        </div>

        <div className="space-y-2.5">
          {insights.map((msg, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <div className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
              <span className="text-muted-foreground leading-relaxed">{msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}