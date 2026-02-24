"use client"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { InventarioHeader } from "@/components/inventario/inventario-header"
import { KpiInventario } from "@/components/inventario/kpi-inventario"
import { InventarioToolbar } from "@/components/inventario/inventario-toolbar"
import { InventarioTable } from "@/components/inventario/inventario-table"
import { ProductoModal } from "@/components/inventario/producto-modal"
import { CompraModal } from "@/components/inventario/compra-modal"
import { AjustarStockModal } from "@/components/inventario/ajustar-stock-modal"
import { DetalleProductoModal } from "@/components/inventario/detalle-producto-modal"
import type { Producto, Categoria, EstadoStock, CompraItem } from "@/lib/inventario-data"
import { generateInventarioData } from "@/lib/inventario-data"

export default function InventarioPage() {
  // Data
  const [productos, setProductos] = useState<Producto[]>(() => generateInventarioData())

  // Filters
  const [busqueda, setBusqueda] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | "todas">("todas")
  const [stockFiltro, setStockFiltro] = useState<EstadoStock | "todos">("todos")

  // Modals
  const [productoModalOpen, setProductoModalOpen] = useState(false)
  const [editProducto, setEditProducto] = useState<Producto | null>(null)
  const [compraModalOpen, setCompraModalOpen] = useState(false)
  const [ajustarModalOpen, setAjustarModalOpen] = useState(false)
  const [ajustarProducto, setAjustarProducto] = useState<Producto | null>(null)
  const [detalleModalOpen, setDetalleModalOpen] = useState(false)
  const [detalleProducto, setDetalleProducto] = useState<Producto | null>(null)

  // Notifications
  const [notificacion, setNotificacion] = useState<{ msg: string; tipo: string } | null>(null)

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

      const matchCategoria = categoriaFiltro === "todas" || p.categoria === categoriaFiltro

      let matchStock = true
      if (stockFiltro === "disponible") matchStock = p.stockActual > p.stockMinimo
      else if (stockFiltro === "bajo") matchStock = p.stockActual > 0 && p.stockActual <= p.stockMinimo
      else if (stockFiltro === "agotado") matchStock = p.stockActual === 0

      return matchBusqueda && matchCategoria && matchStock
    })
  }, [activos, busqueda, categoriaFiltro, stockFiltro])

  // CRUD handlers
  function handleSaveProducto(data: Partial<Producto>) {
    if (data.id) {
      // Edit
      setProductos((prev) =>
        prev.map((p) => (p.id === data.id ? { ...p, ...data } as Producto : p))
      )
      mostrarNotificacion("Producto actualizado exitosamente")
    } else {
      // New
      const newId = Date.now()
      setProductos((prev) => [...prev, { ...data, id: newId } as Producto])
      mostrarNotificacion("Producto agregado exitosamente")
    }
  }

  function handleAjustarStock(productoId: number, cantidad: number) {
    setProductos((prev) =>
      prev.map((p) => {
        if (p.id !== productoId) return p
        const nuevoStock = Math.max(0, p.stockActual + cantidad)
        let estado: EstadoStock = "disponible"
        if (nuevoStock === 0) estado = "agotado"
        else if (nuevoStock <= p.stockMinimo) estado = "bajo"
        return { ...p, stockActual: nuevoStock, estadoStock: estado, fechaActualizacion: new Date().toISOString() }
      })
    )
    mostrarNotificacion("Stock actualizado correctamente")
  }

  function handleEliminar(p: Producto) {
    if (!confirm("Esta seguro de que desea eliminar este producto?")) return
    setProductos((prev) => prev.map((pr) => (pr.id === p.id ? { ...pr, activo: false } : pr)))
    mostrarNotificacion("Producto eliminado correctamente")
  }

  function handleCompraRealizada(proveedor: string, tipoPago: string, items: CompraItem[]) {
    // Update stock for purchased items
    setProductos((prev) =>
      prev.map((p) => {
        const item = items.find((it) => it.id === p.id)
        if (!item) return p
        const nuevoStock = p.stockActual + item.cantidad
        let estado: EstadoStock = "disponible"
        if (nuevoStock === 0) estado = "agotado"
        else if (nuevoStock <= p.stockMinimo) estado = "bajo"
        return {
          ...p,
          stockActual: nuevoStock,
          estadoStock: estado,
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="inventario" />

      <main className="flex-1 flex flex-col min-h-0">
        <InventarioHeader />

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-5">
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
          />

          <InventarioTable
            productos={filtrados}
            onVerDetalle={(p) => { setDetalleProducto(p); setDetalleModalOpen(true) }}
            onEditar={(p) => { setEditProducto(p); setProductoModalOpen(true) }}
            onAjustarStock={(p) => { setAjustarProducto(p); setAjustarModalOpen(true) }}
            onEliminar={handleEliminar}
          />
        </div>

        {/* Modals */}
        <ProductoModal
          open={productoModalOpen}
          onClose={() => { setProductoModalOpen(false); setEditProducto(null) }}
          onSave={handleSaveProducto}
          producto={editProducto}
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
          onClose={() => { setDetalleModalOpen(false); setDetalleProducto(null) }}
          producto={detalleProducto}
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
