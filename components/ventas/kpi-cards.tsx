"use client"

import { DollarSign, CreditCard, Package, CalendarDays, TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency } from "@/lib/ventas-data"

interface KpiData {
  ventasHoy: number
  ventasAyer: number
  transaccionesHoy: number
  promedioTransaccion: number
  productosVendidosHoy: number
  productosVendidosAyer: number
  ventasMes: number
  metaMes: number
}

export function KpiCards({ data }: { data: KpiData }) {
  const cambioVentas = data.ventasAyer > 0
    ? ((data.ventasHoy - data.ventasAyer) / data.ventasAyer) * 100
    : 0
  const cambioProductos = data.productosVendidosAyer > 0
    ? ((data.productosVendidosHoy - data.productosVendidosAyer) / data.productosVendidosAyer) * 100
    : 0
  const porcentajeMeta = data.metaMes > 0 ? (data.ventasMes / data.metaMes) * 100 : 0

  const kpis = [
    {
      label: "Ventas del Dia",
      value: formatCurrency(data.ventasHoy),
      icon: DollarSign,
      color: "accent" as const,
      change: cambioVentas,
      changeLabel: "vs ayer",
    },
    {
      label: "Transacciones",
      value: data.transaccionesHoy.toString(),
      icon: CreditCard,
      color: "primary" as const,
      subtitle: `Promedio: ${formatCurrency(data.promedioTransaccion)}`,
    },
    {
      label: "Productos Vendidos",
      value: data.productosVendidosHoy.toString(),
      icon: Package,
      color: "accent" as const,
      change: cambioProductos,
      changeLabel: "vs ayer",
    },
    {
      label: "Ventas del Mes",
      value: formatCurrency(data.ventasMes),
      icon: CalendarDays,
      color: "primary" as const,
      subtitle: `Meta: ${porcentajeMeta.toFixed(0)}% alcanzada`,
      isWarning: porcentajeMeta < 100,
    },
  ]

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-card rounded-xl p-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg"
          style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
        >
          {/* Top accent bar on hover */}
          <div
            className={`absolute top-0 left-0 right-0 h-[3px] transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ${
              kpi.color === "accent" ? "bg-accent glow-accent" : "bg-primary glow-primary"
            }`}
          />

          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                kpi.color === "accent" ? "text-accent" : "text-primary"
              }`}
            >
              {kpi.label}
            </span>
            <kpi.icon
              className={`h-5 w-5 ${kpi.color === "accent" ? "text-accent" : "text-primary"}`}
              style={{
                filter: kpi.color === "accent"
                  ? "drop-shadow(0 0 4px rgba(0,191,255,0.5))"
                  : "drop-shadow(0 0 4px rgba(255,59,59,0.5))",
              }}
            />
          </div>

          <p className="text-2xl lg:text-3xl font-bold text-foreground mb-1">{kpi.value}</p>

          {kpi.change !== undefined && (
            <span
              className={`text-xs flex items-center gap-1 ${
                kpi.change >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {kpi.change >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {kpi.change >= 0 ? "+" : ""}
              {kpi.change.toFixed(0)}% {kpi.changeLabel}
            </span>
          )}

          {kpi.subtitle && (
            <span className={`text-xs ${kpi.isWarning ? "text-warning" : "text-muted-foreground"}`}>
              {kpi.subtitle}
            </span>
          )}
        </div>
      ))}
    </section>
  )
}
