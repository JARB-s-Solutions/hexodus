"use client"

import { CreditCard, Tag, ToggleRight, TrendingUp } from "lucide-react"
import type { Membresia } from "@/lib/types/membresias"

interface KpiMembresiasProps {
  membresias: Membresia[]
}

export function KpiMembresias({ membresias }: KpiMembresiasProps) {
  const total = membresias.length
  const activas = membresias.filter((m) => m.estado === 'activo').length
  const ofertas = membresias.filter((m) => m.esOferta).length
  const ingresos = membresias.reduce((sum, m) => sum + (m.esOferta ? (m.precioOferta || m.precioBase) : m.precioBase), 0)

  const kpis = [
    {
      label: "Total Membresias",
      value: total,
      sub: `${activas} activas`,
      subColor: "text-muted-foreground",
      icon: CreditCard,
      accentType: "accent" as const,
    },
    {
      label: "Membresias Activas",
      value: activas,
      sub: `${total > 0 ? ((activas / total) * 100).toFixed(0) : 0}% del total`,
      subColor: "text-muted-foreground",
      icon: ToggleRight,
      accentType: "success" as const,
    },
    {
      label: "Ofertas Vigentes",
      value: ofertas,
      sub: "Promociones activas",
      subColor: "text-warning",
      icon: Tag,
      accentType: "primary" as const,
    },
    {
      label: "Ingresos Potenciales",
      value: `$${Math.round(ingresos).toLocaleString()}`,
      sub: "Suma de precios base",
      subColor: "text-accent",
      icon: TrendingUp,
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
                backgroundColor:
                  kpi.accentType === "accent"
                    ? "var(--accent)"
                    : kpi.accentType === "success"
                      ? "#22C55E"
                      : "var(--primary)",
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
            <p className="text-3xl font-bold text-foreground mb-1">
              {typeof kpi.value === 'number' ? kpi.value : kpi.value}
            </p>
            <span className={`text-xs flex items-center gap-1 ${kpi.subColor}`}>
              {kpi.label === "Socios Suscritos" && <TrendingUp className="h-3 w-3" />}
              {kpi.sub}
            </span>
          </div>
        )
      })}
    </section>
  )
}
