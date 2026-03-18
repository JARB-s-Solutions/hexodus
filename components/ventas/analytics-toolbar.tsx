"use client"

import { Calendar, CalendarCheck, RefreshCw } from "lucide-react"

interface AnalyticsToolbarProps {
  periodo: string
  onPeriodoChange: (value: string) => void
  fechaInicio: string
  onFechaInicioChange: (value: string) => void
  fechaFin: string
  onFechaFinChange: (value: string) => void
  onActualizar: () => void
  loading?: boolean
}

export function AnalyticsToolbar({
  periodo,
  onPeriodoChange,
  fechaInicio,
  onFechaInicioChange,
  fechaFin,
  onFechaFinChange,
  onActualizar,
  loading = false,
}: AnalyticsToolbarProps) {
  return (
    <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Period Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <select
            value={periodo}
            onChange={(e) => onPeriodoChange(e.target.value)}
            className="pl-2 pr-8 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:16px] bg-[right_0.5rem_center] bg-no-repeat"
          >
            <option value="todo">Todo el Histórico</option>
            <option value="hoy">Hoy</option>
            <option value="ayer">Ayer</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="trimestre">Este Trimestre</option>
            <option value="anio">Este Año</option>
            <option value="personalizado">Rango Personalizado</option>
          </select>
        </div>

        {/* Custom Date Range */}
        {periodo === "personalizado" && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Desde:</span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => onFechaInicioChange(e.target.value)}
                className="px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Hasta:</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => onFechaFinChange(e.target.value)}
                className="px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
              />
            </div>
          </>
        )}

        {/* Refresh Button */}
        <button
          onClick={onActualizar}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </button>

        {/* Period Info */}
        <div className="w-full flex items-center justify-between mt-1 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {periodo === "todo" && "Mostrando análisis de todo el histórico de ventas"}
            {periodo === "hoy" && "Mostrando análisis del día de hoy"}
            {periodo === "ayer" && "Mostrando análisis del día de ayer"}
            {periodo === "semana" && "Mostrando análisis de esta semana"}
            {periodo === "mes" && "Mostrando análisis de este mes"}
            {periodo === "trimestre" && "Mostrando análisis de este trimestre"}
            {periodo === "anio" && "Mostrando análisis de este año"}
            {periodo === "personalizado" && fechaInicio && fechaFin && (
              <>Mostrando análisis del {fechaInicio} al {fechaFin}</>
            )}
            {periodo === "personalizado" && (!fechaInicio || !fechaFin) && (
              <>Selecciona un rango de fechas personalizado</>
            )}
          </span>
          
          {periodo === "personalizado" && fechaInicio && fechaFin && (
            <span className="text-xs text-accent font-medium">
              {Math.ceil((new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1} días
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
