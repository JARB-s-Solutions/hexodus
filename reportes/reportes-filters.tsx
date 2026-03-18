"use client"

import {
  FileText,
  FilePlus,
  Filter,
  XCircle,
  Download,
  RefreshCw,
} from "lucide-react"
import type { TipoReporte } from "@/lib/reportes-data"

interface ReportesFiltersProps {
  periodo: string
  onPeriodoChange: (value: string) => void
  tipoReporte: TipoReporte | "todos"
  onTipoReporteChange: (value: TipoReporte | "todos") => void
  fechaInicio: string
  onFechaInicioChange: (value: string) => void
  fechaFin: string
  onFechaFinChange: (value: string) => void
  onLimpiar: () => void
  onExportar: () => void
  onNuevoReporte?: () => void
  canExportar?: boolean
}

export function ReportesFilters({
  periodo,
  onPeriodoChange,
  tipoReporte,
  onTipoReporteChange,
  fechaInicio,
  onFechaInicioChange,
  fechaFin,
  onFechaFinChange,
  onLimpiar,
  onExportar,
  onNuevoReporte,
  canExportar = true,
}: ReportesFiltersProps) {
  return (
    <div className="space-y-5">
      {/* Generate New Report Card */}
      {onNuevoReporte && (
        <div
          className="bg-card rounded-xl p-5 flex flex-col items-center"
          style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
        >
          <FilePlus className="h-10 w-10 mb-3 text-primary" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Nuevo Reporte</h2>
          <p className="text-xs text-center mb-4 text-muted-foreground">
            Genera un reporte personalizado con los datos seleccionados.
          </p>
          <button
            onClick={onNuevoReporte}
            className="w-full py-2.5 font-bold rounded-lg uppercase text-sm bg-primary text-primary-foreground transition-all duration-300 glow-primary glow-primary-hover flex items-center justify-center gap-2"
          >
            <FilePlus className="h-4 w-4" />
            Generar Reporte
          </button>
        </div>
      )}

      {/* Export Card */}
      {canExportar && (
        <div
          className="bg-card rounded-xl p-5 flex flex-col items-center"
          style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
        >
          <Download className="h-10 w-10 mb-3 text-accent" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Exportar Reporte</h2>
          <p className="text-xs text-center mb-4 text-muted-foreground">
            Descarga el resumen financiero en formato Excel/CSV con los datos del periodo seleccionado.
          </p>
          <button
            onClick={onExportar}
            className="w-full py-2.5 font-semibold rounded-lg text-sm text-accent border border-accent hover:bg-accent/10 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Descargar Excel
          </button>
        </div>
      )}

      {/* Filters Card */}
      <div
        className="bg-card rounded-xl p-5"
        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-accent" />
          <h2 className="text-lg font-semibold text-accent">Configuracion</h2>
        </div>

        {/* Period */}
        <div className="mb-4">
          <label htmlFor="periodo-reporte" className="block text-xs font-medium mb-1.5 text-muted-foreground">
            Periodo de Tiempo
          </label>
          <select
            id="periodo-reporte"
            value={periodo}
            onChange={(e) => onPeriodoChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-0 focus:outline-none transition-colors cursor-pointer"
          >
            <option value="dia">Hoy</option>
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
              <label htmlFor="ri-fecha-inicio" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                Fecha Inicio
              </label>
              <input
                type="date"
                id="ri-fecha-inicio"
                value={fechaInicio}
                onChange={(e) => onFechaInicioChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-0 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="ri-fecha-fin" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                Fecha Fin
              </label>
              <input
                type="date"
                id="ri-fecha-fin"
                value={fechaFin}
                onChange={(e) => onFechaFinChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-0 focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* Report type */}
        <div className="mb-4">
          <label htmlFor="tipo-reporte" className="block text-xs font-medium mb-1.5 text-muted-foreground">
            Tipo de Reporte
          </label>
          <select
            id="tipo-reporte"
            value={tipoReporte}
            onChange={(e) => onTipoReporteChange(e.target.value as TipoReporte | "todos")}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-0 focus:outline-none transition-colors cursor-pointer"
          >
            <option value="todos">Reporte Completo</option>
            <option value="ventas">Ventas</option>
            <option value="gastos">Gastos</option>
            <option value="utilidad">Utilidad</option>
            <option value="membresias">Membresias</option>
          </select>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onLimpiar}
            className="w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Restablecer Filtros
          </button>
        </div>

        {/* Quick insights */}
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold text-muted-foreground">Que incluye</span>
          </div>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-success flex-shrink-0" />
              Resumen de ventas e ingresos
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              Desglose de gastos por categoria
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
              Utilidad neta (ventas - gastos)
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-warning flex-shrink-0" />
              Ingresos por membresias y socios
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-chart-5 flex-shrink-0" />
              Comparaciones automaticas
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
