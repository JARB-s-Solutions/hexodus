"use client"

import { useState, useMemo } from "react"
import { X, Search, Plus, Minus, Trash2, User, Package, PlusCircle } from "lucide-react"
import type { ProductoCatalogo, ProductoVenta, MetodoPago } from "@/lib/ventas-data"
import { productosCatalogo, formatCurrency } from "@/lib/ventas-data"

interface NuevaVentaModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (data: {
    cliente: string
    metodoPago: MetodoPago
    productos: ProductoVenta[]
  }) => void
}

export function NuevaVentaModal({ open, onClose, onConfirm }: NuevaVentaModalProps) {
  const [cliente, setCliente] = useState("")
  const [metodoPago, setMetodoPago] = useState<MetodoPago | "">("")
  const [productoBuscar, setProductoBuscar] = useState("")
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoVenta[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const sugerencias = useMemo(() => {
    if (!productoBuscar.trim()) return []
    return productosCatalogo.filter(
      (p) =>
        p.nombre.toLowerCase().includes(productoBuscar.toLowerCase()) &&
        !productosSeleccionados.some((s) => s.id === p.id)
    )
  }, [productoBuscar, productosSeleccionados])

  const total = productosSeleccionados.reduce((sum, p) => sum + p.precio * p.cantidad, 0)

  function agregarProducto(prod: ProductoCatalogo) {
    setProductosSeleccionados((prev) => [
      ...prev,
      { id: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: 1 },
    ])
    setProductoBuscar("")
    setShowSuggestions(false)
  }

  function cambiarCantidad(id: string, delta: number) {
    setProductosSeleccionados((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad: Math.max(1, p.cantidad + delta) } : p))
    )
  }

  function eliminarProducto(id: string) {
    setProductosSeleccionados((prev) => prev.filter((p) => p.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!metodoPago || productosSeleccionados.length === 0) return
    onConfirm({
      cliente: cliente || "Cliente General",
      metodoPago: metodoPago as MetodoPago,
      productos: productosSeleccionados,
    })
    // Reset
    setCliente("")
    setMetodoPago("")
    setProductosSeleccionados([])
    setProductoBuscar("")
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 pb-8 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-card rounded-xl w-full max-w-3xl overflow-hidden animate-slide-up"
        style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Registrar Nueva Venta
            </h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Column 1: Client Info */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-accent" />
                  Informacion del Cliente
                </h4>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="modal-cliente" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                      Buscar Cliente
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        id="modal-cliente"
                        value={cliente}
                        onChange={(e) => setCliente(e.target.value)}
                        placeholder="Nombre o ID del cliente..."
                        className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:border-accent focus:ring-0 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="modal-metodo" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                      Metodo de Pago <span className="text-destructive">*</span>
                    </label>
                    <select
                      id="modal-metodo"
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                      required
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-0 focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="">Selecciona metodo...</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta de Credito/Debito</option>
                      <option value="transferencia">Transferencia Bancaria</option>
                      <option value="digital">Pago Digital</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Column 2: Products */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4 text-accent" />
                  Productos
                </h4>

                <div className="space-y-3">
                  {/* Product search */}
                  <div className="relative">
                    <label htmlFor="modal-producto" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                      Agregar Producto
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          id="modal-producto"
                          value={productoBuscar}
                          onChange={(e) => {
                            setProductoBuscar(e.target.value)
                            setShowSuggestions(true)
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          placeholder="Buscar producto..."
                          className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:border-accent focus:ring-0 focus:outline-none transition-colors"
                        />

                        {/* Suggestions dropdown */}
                        {showSuggestions && sugerencias.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg overflow-hidden z-20 max-h-40 overflow-y-auto">
                            {sugerencias.map((prod) => (
                              <button
                                key={prod.id}
                                type="button"
                                onClick={() => agregarProducto(prod)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-center justify-between"
                              >
                                <span className="text-foreground">{prod.nombre}</span>
                                <span className="text-primary font-medium text-xs">{formatCurrency(prod.precio)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selected products list */}
                  <div className="bg-background rounded-lg p-3 max-h-52 overflow-y-auto">
                    <h5 className="text-xs font-medium mb-2 text-muted-foreground">Productos Seleccionados</h5>

                    {productosSeleccionados.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No hay productos seleccionados
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {productosSeleccionados.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between bg-card border border-border/50 rounded-lg px-3 py-2 transition-all hover:border-accent/30"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{p.nombre}</p>
                              <p className="text-xs text-primary font-semibold">{formatCurrency(p.precio)}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <button
                                type="button"
                                onClick={() => cambiarCantidad(p.id, -1)}
                                className="h-6 w-6 rounded border border-accent text-accent flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors text-xs"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-medium text-foreground w-5 text-center">{p.cantidad}</span>
                              <button
                                type="button"
                                onClick={() => cambiarCantidad(p.id, 1)}
                                className="h-6 w-6 rounded border border-accent text-accent flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors text-xs"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => eliminarProducto(p.id)}
                                className="h-6 w-6 rounded text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors ml-1"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t border-border mt-3 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-foreground">Total:</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-sm font-bold uppercase border border-accent text-accent hover:bg-accent/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!metodoPago || productosSeleccionados.length === 0}
                className="px-5 py-2 rounded-lg text-sm font-bold uppercase bg-primary text-primary-foreground glow-primary glow-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Procesar Venta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
