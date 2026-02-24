"use client"

import { useEffect, useState } from "react"
import { Bell, LogOut, SlidersHorizontal } from "lucide-react"

interface MovimientosHeaderProps {
  onToggleFilters?: () => void
}

export function MovimientosHeader({ onToggleFilters }: MovimientosHeaderProps) {
  const [dateTime, setDateTime] = useState("")

  useEffect(() => {
    function update() {
      const now = new Date()
      const formatted = now.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      const time = now.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      setDateTime(`Admin. | ${formatted} | ${time}`)
    }
    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="flex items-center justify-between p-4 mx-4 mt-4 mb-0 rounded-xl sticky top-4 z-10 bg-card">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Control de Movimientos - <span className="text-primary">Administrador General</span>
        </h1>
        <p className="text-sm text-muted-foreground">{dateTime.replace('Admin. | ', '')}</p>
      </div>
      <div className="flex items-center space-x-4">
        {onToggleFilters && (
          <button
            onClick={onToggleFilters}
            className="lg:hidden p-2 rounded-full hover:bg-gray-800 transition duration-200"
            title="Filtros"
          >
            <SlidersHorizontal className="h-6 w-6 text-accent" />
          </button>
        )}
        <button
          className="relative p-2 rounded-full hover:bg-gray-800 transition duration-200"
          title="Notificaciones"
        >
          <Bell className="h-6 w-6 text-accent" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
        </button>
        <button
          className="p-2 rounded-full hover:bg-gray-800 transition duration-200"
          title="Cerrar sesión"
        >
          <LogOut className="h-6 w-6 text-primary" />
        </button>
      </div>
    </header>
  )
}
