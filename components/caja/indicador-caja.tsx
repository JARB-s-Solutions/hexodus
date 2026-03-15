"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Unlock, Lock, DollarSign, Clock, User, ChevronDown, FileText } from "lucide-react"
import { useCaja } from "@/lib/contexts/caja-context"
import { AuthService } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount)
}

function formatTime(dateString: string | null): string {
  if (!dateString) return "--:--"
  const date = new Date(dateString)
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "--"
  const date = new Date(dateString)
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  })
}

export function IndicadorCaja() {
  const { estadoCaja, loading } = useCaja()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()
  const puedeVerCaja =
    AuthService.hasPermission("ventas", "crearCorte") ||
    AuthService.hasPermission("ventas", "verCortesAnteriores")

  if (!puedeVerCaja) {
    return null
  }

  if (loading || !estadoCaja) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border animate-pulse">
        <div className="h-4 w-4 bg-muted rounded-full" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
    )
  }

  const estadoAbierta = estadoCaja.abierta

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200
            ${
              estadoAbierta
                ? "bg-success/10 border-success/30 hover:bg-success/20"
                : "bg-muted/50 border-border hover:bg-muted"
            }
          `}
        >
          {/* Icono de estado */}
          <div
            className={`
              p-1.5 rounded-md
              ${estadoAbierta ? "bg-success/20" : "bg-muted"}
            `}
          >
            {estadoAbierta ? (
              <Unlock className="h-4 w-4 text-success" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col items-start min-w-0">
            <span
              className={`
                text-xs font-semibold
                ${estadoAbierta ? "text-success" : "text-muted-foreground"}
              `}
            >
              {estadoAbierta ? "Caja Abierta" : "Caja Cerrada"}
            </span>
            {estadoAbierta && (
              <span className="text-xs font-bold text-foreground">
                {formatCurrency(estadoCaja.monto_actual)}
              </span>
            )}
          </div>

          {/* Dropdown indicator */}
          <ChevronDown
            className={`h-3 w-3 text-muted-foreground transition-transform ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-accent" />
          Estado de Caja
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {estadoAbierta ? (
          <>
            {/* Estado: Abierta */}
            <div className="px-2 py-3 space-y-3">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-semibold text-success">Turno Activo</span>
              </div>

              {/* Detalles */}
              <div className="space-y-2 text-sm">
                {/* Usuario */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>Usuario:</span>
                  </div>
                  <span className="font-medium text-foreground">{estadoCaja.usuario}</span>
                </div>

                {/* Hora apertura */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Apertura:</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {formatTime(estadoCaja.fecha_apertura)} - {formatDate(estadoCaja.fecha_apertura)}
                  </span>
                </div>

                {/* Divider */}
                <div className="border-t border-border pt-2 mt-2" />

                {/* Monto inicial */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Monto Inicial:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(estadoCaja.monto_inicial)}
                  </span>
                </div>

                {/* Monto actual */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Monto Actual:</span>
                  <span className="font-bold text-success">
                    {formatCurrency(estadoCaja.monto_actual)}
                  </span>
                </div>

                {/* Diferencia */}
                {estadoCaja.monto_actual !== estadoCaja.monto_inicial && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Diferencia:</span>
                    <span
                      className={`font-semibold ${
                        estadoCaja.monto_actual > estadoCaja.monto_inicial
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {estadoCaja.monto_actual > estadoCaja.monto_inicial ? "+" : ""}
                      {formatCurrency(estadoCaja.monto_actual - estadoCaja.monto_inicial)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Acción: Ver corte */}
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                setDropdownOpen(false)
                router.push("/ventas?tab=caja")
              }}
            >
              <FileText className="h-4 w-4" />
              Ver Corte de Caja
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {/* Estado: Cerrada */}
            <div className="px-2 py-4 text-center space-y-2">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                No hay ningún turno de caja activo en este momento.
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
