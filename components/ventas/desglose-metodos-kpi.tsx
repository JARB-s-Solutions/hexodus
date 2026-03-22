"use client"

import { CreditCard } from "lucide-react"
import { formatCurrency } from "@/lib/types/ventas"
import type { DesgloceMetodo } from "@/lib/types/caja"

interface DesgloceMetodosKpiProps {
  metodos: DesgloceMetodo[]
  loading?: boolean
}

export function DesgloceMetodosKpi({ metodos, loading }: DesgloceMetodosKpiProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card rounded-lg p-4 border border-border shadow-sm animate-pulse"
          >
            <div className="h-4 bg-muted rounded mb-2" />
            <div className="h-6 bg-muted rounded mb-2" />
            <div className="h-3 bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!metodos || metodos.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm text-center">
        <p className="text-muted-foreground text-sm">
          Sin movimientos registrados para hoy
        </p>
      </div>
    )
  }

  // Tomar los primeros 4 métodos o todos si hay menos
  const metodosAMostrar = metodos.slice(0, 4)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metodosAMostrar.map((metodo) => (
        <div
          key={metodo.metodo}
          className="bg-card rounded-lg p-4 border border-border shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                {metodo.metodo}
              </p>
            </div>
            <CreditCard className="h-4 w-4 text-accent flex-shrink-0" />
          </div>

          <div className="space-y-2">
            {/* Ingresos */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ingresos</p>
              <p className="text-lg font-bold text-success">
                +{formatCurrency(metodo.ingresos)}
              </p>
            </div>

            {/* Egresos */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Egresos</p>
              <p className="text-sm font-semibold text-destructive">
                -{formatCurrency(metodo.egresos)}
              </p>
            </div>

            {/* Neto */}
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Neto</p>
              <p
                className={`text-sm font-bold ${
                  metodo.neto >= 0 ? "text-accent" : "text-destructive"
                }`}
              >
                {metodo.neto >= 0 ? "+" : ""}{formatCurrency(metodo.neto)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
