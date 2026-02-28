"use client"

import { Users, Activity, AlertCircle, Timer } from "lucide-react"
import type { KpiAsistencia } from "@/lib/asistencia-data"

interface Props {
  data: KpiAsistencia
}

const kpis = [
  {
    key: "asistentesHoy" as const,
    label: "Asistentes Hoy",
    icon: Users,
    colorClass: "text-accent",
    bgClass: "bg-accent/10",
  },
  {
    key: "activosAhora" as const,
    label: "Activos Ahora",
    icon: Activity,
    colorClass: "text-success",
    bgClass: "bg-success/10",
    pulse: true,
  },
  {
    key: "denegados" as const,
    label: "Accesos Denegados",
    icon: AlertCircle,
    colorClass: "text-destructive",
    bgClass: "bg-destructive/10",
  },
  {
    key: "permanenciaPromedio" as const,
    label: "Prom. Permanencia",
    icon: Timer,
    colorClass: "text-warning",
    bgClass: "bg-warning/10",
  },
]

export function KpiAsistenciaCards({ data }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        const value = data[kpi.key]

        return (
          <div
            key={kpi.key}
            className="bg-card rounded-xl p-4 border border-border hover:border-accent/30 transition-all duration-300 hover:-translate-y-0.5"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${kpi.bgClass}`}>
                <Icon className={`h-5 w-5 ${kpi.colorClass}`} />
              </div>
              {kpi.pulse && (
                <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.colorClass}`}>{value}</p>
          </div>
        )
      })}
    </div>
  )
}