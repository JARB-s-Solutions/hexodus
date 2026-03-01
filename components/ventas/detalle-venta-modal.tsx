"use client"

import { useState, useEffect } from "react"
import { X, Receipt, Clock, CreditCard, User, Package, Loader2 } from "lucide-react"
import { VentasService } from "@/lib/services/ventas"
import type { DetalleVenta } from "@/lib/types/ventas"
import { formatCurrency, formatDateTime } from "@/lib/types/ventas"

interface DetalleVentaModalProps {
  ventaId: number | null
  open: boolean
  onClose: () => void
}

export function DetalleVentaModal({ ventaId, open, onClose }: DetalleVentaModalProps) {
  const [detalleVenta, setDetalleVenta] = useState<DetalleVenta | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && ventaId) {
      cargarDetalle()
    } else {
      // Limpiar cuando se cierra
      setDetalleVenta(null)
      setError(null)
    }
  }, [open, ventaId])

  async function cargarDetalle() {
    if (!ventaId) return
    
    try {
      setLoading(true)
      setError(null)
      console.log(`📥 Cargando detalle de venta ID: ${ventaId}`)
      
      const detalle = await VentasService.getById(ventaId)
      setDetalleVenta(detalle)
      
      console.log('✅ Detalle cargado:', detalle)
    } catch (error: any) {
      console.error('❌ Error al cargar detalle:', error)
      setError(error.message || 'No se pudo cargar el detalle de la venta')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const { fecha, hora } = detalleVenta?.fechaHora 
    ? formatDateTime(detalleVenta.fechaHora) 
    : { fecha: '', hora: '' }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-background/85 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-card rounded-xl w-full max-w-lg overflow-hidden animate-slide-up shadow-2xl"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
            <h3 className="text-lg font-bold text-accent flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {detalleVenta ? `Detalle de Venta ${detalleVenta.idVentaStr}` : 'Detalle de Venta'}
            </h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent mb-3" />
              <p className="text-sm text-muted-foreground">Cargando detalle...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={cargarDetalle}
                className="mt-2 text-xs text-accent hover:underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Content */}
          {detalleVenta && !loading && (
            <>
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="text-sm font-medium text-foreground">{detalleVenta.cliente}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha y Hora</p>
                    <p className="text-sm font-medium text-foreground">{fecha} - {hora}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Método de Pago</p>
                    <p className="text-sm font-medium text-foreground">{detalleVenta.metodoPago}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Artículos</p>
                    <p className="text-sm font-medium text-foreground">{detalleVenta.totalArticulos}</p>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="bg-background rounded-lg p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Productos ({detalleVenta.productos.length})
                </h4>
                <div className="space-y-2">
                  {detalleVenta.productos.map((p) => (
                    <div key={p.idDetalle} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency(p.precioUnitario)} x {p.cantidad}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-accent ml-4">
                        {formatCurrency(p.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">Total</span>
                  <span className="text-lg font-bold text-accent">{formatCurrency(detalleVenta.total)}</span>
                </div>
              </div>
            </>
          )}

          {/* Close */}
          <div className="flex justify-end mt-5">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
