"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { AuthService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { IndicadorCaja } from "@/components/caja/indicador-caja"
import { NotificacionesBell } from "@/components/notificaciones-bell"

export function VentasHeader() {
  const [dateTime, setDateTime] = useState("")
  const router = useRouter()
  const { toast } = useToast()

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

  const handleLogout = async () => {
    try {
      await AuthService.logout()
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente',
      })
      router.push('/login')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al cerrar sesión',
      })
    }
  }

  return (
    <header className="flex items-center justify-between p-3 mx-4 mt-3 mb-0 rounded-xl sticky top-4 z-10 bg-card">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Gestión de Ventas - <span className="text-primary">Administrador General</span>
        </h1>
        <p className="text-sm text-muted-foreground">{dateTime}</p>
      </div>
      <div className="flex items-center space-x-4">
        <IndicadorCaja />
        <NotificacionesBell />
        <button
          onClick={handleLogout}
          className="p-2 rounded-full hover:bg-gray-800 transition duration-200"
          title="Cerrar sesión"
        >
          <LogOut className="h-6 w-6 text-primary" />
        </button>
      </div>
    </header>
  )
}
