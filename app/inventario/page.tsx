"use client"

import { useState, useMemo, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { InventarioHeader } from "@/components/inventario/inventario-header"
import { KpiInventario } from "@/components/inventario/kpi-inventario"
import { InventarioToolbar } from "@/components/inventario/inventario-toolbar"
import { InventarioTable } from "@/components/inventario/inventario-table"
import { CategoriasTab } from "@/components/inventario/categorias-tab"
import { ProductoModal } from "@/components/inventario/producto-modal"
import { CompraModal } from "@/components/inventario/compra-modal"
import { AjustarStockModal } from "@/components/inventario/ajustar-stock-modal"
import { DetalleProductoModal } from "@/components/inventario/detalle-producto-modal"
import { ProductosService } from "@/lib/services/productos"
import { CategoriasService } from "@/lib/services/categorias"
import type { ProductoExtendido, CreateProductoRequest } from "@/lib/types/productos"
import { extenderProducto, reducirProducto, mapProductoToAPI, mapProductoToUpdateAPI, calcularEstadoStock } from "@/lib/types/productos"
import type { Categoria as CategoriaAPI } from "@/lib/types/categorias"
import type { Categoria, EstadoStock, CompraItem } from "@/lib/inventario-data"
import { useAuthContext } from "@/lib/contexts/auth-context"
import { Package, Tag } from "lucide-react"

export default function InventarioPage() {
  const { tienePermiso } = useAuthContext()

  // Tabs
  const [activeTab, setActiveTab] = useState<'productos' | 'categorias'>('productos')

  const puedeGestionarCategorias = tienePermiso('inventario', 'gestionarCategorias')
  const puedeCrearProducto = tienePermiso('inventario', 'crear')
  const puedeGestionarCompras = tienePermiso('inventario', 'gestionarCompras')

  useEffect(() => {
    if (activeTab === 'categorias' && !puedeGestionarCategorias) {
      setActiveTab('productos')
    }
  }, [activeTab, puedeGestionarCategorias])
  
  // Data
  const [productos, setProductos] = useState<ProductoExtendido[]>([])
  const [categorias, setCategorias] = useState<CategoriaAPI[]>([])
  const [categoriasMap, setCategoriasMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  // Filters
  const [busqueda, setBusqueda] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | "todas">("todas")
  const [stockFiltro, setStockFiltro] = useState<EstadoStock | "todos">("todos")

  // Modals
  const [productoModalOpen, setProductoModalOpen] = useState(false)
  const [editProducto, setEditProducto] = useState<ProductoExtendido | null>(null)
  const [compraModalOpen, setCompraModalOpen] = useState(false)
  const [ajustarModalOpen, setAjustarModalOpen] = useState(false)
  const [ajustarProducto, setAjustarProducto] = useState<ProductoExtendido | null>(null)
  const [detalleModalOpen, setDetalleModalOpen] = useState(false)
  const [detalleProducto, setDetalleProducto] = useState<ProductoExtendido | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  // Notifications
  const [notificacion, setNotificacion] = useState<{ msg: string; tipo: string } | null>(null)

  // Cargar productos y categorías desde la API
  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      setLoading(true)
      
      // Cargar categorías primero
      const categoriasAPI = await CategoriasService.getAll()
      console.log('✅ Categorías cargadas:', categoriasAPI)
      setCategorias(categoriasAPI)
      
      // Crear mapeo de nombre a ID
      const mapeo: Record<string, number> = {}
      categoriasAPI.forEach(cat => {
        mapeo[cat.nombre] = cat.id
      })
      setCategoriasMap(mapeo)
      console.log('✅ Mapeo de categorías creado:', mapeo)
      
      // Luego cargar productos
      await cargarProductos()
    } catch (error: any) {
      console.error('❌ Error al cargar datos iniciales:', error)
      mostrarNotificacion(error.message || 'Error al cargar datos', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function cargarProductos() {
    try {
      const { productos: productosAPI } = await ProductosService.getAll()
      console.log('✅ Productos cargados:', productosAPI)
      
      // Extender productos con campos calculados
      const productosExtendidos = productosAPI.map(extenderProducto)
      setProductos(productosExtendidos)
    } catch (error: any) {
      console.error('❌ Error al cargar productos:', error)
      mostrarNotificacion(error.message || 'Error al cargar productos', 'error')
    }
  }

  async function cargarCategorias() {
    try {
      const categoriasAPI = await CategoriasService.getAll()
      console.log('✅ Categorías recargadas:', categoriasAPI)
      setCategorias(categoriasAPI)
      
      // Actualizar mapeo de nombre a ID
      const mapeo: Record<string, number> = {}
      categoriasAPI.forEach(cat => {
        mapeo[cat.nombre] = cat.id
      })
      setCategoriasMap(mapeo)
    } catch (error: any) {
      console.error('❌ Error al cargar categorías:', error)
      mostrarNotificacion(error.message || 'Error al cargar categorías', 'error')
    }
  }

  function mostrarNotificacion(msg: string, tipo = "success") {
    setNotificacion({ msg, tipo })
    setTimeout(() => setNotificacion(null), 3500)
  }

  // Filtered products
  const activos = useMemo(() => productos.filter((p) => p.activo), [productos])

  const filtrados = useMemo(() => {
    return activos.filter((p) => {
      const matchBusqueda =
        !busqueda ||
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.marca.toLowerCase().includes(busqueda.toLowerCase())

      const matchCategoria = categoriaFiltro === "todas" || p.categoria.toLowerCase() === categoriaFiltro.toLowerCase()

      let matchStock = true
      if (stockFiltro === "disponible") matchStock = p.estadoStock === "disponible"
      else if (stockFiltro === "bajo") matchStock = p.estadoStock === "bajo"
      else if (stockFiltro === "agotado") matchStock = p.estadoStock === "agotado"

      return matchBusqueda && matchCategoria && matchStock
    })
  }, [activos, busqueda, categoriaFiltro, stockFiltro])

  // CRUD handlers
  async function handleSaveProducto(data: Partial<ProductoExtendido>) {
    try {
      if (data.id) {
        // Editar producto existente
        const productoAPI = mapProductoToUpdateAPI(data, categoriasMap)
        console.log('📦 Datos a actualizar:', productoAPI)
        await ProductosService.update(data.id, productoAPI)
        mostrarNotificacion("Producto actualizado exitosamente")
      } else {
        // Crear nuevo producto
        const productoAPI = mapProductoToAPI(data, categoriasMap)
        console.log('📦 Datos a enviar al API:', productoAPI)
        const result = await ProductosService.create(productoAPI as CreateProductoRequest)
        console.log('✅ Producto creado:', result)
        mostrarNotificacion(`Producto creado exitosamente. Código: ${result.codigo}`)
      }
      
      // Recargar productos y categorías (para actualizar contadores)
      await Promise.all([
        cargarProductos(),
        cargarCategorias()
      ])
      
      setProductoModalOpen(false)
      setEditProducto(null)
    } catch (error: any) {
      console.error('❌ Error al guardar producto:', error)
      mostrarNotificacion(error.message || 'Error al guardar producto', 'error')
    }
  }

  async function handleAjustarStock(productoId: number, cantidad: number) {
    try {
      const producto = productos.find(p => p.id === productoId)
      if (!producto) return
      
      const nuevoStock = Math.max(0, producto.stockActual + cantidad)
      await ProductosService.updateStock(productoId, nuevoStock)
      
      mostrarNotificacion("Stock actualizado correctamente")
      await cargarProductos()
    } catch (error: any) {
      console.error('❌ Error al ajustar stock:', error)
      mostrarNotificacion(error.message || 'Error al ajustar stock', 'error')
    }
  }

  async function handleEliminar(p: ProductoExtendido) {
    if (!confirm("¿Está seguro de que desea eliminar este producto?")) return
    
    try {
      await ProductosService.updateStatus(p.id, 'inactivo')
      mostrarNotificacion("Producto eliminado correctamente")
      
      // Recargar productos y categorías (para actualizar contadores)
      await Promise.all([
        cargarProductos(),
        cargarCategorias()
      ])
    } catch (error: any) {
      console.error('❌ Error al eliminar producto:', error)
      mostrarNotificacion(error.message || 'Error al eliminar producto', 'error')
    }
  }

  async function handleEditar(producto: ProductoExtendido) {
    try {
      // Obtener el detalle completo del producto (incluye descripción y todos los campos)
      console.log('📝 Obteniendo detalle completo del producto para edición...')
      const productoCompleto = await ProductosService.getById(producto.id)
      console.log('✅ Producto completo:', productoCompleto)
      setEditProducto(productoCompleto)
      setProductoModalOpen(true)
    } catch (error: any) {
      console.error('❌ Error al obtener detalle del producto:', error)
      mostrarNotificacion(error.message || 'Error al cargar el producto', 'error')
    }
  }

  function handleCompraRealizada(proveedor: string, tipoPago: string, items: CompraItem[]) {
    // Actualizar stock de productos comprados
    setProductos((prev) =>
      prev.map((p) => {
        const item = items.find((it) => it.id === p.id)
        if (!item) return p
        
        const nuevoStock = p.stockActual + item.cantidad
        const alertaStock = nuevoStock <= p.stockMinimo
        
        return {
          ...p,
          stockActual: nuevoStock,
          alertaStock,
          estadoStock: calcularEstadoStock(nuevoStock, alertaStock),
          precioCompra: item.costoUnitario,
          fechaActualizacion: new Date().toISOString(),
        }
      })
    )
    const total = items.reduce((s, it) => s + it.total, 0)
    mostrarNotificacion(`Compra registrada exitosamente. Total: $${total.toFixed(2)}`)
  }

  function limpiarFiltros() {
    setBusqueda("")
    setCategoriaFiltro("todas")
    setStockFiltro("todos")
  }

  async function handleVerDetalle(producto: ProductoExtendido) {
    setDetalleModalOpen(true)
    setLoadingDetalle(true)
    setDetalleProducto(null)
    
    try {
      console.log('🔍 Cargando detalle del producto:', producto.id)
      const productoDetalle = await ProductosService.getById(producto.id)
      console.log('✅ Detalle cargado:', productoDetalle)
      setDetalleProducto(productoDetalle)
    } catch (error: any) {
      console.error('❌ Error al cargar detalle:', error)
      mostrarNotificacion(error.message || 'Error al cargar detalle del producto', 'error')
      setDetalleModalOpen(false)
    } finally {
      setLoadingDetalle(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar activePage="inventario" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando inventario...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="inventario" />

      <main className="flex-1 flex flex-col min-h-0">
        <InventarioHeader />

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-5">
          {/* Tabs Navigation */}
          <div className="flex gap-2 border-b border-border/40 mb-6">
            <button
              onClick={() => setActiveTab('productos')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative ${
                activeTab === 'productos'
                  ? 'text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package className="h-4 w-4" />
              Productos
              {activeTab === 'productos' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
              )}
            </button>
            {puedeGestionarCategorias && (
              <button
                onClick={() => setActiveTab('categorias')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative ${
                  activeTab === 'categorias'
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Tag className="h-4 w-4" />
                Categorías
                {activeTab === 'categorias' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
                )}
              </button>
            )}
          </div>

          {/* Tab: Productos */}
          {activeTab === 'productos' && (
            <>
              <KpiInventario productos={productos} />

              <InventarioToolbar
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                categoriaFiltro={categoriaFiltro}
                onCategoriaChange={setCategoriaFiltro}
                stockFiltro={stockFiltro}
                onStockChange={setStockFiltro}
                onLimpiar={limpiarFiltros}
                onNuevoProducto={() => { setEditProducto(null); setProductoModalOpen(true) }}
                onNuevaCompra={() => setCompraModalOpen(true)}
                totalFiltrados={filtrados.length}
                totalProductos={activos.length}
                canCrearProducto={puedeCrearProducto}
                canGestionarCompras={puedeGestionarCompras}
              />

              <InventarioTable
                productos={filtrados}
                onVerDetalle={handleVerDetalle}
                onEditar={handleEditar}
                onAjustarStock={(p) => { setAjustarProducto(p); setAjustarModalOpen(true) }}
                onEliminar={handleEliminar}
              />
            </>
          )}

          {/* Tab: Categorías */}
          {activeTab === 'categorias' && puedeGestionarCategorias && (
            <CategoriasTab
              categorias={categorias}
              onRefresh={cargarDatos}
              onVerProductos={(categoria) => {
                // Cambiar al tab de productos y filtrar por la categoría
                setActiveTab('productos')
                setCategoriaFiltro(categoria.nombre as Categoria)
              }}
            />
          )}
        </div>

        {/* Modals */}
        <ProductoModal
          open={productoModalOpen}
          onClose={() => { setProductoModalOpen(false); setEditProducto(null) }}
          onSave={handleSaveProducto}
          producto={editProducto}
          categorias={categorias}
          onRefreshCategorias={cargarDatos}
          canGestionarCategorias={puedeGestionarCategorias}
        />
        <CompraModal
          open={compraModalOpen}
          onClose={() => setCompraModalOpen(false)}
          onCompraRealizada={handleCompraRealizada}
          productosDisponibles={productos}
        />
        <AjustarStockModal
          open={ajustarModalOpen}
          onClose={() => { setAjustarModalOpen(false); setAjustarProducto(null) }}
          producto={ajustarProducto}
          onAjustar={handleAjustarStock}
        />
        <DetalleProductoModal
          open={detalleModalOpen}
          onClose={() => { setDetalleModalOpen(false); setDetalleProducto(null); setLoadingDetalle(false) }}
          producto={detalleProducto}
          loading={loadingDetalle}
        />
      </main>

      {/* Toast notification */}
      {notificacion && (
        <div
          className={`fixed top-4 right-4 z-[60] px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-foreground animate-slide-in-right ${
            notificacion.tipo === "success"
              ? "bg-[#22C55E]/90"
              : notificacion.tipo === "error"
              ? "bg-[#EF4444]/90"
              : "bg-accent/90"
          }`}
        >
          {notificacion.msg}
        </div>
      )}
    </div>
  )
}
