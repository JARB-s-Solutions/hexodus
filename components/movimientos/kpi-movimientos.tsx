"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, DollarSign, Activity, ArrowUp, ArrowDown } from "lucide-react"
import type { MovimientoKpis } from "@/lib/types/movimientos"

interface KpiMovimientosProps {
  kpis: MovimientoKpis
}

const KPI_VISIBILITY_STORAGE_KEY = "hexodus:movimientos:kpis-visible"

function fmtMoney(n: number): string {
  const abs = Math.abs(n)
  const fixed = abs.toFixed(2)
  const [intPart, decPart] = fixed.split(".")
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `$${formatted}.${decPart}`
}

function ChangeIndicator({ value }: { value?: number }) {
  if (value === undefined || value === null) return null
  const isPositive = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        isPositive ? "text-success" : "text-destructive"
      }`}
    >
      {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

export function KpiMovimientos({ kpis }: KpiMovimientosProps) {
  const [kpisVisibles, setKpisVisibles] = useState(false)

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(KPI_VISIBILITY_STORAGE_KEY)
      if (storedValue !== null) {
        setKpisVisibles(storedValue === "true")
      }
    } catch (error) {
      console.error("Error al leer la visibilidad de KPIs de movimientos:", error)
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(KPI_VISIBILITY_STORAGE_KEY, String(kpisVisibles))
    } catch (error) {
      console.error("Error al guardar la visibilidad de KPIs de movimientos:", error)
    }
  }, [kpisVisibles])

  const cards = [
    {
      label: "Total Ingresos",
      value: fmtMoney(kpis.totalIngresos),
      change: kpis.cambioIngresos,
      icon: TrendingUp,
      iconBg: "bg-success/10",
      iconColor: "text-success",
      borderColor: "border-success/20",
    },
    {
      label: "Total Egresos",
      value: fmtMoney(kpis.totalEgresos),
      change: kpis.cambioEgresos,
      icon: TrendingDown,
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      borderColor: "border-destructive/20",
    },
    {
      label: "Balance Neto",
      value: (kpis.balanceNeto < 0 ? "-" : "") + fmtMoney(kpis.balanceNeto),
      change: kpis.cambioBalance,
      icon: DollarSign,
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
      borderColor: "border-accent/20",
    },
    {
      label: "Total Movimientos",
      value: String(kpis.totalMovimientos),
      icon: Activity,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      borderColor: "border-warning/20",
    },
  ]

  return (
    <section
      className="bg-card rounded-xl border border-border p-3 shadow-sm"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">KPIs de movimientos</h2>
          <p className="text-xs text-muted-foreground">
            Controla si los indicadores financieros se muestran o se ocultan en pantalla.
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
            aria-label="Visibilidad de KPIs de movimientos"
          >
            <option value="mostrar">Mostrar KPIs</option>
            <option value="ocultar">Ocultar KPIs</option>
          </select>
        </div>
      </div>

      {kpisVisibles ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`bg-card rounded-xl p-4 md:p-5 border ${card.borderColor} transition-all duration-300 hover:-translate-y-0.5`}
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                {card.change !== undefined && <ChangeIndicator value={card.change} />}
              </div>
              <p className="text-xl md:text-2xl font-bold text-foreground mb-0.5">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
          Los KPIs de movimientos están ocultos. Cambia la visibilidad para mostrarlos cuando lo necesites.
        </div>
      )}
    </section>
  )
}
