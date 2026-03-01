"use client"

import { useState } from "react"
import {
  ShoppingCart,
  ChevronsUpDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import type { Venta, Pagination } from "@/lib/types/ventas"
import { formatCurrency, formatDateTime } from "@/lib/types/ventas"

interface VentasTableProps {
  ventas: Venta[]
  pagination: Pagination
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onVerDetalle: (venta: Venta) => void
  onExportar: () => void
}

const metodoPagoStyles: Record<string, string> = {
  "Efectivo": "bg-success/20 text-success",
  "Tarjeta": "bg-accent/20 text-accent",
  "Transferencia SPEI": "bg-chart-5/20 text-chart-5",
  "Digital": "bg-warning/20 text-warning",
}

export function VentasTable({ ventas, pagination, onPageChange, onLimitChange, onVerDetalle, onExportar }: VentasTableProps) {
  const [sortField, setSortField] = useState<"idVenta" | "fechaHora" | "total">("fechaHora")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // Sorting local (solo para datos actuales en pantalla)
  const sorted = [...ventas].sort((a, b) => {
    let cmp = 0
    if (sortField === "idVenta") cmp = a.idVenta.localeCompare(b.idVenta)
    else if (sortField === "fechaHora") {
      cmp = a.fechaHora.localeCompare(b.fechaHora)
    } else if (sortField === "total") cmp = a.total - b.total
    return sortDir === "desc" ? -cmp : cmp
  })

  function toggleSort(field: "idVenta" | "fechaHora" | "total") {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  // Page numbers to display (usando paginación del servidor)
  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = []
    const totalPages = pagination.totalPages
    const currentPage = pagination.currentPage
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  // Calcular rango actual
  const inicio = (pagination.currentPage - 1) * pagination.limit + 1
  const fin = Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)

  return (
    <div
      className="bg-card rounded-xl p-4"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Historial de Ventas</h2>
          <span className="ml-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-accent/20 text-accent">
            {pagination.totalRecords} ventas
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="por-pagina" className="text-xs text-muted-foreground">
            Mostrar:
          </label>
          <select
            id="por-pagina"
            value={pagination.limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 bg-muted border border-border rounded text-foreground text-xs cursor-pointer focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg" style={{ maxHeight: "calc(100vh - 320px)" }}>
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              <th
                className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleSort("idVenta")}
              >
                <div className="flex items-center gap-1">
                  <span>ID Venta</span>
                  <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Cliente
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Productos
              </th>
              <th
                className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleSort("total")}
              >
                <div className="flex items-center gap-1">
                  <span>Total</span>
                  <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleSort("fechaHora")}
              >
                <div className="flex items-center gap-1">
                  <span>Fecha / Hora</span>
                  <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Metodo Pago
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground text-sm">
                  No se encontraron ventas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              sorted.map((venta, idx) => {
                const { fecha, hora } = formatDateTime(venta.fechaHora)
                return (
                  <tr
                    key={venta.id}
                    className="hover:bg-muted/30 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="px-3 py-2.5 text-sm font-mono text-accent">{venta.idVenta}</td>
                    <td className="px-3 py-2.5 text-sm text-foreground">{venta.cliente}</td>
                    <td className="px-3 py-2.5 text-sm text-muted-foreground">
                      {venta.productosResumen}
                    </td>
                    <td className="px-3 py-2.5 text-sm font-semibold text-primary">
                      {formatCurrency(venta.total)}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-muted-foreground">
                      <div>{fecha}</div>
                      <div className="text-xs">{hora}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
                          metodoPagoStyles[venta.metodoPago] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {venta.metodoPago}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => onVerDetalle(venta)}
                      className="p-1.5 rounded-md text-accent hover:bg-accent/10 transition-all duration-200 hover:scale-110"
                      title="Ver detalle"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalRecords > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-border gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Mostrando</span>
            <span className="font-medium text-foreground">{inicio}</span>
            <span>a</span>
            <span className="font-medium text-foreground">{fin}</span>
            <span>de</span>
            <span className="font-medium text-foreground">{pagination.totalRecords}</span>
            <span>ventas</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={pagination.currentPage === 1}
              className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-border rounded-l-lg text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onPageChange(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1}
              className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-border text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-2 text-muted-foreground text-xs">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  className={`px-2.5 py-1.5 text-xs font-medium border border-border rounded transition-all duration-200 ${
                    pagination.currentPage === p
                      ? "bg-primary text-primary-foreground border-primary glow-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-border text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-border rounded-r-lg text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
