"use client"

import { useState, useMemo, useEffect } from "react"
import { X, Search, Plus, Minus, Trash2, User, Package, PlusCircle, Users, ShoppingCart } from "lucide-react"
import { SociosService } from "@/lib/services/socios"
import { ProductosService } from "@/lib/services/productos"
import { MetodosPagoService } from "@/lib/services/socios"
import { DualPaymentSelector, type PagoSplitRequest } from "@/components/payment/dual-payment-selector"
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
    pagos?: PagoSplitRequest[]
    metodo_pago_id?: number  // Legacy support
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
  const [pagosSeleccionados, setPagosSeleccionados] = useState<PagoSplitRequest[]>([])
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
    
    if (pagosSeleccionados.length === 0 || productosSeleccionados.length === 0) {
      alert('Debes seleccionar al menos un método de pago y un producto')
      return
    }

    onConfirm({
      socio_id: socioSeleccionado?.id || null,
      pagos: pagosSeleccionados,
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
    setPagosSeleccionados([])
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
        className="relative bg-card rounded-xl w-full max-w-5xl overflow-hidden animate-slide-up shadow-2xl my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
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

        {/* Contenido en dos columnas */}
        <div className="flex flex-col md:flex-row h-[calc(100vh-180px)] max-h-[650px] overflow-y-auto">
          {/* COLUMNA IZQUIERDA: Productos */}
          <div className="flex-1 border-r border-border p-6 flex flex-col overflow-hidden">
            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              {/* Buscador de productos */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4 text-accent" />
                  Agregar Productos
                </h4>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={busquedaProducto}
                    onChange={(e) => {
                      setBusquedaProducto(e.target.value)
                      setShowProductosSuggestions(true)
                    }}
                    onFocus={() => setShowProductosSuggestions(true)}
                    onBlur={handleProductoBlur}
                    placeholder="Buscar producto..."
                    className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:border-accent focus:ring-0 focus:outline-none transition-colors"
                  />
                  
                  {/* Sugerencias de productos */}
                  {showProductosSuggestions && productosFiltrados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg overflow-hidden z-20 max-h-48 overflow-y-auto shadow-lg">
                      {productosFiltrados.map((producto) => (
                        <button
                          key={producto.id}
                          type="button"
                          onClick={() => agregarProducto(producto)}
                          className="w-full px-3 py-2.5 text-left hover:bg-accent/10 transition-colors border-b border-border last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{producto.nombre}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {producto.codigo} · Stock: {producto.stockActual}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-accent whitespace-nowrap ml-2">
                              {formatCurrency(producto.precioVenta)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de productos seleccionados */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {productosSeleccionados.length > 0 ? (
                  <>
                    <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                      Productos Seleccionados ({productosSeleccionados.length})
                    </h4>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                      {productosSeleccionados.map((item) => (
                        <div
                          key={item.producto.id}
                          className="flex items-center gap-2 bg-background p-3 rounded-lg border border-border hover:border-accent/30 transition-colors"
                        >
                          {/* Nombre y detalles */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{item.producto.nombre}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {formatCurrency(item.producto.precioVenta)} c/u
                            </div>
                          </div>

                          {/* Controles de cantidad */}
                          <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded">
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(item.producto.id, item.cantidad - 1)}
                              className="p-0.5 hover:bg-accent/10 rounded transition-colors text-muted-foreground hover:text-foreground"
                              disabled={item.cantidad <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-medium w-6 text-center">
                              {item.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(item.producto.id, item.cantidad + 1)}
                              className="p-0.5 hover:bg-accent/10 rounded transition-colors text-muted-foreground hover:text-foreground"
                              disabled={item.cantidad >= item.producto.stockActual}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Subtotal */}
                          <div className="text-sm font-semibold text-foreground min-w-[4rem] text-right">
                            {formatCurrency(item.producto.precioVenta * item.cantidad)}
                          </div>

                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={() => eliminarProducto(item.producto.id)}
                            className="p-1 hover:bg-destructive/10 rounded transition-colors text-muted-foreground hover:text-destructive flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Busca y agrega productos para comenzar
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* COLUMNA DERECHA: Cliente y Pago */}
          <div className="w-full md:w-100 p-6 border-t md:border-t-0 border-border bg-muted/20 flex flex-col overflow-y-auto">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
              {/* Cliente */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-accent" />
                  Cliente
                </h4>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={busquedaSocio}
                    onChange={(e) => {
                      setBusquedaSocio(e.target.value)
                      setSocioSeleccionado(null)
                      setShowSociosSuggestions(true)
                    }}
                    onFocus={() => setShowSociosSuggestions(true)}
                    onBlur={handleSocioBlur}
                    placeholder="Buscar Socio..."
                    className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:border-accent focus:ring-0 focus:outline-none transition-colors"
                  />
                  
                  {/* Sugerencias de socios */}
                  {showSociosSuggestions && sociosFiltrados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg overflow-hidden z-20 max-h-40 overflow-y-auto shadow-lg">
                      {sociosFiltrados.map((socio) => (
                        <button
                          key={socio.id}
                          type="button"
                          onClick={() => seleccionarSocio(socio)}
                          className="w-full px-3 py-2.5 text-left hover:bg-accent/10 transition-colors border-b border-border last:border-b-0"
                        >
                          <div className="text-sm font-medium text-foreground">{socio.nombre}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {socio.codigoSocio}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Socio seleccionado */}
                {socioSeleccionado ? (
                  <div className="flex items-center justify-between bg-accent/10 px-3 py-2 rounded-lg border border-accent/20">
                    <div>
                      <div className="text-sm font-medium text-foreground">{socioSeleccionado.nombre}</div>
                      <div className="text-xs text-muted-foreground">{socioSeleccionado.codigoSocio}</div>
                    </div>
                    <button
                      type="button"
                      onClick={limpiarSocio}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground px-1">
                    Deja vacío para "Público General"
                  </p>
                )}
              </div>

              {/* Separador */}
              <div className="border-t border-border" />

              {/* Método de Pago */}
              <div className="space-y-3 flex-1 flex flex-col">

                {productosSeleccionados.length > 0 ? (
                  <div className="flex-1 overflow-y-auto">
                    <DualPaymentSelector
                      total={total}
                      metodosPago={metodosPago}
                      onPagosChange={setPagosSeleccionados}
                      labelText="Métodos de Pago"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-background border border-border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">
                      Agrega productos para configurar pago
                    </p>
                  </div>
                )}
              </div>

              {/* Total */}
              {productosSeleccionados.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-foreground">Total a Cobrar:</span>
                    <span className="text-2xl font-bold text-accent">{formatCurrency(total)}</span>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-3 py-2.5 bg-background border border-border text-foreground rounded-lg hover:bg-accent/5 transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pagosSeleccionados.length === 0 || productosSeleccionados.length === 0}
                  className="flex-1 px-3 py-2.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Registrar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
