"use client"

import { useState, useCallback } from "react"
import { UserCheck, RefreshCw } from "lucide-react"

export function VisitantesCard() {
  const [visitantes] = useState<never[]>([])
  const [spinning, setSpinning] = useState(false)

  const handleRefresh = useCallback(() => {
    setSpinning(true)
    setTimeout(() => setSpinning(false), 600)
  }, [])

  return (
    <div
      className="bg-card rounded-xl p-6 animate-fade-in-up"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-3 text-accent">
          <UserCheck className="h-5 w-5" />
          Visitantes del Dia
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent/20 text-accent">
            {visitantes.length} asistencias
          </span>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Refrescar"
          >
            <RefreshCw
              className={`h-4 w-4 text-accent transition-transform duration-300 ${spinning ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {visitantes.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay visitantes registrados hoy</p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {/* Visitor cards would render here when connected to real data */}
        </div>
      )}
    </div>
  )
}
