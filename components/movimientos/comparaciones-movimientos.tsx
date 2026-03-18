"use client"

import { useState, useEffect } from "react"
import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react"
import { MovimientosService } from "@/lib/services/movimientos"
import type { ComparacionData, PeriodoComparacionAPI } from "@/lib/types/movimientos"

interface ComparacionesMovimientosProps {}

const PERIODOS: Array<{ key: PeriodoComparacionAPI; label: string }> = [
  { key: "Hoy", label: "Hoy" },
  { key: "Este Mes", label: "Este Mes" },
  { key: "Este Trimestre", label: "Este Trimestre" },
  { key: "Este Semestre", label: "Este Semestre" },
  { key: "Este Año", label: "Este Año" },
]

function fmtMoney(n: number): string {
  const abs = Math.abs(n)
  const fixed = abs.toFixed(2)
  const [intPart, decPart] = fixed.split(".")
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `$${formatted}.${decPart}`
}

function ChangeCell({ cambio }: { cambio: number }) {
  const isUp = cambio > 0
  const isZero = Math.abs(cambio) < 0.1

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        isZero ? "text-muted-foreground" : isUp ? "text-success" : "text-destructive"
      }`}
    >
      {isZero ? <Minus className="h-3 w-3" /> : isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(cambio).toFixed(1)}%
    </span>
  )
}

export function ComparacionesMovimientos({}: ComparacionesMovimientosProps) {
  const [selectedIdx, setSelectedIdx] = useState(2) // "Este Trimestre" por defecto
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ComparacionData | null>(null)

  // Cargar comparación cuando cambia el período seleccionado
  useEffect(() => {
    const cargarComparacion = async () => {
      setLoading(true)
      setError(null)

      try {
        const periodo = PERIODOS[selectedIdx].key
        console.log("📊 Cargando comparación para:", periodo)

        const comparacionData = await MovimientosService.getComparacion(periodo)
        setData(comparacionData)

        console.log("✅ Comparación cargada exitosamente")
      } catch (err: any) {
        console.error("❌ Error cargando comparación:", err)
        setError(err.message || "Error al cargar comparación")
      } finally {
        setLoading(false)
      }
    }

    cargarComparacion()
  }, [selectedIdx])

  // Función para obtener el icono y clase según el concepto
  const getRowIcon = (concepto: string) => {
    switch (concepto) {
      case "Ingresos":
        return { icon: TrendingUp, iconClass: "text-success" }
      case "Egresos":
        return { icon: TrendingDown, iconClass: "text-destructive" }
      case "Balance":
        return { icon: DollarSign, iconClass: "text-accent" }
      default:
        return { icon: BarChart3, iconClass: "text-muted-foreground" }
    }
  }

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
        {PERIODOS.map((p, idx) => (
          <button
            key={p.key}
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

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Cargando comparación...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <p className="text-destructive font-medium">⚠️ Error al cargar</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* Comparison table */}
      {!loading && !error && data && (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-2.5 px-5">
                  Concepto
                </th>
                <th className="text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-2.5 px-5">
                  {data.labels_columnas.actual}
                </th>
                <th className="text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-2.5 px-5">
                  {data.labels_columnas.anterior}
                </th>
                <th className="text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-2.5 px-5">
                  Cambio
                </th>
              </tr>
            </thead>
            <tbody>
              {data.filas.map((fila) => {
                const { icon: Icon, iconClass } = getRowIcon(fila.concepto)
                const esMonetario = fila.concepto !== "Movimientos"

                return (
                  <tr key={fila.concepto} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-5 flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${iconClass}`} />
                      <span className="text-sm font-medium text-foreground">{fila.concepto}</span>
                    </td>
                    <td className="py-3 px-5 text-right text-sm font-semibold text-foreground">
                      {esMonetario ? fmtMoney(fila.actual) : fila.actual}
                    </td>
                    <td className="py-3 px-5 text-right text-sm text-muted-foreground">
                      {esMonetario ? fmtMoney(fila.anterior) : fila.anterior}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <ChangeCell cambio={fila.cambio_pct} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
