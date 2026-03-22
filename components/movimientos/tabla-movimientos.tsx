"use client"

import { useState } from "react"
import { useAuthContext } from "@/lib/contexts/auth-context"
import {
  Plus,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  User,
  Clock,
  Calendar,
  Activity,
} from "lucide-react"
import type { Movimiento } from "@/lib/types/movimientos"

interface PaginationInfo {
  current_page: number
  limit: number
  total_records: number
  total_pages: number
}

interface TablaMovimientosProps {
  movimientos: Movimiento[]
  onNuevo: () => void
  onVer: (m: Movimiento) => void
  onEditar: (m: Movimiento) => void
  onEliminar: (m: Movimiento) => void
  serverPagination?: PaginationInfo
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
}


const tipoPagoLabels: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
}

const tipoPagoIcons: Record<string, string> = {
  efectivo: "E",
  transferencia: "T",
  tarjeta: "C",
}

function fmtMoney(n: number): string {
  const fixed = n.toFixed(2)
  const [intPart, decPart] = fixed.split(".")
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `$${formatted}.${decPart}`
}

function formatFecha(fecha: string): string {
  const parts = fecha.split("-")
  if (parts.length !== 3) return fecha
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const userColors: Record<string, string> = {
  Admin: "bg-primary/20 text-primary",
  "Carlos Ramirez": "bg-accent/20 text-accent",
  "Ana Martinez": "bg-success/20 text-success",
  "Luis Hernandez": "bg-warning/20 text-warning",
  "Sofia Torres": "bg-chart-5/20 text-chart-5",
}

type SortField = "fecha" | "tipo" | "total" | "usuario" | "concepto"
type SortDir = "asc" | "desc"

export function TablaMovimientos({
  movimientos,
  onNuevo,
  onVer,
  onEliminar,
  serverPagination,
  onPageChange,
  onLimitChange,
}: TablaMovimientosProps) {
  const { tienePermiso } = useAuthContext()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [sortField, setSortField] = useState<SortField>("fecha")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Usar paginación del servidor si está disponible
  const useServerPagination = !!serverPagination && !!onPageChange

  const sorted = [...movimientos].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1
    switch (sortField) {
      case "fecha": {
        const cmp = a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora)
        return cmp * dir
      }
      case "tipo":
        return a.tipo.localeCompare(b.tipo) * dir
      case "total":
        return (a.total - b.total) * dir
      case "usuario":
        return a.usuario.localeCompare(b.usuario) * dir
      case "concepto":
        return a.concepto.localeCompare(b.concepto) * dir
      default:
        return 0
    }
  })

  // Calcular paginación
  let totalPages: number
  let clampedPage: number
  let visible: Movimiento[]
  let start: number
  let end: number
  let totalRecords: number

  if (useServerPagination) {
    // Paginación del servidor: mostrar todos los movimientos sin paginar
    totalPages = serverPagination.total_pages
    clampedPage = serverPagination.current_page
    totalRecords = serverPagination.total_records
    start = (serverPagination.current_page - 1) * serverPagination.limit
    end = Math.min(start + sorted.length, serverPagination.total_records)
    visible = sorted
  } else {
    // Paginación local: paginar los movimientos localmente
    totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
    clampedPage = Math.min(page, totalPages)
    totalRecords = sorted.length
    start = (clampedPage - 1) * perPage
    end = Math.min(start + perPage, sorted.length)
    visible = sorted.slice(start, end)
  }

  const goTo = (p: number) => {
    if (useServerPagination && onPageChange) {
      onPageChange(p)
    } else {
      setPage(Math.max(1, Math.min(p, totalPages)))
    }
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
    setPage(1)
  }

  const pageNumbers: number[] = []
  const maxButtons = 5
  let startPage = Math.max(1, clampedPage - Math.floor(maxButtons / 2))
  const endPage = Math.min(totalPages, startPage + maxButtons - 1)
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1)
  }
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i)

  function SortHeader({ field, children }: { field: SortField; children: React.ReactNode }) {
    const isActive = sortField === field
    return (
      <button
        onClick={() => toggleSort(field)}
        className={`inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors ${
          isActive ? "text-accent" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {children}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? "text-accent" : "text-muted-foreground/50"}`} />
      </button>
    )
  }

  return (
    <div
      className="bg-card rounded-xl overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Registro de Movimientos</h2>
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-accent/15 text-accent border border-accent/20">
            {totalRecords}
          </span>
        </div>
        <button
          onClick={onNuevo}
          className="px-4 py-2 font-medium rounded-lg text-sm bg-primary text-primary-foreground transition-all duration-300 glow-primary glow-primary-hover flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Movimiento
        </button>
      </div>

      {/* Per-page and info */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          {movimientos.length === 0 ? "Sin resultados" : `${start + 1}-${end} de ${totalRecords} registros`}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="per-page" className="text-xs text-muted-foreground">
            Mostrar:
          </label>
          <select
            id="per-page"
            value={useServerPagination ? serverPagination.limit : perPage}
            onChange={(e) => {
              const newLimit = Number(e.target.value)
              if (useServerPagination && onLimitChange) {
                onLimitChange(newLimit)
              } else {
                setPerPage(newLimit)
                setPage(1)
              }
            }}
            className="px-2 py-1 bg-card border border-border rounded text-foreground text-xs"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-3 text-left">
                <SortHeader field="fecha">Fecha / Hora</SortHeader>
              </th>
              <th className="px-5 py-3 text-left">
                <SortHeader field="tipo">Tipo</SortHeader>
              </th>
              <th className="px-5 py-3 text-left">
                <SortHeader field="concepto">Concepto</SortHeader>
              </th>
              <th className="px-5 py-3 text-left">
                <SortHeader field="total">Monto</SortHeader>
              </th>
              <th className="px-5 py-3 text-left">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Metodo
                </span>
              </th>
              <th className="px-5 py-3 text-left">
                <SortHeader field="usuario">Responsable</SortHeader>
              </th>
              <th className="px-5 py-3 text-center">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Acciones
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Activity className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm">No se encontraron movimientos</p>
                    <p className="text-muted-foreground/60 text-xs">Ajusta los filtros o registra un nuevo movimiento</p>
                  </div>
                </td>
              </tr>
            ) : (
              visible.map((m, idx) => (
                <tr
                  key={m.id}
                  className="group hover:bg-muted/30 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${idx * 15}ms` }}
                >
                  {/* Fecha + Hora + Folio */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="flex flex-col items-center pt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatFecha(m.fecha)}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3 text-muted-foreground/50" />
                          <span className="text-xs text-muted-foreground">{m.hora} hrs</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/50 mt-0.5 font-mono">{m.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Tipo */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md ${
                        m.tipo === "ingreso"
                          ? "bg-success/15 text-success border border-success/30"
                          : "bg-destructive/15 text-destructive border border-destructive/30"
                      }`}
                    >
                      {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                    </span>
                  </td>

                  {/* Concepto + Observaciones */}
                  <td className="px-5 py-3.5 max-w-[240px]">
                    <p className="text-sm text-foreground truncate" title={m.concepto}>
                      {m.concepto}
                    </p>
                    {m.observaciones && (
                      <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5" title={m.observaciones}>
                        {m.observaciones}
                      </p>
                    )}
                  </td>

                  {/* Monto */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-sm font-bold ${
                        m.tipo === "ingreso" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {m.tipo === "ingreso" ? "+" : "-"}
                      {fmtMoney(m.total)}
                    </span>
                  </td>

                  {/* Metodo de pago */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {tipoPagoIcons[m.tipoPago] || "?"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tipoPagoLabels[m.tipoPago] || m.tipoPago}
                      </span>
                    </div>
                  </td>

                  {/* Responsable */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          userColors[m.usuario] || "bg-muted text-muted-foreground"
                        }`}
                      >
                        {getInitials(m.usuario)}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-foreground leading-tight">{m.usuario}</p>
                      </div>
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-3.5 text-center">
                    {confirmDelete === m.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            onEliminar(m)
                            setConfirmDelete(null)
                          }}
                          className="px-2 py-1 text-[10px] font-medium rounded bg-destructive text-destructive-foreground"
                        >
                          Si
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 text-[10px] font-medium rounded bg-muted text-muted-foreground"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onVer(m)}
                          className="p-1.5 rounded-lg hover:bg-accent/15 text-accent transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {tienePermiso('movimientos', 'eliminar') && (
                          <button
                            onClick={() => setConfirmDelete(m.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/15 text-destructive transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 border-t border-border bg-muted/20">
          {/* Info de registros - Izquierda */}
          <div className="text-xs text-muted-foreground min-w-[140px]">
            {useServerPagination && serverPagination ? (
              <span>
                Mostrando <span className="font-medium text-foreground">{start + 1}-{end}</span> de <span className="font-medium text-foreground">{totalRecords}</span>
              </span>
            ) : (
              <span>
                Página <span className="font-medium text-foreground">{clampedPage}</span> de <span className="font-medium text-foreground">{totalPages}</span>
              </span>
            )}
          </div>

          {/* Controles de paginación - Centro */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(1)}
              disabled={clampedPage === 1}
              className="p-2 border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => goTo(clampedPage - 1)}
              disabled={clampedPage === 1}
              className="p-2 border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1 px-2">
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  onClick={() => goTo(n)}
                  className={`min-w-[32px] h-8 px-3 text-sm font-medium rounded-md transition-all ${
                    n === clampedPage
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              onClick={() => goTo(clampedPage + 1)}
              disabled={clampedPage === totalPages}
              className="p-2 border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => goTo(totalPages)}
              disabled={clampedPage === totalPages}
              className="p-2 border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>

          {/* Selector de límite - Derecha */}
          <div className="text-xs text-muted-foreground">
            {/* Spacer para mantener distribución */}
          </div>
        </div>
      )}
    </div>
  )
}
