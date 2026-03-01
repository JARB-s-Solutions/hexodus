"use client"

import { useState } from "react"
import { X, PackagePlus } from "lucide-react"
import type { ProductoExtendido } from "@/lib/types/productos"

interface AjustarStockModalProps {
  open: boolean
  onClose: () => void
  producto: ProductoExtendido | null
  onAjustar: (productoId: number, cantidad: number) => void
}

export function AjustarStockModal({ open, onClose, producto, onAjustar }: AjustarStockModalProps) {
  const [cantidad, setCantidad] = useState("")

  if (!open || !producto) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const c = parseInt(cantidad)
    if (isNaN(c)) return
    onAjustar(producto!.id, c)
    setCantidad("")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl max-w-md w-full border border-border animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-[#22C55E]" />
            Ajustar Stock
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="p-3 bg-background rounded-lg border border-border">
            <p className="text-sm font-semibold text-foreground">{producto.nombre}</p>
            <p className="text-xs text-muted-foreground">Codigo: {producto.codigo} | Stock actual: {producto.stockActual}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Cantidad a ajustar (negativo para reducir)
            </label>
            <input
              type="number"
              required
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ej: 10 o -5"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="px-4 py-2 text-sm font-semibold bg-[#22C55E] text-background rounded-lg transition-all hover:bg-[#16A34A]">
              Ajustar Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
