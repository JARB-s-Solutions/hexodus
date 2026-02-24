"use client"

import { X, Package, MapPin, Calendar } from "lucide-react"
import type { Producto } from "@/lib/inventario-data"
import { categoriaInfo, estadoStockInfo, formatPrecio, formatFechaCorta } from "@/lib/inventario-data"

interface DetalleProductoModalProps {
  open: boolean
  onClose: () => void
  producto: Producto | null
}

export function DetalleProductoModal({ open, onClose, producto }: DetalleProductoModalProps) {
  if (!open || !producto) return null

  const cat = categoriaInfo[producto.categoria]
  const est = estadoStockInfo[producto.estadoStock]
  const margen = producto.precioVenta - producto.precioCompra
  const margenPct = producto.precioCompra > 0 ? ((margen / producto.precioCompra) * 100).toFixed(1) : "0"

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full border border-border animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-accent" />
            Detalle del Producto
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Name + code */}
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-accent">{producto.codigo}</span>
            </div>
            <div>
              <h4 className="text-base font-semibold text-foreground">{producto.nombre}</h4>
              <p className="text-sm text-muted-foreground">{producto.marca}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cat.bg} ${cat.color}`}>{cat.nombre}</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${est.bg} ${est.color}`}>{est.nombre}</span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Precio Venta</p>
              <p className="text-lg font-bold text-primary">{formatPrecio(producto.precioVenta)}</p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Precio Compra</p>
              <p className="text-lg font-bold text-foreground">{formatPrecio(producto.precioCompra)}</p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Stock Actual</p>
              <p className="text-lg font-bold text-foreground">{producto.stockActual} <span className="text-xs font-normal text-muted-foreground">/ min: {producto.stockMinimo}</span></p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Margen</p>
              <p className="text-lg font-bold text-[#22C55E]">{formatPrecio(margen)} <span className="text-xs font-normal">({margenPct}%)</span></p>
            </div>
          </div>

          {/* Extra info */}
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-accent" />
              <span>Ubicacion: {producto.ubicacion}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 text-accent" />
              <span>Ultima actualizacion: {formatFechaCorta(producto.fechaActualizacion)}</span>
            </div>
          </div>

          {producto.descripcion && (
            <p className="text-sm text-muted-foreground bg-background rounded-lg p-3 border border-border">
              {producto.descripcion}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
