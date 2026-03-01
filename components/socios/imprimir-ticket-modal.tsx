"use client"

import { useState } from "react"
import { X, Printer, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getPrinterInstance, formatTicketData, isWebUSBSupported } from "@/lib/services/thermal-printer"
import type { CotizacionResponse } from "@/lib/types/socios"

interface ImprimirTicketModalProps {
  open: boolean
  onClose: () => void
  socioData: any
  cotizacion: CotizacionResponse['data']
  metodoPago: string
}

export function ImprimirTicketModal({
  open,
  onClose,
  socioData,
  cotizacion,
  metodoPago
}: ImprimirTicketModalProps) {
  const [conectando, setConectando] = useState(false)
  const [imprimiendo, setImprimiendo] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  const printer = getPrinterInstance()

  // ===== Conectar impresora =====
  const handleConectar = async () => {
    setConectando(true)
    setError(null)
    
    try {
      const resultado = await printer.connect()
      
      if (resultado) {
        setConectado(true)
        setError(null)
      } else {
        setError("No se seleccionó ninguna impresora")
      }
    } catch (err: any) {
      console.error("Error conectando impresora:", err)
      setError(err.message || "Error al conectar con la impresora")
      setConectado(false)
    } finally {
      setConectando(false)
    }
  }

  // ===== Imprimir ticket =====
  const handleImprimir = async () => {
    if (!conectado) {
      setError("Debe conectar la impresora primero")
      return
    }

    setImprimiendo(true)
    setError(null)

    try {
      // Formatear datos del ticket
      const ticketData = formatTicketData(
        socioData,
        {
          nombre_plan: cotizacion.nombre_plan,
          duracion_dias: cotizacion.duracion_dias,
          fecha_inicio: cotizacion.fecha_inicio,
          fecha_vencimiento: cotizacion.fecha_vencimiento,
          desglose_cobro: cotizacion.desglose_cobro,
          precioBase: cotizacion.desglose_cobro.precio_regular,
          total: cotizacion.desglose_cobro.total_a_pagar,
        },
        metodoPago,
        `${Date.now()}`
      )

      // Imprimir ticket
      await printer.printTicket(ticketData)
      
      setExito(true)
      setError(null)
      
      // Cerrar automáticamente después de 2 segundos
      setTimeout(() => {
        handleCerrar()
      }, 2000)
      
    } catch (err: any) {
      console.error("Error imprimiendo ticket:", err)
      setError(err.message || "Error al imprimir el ticket")
    } finally {
      setImprimiendo(false)
    }
  }

  // ===== Cerrar modal =====
  const handleCerrar = () => {
    // Desconectar impresora si está conectada
    if (conectado) {
      printer.disconnect()
    }
    
    onClose()
  }

  // ===== Verificar soporte WebUSB =====
  const webUsbSoportado = isWebUSBSupported()

  return (
    <Dialog open={open} onOpenChange={handleCerrar}>
      <DialogContent className="sm:max-w-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Imprimir Ticket</h2>
          </div>
          <button
            onClick={handleCerrar}
            disabled={imprimiendo}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 py-4">
          {/* Advertencia si WebUSB no está soportado */}
          {!webUsbSoportado && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                WebUSB no está soportado en este navegador. Use Chrome, Edge u Opera.
              </AlertDescription>
            </Alert>
          )}

          {/* Información del socio */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Socio:</span>
              <span className="font-medium">{socioData.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Código:</span>
              <span className="font-medium">{socioData.codigoSocio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Membresía:</span>
              <span className="font-medium">{cotizacion.nombre_plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="font-bold text-lg">
                ${cotizacion.desglose_cobro.total_a_pagar.toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Método de Pago:</span>
              <span className="font-medium">{metodoPago}</span>
            </div>
          </div>

          {/* Estado de la conexión */}
          {conectado && !exito && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Impresora conectada y lista para imprimir
              </AlertDescription>
            </Alert>
          )}

          {/* Mensaje de éxito */}
          {exito && (
            <Alert className="border-green-600 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                ¡Ticket impreso exitosamente!
              </AlertDescription>
            </Alert>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Instrucciones */}
          {!conectado && !error && (
            <p className="text-sm text-muted-foreground">
              Conecte su impresora térmica USB y haga clic en "Conectar Impresora"
              para comenzar.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-4 border-t">
          {!conectado && (
            <>
              <Button
                variant="outline"
                onClick={handleCerrar}
                disabled={conectando || imprimiendo}
                className="flex-1"
              >
                Omitir e Continuar
              </Button>
              <Button
                onClick={handleConectar}
                disabled={conectando || !webUsbSoportado}
                className="flex-1"
              >
                {conectando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {conectando ? "Conectando..." : "Conectar Impresora"}
              </Button>
            </>
          )}

          {conectado && !exito && (
            <>
              <Button
                variant="outline"
                onClick={handleCerrar}
                disabled={imprimiendo}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImprimir}
                disabled={imprimiendo}
                className="flex-1"
              >
                {imprimiendo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Printer className="mr-2 h-4 w-4" />
                {imprimiendo ? "Imprimiendo..." : "Imprimir Ticket"}
              </Button>
            </>
          )}

          {exito && (
            <Button onClick={handleCerrar} className="w-full">
              Cerrar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
