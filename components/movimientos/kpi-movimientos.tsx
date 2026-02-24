"use client"

import { TrendingUp, TrendingDown, DollarSign, Activity, ArrowUp, ArrowDown } from "lucide-react"
import type { MovimientoKpis } from "@/lib/movimientos-data"

interface KpiMovimientosProps {
  kpis: MovimientoKpis
}

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
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
    </section>
  )
}
