"use client"

import { useEffect, useState } from "react"
import { X, RefreshCw, CreditCard, Layers, Loader2 } from "lucide-react"
import { Button } from "@/ui/button"
import { Label } from "@/ui/label"
import { toast } from "@/hooks/use-toast"
import { SociosService, MetodosPagoService } from "@/lib/services/socios"
import { MembresiasService } from "@/lib/services/membresias"
import { DualPaymentSelector, type PagoSplitRequest } from "@/components/payment/dual-payment-selector"
import type { Socio, MetodoPago, CotizacionResponse } from "@/lib/types/socios"
import type { Membresia } from "@/lib/types/membresias"
import { extractYmd, getDaysUntilYmd, getTodayYmdInTimeZone } from "@/lib/timezone"
import { ImprimirTicketModal } from "./imprimir-ticket-modal"

interface RenovarMembresiaModalProps {
  open: boolean
  onClose: () => void
  socio: Socio | null
  onSuccess?: () => void
}

function normalizarNombrePlan(valor?: string | null): string {
  if (!valor) return ""
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

export function RenovarMembresiaModal({ open, onClose, socio, onSuccess }: RenovarMembresiaModalProps) {
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [pagosSeleccionados, setPagosSeleccionados] = useState<PagoSplitRequest[]>([])
  const [planSeleccionado, setPlanSeleccionado] = useState<number | null>(null)
  const [planPrecio, setPlanPrecio] = useState(0)
  const [cargandoDatos, setCargandoDatos] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [showImprimirTicket, setShowImprimirTicket] = useState(false)
  const [cotizacionParaTicket, setCotizacionParaTicket] = useState<CotizacionResponse["data"] | null>(null)
  const [metodoPagoParaTicket, setMetodoPagoParaTicket] = useState("")

  const fechaVencimientoYmd = extractYmd(socio?.fechaVencimientoMembresia || "")
  const diasHastaVencimiento = fechaVencimientoYmd ? getDaysUntilYmd(fechaVencimientoYmd) : Number.NaN
  const fechaInicioCotizacion =
    !Number.isNaN(diasHastaVencimiento) && diasHastaVencimiento > 0
      ? fechaVencimientoYmd || getTodayYmdInTimeZone()
      : getTodayYmdInTimeZone()

  useEffect(() => {
    if (!open || !socio) return

    const cargarDatos = async () => {
      setCargandoDatos(true)
      try {
        const [metodos, planesActivos] = await Promise.all([
          MetodosPagoService.getAll(),
          MembresiasService.getAll(),
        ])

        const metodosActivos = metodos.filter((metodo) => metodo.activo)
        const membresiasActivas = planesActivos.filter((plan) => plan.estado === "activo")

        setMetodosPago(metodosActivos)
        setMembresias(membresiasActivas)

        let planId = socio.planId
        let nombrePlanActual = socio.nombrePlan || (socio as any).membresia

        if (!planId || planId <= 0 || !nombrePlanActual) {
          const socioDetalle = await SociosService.getById(socio.id)
          if (!planId || planId <= 0) {
            planId = socioDetalle.planId
          }
          if (!nombrePlanActual) {
            nombrePlanActual = socioDetalle.nombrePlan
          }
        }

        if (planId && planId > 0) {
          setPlanSeleccionado(planId)
          const plan = membresiasActivas.find(p => p.id === planId)
          if (plan) {
            const precioFinal = plan.esOferta && plan.precioOferta ? plan.precioOferta : plan.precioBase
            setPlanPrecio(precioFinal || 0)
          }
        } else {
          const nombreNormalizado = normalizarNombrePlan(nombrePlanActual)
          const planCoincidente = membresiasActivas.find(
            (plan) => normalizarNombrePlan(plan.nombre) === nombreNormalizado
          )

          if (planCoincidente) {
            setPlanSeleccionado(planCoincidente.id)
            const precioFinal = planCoincidente.esOferta && planCoincidente.precioOferta ? planCoincidente.precioOferta : planCoincidente.precioBase
            setPlanPrecio(precioFinal || 0)
          }
        }
      } catch (error: any) {
        console.error("Error cargando datos para renovacion:", error)
        toast({
          title: "Error",
          description: error.message || "No se pudieron cargar planes o metodos de pago",
          variant: "destructive",
        })
      } finally {
        setCargandoDatos(false)
      }
    }

    cargarDatos()
  }, [open, socio])

  const handleConfirmar = async () => {
    if (!socio || !planSeleccionado || pagosSeleccionados.length === 0) {
      toast({
        title: "Datos incompletos",
        description: "Selecciona un plan y al menos un método de pago para renovar",
        variant: "destructive",
      })
      return
    }

    try {
      setProcesando(true)

      const mensaje = await SociosService.renovarMembresia(
        socio.id,
        planSeleccionado,
        pagosSeleccionados,
      )

      toast({
        title: "Membresia renovada",
        description: mensaje || `Se renovo la membresia de ${socio.nombre}`,
      })

      try {
        const cotizacion = await SociosService.cotizar({
          plan_id: planSeleccionado,
          fecha_inicio: fechaInicioCotizacion,
        })
        const metodoPagoNombre = pagosSeleccionados
          .map(p => metodosPago.find(m => m.metodo_pago_id === p.metodo_pago_id)?.nombre || "N/A")
          .join(" + ")

        setCotizacionParaTicket(cotizacion)
        setMetodoPagoParaTicket(metodoPagoNombre)
        setPlanSeleccionado(null)
        setPagosSeleccionados([])
        setShowImprimirTicket(true)
        return
      } catch (cotizError) {
        console.warn("No se pudo obtener cotizacion para el ticket:", cotizError)
      }

      setPlanSeleccionado(null)
      setPagosSeleccionados([])
      onClose()
      onSuccess?.()
    } catch (error: any) {
      console.error("Error renovando membresia:", error)
      toast({
        title: "Error al renovar",
        description: error.message || "No se pudo renovar la membresia",
        variant: "destructive",
      })
    } finally {
      setProcesando(false)
    }
  }

  const handleClose = () => {
    if (procesando || showImprimirTicket) return
    setPlanSeleccionado(null)
    setPagosSeleccionados([])
    onClose()
  }

  const handleImpresionClose = () => {
    setShowImprimirTicket(false)
    setCotizacionParaTicket(null)
    setMetodoPagoParaTicket("")
    onClose()
    onSuccess?.()
  }

  if (!open || !socio) return null

  if (showImprimirTicket && cotizacionParaTicket) {
    return (
      <ImprimirTicketModal
        open={true}
        onClose={handleImpresionClose}
        socioData={socio}
        cotizacion={cotizacionParaTicket}
        metodoPago={metodoPagoParaTicket}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative mx-4 w-full max-w-md overflow-hidden rounded-xl bg-card"
        style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}
      >
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Renovar Membresia</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={procesando}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Socio</p>
              <p className="text-base font-medium text-foreground">{socio.nombre}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Membresia actual</p>
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
                  <span>Plan de membresia</span>
                </Label>
                <select
                  id="plan-renovacion"
                  value={planSeleccionado || ""}
                  onChange={(e) => {
                    const newPlanId = Number(e.target.value)
                    setPlanSeleccionado(newPlanId)
                    const plan = membresias.find(p => p.id === newPlanId)
                    const precioFinal = plan ? (plan.esOferta && plan.precioOferta ? plan.precioOferta : plan.precioBase) : 0
                    setPlanPrecio(precioFinal || 0)
                  }}
                  disabled={procesando || membresias.length === 0}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
                >
                  <option value="" disabled>
                    Selecciona un plan
                  </option>
                  {membresias.map((membresia) => (
                    <option key={membresia.id} value={membresia.id}>
                      {membresia.nombre} (${((membresia.esOferta && membresia.precioOferta) ? membresia.precioOferta : membresia.precioBase).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {planSeleccionado && (
                <div className="space-y-3">
                  {planPrecio > 0 ? (
                    <DualPaymentSelector
                      total={planPrecio}
                      metodosPago={metodosPago}
                      onPagosChange={setPagosSeleccionados}
                      disabled={procesando}
                      labelText="Métodos de Pago"
                    />
                  ) : (
                    <div className="p-3 rounded-lg border border-border bg-muted/10 text-sm text-muted-foreground">
                      Precio del plan no disponible. Elige otro plan o consulta el detalle.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="rounded-lg border border-accent/20 bg-accent/10 p-3">
            <p className="text-xs text-accent">
              <strong>Renovación automática:</strong> si la membresía sigue vigente, los días se suman al final del ciclo actual; si ya venció, inicia hoy. Puedes pagar con hasta 2 métodos diferentes.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              {Number.isNaN(diasHastaVencimiento)
                ? "La fecha de vencimiento no está disponible; el backend calculará automáticamente el inicio del nuevo ciclo."
                : diasHastaVencimiento > 0
                  ? `Renovación anticipada: faltan ${diasHastaVencimiento} día(s) para el vencimiento.`
                  : diasHastaVencimiento === 0
                    ? "Renovación inmediata: la membresía vence hoy."
                    : `Renovación vencida: el socio venció hace ${Math.abs(diasHastaVencimiento)} día(s).`}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
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
              pagosSeleccionados.length === 0 ||
              !planSeleccionado ||
              metodosPago.length === 0 ||
              membresias.length === 0
            }
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {procesando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Confirmar Renovacion
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
