"use client"

import { Search, Filter, XCircle, PlusCircle, Plus, CalendarCheck } from "lucide-react"
import type { MetodoPago } from "@/lib/ventas-data"

interface VentasFiltersProps {
  busqueda: string
  onBusquedaChange: (value: string) => void
  periodo: string
  onPeriodoChange: (value: string) => void
  metodoPago: string
  onMetodoPagoChange: (value: string) => void
  fechaInicio: string
  onFechaInicioChange: (value: string) => void
  fechaFin: string
  onFechaFinChange: (value: string) => void
  onLimpiar: () => void
  onNuevaVenta: () => void
  onAplicarFiltros?: () => void
}

export function VentasFilters({
  busqueda,
  onBusquedaChange,
  periodo,
  onPeriodoChange,
  metodoPago,
  onMetodoPagoChange,
  fechaInicio,
  onFechaInicioChange,
  fechaFin,
  onFechaFinChange,
  onLimpiar,
  onNuevaVenta,
  onAplicarFiltros,
}: VentasFiltersProps) {
  return (
    <div className="space-y-5">
      {/* New Sale Button */}
      <div
        className="bg-card rounded-xl p-5 flex flex-col items-center"
        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
      >
        <PlusCircle className="h-10 w-10 mb-3 text-primary" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Nueva Venta</h2>
        <p className="text-xs text-center mb-4 text-muted-foreground">
          Registra una nueva transaccion de venta.
        </p>
        <button
          onClick={onNuevaVenta}
          className="w-full py-2.5 font-bold rounded-lg uppercase text-sm bg-primary text-primary-foreground transition-all duration-300 glow-primary glow-primary-hover flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Venta
        </button>
      </div>

      {/* Filters */}
      <div
        className="bg-card rounded-xl p-5"
        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
      >
        <h2 className="text-lg font-semibold mb-4 text-accent">Filtros y Consultas</h2>

        {/* Search */}
        <div className="mb-4">
          <label htmlFor="buscar" className="block text-xs font-medium mb-1.5 text-muted-foreground">
            Buscar Venta
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              id="buscar"
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              placeholder="ID, producto o cliente..."
              className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:border-accent focus:ring-0 focus:outline-none transition-colors"
              style={{ boxShadow: "none" }}
            />
          </div>
        </div>

        {/* Period */}
        <div className="mb-4">
          <label htmlFor="periodo" className="block text-xs font-medium mb-1.5 text-muted-foreground">
            Periodo de Tiempo
          </label>
          <select
            id="periodo"
            value={periodo}
            onChange={(e) => onPeriodoChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-0 focus:outline-none transition-colors cursor-pointer"
          >
            <option value="hoy">Hoy</option>
            <option value="ayer">Ayer</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="trimestre">Este Trimestre</option>
            <option value="semestre">Este Semestre</option>
            <option value="anual">Este Ano</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>

        {/* Custom date range */}
        {periodo === "personalizado" && (
          <div className="mb-4 space-y-3 animate-fade-in-up">
            <div>
              <label htmlFor="fecha-inicio" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                Fecha Inicio
              </label>
              <input
                type="date"
                id="fecha-inicio"
                value={fechaInicio}
                onChange={(e) => onFechaInicioChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-0 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="fecha-fin" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                Fecha Fin
              </label>
              <input
                type="date"
                id="fecha-fin"
                value={fechaFin}
                onChange={(e) => onFechaFinChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-0 focus:outline-none transition-colors"
              />
            </div>
            
            {/* Apply Custom Filters Button */}
            {fechaInicio && fechaFin && (
              <button
                onClick={onAplicarFiltros}
                className="w-full py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CalendarCheck className="h-4 w-4" />
                Aplicar Filtros de Fecha
              </button>
            )}
          </div>
        )}

        {/* Payment method */}
        <div className="mb-4">
          <label htmlFor="metodo-pago" className="block text-xs font-medium mb-1.5 text-muted-foreground">
            Metodo de Pago
          </label>
          <select
            id="metodo-pago"
            value={metodoPago}
            onChange={(e) => onMetodoPagoChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-0 focus:outline-none transition-colors cursor-pointer"
          >
            <option value="todos">Todos los Metodos</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="digital">Pago Digital</option>
          </select>
        </div>

        {/* Clear Filters */}
        <button
          onClick={onLimpiar}
          className="w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
        >
          <XCircle className="h-3.5 w-3.5" />
          Limpiar Filtros
        </button>
      </div>
    </div>
  )
}
