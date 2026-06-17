"use client"

import { useState, useEffect } from "react"
import { X, DollarSign, CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/ui/button"
import { Label } from "@/ui/label"
import { toast } from "@/hooks/use-toast"
import { SociosService } from "@/lib/services/socios"
import { DualPaymentSelector, type PagoSplitRequest } from "@/components/payment/dual-payment-selector"
import type { Socio, MetodoPago, CotizacionResponse } from "@/lib/types/socios"
import { ImprimirTicketModal } from "./imprimir-ticket-modal"

interface CobrarMembresiaModalProps {
  open: boolean
  onClose: () => void
  socio: Socio | null
  onSuccess?: () => void
}

export function CobrarMembresiaModal({ open, onClose, socio, onSuccess }: CobrarMembresiaModalProps) {
  const [cargandoMetodos, setCargandoMetodos] = useState(false)
  const [cargandoAdeudo, setCargandoAdeudo] = useState(false)
  const [pagosSeleccionados, setPagosSeleccionados] = useState<PagoSplitRequest[]>([])
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [procesando, setProcesando] = useState(false)
  const [showImprimirTicket, setShowImprimirTicket] = useState(false)
  const [cotizacionParaTicket, setCotizacionParaTicket] = useState<CotizacionResponse['data'] | null>(null)
  const [metodoPagoParaTicket, setMetodoPagoParaTicket] = useState("")
  const [montoACobrar, setMontoACobrar] = useState(0)
  const [socioIdCobro, setSocioIdCobro] = useState<number | null>(null)

  const normalizarMonto = (value: unknown): number => {
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }

  const normalizarId = (value: unknown): number | null => {
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  }

  const resolverSocioId = async (): Promise<number | null> => {
    if (!socio) return null

    const idDirecto =
      normalizarId(socio.id) ||
      normalizarId((socio as any).socioDbId) ||
      normalizarId((socio as any).socio_id)

    if (idDirecto) return idDirecto

    const codigo = String(
      socio.codigoSocio ||
      (socio as any).codigo_socio ||
      (socio as any).clave ||
      (socio as any).socioId ||
      ''
    ).trim()

    if (codigo.length >= 2) {
      const resultados = await SociosService.buscar(codigo)
      const exacto = resultados.find((item) => item.codigo === codigo)
      const match = exacto || resultados[0]
      if (match?.id) return match.id
    }

    return null
  }

  // Cargar métodos de pago al abrir el modal
  useEffect(() => {
    if (open && socio) {
      cargarMetodosPago()
      resolverMontoPendiente()
    }
  }, [open, socio])

  const resolverMontoPendiente = async () => {
    if (!socio) return

    setPagosSeleccionados([])
    setSocioIdCobro(null)

    const montoInicial = normalizarMonto(socio.montoPendiente ?? socio.precioMembresia)
    const idResuelto = await resolverSocioId()
    setSocioIdCobro(idResuelto)

    if (montoInicial > 0) {
      setMontoACobrar(montoInicial)
      return
    }

    setCargandoAdeudo(true)
    try {
      if (!idResuelto) {
        throw new Error("No se pudo identificar el ID del socio para consultar el adeudo.")
      }

      const socioCompleto = await SociosService.getById(idResuelto)
      const montoDetalle = normalizarMonto(socioCompleto.montoPendiente ?? socioCompleto.precioMembresia)

      if (montoDetalle > 0) {
        setMontoACobrar(montoDetalle)
        return
      }

      const historial = await SociosService.getHistorialPagos(socio.id)
      const membresiaPendiente = historial.historial.find((entrada) => entrada.estado_pago === 'sin_pagar')
      const montoHistorial = normalizarMonto(membresiaPendiente?.precio_cobrado)

      if (montoHistorial > 0) {
        setMontoACobrar(montoHistorial)
        return
      }

      setMontoACobrar(0)
    } catch (error: any) {
      console.error("Error obteniendo monto pendiente:", error)
      setMontoACobrar(0)
      toast({
        title: "No se pudo obtener el monto pendiente",
        description: error.message || "Intenta abrir el cobro nuevamente.",
        variant: "destructive",
      })
    } finally {
      setCargandoAdeudo(false)
    }
  }

  const cargarMetodosPago = async () => {
    setCargandoMetodos(true)
    try {
      // Importar dinámicamente el servicio de métodos de pago
      const { MetodosPagoService } = await import("@/lib/services/socios")
      const metodos = await MetodosPagoService.getAll()
      setMetodosPago(metodos.filter(m => m.activo))
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
    if (!socio || pagosSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un método de pago",
        variant: "destructive",
      })
      return
    }

    const idParaCobro = socioIdCobro || await resolverSocioId()

    if (!idParaCobro) {
      toast({
        title: "No se pudo cobrar membresía",
        description: "No se pudo identificar el socio correcto para registrar el pago.",
        variant: "destructive",
      })
      return
    }

    setProcesando(true)
    console.log("💳 Cobrando membresía pendiente:")
    console.log("   Socio ID:", idParaCobro)
    console.log("   Plan ID:", socio.planId)
    console.log("   Pagos:", pagosSeleccionados)
    console.log("   Estado actual:", socio.estadoPago)

    try {
      // Endpoint dedicado para cobro de adeudo - ahora acepta pagos[]
      const mensaje = await SociosService.pagarMembresiaPendiente(idParaCobro, pagosSeleccionados)

      console.log("✅ Membresía cobrada exitosamente")
      
      toast({
        title: "Membresía cobrada",
        description: mensaje || `Se ha registrado el pago de ${socio.nombre}`,
      })

      // Intentar obtener cotización para el ticket
      try {
        let planId = socio.planId
        let fechaInicio = socio.fechaInicioMembresia

        // Si los datos no vienen en la lista, buscar el socio completo
        if (!planId || planId <= 0 || !fechaInicio) {
          const socioActualizado = await SociosService.getById(idParaCobro)
          planId = socioActualizado.planId
          fechaInicio = socioActualizado.fechaInicioMembresia
        }

        if (planId > 0 && fechaInicio) {
          const cotizacion = await SociosService.cotizar({
            plan_id: planId,
            fecha_inicio: fechaInicio.split('T')[0],
          })
          const metodoPagoNombre = pagosSeleccionados
            .map(p => metodosPago.find(m => m.metodo_pago_id === p.metodo_pago_id)?.nombre || "N/A")
            .join(" + ")
          setCotizacionParaTicket(cotizacion)
          setMetodoPagoParaTicket(metodoPagoNombre)
          setPagosSeleccionados([])
          setShowImprimirTicket(true)
          return // El cierre real ocurre cuando se cierra el modal de impresión
        }
      } catch (cotizError) {
        console.warn('No se pudo obtener cotización para el ticket:', cotizError)
      }

      // Fallback: cerrar normalmente si cotizar falla
      setPagosSeleccionados([])
      onClose()
      if (onSuccess) onSuccess()
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
    if (!procesando && !showImprimirTicket) {
      setPagosSeleccionados([])
      setMontoACobrar(0)
      setSocioIdCobro(null)
      onClose()
    }
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
        <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
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

            {/* Monto a cobrar */}
            <div>
              <p className="text-sm text-muted-foreground">Monto a Cobrar</p>
              <p className="text-2xl font-bold text-accent">
                ${montoACobrar.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-border"></div>

          {/* Método de pago - Ahora con selector dual */}
          {cargandoMetodos || cargandoAdeudo ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : montoACobrar <= 0 ? (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
              <p className="text-sm font-medium text-amber-500">No se encontró un monto pendiente válido.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Revisa el historial de membresías del socio antes de registrar el cobro.
              </p>
            </div>
          ) : metodosPago.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay métodos de pago disponibles</p>
          ) : (
            <DualPaymentSelector
              total={montoACobrar}
              metodosPago={metodosPago}
              onPagosChange={setPagosSeleccionados}
              disabled={procesando}
              labelText="Formas de Pago"
            />
          )}

          {/* Nota informativa */}
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
            <p className="text-xs text-accent">
              <strong>Nota:</strong> Al confirmar, se registrará el pago de la membresía y el estado
              cambiará a "PAGADO". Puedes dividir el pago entre hasta 2 métodos diferentes.
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
            disabled={procesando || pagosSeleccionados.length === 0 || cargandoMetodos || cargandoAdeudo || montoACobrar <= 0}
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
