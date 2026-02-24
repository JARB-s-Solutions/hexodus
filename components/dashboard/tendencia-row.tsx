"use client"

import { TrendingUp, TrendingDown, Minus, ScanLine, ArrowUpRight } from "lucide-react"
import { calcPct, getTendencia } from "@/lib/dashboard-data"
import type { DatosFinancieros } from "@/lib/dashboard-data"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface TendenciaRowProps {
  datos: DatosFinancieros
  asistencia: { hoy: number; ayer: number; hombres: number; mujeres: number }
  periodo: string
  onPeriodoChange: (p: string) => void
}

export function TendenciaRow({ datos, asistencia, periodo, onPeriodoChange }: TendenciaRowProps) {
  const utilidad = datos.ventas - datos.gastos
  const utilidadAnt = datos.ventasAnt - datos.gastosAnt
  const pctUtilidad = calcPct(utilidad, utilidadAnt)
  const tendencia = getTendencia(pctUtilidad)
  const pctAsistencia = calcPct(asistencia.hoy, asistencia.ayer)

  const tendenciaConfig = {
    mejoro: {
      Icon: TrendingUp,
      borderClass: "border-success/15",
      bgGradient: "linear-gradient(135deg, rgba(75,181,67,0.06), transparent)",
      iconBg: "bg-success/12 text-success",
      textColor: "text-success",
    },
    empeoro: {
      Icon: TrendingDown,
      borderClass: "border-primary/15",
      bgGradient: "linear-gradient(135deg, rgba(255,59,59,0.06), transparent)",
      iconBg: "bg-primary/12 text-primary",
      textColor: "text-primary",
    },
    igual: {
      Icon: Minus,
      borderClass: "border-warning/15",
      bgGradient: "linear-gradient(135deg, rgba(255,215,0,0.06), transparent)",
      iconBg: "bg-warning/12 text-warning",
      textColor: "text-warning",
    },
  }

  const tc = tendenciaConfig[tendencia.tipo]
  const generoData = [
    { name: "Hombres", value: asistencia.hombres },
    { name: "Mujeres", value: asistencia.mujeres },
  ]
  const GENERO_COLORS = ["#00BFFF", "#FF3B3B"]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Tendencia */}
      <div
        className={`lg:col-span-5 flex items-center gap-3.5 px-5 py-4 rounded-xl border bg-card ${tc.borderClass} animate-fade-in-up`}
        style={{ background: tc.bgGradient }}
      >
        <div className={`h-10 w-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${tc.iconBg}`}>
          <tc.Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${tc.textColor}`}>{tendencia.texto}</p>
          <p className="text-xs text-muted-foreground">{tendencia.sub}</p>
        </div>
        <select
          value={periodo}
          onChange={(e) => onPeriodoChange(e.target.value)}
          className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-border bg-background text-muted-foreground cursor-pointer hover:border-accent focus:border-accent outline-none transition-colors flex-shrink-0"
        >
          <option value="hoy">Hoy</option>
          <option value="semana">Semana</option>
          <option value="mes">Mes</option>
        </select>
      </div>

      {/* Asistencia Hoy */}
      <div className="lg:col-span-4 bg-card rounded-xl border border-accent/10 p-5 animate-fade-in-up" style={{ animationDelay: "30ms" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Asistencia Hoy
          </span>
          <ScanLine className="h-5 w-5 text-accent" style={{ filter: "drop-shadow(0 0 4px rgba(0,191,255,0.4))" }} />
        </div>
        <div className="flex items-end gap-5">
          <div>
            <p className="text-3xl font-bold text-accent">{asistencia.hoy}</p>
            <span className="text-xs text-muted-foreground">personas</span>
          </div>
          <div className="flex-1 pl-4 border-l border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Ayer</span>
              <span className="text-sm font-bold text-foreground">{asistencia.ayer}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                pctAsistencia >= 0 ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
              }`}>
                <ArrowUpRight className="h-3 w-3" />
                +{pctAsistencia}%
              </span>
              <span className="text-xs text-muted-foreground">vs ayer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Genero */}
      <div className="lg:col-span-3 bg-card rounded-xl border border-border p-5 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Por Genero
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-[72px] w-[72px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={generoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={22}
                  outerRadius={34}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {generoData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={GENERO_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1C1C20", border: "1px solid #2A2A30", borderRadius: "8px", fontSize: "12px" }}
                  itemStyle={{ color: "#E0E0E0" }}
                  formatter={(value: number, name: string) => [`${value} personas`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span className="text-xs text-muted-foreground">Hombres</span>
              <span className="text-xs font-bold text-foreground">{asistencia.hombres}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Mujeres</span>
              <span className="text-xs font-bold text-foreground">{asistencia.mujeres}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
