"use client"

import { useState, useEffect } from "react"
import { X, Printer, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/ui/button"
import { Dialog, DialogContent } from "@/ui/dialog"
import { Alert, AlertDescription } from "@/ui/alert"
import { getPrinterInstance, formatVentaTicketData, isWebUSBSupported } from "@/lib/services/thermal-printer"
import type { DetalleVenta } from "@/lib/types/ventas"

interface ImprimirTicketVentaModalProps {
  open: boolean
  onClose: () => void
  detalleVenta: DetalleVenta | null
}

export function ImprimirTicketVentaModal({
  open,
  onClose,
  detalleVenta
}: ImprimirTicketVentaModalProps) {
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
    if (open && detalleVenta && !conectado && !exito && !autoConectando) {
      // Pequeño delay para asegurar que el modal esté completamente renderizado
      const timer = setTimeout(() => {
        intentarAutoImpresion()
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [open, detalleVenta])

  const intentarAutoImpresion = async () => {
    if (!detalleVenta) return
    
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
    if (!detalleVenta) return
    
    setImprimiendo(true)
    
    try {
      const ticketData = formatVentaTicketData(detalleVenta)

      await printer.printVentaTicket(ticketData)
      
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
    } finally {
      setConectando(false)
    }
  }

  // ===== Imprimir ticket =====
  const handleImprimir = async () => {
    if (!detalleVenta) return
    
    setImprimiendo(true)
    setError(null)
    
    try {
      const ticketData = formatVentaTicketData(detalleVenta)

      await printer.printVentaTicket(ticketData)
      
      setExito(true)
      
      // Cerrar automáticamente después de 1.5 segundos
      setTimeout(() => {
        handleCerrar()
      }, 1500)
      
    } catch (err: any) {
      console.error("Error imprimiendo ticket:", err)
      setError(err.message || "Error al imprimir el ticket")
    } finally {
      setImprimiendo(false)
    }
  }

  // ===== Cerrar modal =====
  const handleCerrar = () => {
    onClose()
  }

  if (!open || !detalleVenta) return null

  // Check if WebUSB is supported
  const webUSBSupported = isWebUSBSupported()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={handleCerrar} />
      
      <div className="relative bg-card rounded-xl w-full max-w-md p-6 shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
          <h3 className="text-lg font-bold text-accent flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Imprimir Ticket de Venta
          </h3>
          <button
            onClick={handleCerrar}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={imprimiendo}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* WebUSB not supported */}
          {!webUSBSupported && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Tu navegador no soporta WebUSB. Usa Chrome, Edge o Opera.
              </AlertDescription>
            </Alert>
          )}

          {/* Auto-connecting message */}
          {autoConectando && !conectado && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Buscando impresora guardada...
              </AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success message */}
          {exito && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                ¡Ticket impreso correctamente!
              </AlertDescription>
            </Alert>
          )}

          {/* Info */}
          {!conectado && !autoConectando && webUSBSupported && (
            <div className="bg-accent/10 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-semibold mb-2">Instrucciones:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Conecta tu impresora térmica USB</li>
                <li>Haz clic en "Conectar Impresora"</li>
                <li>Selecciona tu impresora en el diálogo</li>
                <li>El ticket se imprimirá automáticamente</li>
              </ol>
            </div>
          )}

          {conectado && !exito && !imprimiendo && (
            <div className="bg-green-500/10 rounded-lg p-4 text-sm text-green-600">
              <CheckCircle className="h-4 w-4 inline mr-2" />
              Impresora conectada
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleCerrar}
            className="flex-1"
            disabled={imprimiendo}
          >
            Cancelar
          </Button>
          
          {!conectado ? (
            <Button
              onClick={handleConectar}
              className="flex-1"
              disabled={conectando || !webUSBSupported || autoConectando}
            >
              {conectando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Conectar Impresora
                </>
              )}
            </Button>
          ) : !exito ? (
            <Button
              onClick={handleImprimir}
              className="flex-1"
              disabled={imprimiendo}
            >
              {imprimiendo ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Imprimiendo...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
