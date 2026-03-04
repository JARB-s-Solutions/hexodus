"use client"

import { Search, X, Download, SlidersHorizontal } from "lucide-react"

interface MetodoPago {
  id: string
  nombre: string
  activo?: boolean
}

interface FiltrosMovimientosProps {
  busqueda: string
  onBusquedaChange: (v: string) => void
  tipo: string
  onTipoChange: (v: string) => void
  tipoPago: string
  onTipoPagoChange: (v: string) => void
  fechaInicio: string
  onFechaInicioChange: (v: string) => void
  fechaFin: string
  onFechaFinChange: (v: string) => void
  onLimpiar: () => void
  onExportar: () => void
  metodosPago?: MetodoPago[]
}

export function FiltrosMovimientos({
  busqueda,
  onBusquedaChange,
  tipo,
  onTipoChange,
  tipoPago,
  onTipoPagoChange,
  fechaInicio,
  onFechaInicioChange,
  fechaFin,
  onFechaFinChange,
  onLimpiar,
  onExportar,
  metodosPago = [],
}: FiltrosMovimientosProps) {
  const hasFilters = busqueda || tipo !== "todos" || tipoPago !== "" || fechaInicio || fechaFin

  // Métodos de pago por defecto si no se cargan del API
  const metodosDefault = [
    { id: "efectivo", nombre: "Efectivo" },
    { id: "transferencia", nombre: "Transfer." },
    { id: "tarjeta", nombre: "Tarjeta" },
  ]

  // Usar métodos de pago del API o fallback
  const metodosDisponibles = metodosPago.length > 0 ? metodosPago : metodosDefault

  return (
    <div
      className="bg-card rounded-xl overflow-hidden border border-border"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground">Filtros</h2>
        </div>
        {hasFilters && (
          <button
            onClick={onLimpiar}
            className="text-[11px] text-accent hover:underline"
          >
            Limpiar todo
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Search */}
        <div>
          <label htmlFor="buscar-mov" className="block text-[11px] font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              id="buscar-mov"
              type="text"
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              placeholder="Concepto, folio, usuario..."
              className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground/50 focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
            />
            {busqueda && (
              <button
                onClick={() => onBusquedaChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-[11px] font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">
            Tipo
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: "todos", label: "Todos" },
              { value: "ingreso", label: "Ingresos" },
              { value: "egreso", label: "Egresos" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => onTipoChange(opt.value)}
                className={`py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                  tipo === opt.value
                    ? "bg-accent/15 border-accent/40 text-accent"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tipo de Pago */}
        <div>
          <label className="block text-[11px] font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">
            Método de Pago
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {/* Botón "Todos" */}
            <button
              onClick={() => onTipoPagoChange("")}
              className={`py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                tipoPago === ""
                  ? "bg-accent/15 border-accent/40 text-accent"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos
            </button>

            {/* Métodos de pago dinámicos */}
            {metodosDisponibles.map((metodo) => (
              <button
                key={metodo.id}
                onClick={() => onTipoPagoChange(metodo.nombre)}
                className={`py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                  tipoPago === metodo.nombre
                    ? "bg-accent/15 border-accent/40 text-accent"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {metodo.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-[11px] font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">
            Rango de Fechas
          </label>
          <div className="space-y-1.5">
            <div>
              <span className="text-[10px] text-muted-foreground/60">Desde</span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => onFechaInicioChange(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
              />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground/60">Hasta</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => onFechaFinChange(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="pt-1">
          <button
            onClick={onExportar}
            className="w-full py-2.5 font-medium rounded-lg text-xs border border-accent/30 text-accent hover:bg-accent/10 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>
    </div>
  )
}
