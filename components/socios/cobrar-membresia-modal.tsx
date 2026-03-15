"use client"

import { useState, useEffect } from "react"
import { X, DollarSign, CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/ui/button"
import { Label } from "@/ui/label"
import { toast } from "@/hooks/use-toast"
import { SociosService } from "@/lib/services/socios"
import type { Socio, MetodoPago } from "@/lib/types/socios"

interface CobrarMembresiaModalProps {
  open: boolean
  onClose: () => void
  socio: Socio | null
  onSuccess?: () => void
}

export function CobrarMembresiaModal({ open, onClose, socio, onSuccess }: CobrarMembresiaModalProps) {
  const [cargandoMetodos, setCargandoMetodos] = useState(false)
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<number | null>(null)
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [procesando, setProcesando] = useState(false)

  // Cargar métodos de pago al abrir el modal
  useEffect(() => {
    if (open && socio) {
      cargarMetodosPago()
    }
  }, [open, socio])

  const cargarMetodosPago = async () => {
    setCargandoMetodos(true)
    try {
      // Importar dinámicamente el servicio de métodos de pago
      const { MetodosPagoService } = await import("@/lib/services/socios")
      const metodos = await MetodosPagoService.getAll()
      setMetodosPago(metodos.filter(m => m.activo))
      
      // Seleccionar el primer método por defecto si existe
      if (metodos.length > 0) {
        setMetodoPagoSeleccionado(metodos[0].metodo_pago_id)
      }
    } catch (error: any) {
      console.error("Error cargando métodos de pago:", error)
      toast({
        title: "Error al cargar métodos de pago",
        description: error.message || "No se pudieron cargar los métodos de pago disponibles",
        variant: "destructive",
      })
    } finally {
      setCargandoMetodos(false)
    }
  }

  const handleConfirmar = async () => {
    if (!socio || !metodoPagoSeleccionado) {
      toast({
        title: "Error",
        description: "Debe seleccionar un método de pago",
        variant: "destructive",
      })
      return
    }

    setProcesando(true)
    console.log("💳 Cobrando membresía pendiente:")
    console.log("   Socio ID:", socio.id)
    console.log("   Plan ID:", socio.planId)
    console.log("   Método de pago:", metodoPagoSeleccionado)
    console.log("   Estado actual:", socio.estadoPago)

    try {
      // Endpoint dedicado para cobro de adeudo
      const mensaje = await SociosService.pagarMembresiaPendiente(socio.id, metodoPagoSeleccionado)

      console.log("✅ Membresía cobrada exitosamente")
      
      toast({
        title: "Membresía cobrada",
        description: mensaje || `Se ha registrado el pago de ${socio.nombre}`,
      })

      // Resetear estado y cerrar
      setMetodoPagoSeleccionado(null)
      onClose()
      
      // Llamar callback de éxito si existe
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("❌ Error cobrando membresía:", error)
      toast({
        title: "Error al cobrar membresía",
        description: error.message || "No se pudo registrar el pago",
        variant: "destructive",
      })
    } finally {
      setProcesando(false)
    }
  }

  const handleClose = () => {
    if (!procesando) {
      setMetodoPagoSeleccionado(null)
      onClose()
    }
  }

  if (!open || !socio) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative bg-card rounded-xl w-full max-w-md mx-4 overflow-hidden"
        style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Cobrar Membresía Pendiente</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={procesando}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6 space-y-6">
          {/* Info del socio */}
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Socio</p>
              <p className="text-base font-medium text-foreground">{socio.nombre}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-base font-medium text-foreground">{socio.nombrePlan || "Sin plan"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Estado Actual</p>
              <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-500 uppercase">
                {socio.estadoPago === 'sin_pagar' ? 'SIN PAGAR' : socio.estadoPago}
              </span>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-border"></div>

          {/* Método de pago */}
          <div className="space-y-3">
            <Label htmlFor="metodo-pago" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-accent" />
              <span>Método de Pago</span>
            </Label>
            
            {cargandoMetodos ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : metodosPago.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay métodos de pago disponibles</p>
            ) : (
              <select
                id="metodo-pago"
                value={metodoPagoSeleccionado || ""}
                onChange={(e) => setMetodoPagoSeleccionado(Number(e.target.value))}
                disabled={procesando}
                className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm disabled:opacity-50"
              >
                {metodosPago.map((metodo) => (
                  <option key={metodo.metodo_pago_id} value={metodo.metodo_pago_id}>
                    {metodo.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Nota informativa */}
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
            <p className="text-xs text-accent">
              <strong>Nota:</strong> Al confirmar, se registrará el pago de la membresía y el estado
              cambiará a "PAGADO".
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={procesando}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmar}
            disabled={procesando || !metodoPagoSeleccionado || cargandoMetodos}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {procesando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Confirmar Cobro
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
