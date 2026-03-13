"use client"

import { useState, useMemo } from "react"
import {
  FileText,
  Download,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
} from "lucide-react"
import { formatCurrency } from "@/lib/reportes-data"

export interface ReporteHistorial {
  id: string
  nombre: string
  tipo: string
  periodo: string
  fechaGenerado: string
  estado: "generado" | "descargado"
  formato: "Excel"
  resumen: {
    ventas: number
    gastos: number
    utilidad: number
  }
}

interface HistorialReportesProps {
  reportes: ReporteHistorial[]
  onDescargar: (reporte: ReporteHistorial) => void
  onEliminar: (id: string) => void
  canDescargar?: boolean
  canEliminar?: boolean
}

type SortKey = "id" | "tipo" | "fechaGenerado" | "estado"
type SortDir = "asc" | "desc"

export function HistorialReportes({
  reportes,
  onDescargar,
  onEliminar,
  canDescargar = true,
  canEliminar = true,
}: HistorialReportesProps) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortKey, setSortKey] = useState<SortKey>("fechaGenerado")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sorted = useMemo(() => {
    const items = [...reportes]
    items.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDir === "asc" ? cmp : -cmp
    })
    return items
  }, [reportes, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const paginated = sorted.slice((page - 1) * perPage, page * perPage)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const tipoColors: Record<string, string> = {
    ventas: "bg-success/20 text-success",
    gastos: "bg-primary/20 text-primary",
    utilidad: "bg-accent/20 text-accent",
    membresias: "bg-warning/20 text-warning",
    completo: "bg-chart-5/20 text-chart-5",
  }

  const estadoColors: Record<string, string> = {
    generado: "bg-success/20 text-success",
    descargado: "bg-accent/20 text-accent",
  }

  return (
    <div
      className="bg-card rounded-xl p-5"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          <h2 className="text-base font-semibold text-foreground">Historial de Reportes</h2>
          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-accent/20 text-accent">
            {reportes.length} reportes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="rpp" className="text-xs text-muted-foreground">Mostrar:</label>
          <select
            id="rpp"
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value))
              setPage(1)
            }}
            className="px-2 py-1 bg-background border border-border rounded text-foreground text-xs appearance-none focus:border-accent focus:ring-0 focus:outline-none cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          <span className="text-xs text-muted-foreground">por pagina</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg" style={{ maxHeight: "calc(100vh - 520px)" }}>
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              <th
                className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-background/50 transition-colors"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center gap-1">
                  <span>ID / Nombre</span>
                  <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-background/50 transition-colors"
                onClick={() => handleSort("tipo")}
              >
                <div className="flex items-center gap-1">
                  <span>Tipo</span>
                  <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Periodo
              </th>
              <th
                className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-background/50 transition-colors"
                onClick={() => handleSort("fechaGenerado")}
              >
                <div className="flex items-center gap-1">
                  <span>Generado</span>
                  <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-background/50 transition-colors"
                onClick={() => handleSort("estado")}
              >
                <div className="flex items-center gap-1">
                  <span>Estado</span>
                  <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Formato
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay reportes generados aun. Usa el boton "Nuevo Reporte" para crear uno.
                </td>
              </tr>
            ) : (
              paginated.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-muted/50 transition-colors animate-fade-in-up"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.nombre}</p>
                      <p className="text-[11px] text-muted-foreground">{r.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${tipoColors[r.tipo] || "bg-muted text-muted-foreground"}`}>
                      {r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {r.periodo}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {r.fechaGenerado}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${estadoColors[r.estado] || ""}`}>
                      {r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-success/20 text-success">
                      {r.formato}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"
                        title="Ver resumen"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canDescargar && (
                        <button
                          onClick={() => onDescargar(r)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-success hover:bg-success/10 transition-all"
                          title="Descargar"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      {canEliminar && (
                        <button
                          onClick={() => onEliminar(r.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {/* Expanded summary row */}
                    {expandedId === r.id && (
                      <div className="mt-2 p-3 bg-background rounded-lg text-left animate-fade-in-up">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Resumen Rapido</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Ventas:</span>
                            <p className="font-medium text-success">{formatCurrency(r.resumen.ventas)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Gastos:</span>
                            <p className="font-medium text-primary">{formatCurrency(r.resumen.gastos)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Utilidad:</span>
                            <p className={`font-medium ${r.resumen.utilidad >= 0 ? "text-accent" : "text-destructive"}`}>
                              {formatCurrency(r.resumen.utilidad)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-5 pt-4 border-t border-border gap-3">
          <p className="text-xs text-muted-foreground">
            Mostrando{" "}
            <span className="font-semibold text-foreground">{(page - 1) * perPage + 1}</span>
            {" - "}
            <span className="font-semibold text-foreground">{Math.min(page * perPage, sorted.length)}</span>
            {" de "}
            <span className="font-semibold text-foreground">{sorted.length}</span> reportes
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2.5 py-1.5 text-xs text-muted-foreground bg-muted border border-border rounded hover:text-foreground hover:bg-background disabled:opacity-40 transition-colors"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1.5 text-xs text-muted-foreground bg-muted border border-border rounded hover:text-foreground hover:bg-background disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1.5 text-xs rounded font-medium transition-all ${
                    page === pageNum
                      ? "bg-primary text-primary-foreground glow-primary"
                      : "text-muted-foreground bg-muted border border-border hover:text-foreground hover:bg-background"
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 text-xs text-muted-foreground bg-muted border border-border rounded hover:text-foreground hover:bg-background disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 text-xs text-muted-foreground bg-muted border border-border rounded hover:text-foreground hover:bg-background disabled:opacity-40 transition-colors"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
