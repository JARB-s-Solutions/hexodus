"use client"

import {
  FilePlus,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react"
import type { TipoReporte } from "@/lib/reportes-data"

interface ReportesFiltersProps {
  periodo: string
  onPeriodoChange: (value: string) => void
  tipoReporte: TipoReporte | "todos"
  onTipoReporteChange: (value: TipoReporte | "todos") => void
  formatoExportacion: "XLSX" | "PDF" | "CSV"
  onFormatoExportacionChange: (value: "XLSX" | "PDF" | "CSV") => void
  fechaInicio: string
  onFechaInicioChange: (value: string) => void
  fechaFin: string
  onFechaFinChange: (value: string) => void
  onLimpiar: () => void
  onExportar: () => void
  onNuevoReporte?: () => void
  canExportar?: boolean
  showTipoReporte?: boolean
}

export function ReportesFilters({
  periodo,
  onPeriodoChange,
  tipoReporte,
  onTipoReporteChange,
  formatoExportacion,
  onFormatoExportacionChange,
  fechaInicio,
  onFechaInicioChange,
  fechaFin,
  onFechaFinChange,
  onLimpiar,
  onExportar,
  onNuevoReporte,
  canExportar = true,
  showTipoReporte = true,
}: ReportesFiltersProps) {
  const exportLabel = {
    XLSX: "Excel (.xlsx)",
    PDF: "PDF",
    CSV: "CSV",
  }[formatoExportacion]

  return (
    <section
      className="bg-card rounded-xl border border-border p-4"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:flex xl:flex-wrap xl:items-end">
          <div className="min-w-[170px]">
            <label htmlFor="periodo-reporte" className="mb-1.5 block text-xs font-medium uppercase text-muted-foreground">
              Periodo
            </label>
            <select
              id="periodo-reporte"
              value={periodo}
              onChange={(e) => onPeriodoChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
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

          {periodo === "personalizado" && (
            <>
              <div className="min-w-[160px]">
                <label htmlFor="ri-fecha-inicio" className="mb-1.5 block text-xs font-medium uppercase text-muted-foreground">
                  Inicio
                </label>
                <input
                  type="date"
                  id="ri-fecha-inicio"
                  value={fechaInicio}
                  onChange={(e) => onFechaInicioChange(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
                />
              </div>
              <div className="min-w-[160px]">
                <label htmlFor="ri-fecha-fin" className="mb-1.5 block text-xs font-medium uppercase text-muted-foreground">
                  Fin
                </label>
                <input
                  type="date"
                  id="ri-fecha-fin"
                  value={fechaFin}
                  onChange={(e) => onFechaFinChange(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
                />
              </div>
            </>
          )}

          {showTipoReporte && (
            <div className="min-w-[190px]">
              <label htmlFor="tipo-reporte" className="mb-1.5 block text-xs font-medium uppercase text-muted-foreground">
                Tipo
              </label>
              <select
                id="tipo-reporte"
                value={tipoReporte}
                onChange={(e) => onTipoReporteChange(e.target.value as TipoReporte | "todos")}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
              >
                <option value="todos">Reporte Completo</option>
                <option value="ventas">Ventas</option>
                <option value="gastos">Gastos</option>
                <option value="utilidad">Utilidad</option>
                <option value="membresias">Membresias</option>
              </select>
            </div>
          )}

          {canExportar && (
            <div className="min-w-[180px]">
              <label htmlFor="formato-exportacion" className="mb-1.5 block text-xs font-medium uppercase text-muted-foreground">
                Formato
              </label>
              <select
                id="formato-exportacion"
                value={formatoExportacion}
                onChange={(e) => onFormatoExportacionChange(e.target.value as "XLSX" | "PDF" | "CSV")}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
              >
                <option value="XLSX">Excel (.xlsx)</option>
                <option value="PDF">PDF</option>
                <option value="CSV">CSV</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
          <button
            type="button"
            onClick={onLimpiar}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground"
            title="Restablecer filtros"
          >
            <RefreshCw className="h-4 w-4" />
            Restablecer
          </button>

          {canExportar && (
            <button
              type="button"
              onClick={onExportar}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-accent px-4 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
            >
              <Download className="h-4 w-4" />
              Exportar {exportLabel}
            </button>
          )}

          {onNuevoReporte && (
            <button
              type="button"
              onClick={onNuevoReporte}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors glow-primary glow-primary-hover"
            >
              <FilePlus className="h-4 w-4" />
              Nuevo Reporte
            </button>
          )}
        </div>
      </div>

      {periodo === "personalizado" && (!fechaInicio || !fechaFin) && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
          <Filter className="h-3.5 w-3.5" />
          Selecciona fecha inicio y fecha fin para aplicar el rango personalizado.
        </div>
      )}
    </section>
  )
}
