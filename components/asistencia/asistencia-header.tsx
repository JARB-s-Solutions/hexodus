"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, UserPlus, Fingerprint } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { NotificacionesBell } from "@/components/notificaciones-bell"

interface AsistenciaHeaderProps {
  onRegistroManual?: () => void
  onRegistroHuella?: () => void
}

export function AsistenciaHeader({ onRegistroManual, onRegistroHuella }: AsistenciaHeaderProps) {
  const [fechaHora, setFechaHora] = useState("")
  const router = useRouter()
  const { toast } = useToast()

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
        {onRegistroHuella && (
          <Button
            onClick={onRegistroHuella}
            variant="default"
            size="sm"
            className="gap-2 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
          >
            <Fingerprint className="h-4 w-4" />
            Registro con Huella
          </Button>
        )}
        {onRegistroManual && (
          <Button
            onClick={onRegistroManual}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Registro Manual
          </Button>
        )}
        <NotificacionesBell />
        <button
          onClick={handleLogout}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Cerrar sesion"
        >
          <LogOut className="h-5 w-5 text-primary" />
        </button>
      </div>
    </header>
  )
}