"use client"

import { useState, useEffect } from "react"
import { X, Receipt, Loader2, Printer } from "lucide-react"
import { VentasService } from "@/lib/services/ventas"
import type { DetalleVenta } from "@/lib/types/ventas"
import { formatCurrency, formatDateTime } from "@/lib/types/ventas"

interface DetalleVentaModalProps {
  ventaId: number | null
  open: boolean
  onClose: () => void
  onPrintInvoice?: (detalleVenta: DetalleVenta) => void
}

export function DetalleVentaModal({ ventaId, open, onClose, onPrintInvoice }: DetalleVentaModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-background/85 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden animate-slide-up shadow-2xl border border-slate-700/50"
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20">
                <Receipt className="h-7 w-7 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Detalle de Venta</h2>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">SISTEMA DE GESTIÓN DE INVENTARIO</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-400 mb-4" />
              <p className="text-sm text-slate-400">Cargando detalle...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={cargarDetalle}
                className="mt-2 text-xs text-cyan-400 hover:underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Content */}
          {detalleVenta && !loading && (
            <>
              {/* Info Grid - Top Section */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">ID DE VENTA</p>
                    <p className="text-2xl font-bold text-cyan-400">{detalleVenta.idVentaStr}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">CLIENTE</p>
                    <p className="text-lg font-semibold text-white">{detalleVenta.cliente}</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4 text-right">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">FECHA Y HORA</p>
                    <p className="text-base font-medium text-slate-300">{fecha} {hora}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">MÉTODO DE PAGO</p>
                    <p className="text-base font-medium text-slate-300 flex items-center justify-end gap-2">
                      <Receipt className="h-4 w-4" />
                      {detalleVenta.metodoPago}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* Items Card */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">ARTÍCULOS</p>
                  <p className="text-3xl font-bold text-white">{detalleVenta.totalArticulos}</p>
                </div>

                {/* Status Card */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                  <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2">ESTADO</p>
                  <p className="text-lg font-bold text-emerald-400">COMPLETADO</p>
                </div>

                {/* Total Amount Card */}
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center">
                  <p className="text-xs text-cyan-400 uppercase tracking-wider mb-2">MONTO TOTAL</p>
                  <p className="text-3xl font-bold text-cyan-400">{formatCurrency(detalleVenta.total)}</p>
                </div>
              </div>

              {/* Products List */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 mb-6">
                <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-4 font-semibold">LISTA DE PRODUCTOS</h3>
                
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 pb-3 mb-3 border-b border-slate-700/50">
                  <div className="col-span-5">
                    <p className="text-xs text-slate-400 font-medium">Descripción del Producto</p>
                  </div>
                  <div className="col-span-2 text-center">
                    <p className="text-xs text-slate-400 font-medium">Cant</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-xs text-slate-400 font-medium">Precio Unit.</p>
                  </div>
                  <div className="col-span-3 text-right">
                    <p className="text-xs text-slate-400 font-medium">Subtotal</p>
                  </div>
                </div>

                {/* Table Body */}
                <div className="space-y-3">
                  {detalleVenta.productos.map((p) => (
                    <div key={p.idDetalle} className="grid grid-cols-12 gap-4 items-center py-2">
                      <div className="col-span-5">
                        <p className="text-sm text-white font-medium">{p.nombre}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Esenciales de Gym</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <p className="text-sm text-slate-300 font-medium">{p.cantidad}</p>
                      </div>
                      <div className="col-span-2 text-right">
                        <p className="text-sm text-slate-300">{formatCurrency(p.precioUnitario)}</p>
                      </div>
                      <div className="col-span-3 text-right">
                        <p className="text-base text-cyan-400 font-semibold">{formatCurrency(p.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Due */}
                <div className="border-t border-slate-700/50 mt-4 pt-4 flex justify-end items-center">
                  <span className="text-base text-slate-400 mr-8">Total a Pagar</span>
                  <span className="text-2xl font-bold text-cyan-400">{formatCurrency(detalleVenta.total)}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between items-center gap-4">
                {onPrintInvoice && (
                  <button
                    onClick={() => onPrintInvoice(detalleVenta)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium text-white transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir Ticket
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  Cerrar Detalle
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
