"use client"

import { useState, useRef, useEffect } from "react"
import { Lock, Loader2, FileText } from "lucide-react"
import { useCaja } from "@/lib/contexts/caja-context"
import { useToast } from "@/hooks/use-toast"

interface ModalCierreCajaProps {
  open: boolean
  onSuccess: () => void
  onCancel: () => void
  estadoCajaActual?: {
    monto_inicial: number
    monto_actual: number
    fecha_apertura: string | null
  }
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
    year: "numeric",
  })
}

export function ModalCierreCaja({
  open,
  onSuccess,
  onCancel,
  estadoCajaActual,
}: ModalCierreCajaProps) {
  const [observacion, setObservacion] = useState("")
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { cerrarCaja } = useCaja()
  const { toast } = useToast()

  // Focus en el textarea al abrir
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)

    try {
      console.log("🔒 Cerrando caja...")
      const resultado = await cerrarCaja(observacion.trim() || undefined)

      toast({
        title: "✅ Caja Cerrada",
        description: `Corte realizado exitosamente. Total ingresos: $${resultado.total_ingresos}`,
      })

      // Limpiar form
      setObservacion("")
      onSuccess()
    } catch (error: any) {
      console.error("Error al cerrar caja:", error)
      toast({
        title: "Error al cerrar caja",
        description: error.message || "No se pudo cerrar la caja. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const diferencia = estadoCajaActual
    ? estadoCajaActual.monto_actual - estadoCajaActual.monto_inicial
    : null

  return (
    <div
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md transform transition-all"
        style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/20 to-orange-500/20" />
          <div className="relative px-6 py-6 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Cierre de Caja</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  El sistema calculará automáticamente el corte
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 space-y-6">
            {/* Info de apertura */}
            {estadoCajaActual && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Apertura:</span>
                  <span className="font-medium text-foreground">
                    {formatTime(estadoCajaActual.fecha_apertura)} -{" "}
                    {formatDate(estadoCajaActual.fecha_apertura)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monto Inicial:</span>
                  <span className="font-semibold text-foreground">
                    ${estadoCajaActual.monto_inicial.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monto Actual:</span>
                  <span className="font-semibold text-success">
                    ${estadoCajaActual.monto_actual.toFixed(2)}
                  </span>
                </div>
                {diferencia !== null && diferencia !== 0 && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">Diferencia:</span>
                    <span
                      className={`font-bold ${
                        diferencia > 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {diferencia > 0 ? "+" : ""}${diferencia.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Info box */}
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-sm text-orange-600 dark:text-orange-400">
                ℹ️ El sistema calculará automáticamente todos los movimientos del día y generará
                el corte de caja.
              </p>
            </div>

            {/* Observación */}
            <div className="space-y-2">
              <label
                htmlFor="observacion"
                className="text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Observaciones (opcional)
              </label>
              <textarea
                ref={textareaRef}
                id="observacion"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Ej: Todo en orden, sin novedad..."
                className="w-full px-4 py-3 bg-background border border-input rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-destructive/50 focus:border-destructive
                         text-sm text-foreground placeholder:text-muted-foreground/50
                         transition-all resize-none"
                rows={3}
                disabled={loading}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">{observacion.length}/200 caracteres</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-muted/30 border-t border-border flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-muted text-foreground rounded-lg 
                       hover:bg-muted/80 transition-all flex items-center justify-center gap-2 
                       font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-destructive text-destructive-foreground rounded-lg 
                       hover:bg-destructive/90 transition-all flex items-center justify-center gap-2 
                       font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed
                       transform active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Cerrando...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  Cerrar Caja
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
