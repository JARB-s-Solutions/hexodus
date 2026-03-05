"use client"

import { useState } from "react"
import { AlertTriangle, Clock, DollarSign, Calendar, X } from "lucide-react"
import { CajaService } from "@/lib/services/caja"
import { useToast } from "@/hooks/use-toast"

interface ModalCierreAutomaticoProps {
  open: boolean
  cajaAntigua: {
    monto_inicial: number
    monto_actual: number
    fecha_apertura: string
  }
  onSuccess: () => void
  onCancel: () => void
}

export function ModalCierreAutomatico({
  open,
  cajaAntigua,
  onSuccess,
  onCancel,
}: ModalCierreAutomaticoProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  if (!open) return null

  // Calcular hace cuánto se abrió
  const fechaApertura = new Date(cajaAntigua.fecha_apertura)
  const ahora = new Date()
  const diffMs = ahora.getTime() - fechaApertura.getTime()
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDias = Math.floor(diffHoras / 24)

  const fechaFormateada = fechaApertura.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const handleCierreAutomatico = async () => {
    setLoading(true)

    try {
      console.log("🤖 Iniciando cierre automático de caja antigua...")
      
      // Cerrar caja con las fechas correctas del día que se abrió
      const resultado = await CajaService.cerrarCajaAntigua(
        cajaAntigua.fecha_apertura,
        `Cierre automático - Caja dejada abierta ${diffDias > 0 ? `${diffDias} día(s)` : `${diffHoras} hora(s)`}`
      )

      toast({
        title: "✅ Caja Cerrada Automáticamente",
        description: `Se cerró la caja del ${fechaFormateada}. Total: $${resultado.data.total_ingresos_amarrados}`,
      })

      console.log("✅ Cierre automático completado")
      onSuccess()
    } catch (error: any) {
      console.error("❌ Error en cierre automático:", error)
      
      toast({
        title: "Error al cerrar caja",
        description: error.message || "No se pudo cerrar la caja automáticamente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-b border-orange-500/30 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Caja Anterior Sin Cerrar</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Se detectó una caja abierta de un día anterior
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Alert Box */}
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  Caja dejada abierta hace {diffDias > 0 ? `${diffDias} día(s)` : `${diffHoras} hora(s)`}
                </p>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
                  No puedes abrir una nueva caja hasta cerrar esta
                </p>
              </div>
            </div>
          </div>

          {/* Detalles de la caja antigua */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Detalles de la caja:</h3>
            
            <div className="grid grid-cols-1 gap-3">
              {/* Fecha de apertura */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Fecha de apertura</p>
                  <p className="text-sm font-medium text-foreground">{fechaFormateada}</p>
                </div>
              </div>

              {/* Monto inicial */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Monto inicial</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${cajaAntigua.monto_inicial.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Monto actual */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <DollarSign className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Efectivo actual</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ${cajaAntigua.monto_actual.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info box explicativo */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              💡 <strong>¿Qué hará el sistema?</strong>
              <br />
              Se generará automáticamente el corte de caja del día de apertura, calculando todos los
              movimientos registrados. Después podrás abrir una nueva caja para el día de hoy.
            </p>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border flex gap-3">
          <button
            type="button"
            onClick={handleCierreAutomatico}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold 
                     rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Cerrando caja...
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                Cerrar Caja Automáticamente
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-3 bg-muted hover:bg-muted/80 text-muted-foreground font-medium 
                     rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
        </div>

        {/* Nota al pie */}
        <div className="px-6 py-3 bg-muted/50 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            ⚠️ No podrás acceder al sistema hasta cerrar esta caja
          </p>
        </div>
      </div>
    </div>
  )
}
