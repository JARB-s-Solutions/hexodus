"use client"

import { useState, useMemo, useEffect } from "react"
import { X, Search, Plus, Minus, Trash2, User, Package, PlusCircle, Users, ShoppingCart } from "lucide-react"
import { SociosService } from "@/lib/services/socios"
import { ProductosService } from "@/lib/services/productos"
import { MetodosPagoService } from "@/lib/services/socios"
import type { Socio } from "@/lib/types/socios"
import type { ProductoExtendido } from "@/lib/types/productos"
import type { MetodoPago } from "@/lib/types/socios"
import { formatCurrency } from "@/lib/types/ventas"

interface ProductoSeleccionado {
  producto: ProductoExtendido
  cantidad: number
}

interface NuevaVentaModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (data: {
    socio_id: number | null
    metodo_pago_id: number
    productos: { producto_id: number; cantidad: number }[]
  }) => void
}

export function NuevaVentaModal({ open, onClose, onConfirm }: NuevaVentaModalProps) {
  // Estados principales
  const [socios, setSocios] = useState<Socio[]>([])
  const [productos, setProductos] = useState<ProductoExtendido[]>([])
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  
  // Estados del formulario
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null)
  const [metodoPagoId, setMetodoPagoId] = useState<number | "">("")
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([])
  
  // Estados de búsqueda
  const [busquedaSocio, setBusquedaSocio] = useState("")
  const [busquedaProducto, setBusquedaProducto] = useState("")
  const [showSociosSuggestions, setShowSociosSuggestions] = useState(false)
  const [showProductosSuggestions, setShowProductosSuggestions] = useState(false)

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (open) {
      cargarDatos()
    }
  }, [open])

  async function cargarDatos() {
    try {
      console.log('🔄 Cargando datos para modal de venta...')
      
      const [sociosData, productosData, metodosPagoData] = await Promise.all([
        SociosService.getAll(),
        ProductosService.getAll(),
        MetodosPagoService.getAll()
      ])
      
      console.log('📦 Datos recibidos:', {
        sociosRaw: sociosData.socios.length,
        productosRaw: productosData.productos.length,
        metodosRaw: metodosPagoData.length
      })
      
      const sociosFiltrados = sociosData.socios.filter(s => s.estadoSocio === 'activo')
      const productosFiltrados = productosData.productos.filter(p => p.status === 'activo' && p.stockActual > 0)
      const metodosActivos = metodosPagoData.filter(m => m.activo)
      
      setSocios(sociosFiltrados)
      setProductos(productosFiltrados)
      setMetodosPago(metodosActivos)
      
      console.log('✅ Datos filtrados y guardados:', {
        socios: sociosFiltrados.length,
        productos: productosFiltrados.length,
        metodosPago: metodosActivos.length
      })
    } catch (error) {
      console.error('❌ Error al cargar datos:', error)
    }
  }

  // Filtrar socios por búsqueda
  const sociosFiltrados = useMemo(() => {
    if (!busquedaSocio.trim()) return []
    const q = busquedaSocio.toLowerCase()
    const filtrados = socios.filter(
      s => s.nombre.toLowerCase().includes(q) || 
           s.codigoSocio.toLowerCase().includes(q)
    ).slice(0, 5)
    
    console.log('🔍 Búsqueda socio:', { 
      query: q, 
      resultados: filtrados.length, 
      total: socios.length,
      sociosDisponibles: socios.slice(0, 3).map(s => ({ nombre: s.nombre, codigo: s.codigoSocio }))
    })
    return filtrados
  }, [busquedaSocio, socios])

  // Filtrar productos por búsqueda (excluir ya seleccionados)
  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto.trim()) return []
    const q = busquedaProducto.toLowerCase()
    const idsSeleccionados = productosSeleccionados.map(p => p.producto.id)
    return productos.filter(
      p => !idsSeleccionados.includes(p.id) &&
           (p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q))
    ).slice(0, 5)
  }, [busquedaProducto, productos, productosSeleccionados])

  // Calcular total
  const total = useMemo(() => {
    return productosSeleccionados.reduce(
      (sum, item) => sum + (item.producto.precioVenta * item.cantidad),
      0
    )
  }, [productosSeleccionados])

  function seleccionarSocio(socio: Socio) {
    setSocioSeleccionado(socio)
    setBusquedaSocio(socio.nombre)
    setShowSociosSuggestions(false)
  }

  function limpiarSocio() {
    setSocioSeleccionado(null)
    setBusquedaSocio("")
  }

  function agregarProducto(producto: ProductoExtendido) {
    setProductosSeleccionados(prev => [
      ...prev,
      { producto, cantidad: 1 }
    ])
    setBusquedaProducto("")
    setShowProductosSuggestions(false)
  }

  function cambiarCantidad(productoId: number, nuevaCantidad: number) {
    setProductosSeleccionados(prev =>
      prev.map(item => {
        if (item.producto.id === productoId) {
          const max = item.producto.stockActual
          return { ...item, cantidad: Math.min(Math.max(1, nuevaCantidad), max) }
        }
        return item
      })
    )
  }

  function eliminarProducto(productoId: number) {
    setProductosSeleccionados(prev => prev.filter(item => item.producto.id !== productoId))
  }

  // Manejar cierre de sugerencias con delay para permitir click
  function handleSocioBlur() {
    setTimeout(() => setShowSociosSuggestions(false), 200)
  }

  function handleProductoBlur() {
    setTimeout(() => setShowProductosSuggestions(false), 200)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!metodoPagoId || productosSeleccionados.length === 0) {
      alert('Debes seleccionar un método de pago y al menos un producto')
      return
    }

    onConfirm({
      socio_id: socioSeleccionado?.id || null,
      metodo_pago_id: metodoPagoId as number,
      productos: productosSeleccionados.map(item => ({
        producto_id: item.producto.id,
        cantidad: item.cantidad
      }))
    })

    // Reset
    resetForm()
  }

  function resetForm() {
    setSocioSeleccionado(null)
    setMetodoPagoId("")
    setProductosSeleccionados([])
    setBusquedaSocio("")
    setBusquedaProducto("")
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 px-4 pb-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-card rounded-xl w-full max-w-4xl overflow-hidden animate-slide-up shadow-2xl my-4"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Registrar Nueva Venta
            </h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sección 1: Cliente y Método de Pago */}
            <div className="grid grid-cols-2 gap-6">
              {/* Cliente */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  Cliente (opcional)
                </h4>

                <div className="relative">
                  <label htmlFor="busqueda-socio" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                    Buscar Socio
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      id="busqueda-socio"
                      value={busquedaSocio}
                      onChange={(e) => {
                        setBusquedaSocio(e.target.value)
                        setSocioSeleccionado(null)
                        setShowSociosSuggestions(true)
                      }}
                      onFocus={() => setShowSociosSuggestions(true)}
                      onBlur={handleSocioBlur}
                      placeholder="Buscar por nombre o código..."
                      className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:border-accent focus:ring-0 focus:outline-none transition-colors"
                    />
                    
                    {/* Sugerencias de socios */}
                    {showSociosSuggestions && sociosFiltrados.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg overflow-hidden z-20 max-h-48 overflow-y-auto shadow-lg">
                        {sociosFiltrados.map((socio) => (
                          <button
                            key={socio.id}
                            type="button"
                            onClick={() => seleccionarSocio(socio)}
                            className="w-full px-3 py-2.5 text-left hover:bg-accent/10 transition-colors border-b border-border last:border-b-0"
                          >
                            <div className="text-sm font-medium text-foreground">{socio.nombre}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {socio.codigoSocio} · {socio.email}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Socio seleccionado */}
                  {socioSeleccionado && (
                    <div className="mt-2 flex items-center justify-between bg-accent/10 px-3 py-2 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-foreground">{socioSeleccionado.nombre}</div>
                        <div className="text-xs text-muted-foreground">{socioSeleccionado.codigoSocio}</div>
                      </div>
                      <button
                        type="button"
                        onClick={limpiarSocio}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  {!socioSeleccionado && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Deja vacío para "Público General"
                    </p>
                  )}
                </div>
              </div>

              {/* Método de Pago */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4 text-accent" />
                  Método de Pago
                </h4>

                <div>
                  <label htmlFor="metodo-pago" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                    Método de Pago <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="metodo-pago"
                    value={metodoPagoId}
                    onChange={(e) => setMetodoPagoId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-0 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="">Selecciona un método...</option>
                    {metodosPago.map((metodo) => (
                      <option key={metodo.metodo_pago_id} value={metodo.metodo_pago_id}>
                        {metodo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sección 2: Búsqueda de productos */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-accent" />
                Agregar Productos
              </h4>

              <div className="relative">
                <label htmlFor="busqueda-producto" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                  Buscar Producto
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    id="busqueda-producto"
                    value={busquedaProducto}
                    onChange={(e) => {
                      setBusquedaProducto(e.target.value)
                      setShowProductosSuggestions(true)
                    }}
                    onFocus={() => setShowProductosSuggestions(true)}
                    onBlur={handleProductoBlur}
                    placeholder="Buscar por nombre o código..."
                    className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:border-accent focus:ring-0 focus:outline-none transition-colors"
                  />
                  
                  {/* Sugerencias de productos */}
                  {showProductosSuggestions && productosFiltrados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg overflow-hidden z-20 max-h-60 overflow-y-auto shadow-lg">
                      {productosFiltrados.map((producto) => (
                        <button
                          key={producto.id}
                          type="button"
                          onClick={() => agregarProducto(producto)}
                          className="w-full px-3 py-2.5 text-left hover:bg-accent/10 transition-colors border-b border-border last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-foreground">{producto.nombre}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {producto.codigo} · Stock: {producto.stockActual}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-accent">
                              {formatCurrency(producto.precioVenta)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 3: Productos seleccionados */}
            {productosSeleccionados.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-accent" />
                  Productos Seleccionados ({productosSeleccionados.length})
                </h4>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {productosSeleccionados.map((item) => (
                    <div
                      key={item.producto.id}
                      className="flex items-center gap-3 bg-background p-3 rounded-lg border border-border"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{item.producto.nombre}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency(item.producto.precioVenta)} c/u · Stock: {item.producto.stockActual}
                        </div>
                      </div>

                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.producto.id, item.cantidad - 1)}
                          className="p-1 hover:bg-accent/10 rounded transition-colors"
                          disabled={item.cantidad <= 1}
                        >
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <span className="text-sm font-medium min-w-[2rem] text-center">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.producto.id, item.cantidad + 1)}
                          className="p-1 hover:bg-accent/10 rounded transition-colors"
                          disabled={item.cantidad >= item.producto.stockActual}
                        >
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-sm font-semibold text-foreground min-w-[5rem] text-right">
                        {formatCurrency(item.producto.precioVenta * item.cantidad)}
                      </div>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={() => eliminarProducto(item.producto.id)}
                        className="p-1 hover:bg-destructive/10 rounded transition-colors text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-foreground">Total a Cobrar:</span>
                    <span className="text-2xl font-bold text-accent">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-background border border-border text-foreground rounded-lg hover:bg-accent/5 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!metodoPagoId || productosSeleccionados.length === 0}
                className="flex-1 px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Registrar Venta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
