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
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  BarChart3,
  PieChart as PieChartIcon,
  Lightbulb,
  ArrowUpRight,
} from "lucide-react"
import type { Venta } from "@/lib/ventas-data"
import {
  formatCurrency,
  getTotalVentas,
  getProductosMasVendidos,
  getVentasPorDia,
  getVentasPorMetodo,
  getMetodoPagoLabel,
} from "@/lib/ventas-data"

interface VentasAnalyticsProps {
  ventasActuales: Venta[]
  ventasPeriodoAnterior: Venta[]
  periodoLabel: string
}

const PIE_COLORS = ["#4BB543", "#00BFFF", "#A855F7", "#FFD700"]

export function VentasAnalytics({
  ventasActuales,
  ventasPeriodoAnterior,
  periodoLabel,
}: VentasAnalyticsProps) {
  const totalActual = getTotalVentas(ventasActuales)
  const totalAnterior = getTotalVentas(ventasPeriodoAnterior)
  const cambio = totalAnterior > 0 ? ((totalActual - totalAnterior) / totalAnterior) * 100 : 0

  const topProductos = useMemo(() => getProductosMasVendidos(ventasActuales).slice(0, 5), [ventasActuales])
  const ventasPorDia = useMemo(() => getVentasPorDia(ventasActuales).slice(-14), [ventasActuales])
  const ventasPorMetodo = useMemo(() => getVentasPorMetodo(ventasActuales), [ventasActuales])

  // Insights generation
  const insights = useMemo(() => {
    const msgs: string[] = []
    if (cambio > 0) {
      msgs.push(`Vendiste ${cambio.toFixed(0)}% mas que el periodo anterior. Excelente tendencia.`)
    } else if (cambio < 0) {
      msgs.push(`Las ventas bajaron ${Math.abs(cambio).toFixed(0)}% respecto al periodo anterior.`)
    }
    if (topProductos.length > 0) {
      msgs.push(`El producto mas vendido es "${topProductos[0].nombre}" con ${topProductos[0].cantidad} unidades.`)
    }
    if (ventasPorMetodo.length > 0) {
      msgs.push(`El metodo de pago mas usado es ${getMetodoPagoLabel(ventasPorMetodo[0].metodo)} con ${ventasPorMetodo[0].cantidad} transacciones.`)
    }
    const promedioVenta = ventasActuales.length > 0 ? totalActual / ventasActuales.length : 0
    msgs.push(`Ticket promedio: ${formatCurrency(promedioVenta)}.`)
    return msgs
  }, [cambio, topProductos, ventasPorMetodo, ventasActuales, totalActual])

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
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalActual)}</p>
            <p className="text-xs text-muted-foreground">{ventasActuales.length} transacciones</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Periodo Anterior</p>
            <p className="text-xl font-bold text-muted-foreground">{formatCurrency(totalAnterior)}</p>
            <p className="text-xs text-muted-foreground">{ventasPeriodoAnterior.length} transacciones</p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border">
          <div
            className={`flex items-center gap-1.5 text-sm font-semibold ${
              cambio >= 0 ? "text-success" : "text-destructive"
            }`}
          >
            {cambio >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {cambio >= 0 ? "+" : ""}{cambio.toFixed(1)}% vs periodo anterior
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

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ventasPorDia}>
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
      </div>

      {/* Top Products */}
      <div
        className="bg-card rounded-xl p-5"
        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">Top Productos</h3>
        </div>

        {topProductos.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Sin datos para este periodo</p>
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
                    contentStyle={{
                      backgroundColor: "#1C1C20",
                      border: "1px solid #2A2A30",
                      borderRadius: "8px",
                      color: "#E0E0E0",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "cantidad") return [value, "Unidades"]
                      return [formatCurrency(value), "Ingresos"]
                    }}
                  />
                  <Bar dataKey="cantidad" fill="#FF3B3B" radius={[0, 4, 4, 0]} />
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
                  <span className="text-xs font-medium text-primary">{formatCurrency(p.ingresos)}</span>
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

        {ventasPorMetodo.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Sin datos</p>
        ) : (
          <>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ventasPorMetodo.map((m) => ({
                      name: getMetodoPagoLabel(m.metodo),
                      value: m.total,
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={35}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {ventasPorMetodo.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1C1C20",
                      border: "1px solid #2A2A30",
                      borderRadius: "8px",
                      color: "#E0E0E0",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Total"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 mt-2">
              {ventasPorMetodo.map((m, i) => (
                <div key={m.metodo} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="flex-1 text-xs text-foreground">{getMetodoPagoLabel(m.metodo)}</span>
                  <span className="text-xs text-muted-foreground">{m.cantidad} txns</span>
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
