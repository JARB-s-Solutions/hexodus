"use client"

import { Users, UserCheck, AlertCircle, CalendarClock, TrendingUp } from "lucide-react"
import type { Socio } from "@/lib/socios-data"
import { getVigenciaMembresia } from "@/lib/socios-data"

interface KpiSociosProps {
  socios: Socio[]
}

export function KpiSocios({ socios }: KpiSociosProps) {
  const total = socios.length
  const activos = socios.filter((s) => {
    const vig = getVigenciaMembresia(s.fechaFin)
    return vig === "vigente" || vig === "por_vencer"
  }).length
  const vencidos = socios.filter((s) => getVigenciaMembresia(s.fechaFin) === "vencida").length
  const porVencer = socios.filter((s) => getVigenciaMembresia(s.fechaFin) === "por_vencer").length

  const kpis = [
    {
      label: "Total Socios",
      value: total,
      sub: "+12 este mes",
      subColor: "text-[#22C55E]",
      icon: Users,
      accentType: "accent" as const,
    },
    {
      label: "Socios Activos",
      value: activos,
      sub: `${total > 0 ? ((activos / total) * 100).toFixed(0) : 0}% del total`,
      subColor: "text-muted-foreground",
      icon: UserCheck,
      accentType: "success" as const,
    },
    {
      label: "Vencidos",
      value: vencidos,
      sub: "Requieren seguimiento",
      subColor: "text-primary",
      icon: AlertCircle,
      accentType: "primary" as const,
    },
    {
      label: "Vencen en 7 dias",
      value: porVencer,
      sub: "Renovacion pendiente",
      subColor: "text-warning",
      icon: CalendarClock,
      accentType: "accent" as const,
    },
  ]

  const accentColors = {
    accent: { text: "text-accent", shadow: "rgba(0,191,255,0.6)" },
    success: { text: "text-[#22C55E]", shadow: "rgba(34,197,94,0.6)" },
    primary: { text: "text-primary", shadow: "rgba(255,59,59,0.6)" },
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const colors = accentColors[kpi.accentType]
        return (
          <div
            key={kpi.label}
            className="group bg-card rounded-xl p-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[3px] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"
              style={{
                backgroundColor: kpi.accentType === "accent" ? "var(--accent)" : kpi.accentType === "success" ? "#22C55E" : "var(--primary)",
                boxShadow: `0 0 8px ${colors.shadow}`,
              }}
            />
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-medium uppercase tracking-wider ${colors.text}`}>
                {kpi.label}
              </span>
              <kpi.icon
                className={`h-5 w-5 ${colors.text}`}
                style={{ filter: `drop-shadow(0 0 4px ${colors.shadow})` }}
              />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{kpi.value}</p>
            <span className={`text-xs flex items-center gap-1 ${kpi.subColor}`}>
              {kpi.label === "Total Socios" && <TrendingUp className="h-3 w-3" />}
              {kpi.sub}
            </span>
          </div>
        )
      })}
    </section>
  )
}
