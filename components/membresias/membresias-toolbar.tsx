"use client"

import { Search, Plus, Filter, X } from "lucide-react"

interface MembresiasToolbarProps {
  busqueda: string
  onBusquedaChange: (v: string) => void
  tipoFiltro: string
  onTipoChange: (v: string) => void
  estadoFiltro: string
  onEstadoChange: (v: string) => void
  precioMin: string
  onPrecioMinChange: (v: string) => void
  precioMax: string
  onPrecioMaxChange: (v: string) => void
  onLimpiar: () => void
  onNuevaMembresia: () => void
  totalFiltrados: number
  totalMembresias: number
}

export function MembresiasToolbar({
  busqueda,
  onBusquedaChange,
  tipoFiltro,
  onTipoChange,
  estadoFiltro,
  onEstadoChange,
  precioMin,
  onPrecioMinChange,
  precioMax,
  onPrecioMaxChange,
  onLimpiar,
  onNuevaMembresia,
  totalFiltrados,
  totalMembresias,
}: MembresiasToolbarProps) {
  const hasFilters =
    busqueda !== "" ||
    tipoFiltro !== "todos" ||
    estadoFiltro !== "todos" ||
    precioMin !== "" ||
    precioMax !== ""

  const selectBase =
    "h-10 px-3 text-sm bg-[#070B1E]/70 border border-accent/20 rounded-lg text-foreground focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all"

  return (
    <section
      className="bg-card rounded-xl p-4 space-y-3"
      style={{
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        border: "1px solid rgba(0,191,255,0.12)",
        background: "linear-gradient(145deg, rgba(28,28,32,0.96), rgba(21,24,38,0.95))",
      }}
    >
      {/* Top row: search + add button */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar membresias por nombre o descripcion..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-[#070B1E]/70 border border-accent/20 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all"
          />
        </div>

        {/* Result count */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
          <Filter className="h-3.5 w-3.5" />
          <span>
            {totalFiltrados} de {totalMembresias} membresias
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasFilters && (
            <button
              onClick={onLimpiar}
              className="flex items-center gap-1.5 h-10 px-3 text-sm font-medium border border-border rounded-lg text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </button>
          )}
          <button
            onClick={onNuevaMembresia}
            className="flex items-center gap-2 h-10 px-4 text-sm font-bold rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-all uppercase tracking-wide glow-primary glow-primary-hover"
          >
            <Plus className="h-4 w-4" />
            Nueva Membresia
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
        {/* Estado */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Estado
          </label>
          <select
            value={estadoFiltro}
            onChange={(e) => onEstadoChange(e.target.value)}
            className={selectBase}
          >
            <option value="todos">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        {/* Precio min */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Precio Min
          </label>
          <input
            type="number"
            placeholder="$0"
            value={precioMin}
            onChange={(e) => onPrecioMinChange(e.target.value)}
            className={selectBase}
          />
        </div>

        {/* Precio max */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Precio Max
          </label>
          <input
            type="number"
            placeholder="$99,999"
            value={precioMax}
            onChange={(e) => onPrecioMaxChange(e.target.value)}
            className={selectBase}
          />
        </div>
      </div>
    </section>
  )
}
