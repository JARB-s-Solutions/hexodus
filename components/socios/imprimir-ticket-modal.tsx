"use client"

import { useState, useEffect } from "react"
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
  const [autoConectando, setAutoConectando] = useState(false)

  const printer = getPrinterInstance()

  // ===== Resetear estados cuando se cierra el modal =====
  useEffect(() => {
    if (!open) {
      // Resetear todos los estados cuando se cierra
      setConectando(false)
      setImprimiendo(false)
      setConectado(false)
      setError(null)
      setExito(false)
      setAutoConectando(false)
    }
  }, [open])

  // ===== Auto-conectar y auto-imprimir al abrir modal =====
  useEffect(() => {
    if (open && !conectado && !exito && !autoConectando) {
      // Pequeño delay para asegurar que el modal esté completamente renderizado
      // y cualquier operación pendiente haya terminado
      const timer = setTimeout(() => {
        intentarAutoImpresion()
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [open])

  const intentarAutoImpresion = async () => {
    setAutoConectando(true)
    setError(null)
    
    try {
      console.log('🔄 Intentando conexión automática...')
      
      // Verificar si ya está conectado
      if (printer.isConnected()) {
        console.log('✅ Impresora ya estaba conectada, imprimiendo directamente...')
        setConectado(true)
        await imprimirAutomatico()
        return
      }
      
      // Intentar conectar a dispositivo guardado
      const conectadoAuto = await printer.connectToSavedDevice()
      
      if (conectadoAuto) {
        setConectado(true)
        console.log('✅ Conexión automática exitosa, imprimiendo...')
        
        // Auto-imprimir inmediatamente
        await imprimirAutomatico()
      } else {
        console.log('📭 No hay impresora guardada, se requiere conexión manual')
      }
    } catch (err: any) {
      console.error('Error en auto-conexión:', err)
      // No mostrar error aquí, el usuario puede conectar manualmente
    } finally {
      setAutoConectando(false)
    }
  }

  const imprimirAutomatico = async () => {
    setImprimiendo(true)
    
    try {
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

      await printer.printTicket(ticketData)
      
      setExito(true)
      setError(null)
      
      // Cerrar automáticamente después de 2 segundos
      setTimeout(() => {
        handleCerrar()
      }, 2000)
      
    } catch (err: any) {
      console.error("Error en impresión automática:", err)
      setError(err.message || "Error al imprimir el ticket")
      setConectado(false) // Permitir reconectar manualmente
    } finally {
      setImprimiendo(false)
    }
  }

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
    // IMPORTANTE: NO desconectamos la impresora aquí
    // La conexión USB se mantiene activa entre impresiones para permitir auto-impresión
    // Esto permite que la próxima vez que se abra el modal, la impresora ya esté
    // conectada y lista para imprimir automáticamente sin intervención del usuario
    // La impresora solo se desconecta si hay un error o si el usuario cierra el navegador
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

          {/* Estado de auto-conectando */}
          {autoConectando && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription className="text-blue-600">
                Conectando automáticamente a impresora guardada...
              </AlertDescription>
            </Alert>
          )}

          {/* Estado de la conexión */}
          {conectado && !exito && !imprimiendo && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Impresora conectada y lista para imprimir
              </AlertDescription>
            </Alert>
          )}

          {/* Estado de imprimiendo */}
          {imprimiendo && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription className="text-blue-600">
                Imprimiendo ticket automáticamente...
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
          {!conectado && !error && !autoConectando && !imprimiendo && !exito && (
            <p className="text-sm text-muted-foreground">
              Conecte su impresora térmica USB y haga clic en "Conectar Impresora"
              para comenzar.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-4 border-t">
          {/* Botones cuando está auto-conectando o imprimiendo automáticamente */}
          {(autoConectando || (imprimiendo && !conectado)) && (
            <Button
              variant="outline"
              onClick={handleCerrar}
              disabled={true}
              className="w-full"
            >
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </Button>
          )}

          {/* Botones de conexión manual */}
          {!conectado && !autoConectando && !imprimiendo && !exito && (
            <>
              <Button
                variant="outline"
                onClick={handleCerrar}
                disabled={conectando}
                className="flex-1"
              >
                Omitir y Continuar
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
