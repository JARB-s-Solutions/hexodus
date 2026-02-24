"use client"

import { Users, UserCheck, Shield, Clock, TrendingUp, Activity } from "lucide-react"
import type { Usuario } from "@/lib/usuarios-data"

interface KpiUsuariosProps {
  usuarios: Usuario[]
}

export function KpiUsuarios({ usuarios }: KpiUsuariosProps) {
  const totalActivos = usuarios.filter((u) => u.activo).length
  const activos = usuarios.filter((u) => u.estado === "activo" && u.activo).length
  const administradores = usuarios.filter((u) => u.rol === "admin" && u.activo).length
  const sesionesActivas = usuarios.filter((u) => u.sesionActiva && u.activo).length

  const kpis = [
    {
      label: "Total Usuarios",
      value: totalActivos,
      sub: "+3 este mes",
      subColor: "text-[#22C55E]",
      icon: Users,
      accent: "accent",
    },
    {
      label: "Usuarios Activos",
      value: activos,
      sub: `${totalActivos > 0 ? ((activos / totalActivos) * 100).toFixed(1) : 0}% del total`,
      subColor: "text-[#FBB424]",
      icon: UserCheck,
      accent: "primary",
    },
    {
      label: "Administradores",
      value: administradores,
      sub: "Permisos completos",
      subColor: "text-muted-foreground",
      icon: Shield,
      accent: "primary",
    },
    {
      label: "Sesiones Activas",
      value: sesionesActivas,
      sub: `${totalActivos > 0 ? ((sesionesActivas / totalActivos) * 100).toFixed(0) : 0}% conectados`,
      subColor: "text-[#22C55E]",
      icon: Activity,
      accent: "accent",
    },
  ]

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="group bg-card rounded-xl p-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
          style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
        >
          {/* Top accent bar on hover */}
          <div className={`absolute top-0 left-0 right-0 h-[3px] bg-${kpi.accent} scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300`}
            style={kpi.accent === "accent" ? { boxShadow: "0 0 8px rgba(0,191,255,0.6)" } : { boxShadow: "0 0 8px rgba(255,59,59,0.6)" }}
          />
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium uppercase tracking-wider ${kpi.accent === "accent" ? "text-accent" : "text-primary"}`}>
              {kpi.label}
            </span>
            <kpi.icon className={`h-5 w-5 ${kpi.accent === "accent" ? "text-accent" : "text-primary"}`} style={{ filter: `drop-shadow(0 0 4px ${kpi.accent === "accent" ? "rgba(0,191,255,0.5)" : "rgba(255,59,59,0.5)"})` }} />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{kpi.value}</p>
          <span className={`text-xs flex items-center gap-1 ${kpi.subColor}`}>
            {kpi.label === "Total Usuarios" && <TrendingUp className="h-3 w-3" />}
            {kpi.label === "Sesiones Activas" && <Clock className="h-3 w-3" />}
            {kpi.sub}
          </span>
        </div>
      ))}
    </section>
  )
}
