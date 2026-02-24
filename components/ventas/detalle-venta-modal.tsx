"use client"

import { X, Receipt, Clock, CreditCard, User } from "lucide-react"
import type { Venta } from "@/lib/ventas-data"
import { formatCurrency, getMetodoPagoLabel } from "@/lib/ventas-data"

interface DetalleVentaModalProps {
  venta: Venta | null
  open: boolean
  onClose: () => void
}

export function DetalleVentaModal({ venta, open, onClose }: DetalleVentaModalProps) {
  if (!open || !venta) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-background/85 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-card rounded-xl w-full max-w-lg overflow-hidden animate-slide-up"
        style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
            <h3 className="text-lg font-bold text-accent flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Detalle de Venta {venta.id}
            </h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="text-sm font-medium text-foreground">{venta.cliente}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha y Hora</p>
                <p className="text-sm font-medium text-foreground">{venta.fecha} - {venta.hora}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Metodo de Pago</p>
                <p className="text-sm font-medium text-foreground">{getMetodoPagoLabel(venta.metodoPago)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Receipt className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-bold text-primary">{formatCurrency(venta.total)}</p>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-background rounded-lg p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Productos ({venta.productos.length})
            </h4>
            <div className="space-y-2">
              {venta.productos.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-sm text-foreground">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(p.precio)} x {p.cantidad}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {formatCurrency(p.precio * p.cantidad)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(venta.total)}</span>
            </div>
          </div>

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
