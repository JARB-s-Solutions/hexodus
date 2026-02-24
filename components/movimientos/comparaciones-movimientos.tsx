"use client"

import { useState, useMemo } from "react"
import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react"
import type { Movimiento, PeriodoComparacion } from "@/lib/movimientos-data"

interface ComparacionesMovimientosProps {
  movimientos: Movimiento[]
  periodos: PeriodoComparacion[]
}

function filterByRange(movimientos: Movimiento[], inicio: string, fin: string) {
  return movimientos.filter((m) => m.fecha >= inicio && m.fecha <= fin)
}

function calcTotals(movs: Movimiento[]) {
  const ingresos = movs.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.total, 0)
  const egresos = movs.filter((m) => m.tipo === "egreso").reduce((s, m) => s + m.total, 0)
  return { ingresos, egresos, balance: ingresos - egresos, count: movs.length }
}

function pctChange(current: number, prev: number): number | null {
  if (prev === 0) return current > 0 ? 100 : null
  return ((current - prev) / Math.abs(prev)) * 100
}

function fmtMoney(n: number): string {
  const abs = Math.abs(n)
  const fixed = abs.toFixed(2)
  const [intPart, decPart] = fixed.split(".")
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `$${formatted}.${decPart}`
}

function ChangeCell({ current, prev }: { current: number; prev: number }) {
  const change = pctChange(current, prev)
  if (change === null) return <span className="text-muted-foreground/50 text-xs">--</span>
  const isUp = change > 0
  const isZero = Math.abs(change) < 0.1

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        isZero ? "text-muted-foreground" : isUp ? "text-success" : "text-destructive"
      }`}
    >
      {isZero ? <Minus className="h-3 w-3" /> : isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(change).toFixed(1)}%
    </span>
  )
}

export function ComparacionesMovimientos({ movimientos, periodos }: ComparacionesMovimientosProps) {
  const [selectedIdx, setSelectedIdx] = useState(1)

  const comparison = useMemo(() => {
    const p = periodos[selectedIdx]
    if (!p) return null
    const current = calcTotals(filterByRange(movimientos, p.inicio, p.fin))
    const prev = calcTotals(filterByRange(movimientos, p.anteriorInicio, p.anteriorFin))
    return { periodo: p, current, prev }
  }, [movimientos, periodos, selectedIdx])

  if (!comparison) return null
  const { periodo, current, prev } = comparison

  const rows = [
    { label: "Ingresos", icon: TrendingUp, iconClass: "text-success", current: current.ingresos, prev: prev.ingresos },
    { label: "Egresos", icon: TrendingDown, iconClass: "text-destructive", current: current.egresos, prev: prev.egresos },
    { label: "Balance", icon: DollarSign, iconClass: "text-accent", current: current.balance, prev: prev.balance },
  ]

  return (
    <div
      className="bg-card rounded-xl overflow-hidden border border-border"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
        <BarChart3 className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">Comparaciones</h2>
      </div>

      {/* Period tabs */}
      <div className="flex flex-wrap gap-1.5 px-5 py-3 bg-muted/20">
        {periodos.map((p, idx) => (
          <button
            key={p.label}
            onClick={() => setSelectedIdx(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              idx === selectedIdx
                ? "bg-primary text-primary-foreground glow-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-2.5 px-5">Concepto</th>
              <th className="text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-2.5 px-5">{periodo.label}</th>
              <th className="text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-2.5 px-5">{periodo.labelAnterior}</th>
              <th className="text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-2.5 px-5">Cambio</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                <td className="py-3 px-5 flex items-center gap-2">
                  <row.icon className={`h-4 w-4 ${row.iconClass}`} />
                  <span className="text-sm font-medium text-foreground">{row.label}</span>
                </td>
                <td className="py-3 px-5 text-right text-sm font-semibold text-foreground">
                  {row.current < 0 ? "-" : ""}{fmtMoney(row.current)}
                </td>
                <td className="py-3 px-5 text-right text-sm text-muted-foreground">
                  {row.prev < 0 ? "-" : ""}{fmtMoney(row.prev)}
                </td>
                <td className="py-3 px-5 text-right">
                  <ChangeCell current={row.current} prev={row.prev} />
                </td>
              </tr>
            ))}
            <tr className="hover:bg-muted/20 transition-colors">
              <td className="py-3 px-5 text-sm font-medium text-foreground">Movimientos</td>
              <td className="py-3 px-5 text-right text-sm font-semibold text-foreground">{current.count}</td>
              <td className="py-3 px-5 text-right text-sm text-muted-foreground">{prev.count}</td>
              <td className="py-3 px-5 text-right">
                <ChangeCell current={current.count} prev={prev.count} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
