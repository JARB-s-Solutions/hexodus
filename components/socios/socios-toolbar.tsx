"use client"

import { Search, UserPlus, Filter, X, Calendar, Download } from "lucide-react"
import type { Genero } from "@/lib/socios-data"

interface SociosToolbarProps {
  busqueda: string
  onBusquedaChange: (v: string) => void
  vigenciaFiltro: string
  onVigenciaChange: (v: string) => void
  membresiaFiltro: string
  onMembresiaChange: (v: string) => void
  membresiaOpciones: Array<{ value: string; label: string }>
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
  onExportar: () => void
  exportando?: boolean
  canExportar?: boolean
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
  membresiaOpciones,
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
  onExportar,
  exportando = false,
  canExportar = true,
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
    "w-full min-w-0 h-10 px-3 text-sm bg-[#070B1E]/70 border border-accent/20 rounded-lg text-foreground focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all"

  return (
    <section
      className="min-w-0 max-w-full overflow-hidden bg-card rounded-xl p-4 space-y-3"
      style={{
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        border: "1px solid rgba(0,191,255,0.12)",
        background: "linear-gradient(145deg, rgba(28,28,32,0.96), rgba(21,24,38,0.95))",
      }}
    >
      {/* Top row: search + add button */}
      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(18rem,1fr)_auto] xl:items-center">
        {/* Search */}
        <div className="relative min-w-0 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, clave, ID, correo o telefono..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-[#070B1E]/70 border border-accent/20 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
          {/* Result count */}
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground sm:mr-auto xl:mr-0">
            <Filter className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {totalFiltrados} de {totalSocios} socios
            </span>
          </div>

          {canExportar && (
            <button
              onClick={onExportar}
              disabled={exportando}
              className="flex min-w-0 items-center justify-center gap-2 h-10 px-3 text-sm font-bold rounded-lg text-accent border border-accent/30 bg-accent/10 hover:bg-accent/20 transition-all uppercase tracking-wide disabled:opacity-60 disabled:cursor-not-allowed sm:px-4"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span className="truncate">{exportando ? "Exportando..." : "Exportar Excel"}</span>
            </button>
          )}
          {hasFilters && (
            <button
              onClick={onLimpiar}
              className="flex min-w-0 items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium border border-border rounded-lg text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Limpiar</span>
            </button>
          )}
          <button
            onClick={onNuevoSocio}
            className="flex min-w-0 items-center justify-center gap-2 h-10 px-3 text-sm font-bold rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-all uppercase tracking-wide glow-primary glow-primary-hover sm:px-4"
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            <span className="truncate">Agregar Nuevo Socio</span>
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7 gap-3 items-end">
        {/* Vigencia membresia */}
        <div className="space-y-1 min-w-0">
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
        <div className="space-y-1 min-w-0">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Tipo de membresia
          </label>
          <select
            value={membresiaFiltro}
            onChange={(e) => onMembresiaChange(e.target.value)}
            className={selectBase}
          >
            <option value="todos">Todos</option>
            {membresiaOpciones.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>

        {/* Genero */}
        <div className="space-y-1 min-w-0">
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
        <div className="space-y-1 min-w-0">
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
        <div className="space-y-1 min-w-0">
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
        <div className="space-y-1 min-w-0">
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
        <div className="space-y-1 min-w-0">
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
