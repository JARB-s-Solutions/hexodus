"use client"

import { useEffect, useState } from "react"
import { X, RefreshCw, CreditCard, Layers, Loader2 } from "lucide-react"
import { Button } from "@/ui/button"
import { Label } from "@/ui/label"
import { toast } from "@/hooks/use-toast"
import { SociosService, MetodosPagoService } from "@/lib/services/socios"
import { MembresiasService } from "@/lib/services/membresias"
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
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<number | null>(null)
  const [planSeleccionado, setPlanSeleccionado] = useState<number | null>(null)
  const [cargandoDatos, setCargandoDatos] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [showImprimirTicket, setShowImprimirTicket] = useState(false)
  const [cotizacionParaTicket, setCotizacionParaTicket] = useState<CotizacionResponse["data"] | null>(null)
  const [metodoPagoParaTicket, setMetodoPagoParaTicket] = useState("")

  const fechaVencimientoYmd = extractYmd(socio?.fechaVencimientoMembresia || "")
  const diasHastaVencimiento = fechaVencimientoYmd ? getDaysUntilYmd(fechaVencimientoYmd) : Number.NaN
  const puedeRenovarPorFecha =
    !Number.isNaN(diasHastaVencimiento) && diasHastaVencimiento <= 0

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

        if (metodosActivos.length > 0) {
          setMetodoPagoSeleccionado(metodosActivos[0].metodo_pago_id)
        }

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
        } else {
          const nombreNormalizado = normalizarNombrePlan(nombrePlanActual)
          const planCoincidente = membresiasActivas.find(
            (plan) => normalizarNombrePlan(plan.nombre) === nombreNormalizado
          )

          setPlanSeleccionado(planCoincidente?.id ?? null)
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
    if (!socio || !planSeleccionado || !metodoPagoSeleccionado) {
      toast({
        title: "Datos incompletos",
        description: "Selecciona un plan y un metodo de pago para renovar",
        variant: "destructive",
      })
      return
    }

    if (!puedeRenovarPorFecha) {
      const detalleDias = Number.isNaN(diasHastaVencimiento)
        ? "No se pudo determinar la fecha de vencimiento."
        : `Faltan ${diasHastaVencimiento} dia(s) para el vencimiento.`

      toast({
        title: "Renovacion no disponible",
        description: `${detalleDias} La renovacion se habilita cuando la membresia vence hoy o ya vencio.`,
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
        title: "Membresia renovada",
        description: mensaje || `Se renovo la membresia de ${socio.nombre}`,
      })

      try {
        const today = getTodayYmdInTimeZone()
        const cotizacion = await SociosService.cotizar({
          plan_id: planSeleccionado,
          fecha_inicio: today,
        })
        const metodoPagoNombre =
          metodosPago.find((metodo) => metodo.metodo_pago_id === metodoPagoSeleccionado)?.nombre || "N/A"

        setCotizacionParaTicket(cotizacion)
        setMetodoPagoParaTicket(metodoPagoNombre)
        setPlanSeleccionado(null)
        setMetodoPagoSeleccionado(null)
        setShowImprimirTicket(true)
        return
      } catch (cotizError) {
        console.warn("No se pudo obtener cotizacion para el ticket:", cotizError)
      }

      setPlanSeleccionado(null)
      setMetodoPagoSeleccionado(null)
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
    setMetodoPagoSeleccionado(null)
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

        <div className="space-y-6 px-6 py-6">
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
                  onChange={(e) => setPlanSeleccionado(Number(e.target.value))}
                  disabled={procesando || membresias.length === 0}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
                >
                  <option value="" disabled>
                    Selecciona un plan
                  </option>
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
                  <span>Metodo de pago</span>
                </Label>
                <select
                  id="metodo-pago-renovacion"
                  value={metodoPagoSeleccionado || ""}
                  onChange={(e) => setMetodoPagoSeleccionado(Number(e.target.value))}
                  disabled={procesando || metodosPago.length === 0}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
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

          <div className="rounded-lg border border-accent/20 bg-accent/10 p-3">
            <p className="text-xs text-accent">
              <strong>Renovacion disponible:</strong> cuando la membresia vence hoy o ya vencio.
            </p>
          </div>

          {!puedeRenovarPorFecha && (
            <div className="rounded-lg border border-primary/25 bg-primary/10 p-3">
              <p className="text-xs text-primary">
                Renovacion bloqueada: {Number.isNaN(diasHastaVencimiento)
                  ? "fecha de vencimiento no disponible."
                  : `faltan ${diasHastaVencimiento} dia(s) para el vencimiento.`}
              </p>
            </div>
          )}
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
              !puedeRenovarPorFecha ||
              !metodoPagoSeleccionado ||
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
