"use client"

import { Users, Activity, AlertCircle, Gauge, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/ui/button"
import type { KpiAsistencia } from "@/lib/asistencia-data"

interface Props {
  data: KpiAsistencia
  loading?: boolean
  error?: string | null
  onRecargar?: () => void
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
    label: "Prom. Confianza",
    icon: Gauge,
    colorClass: "text-warning",
    bgClass: "bg-warning/10",
  },
]

export function KpiAsistenciaCards({ data, loading = false, error = null, onRecargar }: Props) {
  if (error) {
    return (
      <div className="col-span-full rounded-xl border border-destructive bg-destructive/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-sm text-destructive">Error al cargar KPIs</p>
              <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
            </div>
          </div>
          {onRecargar && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRecargar}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Reintentar
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        const value = data[kpi.key]

        return (
          <div
            key={kpi.key}
            className="bg-card rounded-xl p-4 border border-border hover:border-accent/30 transition-all duration-300 hover:-translate-y-0.5 relative"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
          >
            {loading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${kpi.bgClass}`}>
                <Icon className={`h-5 w-5 ${kpi.colorClass}`} />
              </div>
              {kpi.pulse && !loading && (
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