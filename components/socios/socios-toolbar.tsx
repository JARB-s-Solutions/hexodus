"use client"

import { Search, UserPlus, Filter, X, Calendar } from "lucide-react"
import type { TipoMembresia, Genero } from "@/lib/socios-data"

interface SociosToolbarProps {
  busqueda: string
  onBusquedaChange: (v: string) => void
  vigenciaFiltro: string
  onVigenciaChange: (v: string) => void
  membresiaFiltro: TipoMembresia | "todos"
  onMembresiaChange: (v: TipoMembresia | "todos") => void
  generoFiltro: Genero | "todos"
  onGeneroChange: (v: Genero | "todos") => void
  contratoFirmaFiltro: string
  onContratoFirmaChange: (v: string) => void
  contratoVigenciaFiltro: string
  onContratoVigenciaChange: (v: string) => void
  fechaDesde: string
  onFechaDesdeChange: (v: string) => void
  fechaHasta: string
  onFechaHastaChange: (v: string) => void
  onLimpiar: () => void
  onNuevoSocio: () => void
  totalFiltrados: number
  totalSocios: number
}

export function SociosToolbar({
  busqueda,
  onBusquedaChange,
  vigenciaFiltro,
  onVigenciaChange,
  membresiaFiltro,
  onMembresiaChange,
  generoFiltro,
  onGeneroChange,
  contratoFirmaFiltro,
  onContratoFirmaChange,
  contratoVigenciaFiltro,
  onContratoVigenciaChange,
  fechaDesde,
  onFechaDesdeChange,
  fechaHasta,
  onFechaHastaChange,
  onLimpiar,
  onNuevoSocio,
  totalFiltrados,
  totalSocios,
}: SociosToolbarProps) {
  const hasFilters =
    busqueda !== "" ||
    vigenciaFiltro !== "todos" ||
    membresiaFiltro !== "todos" ||
    generoFiltro !== "todos" ||
    contratoFirmaFiltro !== "todos" ||
    contratoVigenciaFiltro !== "todos" ||
    fechaDesde !== "" ||
    fechaHasta !== ""

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
            placeholder="Buscar por nombre, ID, correo o telefono..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-[#070B1E]/70 border border-accent/20 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all"
          />
        </div>

        {/* Result count */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
          <Filter className="h-3.5 w-3.5" />
          <span>
            {totalFiltrados} de {totalSocios} socios
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
            onClick={onNuevoSocio}
            className="flex items-center gap-2 h-10 px-4 text-sm font-bold rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-all uppercase tracking-wide glow-primary glow-primary-hover"
          >
            <UserPlus className="h-4 w-4" />
            Agregar Nuevo Socio
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 items-end">
        {/* Vigencia membresia */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Vigencia membresia
          </label>
          <select
            value={vigenciaFiltro}
            onChange={(e) => onVigenciaChange(e.target.value)}
            className={selectBase}
          >
            <option value="todos">Todos</option>
            <option value="vigente">Activa</option>
            <option value="por_vencer">Por vencer (7d)</option>
            <option value="vencida">Vencida</option>
          </select>
        </div>

        {/* Tipo membresia */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Tipo de membresia
          </label>
          <select
            value={membresiaFiltro}
            onChange={(e) => onMembresiaChange(e.target.value as TipoMembresia | "todos")}
            className={selectBase}
          >
            <option value="todos">Todos</option>
            <option value="diaria">Diaria</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="anual">Anual</option>
          </select>
        </div>

        {/* Genero */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Genero
          </label>
          <select
            value={generoFiltro}
            onChange={(e) => onGeneroChange(e.target.value as Genero | "todos")}
            className={selectBase}
          >
            <option value="todos">Todos</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
          </select>
        </div>

        {/* Contrato firma */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Contrato (firma)
          </label>
          <select
            value={contratoFirmaFiltro}
            onChange={(e) => onContratoFirmaChange(e.target.value)}
            className={selectBase}
          >
            <option value="todos">Todos</option>
            <option value="firmado">Firmado</option>
            <option value="pendiente">Pendiente</option>
          </select>
        </div>

        {/* Vigencia contrato */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Vigencia contrato
          </label>
          <select
            value={contratoVigenciaFiltro}
            onChange={(e) => onContratoVigenciaChange(e.target.value)}
            className={selectBase}
          >
            <option value="todos">Todos</option>
            <option value="activo">Activo</option>
            <option value="por_vencer">Por vencer</option>
            <option value="vencido">Vencido</option>
            <option value="sin_contrato">Sin fechas</option>
          </select>
        </div>

        {/* Fecha desde */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Venc. desde
          </label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => onFechaDesdeChange(e.target.value)}
            className={selectBase}
          />
        </div>

        {/* Fecha hasta */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Venc. hasta
          </label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => onFechaHastaChange(e.target.value)}
            className={selectBase}
          />
        </div>
      </div>
    </section>
  )
}
