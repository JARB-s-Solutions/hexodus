"use client"

import { useState, useEffect } from "react"
import { Search, Calendar, CreditCard, Filter, XCircle, Plus, Download, CalendarCheck, Loader2 } from "lucide-react"
import { getMetodosPago, type MetodoPago } from "@/lib/services/metodos-pago"

interface VentasToolbarProps {
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
  onExportar: () => void
  totalVentas: number
  canCrearVenta?: boolean
  canExportar?: boolean
}

export function VentasToolbar({
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
  onExportar,
  totalVentas,
  canCrearVenta = true,
  canExportar = true,
}: VentasToolbarProps) {
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [loadingMetodos, setLoadingMetodos] = useState(true)

  // Cargar métodos de pago al montar
  useEffect(() => {
    async function cargarMetodosPago() {
      try {
        setLoadingMetodos(true)
        const metodos = await getMetodosPago()
        setMetodosPago(Array.isArray(metodos) ? metodos : [])
      } catch (error) {
        console.error("Error al cargar métodos de pago:", error)
        setMetodosPago([])
      } finally {
        setLoadingMetodos(false)
      }
    }
    cargarMetodosPago()
  }, [])
  return (
    <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-[350px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              placeholder="Buscar por ID, cliente o producto..."
              className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <select
            value={periodo}
            onChange={(e) => onPeriodoChange(e.target.value)}
            className="pl-2 pr-8 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:16px] bg-[right_0.5rem_center] bg-no-repeat"
          >
            <option value="todo">Todo</option>
            <option value="hoy">Hoy</option>
            <option value="ayer">Ayer</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>

        {/* Custom Date Range */}
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
            {fechaInicio && fechaFin && (
              <button
                onClick={onAplicarFiltros}
                className="px-3 py-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
                title="Aplicar filtros de fecha"
              >
                <CalendarCheck className="h-4 w-4" />
              </button>
            )}
          </>
        )}

        {/* Payment Method Filter */}
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <select
            value={metodoPago}
            onChange={(e) => onMetodoPagoChange(e.target.value)}
            disabled={loadingMetodos}
            className="pl-2 pr-8 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:16px] bg-[right_0.5rem_center] bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="todos">Todos</option>
            {loadingMetodos ? (
              <option disabled>Cargando...</option>
            ) : (
              metodosPago.map((metodo) => (
                <option key={metodo.id} value={metodo.id}>
                  {metodo.nombre}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Clear Filters */}
        <button
          onClick={onLimpiar}
          className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
          title="Limpiar filtros"
        >
          <XCircle className="h-4 w-4" />
        </button>

        {/* Results Count */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg ml-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {totalVentas} ventas
          </span>
        </div>

        {/* Action Buttons */}
        {canCrearVenta && (
          <button
            onClick={onNuevaVenta}
            className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Nueva Venta
          </button>
        )}

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
