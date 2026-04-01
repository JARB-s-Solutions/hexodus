"use client"

import {
  ArrowUpRight,
  ArrowDownRight,
  Equal,
  Calendar,
} from "lucide-react"
import { formatCurrency, calcCambio } from "@/lib/reportes-data"

interface ComparacionItem {
  label: string
  actual: number
  anterior: number
}

interface ComparacionesProps {
  items: ComparacionItem[]
  labelActual: string
  labelAnterior: string
  periodoActivo?: string
  onPeriodoActivoChange?: (periodo: string) => void
}

export function Comparaciones({
  items,
  labelActual,
  labelAnterior,
  periodoActivo = "dia",
  onPeriodoActivoChange,
}: ComparacionesProps) {
  const periodoTabs = [
    { tipo: "dia", label: "Hoy" },
    { tipo: "semana", label: "Esta Semana" },
    { tipo: "mes", label: "Este Mes" },
    { tipo: "trimestre", label: "Este Trimestre" },
    { tipo: "semestre", label: "Este Semestre" },
    { tipo: "anual", label: "Este Año" },
    { tipo: "personalizado", label: "Personalizado" },
  ]

  return (
    <div
      className="bg-card rounded-xl p-5 relative overflow-hidden"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.75 bg-accent glow-accent" />

      <div className="flex items-center gap-2 mb-4">
        <ArrowUpRight className="h-5 w-5 text-accent" />
        <h3 className="text-sm font-semibold text-accent uppercase tracking-wider">
          Comparaciones
        </h3>
      </div>

      {/* Period selector tabs */}
      {periodoTabs.length > 1 && (
        <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-1" />
          {periodoTabs.map((tab) => (
            <button
              key={tab.tipo}
              onClick={() => onPeriodoActivoChange?.(tab.tipo)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                periodoActivo === tab.tipo
                  ? "bg-accent/20 text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-background"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Header showing period label */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="text-xs text-muted-foreground">
          {labelActual} vs {labelAnterior}
        </span>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const cambio = calcCambio(item.actual, item.anterior)
          const isPositive = item.label === "Gastos Totales" ? cambio <= 0 : cambio >= 0
          const diferencia = item.actual - item.anterior
          const esExtremo = Math.abs(cambio) > 200
          const cambioCappeado = Math.min(Math.abs(cambio), 300)

          return (
            <div key={item.label} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  {esExtremo && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-500 uppercase tracking-widest">
                      Cambio Extremo
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    {cambio === 0 ? (
                      <Equal className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : isPositive ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span
                      className={`text-sm font-bold ${
                        cambio === 0
                          ? "text-muted-foreground"
                          : isPositive
                          ? "text-success"
                          : "text-destructive"
                      }`}
                      title={`${cambio >= 0 ? "+" : ""}${cambio.toFixed(1)}%`}
                    >
                      {esExtremo ? (cambio >= 0 ? "+" : "") + cambioCappeado.toFixed(0) + "%+" : (cambio >= 0 ? "+" : "") + cambio.toFixed(1) + "%"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{labelActual}</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(item.actual)}</p>
                </div>
                <div className="bg-background rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{labelAnterior}</p>
                  <p className="text-lg font-bold text-muted-foreground">{formatCurrency(item.anterior)}</p>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Diferencia:</span>
                <span
                  className={`font-semibold ${
                    item.label === "Gastos Totales"
                      ? diferencia <= 0 ? "text-success" : "text-destructive"
                      : diferencia >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {diferencia >= 0 ? "+" : ""}{formatCurrency(diferencia)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPositive ? "bg-success" : "bg-destructive"
                  }`}
                  style={{ width: `${(cambioCappeado / 300) * 100}%` }}
                  title={`${cambio >= 0 ? "+" : ""}${cambio.toFixed(1)}%`}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary indicator */}
      <div className="mt-5 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Indicadores Positivos</p>
            <p className="text-lg font-bold text-success">
              {items.filter((item) => {
                const c = calcCambio(item.actual, item.anterior)
                return item.label === "Gastos Totales" ? c <= 0 : c >= 0
              }).length}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Indicadores Negativos</p>
            <p className="text-lg font-bold text-destructive">
              {items.filter((item) => {
                const c = calcCambio(item.actual, item.anterior)
                return item.label === "Gastos Totales" ? c > 0 : c < 0
              }).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
