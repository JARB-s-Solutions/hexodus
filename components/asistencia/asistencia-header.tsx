"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, UserPlus, Fingerprint } from "lucide-react"
import { Button } from "@/ui/button"
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
      className="sticky top-0 z-10 flex flex-col gap-3 rounded-xl bg-card p-3 md:flex-row md:items-center md:justify-between md:p-4"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      <div className="min-w-0">
        <h2 className="truncate text-lg font-semibold text-foreground md:text-xl">
          {"Control de Asistencia - "}
          <span className="text-primary">Administrador General</span>
        </h2>
        <p className="text-sm text-muted-foreground">{fechaHora}</p>
      </div>
      <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-2 md:w-auto md:flex md:items-center md:gap-3">
        {onRegistroHuella && (
          <Button
            onClick={onRegistroHuella}
            variant="default"
            size="sm"
            className="min-h-11 min-w-0 justify-center gap-1.5 bg-gradient-to-r from-accent to-accent/80 px-2 text-xs hover:from-accent/90 hover:to-accent/70 md:min-h-0 md:w-auto md:gap-2 md:px-4 md:text-sm"
          >
            <Fingerprint className="h-4 w-4 shrink-0" />
            <span className="truncate">Registro con Huella</span>
          </Button>
        )}
        {onRegistroManual && (
          <Button
            onClick={onRegistroManual}
            variant="default"
            size="sm"
            className="min-h-11 min-w-0 justify-center gap-1.5 px-2 text-xs md:min-h-0 md:w-auto md:gap-2 md:px-4 md:text-sm"
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            <span className="truncate">Registro Manual</span>
          </Button>
        )}
        <div className="hidden md:block">
          <NotificacionesBell />
        </div>
        <button
          onClick={handleLogout}
          className="hidden p-2 rounded-full hover:bg-muted transition-colors md:block"
          aria-label="Cerrar sesion"
        >
          <LogOut className="h-5 w-5 text-primary" />
        </button>
      </div>
    </header>
  )
}
