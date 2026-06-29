"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Unlock, Lock, DollarSign, Clock, User, ChevronDown, FileText, X } from "lucide-react"
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
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const router = useRouter()
  const puedeVerCaja =
    AuthService.hasPermission("ventas", "crearCorte") ||
    AuthService.hasPermission("ventas", "verCortesAnteriores")

  if (!puedeVerCaja) {
    return null
  }

  if (loading || !estadoCaja) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/50 border border-border animate-pulse md:h-auto md:w-auto md:gap-2 md:px-3 md:py-2 md:rounded-lg">
        <div className="h-4 w-4 bg-muted rounded-full" />
        <div className="hidden h-4 w-24 bg-muted rounded md:block" />
      </div>
    )
  }

  const estadoAbierta = estadoCaja.abierta

  return (
    <>
      <button
        type="button"
        onClick={() => setMobilePanelOpen(true)}
        className={`
          caja-indicador caja-indicador-mobile flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200 md:hidden
          ${
            estadoAbierta
              ? "bg-success/10 border-success/30 text-success"
              : "bg-muted/50 border-border text-muted-foreground"
          }
        `}
        title={estadoAbierta ? "Caja abierta" : "Caja cerrada"}
        aria-label={estadoAbierta ? "Ver estado de caja abierta" : "Ver estado de caja cerrada"}
      >
        <span className="relative flex h-6 w-6 items-center justify-center">
          {estadoAbierta ? (
            <Unlock className="h-5 w-5" />
          ) : (
            <Lock className="h-5 w-5" />
          )}
          <span
            className={`
              absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-background
              ${estadoAbierta ? "bg-success" : "bg-muted-foreground"}
            `}
          />
        </span>
      </button>

      {mobilePanelOpen && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-background/75 backdrop-blur-sm"
            onClick={() => setMobilePanelOpen(false)}
            aria-label="Cerrar estado de caja"
          />
          <section className="absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+6.25rem)] top-[calc(env(safe-area-inset-top)+5.5rem)] overflow-y-auto rounded-2xl border border-border/70 bg-card shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-card/95 px-5 py-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-accent" />
                <div>
                  <h2 className="text-base font-semibold text-foreground">Estado de Caja</h2>
                  <p className="text-xs text-muted-foreground">
                    {estadoAbierta ? "Turno activo en recepcion" : "Sin turno activo"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobilePanelOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-5">
              {estadoAbierta ? (
                <div className="space-y-5">
                  <div className="rounded-xl border border-success/25 bg-success/10 p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-success" />
                      <span className="text-sm font-semibold text-success">Turno Activo</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Monto actual</p>
                        <p className="mt-1 text-xl font-bold text-success">
                          {formatCurrency(estadoCaja.monto_actual)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Monto inicial</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {formatCurrency(estadoCaja.monto_inicial)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border/70 bg-background/40 p-4 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        Usuario
                      </span>
                      <span className="min-w-0 text-right font-medium text-foreground">
                        {estadoCaja.usuario}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Apertura
                      </span>
                      <span className="text-right font-medium text-foreground">
                        {formatTime(estadoCaja.fecha_apertura)} - {formatDate(estadoCaja.fecha_apertura)}
                      </span>
                    </div>
                    {estadoCaja.monto_actual !== estadoCaja.monto_inicial && (
                      <div className="flex items-start justify-between gap-4 border-t border-border pt-3">
                        <span className="text-muted-foreground">Diferencia</span>
                        <span
                          className={`text-right font-semibold ${
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

                  <button
                    type="button"
                    onClick={() => {
                      setMobilePanelOpen(false)
                      router.push("/ventas?tab=caja")
                    }}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent/50 bg-accent/10 px-4 font-semibold text-accent"
                  >
                    <FileText className="h-4 w-4" />
                    Ver Corte de Caja
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-border/70 bg-background/40 p-6 text-center">
                  <Lock className="mx-auto h-9 w-9 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No hay ningun turno de caja activo en este momento.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
        <button
          className={`
            caja-indicador caja-indicador-desktop hidden items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 md:flex
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
    </>
  )
}