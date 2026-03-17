"use client"

import { Search, XCircle, Download, SlidersHorizontal, Calendar, CreditCard, Filter } from "lucide-react"

interface MetodoPago {
  id: string | number
  nombre: string
  metodo_pago_id?: number
  activo?: boolean
}

interface FiltrosMovimientosProps {
  busqueda: string
  onBusquedaChange: (v: string) => void
  periodo: string
  onPeriodoChange: (v: string) => void
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
  canExportar?: boolean
}

export function FiltrosMovimientos({
  busqueda,
  onBusquedaChange,
  periodo,
  onPeriodoChange,
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
  canExportar = true,
}: FiltrosMovimientosProps) {
  const hasFilters =
    busqueda !== "" ||
    periodo !== "hoy" ||
    tipo !== "todos" ||
    tipoPago !== "" ||
    (periodo === "personalizado" && (fechaInicio !== "" || fechaFin !== ""))

  // Métodos de pago por defecto si no se cargan del API
  const metodosDefault = [
    { id: "efectivo", nombre: "Efectivo" },
    { id: "transferencia", nombre: "Transferencia" },
    { id: "tarjeta", nombre: "Tarjeta" },
  ]

  // Usar métodos de pago del API o fallback
  const metodosDisponibles = metodosPago.length > 0 ? metodosPago : metodosDefault

  return (
    <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="flex-1 min-w-[220px] max-w-[380px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="buscar-mov"
              type="text"
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              placeholder="Buscar por concepto, folio o usuario..."
              className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Periodo */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <select
            value={periodo}
            onChange={(e) => onPeriodoChange(e.target.value)}
            className="pl-2 pr-8 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:16px] bg-[right_0.5rem_center] bg-no-repeat"
          >
            <option value="todo">Todo</option>
            <option value="hoy">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>

        {/* Rango personalizado */}
        {periodo === "personalizado" && (
          <>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => onFechaInicioChange(e.target.value)}
              className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => onFechaFinChange(e.target.value)}
              className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
            />
          </>
        )}

        {/* Tipo */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <select
            value={tipo}
            onChange={(e) => onTipoChange(e.target.value)}
            className="pl-2 pr-8 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:16px] bg-[right_0.5rem_center] bg-no-repeat"
          >
            <option value="todos">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="egreso">Egresos</option>
          </select>
        </div>

        {/* Método de pago */}
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <select
            value={tipoPago}
            onChange={(e) => onTipoPagoChange(e.target.value)}
            className="pl-2 pr-8 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:16px] bg-[right_0.5rem_center] bg-no-repeat"
          >
            <option value="">Todos</option>
            {metodosDisponibles.map((metodo) => (
              <option key={metodo.id} value={String(metodo.metodo_pago_id ?? metodo.id)}>
                {metodo.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Limpiar */}
        <button
          onClick={onLimpiar}
          className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
          title="Limpiar filtros"
          disabled={!hasFilters}
        >
          <XCircle className="h-4 w-4" />
        </button>

        {/* Chips de estado */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg ml-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            Filtros activos
          </span>
        </div>

        {/* Exportar */}
        {canExportar && (
          <button
            onClick={onExportar}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        )}
      </div>
    </div>
  )
}
