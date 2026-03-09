"use client"

import { Search, Filter, UserPlus, X, RotateCcw, Loader2 } from "lucide-react"

interface UsuariosToolbarProps {
  busqueda: string
  onBusquedaChange: (v: string) => void
  onAplicarBusqueda?: () => void
  activoFiltro: boolean | "todos"
  onActivoChange: (v: boolean | "todos") => void
  rolFiltro: string
  onRolChange: (v: string) => void
  onLimpiar: () => void
  onNuevoUsuario: () => void
  loading?: boolean
}

export function UsuariosToolbar({
  busqueda,
  onBusquedaChange,
  onAplicarBusqueda,
  activoFiltro,
  onActivoChange,
  rolFiltro,
  onRolChange,
  onLimpiar,
  onNuevoUsuario,
  loading,
}: UsuariosToolbarProps) {
  const hasFilters = busqueda || activoFiltro !== "todos" || rolFiltro !== "todos"

  return (
    <div
      className="bg-card rounded-xl p-4"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      {/* Top row: Search + Add button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o usuario..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAplicarBusqueda?.()}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all"
            disabled={loading}
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

        {/* Search button (optional, for explicit search) */}
        {onAplicarBusqueda && (
          <button
            onClick={onAplicarBusqueda}
            disabled={loading}
            className="px-4 py-2.5 bg-accent text-accent-foreground font-semibold text-sm rounded-lg hover:bg-accent/90 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
          </button>
        )}

        {/* Add user button */}
        <button
          onClick={onNuevoUsuario}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg transition-all duration-300 hover:bg-[#FF5A5A] glow-primary glow-primary-hover whitespace-nowrap disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          <span>Agregar Usuario</span>
        </button>
      </div>

      {/* Filter row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
          <Filter className="h-4 w-4 text-accent" />
          <span className="font-medium">Filtros:</span>
        </div>

        {/* Estado filter */}
        <select
          value={activoFiltro === "todos" ? "todos" : activoFiltro ? "activo" : "inactivo"}
          onChange={(e) => {
            const val = e.target.value
            if (val === "todos") onActivoChange("todos")
            else onActivoChange(val === "activo")
          }}
          disabled={loading}
          className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all appearance-none cursor-pointer disabled:opacity-50"
        >
          <option value="todos">Todos los Estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>

        {/* Rol filter */}
        <select
          value={rolFiltro}
          onChange={(e) => onRolChange(e.target.value)}
          disabled={loading}
          className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all appearance-none cursor-pointer disabled:opacity-50"
        >
          <option value="todos">Todos los Roles</option>
          <option value="admin">Administrador</option>
          <option value="recepcionista">Recepcionista</option>
          <option value="moderador">Moderador</option>
          <option value="empleado">Empleado</option>
          <option value="invitado">Invitado</option>
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={onLimpiar}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-background transition-all whitespace-nowrap disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
