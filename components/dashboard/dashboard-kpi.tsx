"use client"

import { DollarSign, Receipt, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { formatoMoneda, calcPct } from "@/lib/dashboard-data"
import type { DatosFinancieros } from "@/lib/dashboard-data"

interface DashboardKpiProps {
  datos: DatosFinancieros
  loading?: boolean
  error?: string | null
}

function TrendBadge({ pct, contexto }: { pct: number; contexto: string }) {
  let bgClass: string
  let textClass: string
  let Icon: typeof ArrowUpRight
  let sign: string

  if (pct === 0) {
    bgClass = "bg-warning/15"
    textClass = "text-warning"
    Icon = Minus
    sign = ""
  } else if (pct > 0) {
    bgClass = "bg-success/15"
    textClass = "text-success"
    Icon = ArrowUpRight
    sign = "+"
  } else {
    bgClass = "bg-primary/15"
    textClass = "text-primary"
    Icon = ArrowDownRight
    sign = ""
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${bgClass} ${textClass}`}>
        <Icon className="h-3 w-3" />
        {sign}{pct}%
      </span>
      <span className="text-xs text-muted-foreground">{contexto}</span>
    </div>
  )
}

export function DashboardKpi({ datos, loading = false, error = null }: DashboardKpiProps) {
  const utilidad = datos.ventas - datos.gastos
  const utilidadAnt = datos.ventasAnt - datos.gastosAnt
  const pctVentas = calcPct(datos.ventas, datos.ventasAnt)
  const pctGastos = calcPct(datos.gastos, datos.gastosAnt)
  const pctUtilidad = calcPct(utilidad, utilidadAnt)

  const cards = [
    {
      label: "VENTAS",
      valor: formatoMoneda(datos.ventas),
      pct: pctVentas,
      icon: DollarSign,
      colorClass: "text-accent",
      iconBg: "bg-accent/10 text-accent",
      accent: false,
    },
    {
      label: "GASTOS",
      valor: formatoMoneda(datos.gastos),
      pct: pctGastos,
      icon: Receipt,
      colorClass: "text-primary",
      iconBg: "bg-primary/10 text-primary",
      accent: false,
    },
    {
      label: "UTILIDAD",
      valor: formatoMoneda(utilidad),
      pct: pctUtilidad,
      icon: TrendingUp,
      colorClass: utilidad >= 0 ? "text-success" : "text-primary",
      iconBg: "bg-success/10 text-success",
      accent: false,
    },
    {
      label: "SALDO NETO",
      valor: formatoMoneda(utilidad),
      pct: pctUtilidad,
      icon: Wallet,
      colorClass: "text-accent",
      iconBg: "bg-accent/10 text-accent",
      accent: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`relative bg-card rounded-xl p-5 border transition-colors hover:border-foreground/10 animate-fade-in-up ${
            card.accent ? "border-accent/15 hover:border-accent/30" : "border-border"
          }`}
          style={{ animationDelay: `${i * 30}ms` }}
        >
          {loading && (
            <div className="absolute inset-0 rounded-xl bg-background/45 backdrop-blur-[1px]" />
          )}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {card.label}
            </span>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
              <card.icon className="h-4 w-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold mb-1.5 ${card.colorClass}`}>{card.valor}</p>
          <TrendBadge pct={card.pct} contexto="vs anterior" />
          {error && i === 0 && (
            <p className="text-[11px] text-primary mt-2 truncate" title={error}>
              Error al actualizar KPIs
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
