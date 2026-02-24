"use client"

import { Activity } from "lucide-react"
import type { Usuario } from "@/lib/usuarios-data"

interface SesionesActivasProps {
  usuarios: Usuario[]
}

export function SesionesActivas({ usuarios }: SesionesActivasProps) {
  const activos = usuarios.filter((u) => u.activo)
  const sesionesAdmin = activos.filter((u) => u.rol === "admin" && u.sesionActiva).length
  const sesionesEmpleados = activos.filter((u) => u.rol !== "admin" && u.sesionActiva).length
  const totalSesiones = activos.filter((u) => u.sesionActiva).length
  const total = activos.length

  return (
    <div
      className="bg-card rounded-xl p-4 flex items-center gap-6"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="h-4 w-4 text-accent" />
        <span className="font-medium">Sesiones Activas</span>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-muted-foreground">Admins:</span>
          <span className="font-semibold text-[#22C55E]">{sesionesAdmin}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#FBB424]" />
          <span className="text-muted-foreground">Empleados:</span>
          <span className="font-semibold text-[#FBB424]">{sesionesEmpleados}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-muted-foreground">Total:</span>
          <span className="font-semibold text-accent">{totalSesiones}/{total}</span>
        </div>
      </div>
    </div>
  )
}
