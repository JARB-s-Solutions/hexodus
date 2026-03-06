"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, LogOut } from "lucide-react"
import { AuthService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export function UsuariosHeader() {
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
      setDateTime(`${formatted} | ${time}`)
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
    <header className="flex items-center justify-between p-4 mx-4 mt-4 mb-0 rounded-xl sticky top-4 z-10 bg-card">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Gestión de Usuarios - <span className="text-primary">Administrador General</span>
        </h1>
        <p className="text-sm text-muted-foreground">{dateTime}</p>
      </div>
      <div className="flex items-center space-x-4">
        <button
          className="relative p-2 rounded-full hover:bg-gray-800 transition duration-200"
          title="Notificaciones"
        >
          <Bell className="h-6 w-6 text-accent" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
        </button>
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
