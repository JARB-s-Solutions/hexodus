"use client"

import { useState, useEffect } from "react"
import { X, Save, Info, DollarSign, RefreshCw, Plus } from "lucide-react"
import type { ProductoExtendido } from "@/lib/types/productos"
import type { Categoria as CategoriaAPI } from "@/lib/types/categorias"
import type { Categoria } from "@/lib/inventario-data"
import { CategoriaModal } from "./categoria-modal"

interface ProductoModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<ProductoExtendido>) => void
  producto?: ProductoExtendido | null
  categorias?: CategoriaAPI[]
  onRefreshCategorias?: () => Promise<void> // Callback para recargar categorías
  canGestionarCategorias?: boolean
}

export function ProductoModal({
  open,
  onClose,
  onSave,
  producto,
  categorias = [],
  onRefreshCategorias,
  canGestionarCategorias = true,
}: ProductoModalProps) {
  const isEdit = !!producto
  const [nombre, setNombre] = useState("")
  const [codigo, setCodigo] = useState("")
  const [categoriaId, setCategoriaId] = useState<number | "">("")
  const [categoria, setCategoria] = useState<Categoria | "">("")
  const [marca, setMarca] = useState("")
  const [precioCompra, setPrecioCompra] = useState("")
  const [precioVenta, setPrecioVenta] = useState("")
  const [stockActual, setStockActual] = useState("")
  const [stockMinimo, setStockMinimo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [codigoEditado, setCodigoEditado] = useState(false) // Para saber si el usuario editó manualmente el código

  const handleNumberWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur()
  }
  
  // Modal de categoría inline
  const [categoriaModalOpen, setCategoriaModalOpen] = useState(false)

  // Función para generar prefijo de categoría
  const generarPrefijo = (nombreCategoria: string): string => {
    const prefijos: Record<string, string> = {
      'Proteínas': 'PROT',
      'Creatinas': 'CREAT',
      'Pre-Entreno': 'PRE',
      'Vitaminas': 'VIT',
      'Barras': 'BAR',
      'Snacks': 'SNK',
      'Bebidas': 'BEB',
      'Accesorios': 'ACC',
      'Otros': 'OTR'
    }
    return prefijos[nombreCategoria] || nombreCategoria.substring(0, 3).toUpperCase()
  }

  // Función para generar código automático
  const generarCodigoAutomatico = () => {
    if (!categoriaId) return
    
    const categoriaSeleccionada = categorias.find(c => c.id === categoriaId)
    if (!categoriaSeleccionada) return

    const prefijo = generarPrefijo(categoriaSeleccionada.nombre)
    const numeroAleatorio = Math.floor(Math.random() * 900) + 100 // Genera número entre 100-999
    const codigoGenerado = `${prefijo}-${numeroAleatorio}`
    
    setCodigo(codigoGenerado)
    setCodigoEditado(false)
  }

  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre)
      setCodigo(producto.codigo)
      setCodigoEditado(true) // Si es edición, considerar que el código ya fue establecido
      setCategoria(producto.categoria)
      // Si el producto tiene categoriaId, usarlo
      if (producto.categoriaId) {
        setCategoriaId(producto.categoriaId)
      } else {
        // Si no, intentar encontrar el ID desde el nombre de categoría
        const cat = categorias.find(c => c.nombre === producto.categoria)
        setCategoriaId(cat?.id || "")
      }
      setMarca(producto.marca)
      setPrecioCompra(producto.precioCompra.toString())
      setPrecioVenta(producto.precioVenta.toString())
      setStockActual(producto.stockActual.toString())
      setStockMinimo(producto.stockMinimo.toString())
      setDescripcion(producto.descripcion)
    } else {
      setNombre(""); setCodigo(""); setCategoria(""); setCategoriaId(""); setMarca("")
      setPrecioCompra(""); setPrecioVenta(""); setStockActual(""); setStockMinimo("")
      setDescripcion("")
      setCodigoEditado(false)
    }
  }, [producto, open, categorias])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre || !codigo || !categoriaId || !precioCompra || !precioVenta) return

    const stock = parseInt(stockActual) || 0
    const min = parseInt(stockMinimo) || 0
    let estadoStock: "disponible" | "bajo" | "agotado" = "disponible"
    if (stock === 0) estadoStock = "agotado"
    else if (stock <= min) estadoStock = "bajo"

    // Calcular alerta de stock
    const alertaStock = stock <= min && stock > 0

    onSave({
      ...(producto ? { id: producto.id } : {}),
      nombre, 
      codigo,
      categoria: categoria as Categoria,
      categoriaId: typeof categoriaId === 'number' ? categoriaId : undefined,
      marca: marca || "Sin marca",
      precioCompra: parseFloat(precioCompra),
      precioVenta: parseFloat(precioVenta),
      stockActual: stock,
      stockMinimo: min,
      estadoStock,
      alertaStock,  // Incluir alerta de stock
      status: producto?.status || 'activo',  // Preservar status o usar 'activo' por defecto
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
        {/* Header mejorado */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 border border-accent/20">
                <Info className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {isEdit ? "Editar Producto" : "Agregar Nuevo Producto"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isEdit ? "Actualiza la información del producto en el inventario" : "Registra un nuevo artículo en el inventario del gimnasio"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {/* INFORMACIÓN BÁSICA */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Info className="h-3.5 w-3.5 text-accent" /> 
              Información Básica
            </h4>
            <div className="flex flex-col gap-4">
              {/* Nombre del Producto - Full Width */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre del Producto <span className="text-primary">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Proteína Whey Gold Standard 2lb"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" 
                />
              </div>

              {/* SKU/Código + Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    SKU / Código <span className="text-primary">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required 
                      value={codigo} 
                      onChange={(e) => {
                        setCodigo(e.target.value)
                        setCodigoEditado(true)
                      }}
                      placeholder="SKU-000"
                      className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" 
                    />
                    <button
                      type="button"
                      onClick={generarCodigoAutomatico}
                      disabled={!categoriaId}
                      title={!categoriaId ? "Selecciona primero una categoría" : "Generar código automático"}
                      className="px-3.5 py-2.5 bg-accent text-white hover:bg-accent/90 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  {!codigoEditado && !codigo && categoriaId && (
                    <p className="text-xs text-muted-foreground mt-1.5">💡 Haz clic en el botón para generar automáticamente</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Categoría <span className="text-primary">*</span>
                  </label>
                  <select 
                    required 
                    value={categoriaId} 
                    onChange={(e) => {
                      const id = e.target.value ? parseInt(e.target.value) : ""
                      setCategoriaId(id)
                      const cat = categorias.find(c => c.id === id)
                      setCategoria((cat?.nombre as Categoria) || "")
                      
                      if (!codigoEditado && !isEdit && cat) {
                        const prefijo = generarPrefijo(cat.nombre)
                        const numeroAleatorio = Math.floor(Math.random() * 900) + 100
                        setCodigo(`${prefijo}-${numeroAleatorio}`)
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 appearance-none cursor-pointer transition-all">
                    <option value="">Seleccionar...</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                  {canGestionarCategorias && (
                    <button
                      type="button"
                      onClick={() => setCategoriaModalOpen(true)}
                      className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-xs font-medium transition-all border border-accent/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Crear nueva categoría
                    </button>
                  )}
                </div>
              </div>

              {/* Marca - Full Width */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Marca
                </label>
                <input 
                  type="text" 
                  value={marca} 
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Ej. Optimum Nutrition"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" 
                />
              </div>
            </div>
          </div>

          {/* PRECIOS E INVENTARIO */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
              <DollarSign className="h-3.5 w-3.5 text-accent" /> 
              Precios e Inventario
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Precio Compra <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input 
                    type="number" 
                    required 
                    step="0.01" 
                    min="0" 
                    value={precioCompra} 
                    onChange={(e) => setPrecioCompra(e.target.value)}
                    onWheel={handleNumberWheel}
                    placeholder="0.00"
                    className="w-full pl-7 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Precio Venta <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input 
                    type="number" 
                    required 
                    step="0.01" 
                    min="0" 
                    value={precioVenta} 
                    onChange={(e) => setPrecioVenta(e.target.value)}
                    onWheel={handleNumberWheel}
                    placeholder="0.00"
                    className="w-full pl-7 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Stock Inicial
                </label>
                <input 
                  type="number" 
                  min="0" 
                  value={stockActual} 
                  onChange={(e) => setStockActual(e.target.value)}
                  onWheel={handleNumberWheel}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Alerta Mín.
                </label>
                <input 
                  type="number" 
                  min="0" 
                  value={stockMinimo} 
                  onChange={(e) => setStockMinimo(e.target.value)}
                  onWheel={handleNumberWheel}
                  placeholder="5"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" 
                />
              </div>
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Info className="h-3.5 w-3.5 text-accent" /> 
              Descripción
            </h4>
            <div>
              <textarea 
                value={descripcion} 
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalles adicionales, ingredientes, tallas o especificaciones técnicas..."
                rows={4}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all">
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-accent text-white rounded-lg transition-all hover:bg-accent/90 shadow-lg shadow-accent/25">
              <Save className="h-4 w-4" />
              Guardar Producto
            </button>
          </div>
        </form>
      </div>

      {/* Modal inline de categoría */}
      {categoriaModalOpen && canGestionarCategorias && (
        <CategoriaModal
          open={categoriaModalOpen}
          onClose={() => setCategoriaModalOpen(false)}
          onSuccess={async (nuevaCategoria) => {
            // Auto-seleccionar la categoría recién creada
            setCategoriaId(nuevaCategoria.id)
            setCategoria(nuevaCategoria.nombre as Categoria)
            
            // Auto-generar código con el nuevo prefijo si aplica
            if (!codigoEditado && !isEdit && nuevaCategoria.prefijo) {
              const numeroAleatorio = Math.floor(Math.random() * 900) + 100
              setCodigo(`${nuevaCategoria.prefijo}-${numeroAleatorio}`)
            }
            
            // Cerrar modal y recargar categorías
            setCategoriaModalOpen(false)
            if (onRefreshCategorias) {
              await onRefreshCategorias()
            }
            
            toast({
              title: "Categoría creada",
              description: `"${nuevaCategoria.nombre}" está lista para usar`,
            })
          }}
          inline={true}
        />
      )}
    </div>
  )
}
