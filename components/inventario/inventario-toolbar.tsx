"use client"

import { Search, Filter, PackagePlus, ShoppingCart, X, RotateCcw } from "lucide-react"
import type { Categoria, EstadoStock } from "@/lib/inventario-data"

interface InventarioToolbarProps {
  busqueda: string
  onBusquedaChange: (v: string) => void
  categoriaFiltro: Categoria | "todas"
  onCategoriaChange: (v: Categoria | "todas") => void
  stockFiltro: EstadoStock | "todos"
  onStockChange: (v: EstadoStock | "todos") => void
  onLimpiar: () => void
  onNuevoProducto: () => void
  onNuevaCompra: () => void
  totalFiltrados: number
  totalProductos: number
}

export function InventarioToolbar({
  busqueda,
  onBusquedaChange,
  categoriaFiltro,
  onCategoriaChange,
  stockFiltro,
  onStockChange,
  onLimpiar,
  onNuevoProducto,
  onNuevaCompra,
  totalFiltrados,
  totalProductos,
}: InventarioToolbarProps) {
  const hasFilters = busqueda || categoriaFiltro !== "todas" || stockFiltro !== "todos"

  return (
    <div
      className="bg-card rounded-xl p-4"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      {/* Top row: Search + Action buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, codigo o marca..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all"
          />
          {busqueda && (
            <button
              onClick={() => onBusquedaChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNuevoProducto}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg transition-all duration-300 hover:bg-[#FF5A5A] glow-primary glow-primary-hover whitespace-nowrap"
          >
            <PackagePlus className="h-4 w-4" />
            <span>Nuevo Producto</span>
          </button>
          <button
            onClick={onNuevaCompra}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent/15 text-accent border border-accent/30 font-semibold text-sm rounded-lg transition-all duration-300 hover:bg-accent/25 whitespace-nowrap"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Nueva Compra</span>
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
          <Filter className="h-4 w-4 text-accent" />
          <span className="font-medium">Filtros:</span>
        </div>

        {/* Categoria */}
        <select
          value={categoriaFiltro}
          onChange={(e) => onCategoriaChange(e.target.value as Categoria | "todas")}
          className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all appearance-none cursor-pointer"
        >
          <option value="todas">Todas las categorias</option>
          <option value="suplementos">Suplementos</option>
          <option value="accesorios">Accesorios</option>
          <option value="ropa">Ropa Deportiva</option>
          <option value="equipamiento">Equipamiento</option>
          <option value="bebidas">Bebidas</option>
          <option value="otros">Otros</option>
        </select>

        {/* Estado Stock */}
        <select
          value={stockFiltro}
          onChange={(e) => onStockChange(e.target.value as EstadoStock | "todos")}
          className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all appearance-none cursor-pointer"
        >
          <option value="todos">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="bajo">Stock bajo</option>
          <option value="agotado">Sin stock</option>
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={onLimpiar}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-background transition-all whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}

        {/* Counter */}
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/10 whitespace-nowrap flex-shrink-0">
          <span className="text-xs font-semibold text-accent">{totalFiltrados}</span>
          <span className="text-xs text-muted-foreground">
            {totalFiltrados !== totalProductos ? `de ${totalProductos}` : "productos"}
          </span>
        </div>
      </div>
    </div>
  )
}
