"use client"

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
  Users,
} from "lucide-react"
import { formatCurrency, calcCambio } from "@/lib/reportes-data"

interface KpiReportesProps {
  ventas: number
  ventasAnterior: number
  gastos: number
  gastosAnterior: number
  utilidad: number
  utilidadAnterior: number
  membresias: number
  membresiasAnterior: number
  socios: number
  labelAnterior: string
}

export function KpiReportes({
  ventas,
  ventasAnterior,
  gastos,
  gastosAnterior,
  utilidad,
  utilidadAnterior,
  membresias,
  membresiasAnterior,
  socios,
  labelAnterior,
}: KpiReportesProps) {
  const cambioVentas = calcCambio(ventas, ventasAnterior)
  const cambioGastos = calcCambio(gastos, gastosAnterior)
  const cambioUtilidad = calcCambio(utilidad, utilidadAnterior)
  const cambioMembresias = calcCambio(membresias, membresiasAnterior)

  const kpis = [
    {
      label: "Ingresos Totales",
      value: formatCurrency(ventas),
      icon: DollarSign,
      color: "accent" as const,
      change: cambioVentas,
    },
    {
      label: "Gastos Totales",
      value: formatCurrency(gastos),
      icon: Receipt,
      color: "primary" as const,
      change: cambioGastos,
      invertChange: true,
    },
    {
      label: "Utilidad Neta",
      value: formatCurrency(utilidad),
      icon: Wallet,
      color: utilidad >= 0 ? ("accent" as const) : ("primary" as const),
      change: cambioUtilidad,
    },
    {
      label: "Membresias",
      value: formatCurrency(membresias),
      icon: Users,
      color: "accent" as const,
      change: cambioMembresias,
      extra: `${socios} socios activos`,
    },
  ]

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        // For gastos, lower is better so invert color logic
        const changePositive = kpi.invertChange
          ? kpi.change <= 0
          : kpi.change >= 0

        return (
          <div
            key={kpi.label}
            className="bg-card rounded-xl p-5 relative overflow-hidden group transition-all duration-300 hover:shadow-lg"
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

            <span
              className={`text-xs flex items-center gap-1 ${
                changePositive ? "text-success" : "text-destructive"
              }`}
            >
              {changePositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {kpi.change >= 0 ? "+" : ""}{kpi.change.toFixed(1)}% vs {labelAnterior}
            </span>

            {kpi.extra && (
              <span className="text-xs text-muted-foreground block mt-0.5">{kpi.extra}</span>
            )}
          </div>
        )
      })}
    </section>
  )
}
