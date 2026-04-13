"use client"

import { useEffect, useState } from "react"
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

const KPI_VISIBILITY_STORAGE_KEY = "hexodus:ventas:kpis-visible"

export function KpiCards({ data }: { data: KpiData }) {
  const [kpisVisibles, setKpisVisibles] = useState(false)

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(KPI_VISIBILITY_STORAGE_KEY)
      if (storedValue !== null) {
        setKpisVisibles(storedValue === "true")
      }
    } catch (error) {
      console.error("Error al leer la visibilidad de KPIs:", error)
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(KPI_VISIBILITY_STORAGE_KEY, String(kpisVisibles))
    } catch (error) {
      console.error("Error al guardar la visibilidad de KPIs:", error)
    }
  }, [kpisVisibles])

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
    <section
      className="bg-card rounded-xl border border-border p-3 shadow-sm"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">KPIs de ventas</h2>
          <p className="text-xs text-muted-foreground">
            Controla si los indicadores se muestran o se ocultan en pantalla.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Visibilidad
          </span>
          <select
            value={kpisVisibles ? "mostrar" : "ocultar"}
            onChange={(e) => setKpisVisibles(e.target.value === "mostrar")}
            className="min-w-[160px] pl-3 pr-8 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:16px] bg-[right_0.5rem_center] bg-no-repeat"
            aria-label="Visibilidad de KPIs de ventas"
          >
            <option value="mostrar">Mostrar KPIs</option>
            <option value="ocultar">Ocultar KPIs</option>
          </select>
        </div>
      </div>

      {kpisVisibles ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-card rounded-xl p-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg"
              style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
            >
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
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
          Los KPIs de ventas están ocultos. Cambia la visibilidad para mostrarlos cuando lo necesites.
        </div>
      )}
    </section>
  )
}
