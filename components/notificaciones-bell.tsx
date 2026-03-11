"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Bell } from "lucide-react"
import { AlertasService } from "@/lib/services/alertas"
import { AlertasDashboard } from "@/components/configuracion/alertas-dashboard"

export function NotificacionesBell() {
  const [open, setOpen] = useState(false)
  const [totalActivas, setTotalActivas] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cargar conteo de alertas activas para el badge
  const cargarConteo = useCallback(async () => {
    try {
      const response = await AlertasService.getAlertas()
      setTotalActivas(response.resumen.total)
    } catch {
      // silencioso — el badge simplemente no aparece
    }
  }, [])

  useEffect(() => {
    cargarConteo()
  }, [cargarConteo])

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  // Al cerrar el dropdown, refrescar conteo (por si se resolvieron alertas)
  const handleToggle = () => {
    if (open) cargarConteo()
    setOpen((prev) => !prev)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-gray-800 transition duration-200"
        title="Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell className="h-6 w-6 text-accent" />
        {totalActivas > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
            <span className="text-[10px] font-bold text-white leading-none">
              {totalActivas > 9 ? "9+" : totalActivas}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-105 max-w-[calc(100vw-2rem)] z-50 shadow-2xl rounded-xl bg-card border border-border/60 overflow-hidden">
          <AlertasDashboard
            compact
            onAlertaResuelta={cargarConteo}
          />
        </div>
      )}
    </div>
  )
}
