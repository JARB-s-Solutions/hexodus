"use client"

import { useEffect, useState } from "react"
import { X, RefreshCw, CreditCard, Layers, Loader2 } from "lucide-react"
import { Button } from "@/ui/button"
import { Label } from "@/ui/label"
import { toast } from "@/hooks/use-toast"
import { SociosService, MetodosPagoService } from "@/lib/services/socios"
import { MembresiasService } from "@/lib/services/membresias"
import type { Socio, MetodoPago } from "@/lib/types/socios"
import type { Membresia } from "@/lib/types/membresias"

interface RenovarMembresiaModalProps {
  open: boolean
  onClose: () => void
  socio: Socio | null
  onSuccess?: () => void
}

export function RenovarMembresiaModal({ open, onClose, socio, onSuccess }: RenovarMembresiaModalProps) {
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<number | null>(null)
  const [planSeleccionado, setPlanSeleccionado] = useState<number | null>(null)
  const [cargandoDatos, setCargandoDatos] = useState(false)
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    if (!open || !socio) return

    const cargarDatos = async () => {
      setCargandoDatos(true)
      try {
        const [metodos, planesActivos] = await Promise.all([
          MetodosPagoService.getAll(),
          MembresiasService.getAll(),
        ])

        const metodosActivos = metodos.filter((m) => m.activo)
        const membresiasActivas = planesActivos.filter((m) => m.estado === "activo")

        setMetodosPago(metodosActivos)
        setMembresias(membresiasActivas)

        if (metodosActivos.length > 0) {
          setMetodoPagoSeleccionado(metodosActivos[0].metodo_pago_id)
        }

        let planId = socio.planId
        if (!planId || planId <= 0) {
          const socioDetalle = await SociosService.getById(socio.id)
          planId = socioDetalle.planId
        }

        if (planId && planId > 0) {
          setPlanSeleccionado(planId)
        } else if (membresiasActivas.length > 0) {
          setPlanSeleccionado(membresiasActivas[0].id)
        }
      } catch (error: any) {
        console.error("Error cargando datos para renovación:", error)
        toast({
          title: "Error",
          description: error.message || "No se pudieron cargar planes o métodos de pago",
          variant: "destructive",
        })
      } finally {
        setCargandoDatos(false)
      }
    }

    cargarDatos()
  }, [open, socio])

  const handleConfirmar = async () => {
    if (!socio || !planSeleccionado || !metodoPagoSeleccionado) {
      toast({
        title: "Datos incompletos",
        description: "Selecciona un plan y un método de pago para renovar",
        variant: "destructive",
      })
      return
    }

    try {
      setProcesando(true)

      const mensaje = await SociosService.renovarMembresia(
        socio.id,
        planSeleccionado,
        metodoPagoSeleccionado,
      )

      toast({
        title: "Membresía renovada",
        description: mensaje || `Se renovó la membresía de ${socio.nombre}`,
      })

      setPlanSeleccionado(null)
      setMetodoPagoSeleccionado(null)
      onClose()
      onSuccess?.()
    } catch (error: any) {
      console.error("Error renovando membresía:", error)
      toast({
        title: "Error al renovar",
        description: error.message || "No se pudo renovar la membresía",
        variant: "destructive",
      })
    } finally {
      setProcesando(false)
    }
  }

  const handleClose = () => {
    if (procesando) return
    setPlanSeleccionado(null)
    setMetodoPagoSeleccionado(null)
    onClose()
  }

  if (!open || !socio) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative bg-card rounded-xl w-full max-w-md mx-4 overflow-hidden"
        style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Renovar Membresía</h2>
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

        <div className="px-6 py-6 space-y-6">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Socio</p>
              <p className="text-base font-medium text-foreground">{socio.nombre}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Membresía actual</p>
              <p className="text-base font-medium text-foreground">{socio.nombrePlan || "Sin plan"}</p>
            </div>
          </div>

          <div className="border-t border-border"></div>

          {cargandoDatos ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <Label htmlFor="plan-renovacion" className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent" />
                  <span>Plan de membresía</span>
                </Label>
                <select
                  id="plan-renovacion"
                  value={planSeleccionado || ""}
                  onChange={(e) => setPlanSeleccionado(Number(e.target.value))}
                  disabled={procesando || membresias.length === 0}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm disabled:opacity-50"
                >
                  {membresias.map((membresia) => (
                    <option key={membresia.id} value={membresia.id}>
                      {membresia.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="metodo-pago-renovacion" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-accent" />
                  <span>Método de pago</span>
                </Label>
                <select
                  id="metodo-pago-renovacion"
                  value={metodoPagoSeleccionado || ""}
                  onChange={(e) => setMetodoPagoSeleccionado(Number(e.target.value))}
                  disabled={procesando || metodosPago.length === 0}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm disabled:opacity-50"
                >
                  {metodosPago.map((metodo) => (
                    <option key={metodo.metodo_pago_id} value={metodo.metodo_pago_id}>
                      {metodo.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
            <p className="text-xs text-accent">
              <strong>Nota:</strong> Esta acción registrará un nuevo periodo de membresía para el socio.
            </p>
          </div>
        </div>

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
            disabled={
              procesando ||
              cargandoDatos ||
              !metodoPagoSeleccionado ||
              !planSeleccionado ||
              metodosPago.length === 0 ||
              membresias.length === 0
            }
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {procesando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Confirmar Renovación
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
