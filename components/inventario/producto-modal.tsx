"use client"

import { useState, useEffect } from "react"
import { X, Save, Info, DollarSign } from "lucide-react"
import type { Producto, Categoria } from "@/lib/inventario-data"

interface ProductoModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Producto>) => void
  producto?: Producto | null
}

export function ProductoModal({ open, onClose, onSave, producto }: ProductoModalProps) {
  const isEdit = !!producto
  const [nombre, setNombre] = useState("")
  const [codigo, setCodigo] = useState("")
  const [categoria, setCategoria] = useState<Categoria | "">("")
  const [marca, setMarca] = useState("")
  const [precioCompra, setPrecioCompra] = useState("")
  const [precioVenta, setPrecioVenta] = useState("")
  const [stockActual, setStockActual] = useState("")
  const [stockMinimo, setStockMinimo] = useState("")
  const [ubicacion, setUbicacion] = useState("")
  const [descripcion, setDescripcion] = useState("")

  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre)
      setCodigo(producto.codigo)
      setCategoria(producto.categoria)
      setMarca(producto.marca)
      setPrecioCompra(producto.precioCompra.toString())
      setPrecioVenta(producto.precioVenta.toString())
      setStockActual(producto.stockActual.toString())
      setStockMinimo(producto.stockMinimo.toString())
      setUbicacion(producto.ubicacion)
      setDescripcion(producto.descripcion)
    } else {
      setNombre(""); setCodigo(""); setCategoria(""); setMarca("")
      setPrecioCompra(""); setPrecioVenta(""); setStockActual(""); setStockMinimo("")
      setUbicacion(""); setDescripcion("")
    }
  }, [producto, open])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre || !codigo || !categoria || !precioCompra || !precioVenta) return

    const stock = parseInt(stockActual) || 0
    const min = parseInt(stockMinimo) || 0
    let estadoStock: "disponible" | "bajo" | "agotado" = "disponible"
    if (stock === 0) estadoStock = "agotado"
    else if (stock <= min) estadoStock = "bajo"

    onSave({
      ...(producto ? { id: producto.id } : {}),
      nombre, codigo,
      categoria: categoria as Categoria,
      marca: marca || "Sin marca",
      precioCompra: parseFloat(precioCompra),
      precioVenta: parseFloat(precioVenta),
      stockActual: stock,
      stockMinimo: min,
      estadoStock,
      ubicacion: ubicacion || "Sin ubicacion",
      descripcion,
      activo: true,
      fechaActualizacion: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-border animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            {isEdit ? "Editar Producto" : "Agregar Nuevo Producto"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-6">
          {/* Section 1: Info Basica */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Info className="h-4 w-4 text-accent" /> Informacion Basica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Nombre del Producto <span className="text-primary">*</span>
                </label>
                <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Codigo <span className="text-primary">*</span>
                </label>
                <input type="text" required value={codigo} onChange={(e) => setCodigo(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Categoria <span className="text-primary">*</span>
                </label>
                <select required value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 appearance-none cursor-pointer">
                  <option value="">Selecciona una categoria...</option>
                  <option value="suplementos">Suplementos</option>
                  <option value="accesorios">Accesorios</option>
                  <option value="ropa">Ropa Deportiva</option>
                  <option value="equipamiento">Equipamiento</option>
                  <option value="bebidas">Bebidas</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Marca</label>
                <input type="text" value={marca} onChange={(e) => setMarca(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50" />
              </div>
            </div>
          </div>

          {/* Section 2: Precios e Inventario */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
              <DollarSign className="h-4 w-4 text-accent" /> Precios e Inventario
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Precio de Compra <span className="text-primary">*</span>
                </label>
                <input type="number" required step="0.01" min="0" value={precioCompra} onChange={(e) => setPrecioCompra(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Precio de Venta <span className="text-primary">*</span>
                </label>
                <input type="number" required step="0.01" min="0" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Stock Inicial</label>
                <input type="number" min="0" value={stockActual} onChange={(e) => setStockActual(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Stock Minimo</label>
                <input type="number" min="0" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Ubicacion/Estante</label>
                <input type="text" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Descripcion</label>
                <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg transition-all hover:bg-[#FF5A5A] glow-primary glow-primary-hover">
              <Save className="h-4 w-4" />
              {isEdit ? "Actualizar Producto" : "Guardar Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
