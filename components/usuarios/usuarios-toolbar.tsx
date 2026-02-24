"use client"

import { Search, Filter, UserPlus, X, RotateCcw } from "lucide-react"
import type { Rol, Estado, Departamento } from "@/lib/usuarios-data"

interface UsuariosToolbarProps {
  busqueda: string
  onBusquedaChange: (v: string) => void
  estadoFiltro: Estado | "todos"
  onEstadoChange: (v: Estado | "todos") => void
  rolFiltro: Rol | "todos"
  onRolChange: (v: Rol | "todos") => void
  departamentoFiltro: Departamento | "todos"
  onDepartamentoChange: (v: Departamento | "todos") => void
  onLimpiar: () => void
  onNuevoUsuario: () => void
  totalFiltrados: number
  totalUsuarios: number
}

export function UsuariosToolbar({
  busqueda,
  onBusquedaChange,
  estadoFiltro,
  onEstadoChange,
  rolFiltro,
  onRolChange,
  departamentoFiltro,
  onDepartamentoChange,
  onLimpiar,
  onNuevoUsuario,
  totalFiltrados,
  totalUsuarios,
}: UsuariosToolbarProps) {
  const hasFilters = busqueda || estadoFiltro !== "todos" || rolFiltro !== "todos" || departamentoFiltro !== "todos"

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

        {/* Add user button */}
        <button
          onClick={onNuevoUsuario}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg transition-all duration-300 hover:bg-[#FF5A5A] glow-primary glow-primary-hover whitespace-nowrap"
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
          value={estadoFiltro}
          onChange={(e) => onEstadoChange(e.target.value as Estado | "todos")}
          className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all appearance-none cursor-pointer"
        >
          <option value="todos">Todos los Estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
          <option value="bloqueado">Bloqueados</option>
        </select>

        {/* Rol filter */}
        <select
          value={rolFiltro}
          onChange={(e) => onRolChange(e.target.value as Rol | "todos")}
          className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all appearance-none cursor-pointer"
        >
          <option value="todos">Todos los Roles</option>
          <option value="admin">Administrador</option>
          <option value="moderador">Moderador</option>
          <option value="empleado">Empleado</option>
          <option value="invitado">Invitado</option>
        </select>

        {/* Departamento filter */}
        <select
          value={departamentoFiltro}
          onChange={(e) => onDepartamentoChange(e.target.value as Departamento | "todos")}
          className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all appearance-none cursor-pointer"
        >
          <option value="todos">Todos los Departamentos</option>
          <option value="administracion">Administracion</option>
          <option value="ventas">Ventas</option>
          <option value="operaciones">Operaciones</option>
          <option value="marketing">Marketing</option>
          <option value="soporte">Soporte</option>
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
          <span className="text-xs font-semibold text-accent">
            {totalFiltrados}
          </span>
          <span className="text-xs text-muted-foreground">
            {totalFiltrados !== totalUsuarios ? `de ${totalUsuarios}` : "usuarios"}
          </span>
        </div>
      </div>
    </div>
  )
}
