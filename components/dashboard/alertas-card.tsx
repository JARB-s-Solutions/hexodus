"use client"

import { AlertTriangle } from "lucide-react"
import type { Alerta } from "@/lib/dashboard-data"

interface AlertasCardProps {
  alertas: Alerta[]
}

const dotColors: Record<string, string> = {
  danger: "bg-primary shadow-[0_0_6px_rgba(255,59,59,0.4)]",
  warning: "bg-warning shadow-[0_0_6px_rgba(255,215,0,0.4)]",
  info: "bg-accent shadow-[0_0_6px_rgba(0,191,255,0.4)]",
}

export function AlertasCard({ alertas }: AlertasCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border animate-fade-in-up">
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <AlertTriangle className="h-4 w-4 text-primary" style={{ filter: "drop-shadow(0 0 4px rgba(255,59,59,0.4))" }} />
        <h3 className="text-sm font-semibold text-primary">Alertas</h3>
      </div>
      <div className="px-5 pb-4">
        {alertas.map((alerta, i) => (
          <div
            key={alerta.id}
            className={`flex items-start gap-3 py-3 ${
              i < alertas.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${dotColors[alerta.tipo]}`} />
            <div>
              <p className="text-sm font-medium text-foreground">{alerta.mensaje}</p>
              <span className="text-xs text-muted-foreground">{alerta.detalle}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
