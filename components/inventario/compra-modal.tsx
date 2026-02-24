"use client"

import { useState, useRef, useEffect } from "react"
import { X, ShoppingCart, Plus, Trash2, Search, Package, Info, AlertTriangle } from "lucide-react"
import type { Producto, CompraItem } from "@/lib/inventario-data"
import { formatPrecio, categoriaInfo, estadoStockInfo } from "@/lib/inventario-data"

interface CompraModalProps {
  open: boolean
  onClose: () => void
  onCompraRealizada: (proveedor: string, tipoPago: string, items: CompraItem[]) => void
  productosDisponibles: Producto[]
}

export function CompraModal({ open, onClose, onCompraRealizada, productosDisponibles }: CompraModalProps) {
  const [proveedor, setProveedor] = useState("")
  const [tipoPago, setTipoPago] = useState("")
  const [fechaCompra, setFechaCompra] = useState(() => new Date().toISOString().split("T")[0])
  const [items, setItems] = useState<CompraItem[]>([])

  // Product search
  const [searchTerm, setSearchTerm] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [cantidad, setCantidad] = useState("1")
  const [costoUnitario, setCostoUnitario] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setProveedor(""); setTipoPago(""); setItems([]); setSearchTerm("")
      setSelectedProducto(null); setCantidad("1"); setCostoUnitario("")
      setFechaCompra(new Date().toISOString().split("T")[0])
    }
  }, [open])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!open) return null

  const activos = productosDisponibles.filter((p) => p.activo)
  const filtered = searchTerm.trim()
    ? activos.filter((p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.marca.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : activos

  function selectProduct(p: Producto) {
    setSelectedProducto(p)
    setSearchTerm("")
    setCostoUnitario(p.precioCompra.toFixed(2))
    setDropdownOpen(false)
  }

  function clearSelection() {
    setSelectedProducto(null)
    setCostoUnitario("")
    setSearchTerm("")
  }

  function agregarItem() {
    if (!selectedProducto || parseInt(cantidad) <= 0 || parseFloat(costoUnitario) <= 0) return

    const q = parseInt(cantidad)
    const c = parseFloat(costoUnitario)

    const existing = items.find((it) => it.id === selectedProducto.id)
    if (existing) {
      setItems(items.map((it) =>
        it.id === selectedProducto.id
          ? { ...it, cantidad: it.cantidad + q, total: (it.cantidad + q) * it.costoUnitario }
          : it
      ))
    } else {
      setItems([...items, {
        id: selectedProducto.id,
        nombre: selectedProducto.nombre,
        codigo: selectedProducto.codigo,
        cantidad: q,
        costoUnitario: c,
        total: q * c,
      }])
    }

    clearSelection()
    setCantidad("1")
  }

  function eliminarItem(id: number) {
    setItems(items.filter((it) => it.id !== id))
  }

  const total = items.reduce((sum, it) => sum + it.total, 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!proveedor || !tipoPago || items.length === 0) return
    onCompraRealizada(proveedor, tipoPago, items)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-accent" />
            Registrar Compra de Reabastecimiento
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-6">
          {/* General Info */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Info className="h-4 w-4 text-accent" /> Informacion General
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha <span className="text-primary">*</span></label>
                <input type="date" required value={fechaCompra} onChange={(e) => setFechaCompra(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Proveedor <span className="text-primary">*</span></label>
                <input type="text" required value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Nombre del proveedor"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de Pago <span className="text-primary">*</span></label>
                <select required value={tipoPago} onChange={(e) => setTipoPago(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent appearance-none cursor-pointer">
                  <option value="">Seleccionar tipo...</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="credito">Credito</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product selector */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Package className="h-4 w-4 text-accent" /> Productos a Comprar
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-background rounded-lg border border-border">
              {/* Search / Selected */}
              <div className="relative">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Buscar Producto</label>
                {selectedProducto ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/30 rounded-lg text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{selectedProducto.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">{selectedProducto.codigo} - {selectedProducto.marca}</p>
                    </div>
                    <button type="button" onClick={clearSelection} className="text-primary hover:text-[#FF5A5A] flex-shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        ref={searchRef}
                        type="text"
                        placeholder="Nombre, codigo, marca..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setDropdownOpen(true) }}
                        onFocus={() => setDropdownOpen(true)}
                        autoComplete="off"
                        className="w-full pl-8 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                      />
                    </div>
                    {dropdownOpen && (
                      <div ref={dropdownRef} className="absolute z-50 w-full bg-card border border-border rounded-lg shadow-xl mt-1 max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                          <div className="p-4 text-center text-xs text-muted-foreground">No se encontraron productos</div>
                        ) : (
                          filtered.slice(0, 20).map((p) => {
                            const est = estadoStockInfo[p.estadoStock]
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => selectProduct(p)}
                                className="w-full text-left p-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-foreground truncate">{p.nombre}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] px-1.5 py-0.5 bg-accent/15 text-accent rounded">{p.codigo}</span>
                                      <span className="text-[10px] text-muted-foreground">{p.marca}</span>
                                      <span className={`text-[10px] font-medium ${est.color}`}>Stock: {p.stockActual}</span>
                                    </div>
                                  </div>
                                  <span className="text-xs text-[#22C55E] font-semibold ml-2">{formatPrecio(p.precioCompra)}</span>
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>
                    )}
                  </>
                )}
                {selectedProducto && selectedProducto.stockActual <= selectedProducto.stockMinimo && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#FBB424]">
                    <AlertTriangle className="h-3 w-3" />
                    Stock bajo - considerar cantidad
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Cantidad</label>
                <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Costo Unitario</label>
                <input type="number" step="0.01" min="0" value={costoUnitario} onChange={(e) => setCostoUnitario(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent" />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={agregarItem}
                  className="w-full py-2 px-3 bg-accent/15 text-accent border border-accent/30 font-semibold text-sm rounded-lg transition-all hover:bg-accent/25 flex items-center justify-center gap-1.5">
                  <Plus className="h-4 w-4" /> Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Items list */}
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h5 className="text-sm font-medium text-muted-foreground">Productos en la Compra</h5>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-xs text-muted-foreground font-medium">Producto</th>
                    <th className="text-center p-3 text-xs text-muted-foreground font-medium">Cantidad</th>
                    <th className="text-right p-3 text-xs text-muted-foreground font-medium">Costo Unit.</th>
                    <th className="text-right p-3 text-xs text-muted-foreground font-medium">Total</th>
                    <th className="text-center p-3 text-xs text-muted-foreground font-medium w-12" />
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-xs text-muted-foreground">
                        No hay productos agregados
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => (
                      <tr key={it.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-foreground">
                          {it.nombre}
                          <span className="text-muted-foreground ml-1">({it.codigo})</span>
                        </td>
                        <td className="p-3 text-center text-foreground">{it.cantidad}</td>
                        <td className="p-3 text-right text-foreground">{formatPrecio(it.costoUnitario)}</td>
                        <td className="p-3 text-right text-[#22C55E] font-semibold">{formatPrecio(it.total)}</td>
                        <td className="p-3 text-center">
                          <button type="button" onClick={() => eliminarItem(it.id)} className="text-primary hover:text-[#FF5A5A] transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="px-4 py-3 border-t border-border text-right">
              <span className="text-lg font-bold text-foreground">
                Total: <span className="text-[#22C55E]">{formatPrecio(total)}</span>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={items.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg transition-all hover:bg-[#FF5A5A] glow-primary glow-primary-hover disabled:opacity-40 disabled:cursor-not-allowed">
              <ShoppingCart className="h-4 w-4" />
              Registrar Compra
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
