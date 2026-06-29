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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)] md:px-4 md:pb-4 md:pt-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative my-2 max-h-[calc(100dvh-2rem)] w-full max-w-5xl overflow-y-auto rounded-xl bg-card shadow-2xl animate-slide-up md:my-4"
      >
        {/* Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-muted/95 p-4 backdrop-blur md:p-6">
          <h3 className="flex min-w-0 items-center gap-2 text-lg font-bold text-primary md:text-xl">
            <ShoppingCart className="h-5 w-5" />
            <span className="truncate">Registrar Nueva Venta</span>
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido en dos columnas */}
        <div className="flex flex-col md:h-[calc(100vh-180px)] md:max-h-[650px] md:flex-row md:overflow-y-auto">
          {/* COLUMNA IZQUIERDA: Productos */}
          <div className="flex flex-col border-border p-4 md:flex-1 md:border-r md:p-6 md:overflow-hidden">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-1">
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
                    <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
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
              <div className="flex flex-col md:flex-1 md:overflow-hidden">
                {productosSeleccionados.length > 0 ? (
                  <>
                    <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                      Productos Seleccionados ({productosSeleccionados.length})
                    </h4>
                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1 md:max-h-none md:flex-1 md:pr-2">
                      {productosSeleccionados.map((item) => (
                        <div
                          key={item.producto.id}
                          className="grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-accent/30 sm:flex sm:items-center sm:gap-2"
                        >
                          {/* Nombre y detalles */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{item.producto.nombre}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {formatCurrency(item.producto.precioVenta)} c/u
                            </div>
                          </div>

                          {/* Controles de cantidad */}
                          <div className="flex items-center gap-1 rounded bg-muted/50 px-2 py-1">
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
                          <div className="text-right text-sm font-semibold text-foreground sm:min-w-[4rem]">
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
                  <div className="flex min-h-44 items-center justify-center md:flex-1">
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
          <div className="flex w-full flex-col overflow-visible border-t border-border bg-muted/20 p-4 md:w-100 md:overflow-y-auto md:border-t-0 md:p-6">
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
                    <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-40 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
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
                  <div className="overflow-visible md:flex-1 md:overflow-y-auto">
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
              <div className="sticky bottom-0 z-20 -mx-4 grid grid-cols-2 gap-2 border-t border-border bg-card/95 px-4 pb-1 pt-3 backdrop-blur md:static md:mx-0 md:flex md:border-0 md:bg-transparent md:p-0 md:pt-2 md:backdrop-blur-0">
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
