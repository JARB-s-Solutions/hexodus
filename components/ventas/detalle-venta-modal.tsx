"use client"

import { useState, useEffect } from "react"
import { X, Receipt, Loader2, Printer, Ban, CheckCircle2, Clock3 } from "lucide-react"
import { VentasService } from "@/lib/services/ventas"
import type { DetalleVenta, StatusVenta, Venta } from "@/lib/types/ventas"
import { formatCurrency, formatDateTime } from "@/lib/types/ventas"

interface DetalleVentaModalProps {
  ventaId: number | null
  open: boolean
  onClose: () => void
  onPrintInvoice?: (detalleVenta: DetalleVenta) => void
  ventaContexto?: Venta | null
  onSolicitarCancelacion?: (venta: Venta) => void
}

const statusStyles: Record<StatusVenta, string> = {
  exitosa: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelada: "bg-destructive/15 text-destructive border-destructive/30",
  pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/30",
}

const statusLabels: Record<StatusVenta, string> = {
  exitosa: "Exitosa",
  cancelada: "Cancelada",
  pendiente: "Pendiente",
}

export function DetalleVentaModal({ ventaId, open, onClose, onPrintInvoice, ventaContexto, onSolicitarCancelacion }: DetalleVentaModalProps) {
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

  const statusVenta = ventaContexto?.status
  const { fecha, hora } = detalleVenta?.fechaHora 
    ? formatDateTime(detalleVenta.fechaHora) 
    : { fecha: '', hora: '' }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)] md:px-4 md:pb-8 md:pt-8">
      <div className="fixed inset-0 bg-background/85 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl animate-slide-up"
      >
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-3 md:mb-8">
            <div className="flex min-w-0 items-center gap-3 md:gap-4">
              <div className="shrink-0 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
                <Receipt className="h-6 w-6 text-cyan-400 md:h-7 md:w-7" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-white md:text-2xl">Detalle de Venta</h2>
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
              <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-8">
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
                <div className="space-y-4 text-left sm:text-right">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">FECHA Y HORA</p>
                    <p className="text-base font-medium text-slate-300">{fecha} {hora}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">MÉTODO DE PAGO</p>
                    <p className="flex items-center gap-2 text-base font-medium text-slate-300 sm:justify-end">
                      <Receipt className="h-4 w-4" />
                      {detalleVenta.metodoPago}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 md:mb-8 md:gap-4">
                {/* Items Card */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">ARTÍCULOS</p>
                  <p className="text-3xl font-bold text-white">{detalleVenta.totalArticulos}</p>
                </div>

                {/* Status Card */}
                <div className={`border rounded-xl p-4 text-center ${statusVenta ? statusStyles[statusVenta] : 'bg-slate-800/50 border-slate-700/50 text-slate-300'}`}>
                  <p className="text-xs uppercase tracking-wider mb-2">ESTADO</p>
                  <p className="text-lg font-bold flex items-center justify-center gap-2">
                    {statusVenta === 'exitosa' && <CheckCircle2 className="h-4 w-4" />}
                    {statusVenta === 'pendiente' && <Clock3 className="h-4 w-4" />}
                    {statusVenta === 'cancelada' && <Ban className="h-4 w-4" />}
                    {statusVenta ? statusLabels[statusVenta] : 'No disponible'}
                  </p>
                </div>

                {/* Total Amount Card */}
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center">
                  <p className="text-xs text-cyan-400 uppercase tracking-wider mb-2">MONTO TOTAL</p>
                  <p className="text-2xl font-bold text-cyan-400 md:text-3xl">{formatCurrency(detalleVenta.total)}</p>
                </div>
              </div>

              {/* Products List */}
              <div className="mb-6 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 md:p-6">
                <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-4 font-semibold">LISTA DE PRODUCTOS</h3>

                {/* Table Header */}
                <div className="mb-3 hidden grid-cols-12 gap-4 border-b border-slate-700/50 pb-3 sm:grid">
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
                    <div key={p.idDetalle} className="grid grid-cols-2 gap-3 rounded-lg border border-slate-700/40 bg-slate-900/25 p-3 sm:grid-cols-12 sm:items-center sm:border-0 sm:bg-transparent sm:p-0 sm:py-2 md:gap-4">
                      <div className="col-span-2 sm:col-span-5">
                        <p className="text-sm text-white font-medium">{p.nombre}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Esenciales de Gym</p>
                      </div>
                      <div className="sm:col-span-2 sm:text-center">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 sm:hidden">Cant</p>
                        <p className="text-sm text-slate-300 font-medium">{p.cantidad}</p>
                      </div>
                      <div className="text-right sm:col-span-2">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 sm:hidden">Precio</p>
                        <p className="text-sm text-slate-300">{formatCurrency(p.precioUnitario)}</p>
                      </div>
                      <div className="col-span-2 text-right sm:col-span-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 sm:hidden">Subtotal</p>
                        <p className="text-base text-cyan-400 font-semibold">{formatCurrency(p.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Due */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-700/50 pt-4 sm:justify-end">
                  <span className="text-base text-slate-400 sm:mr-8">Total a Pagar</span>
                  <span className="text-2xl font-bold text-cyan-400">{formatCurrency(detalleVenta.total)}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:gap-4">
                <div className="grid grid-cols-1 gap-3 sm:flex sm:items-center">
                  {onPrintInvoice && (
                    <button
                      onClick={() => onPrintInvoice(detalleVenta)}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimir Ticket
                    </button>
                  )}
                  {ventaContexto && ventaContexto.status !== 'cancelada' && onSolicitarCancelacion && (
                    <button
                      onClick={() => onSolicitarCancelacion(ventaContexto)}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-6 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
                    >
                      <Ban className="h-4 w-4" />
                      Cancelar venta
                    </button>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="min-h-12 rounded-lg bg-cyan-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-600"
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
