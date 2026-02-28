"use client"

import { useEffect, useState } from "react"
import { Bell, LogOut } from "lucide-react"

export function AsistenciaHeader() {
  const [fechaHora, setFechaHora] = useState("")

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const fecha = now.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      const hora = now.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      setFechaHora(`${fecha} | ${hora}`)
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <header
      className="flex items-center justify-between p-4 rounded-xl sticky top-0 z-10 bg-card"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {"Control de Asistencia - "}
          <span className="text-primary">Administrador General</span>
        </h2>
        <p className="text-sm text-muted-foreground">{fechaHora}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="relative p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5 text-accent" />
          <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-primary" />
        </button>
        <button
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Cerrar sesion"
        >
          <LogOut className="h-5 w-5 text-primary" />
        </button>
      </div>
    </header>
  )
}