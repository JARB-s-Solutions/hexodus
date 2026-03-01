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
  FileDown,
} from "lucide-react"
import type { Venta } from "@/lib/types/ventas"
import { formatCurrency, formatDateTime } from "@/lib/types/ventas"

interface VentasTableProps {
  ventas: Venta[]
  onVerDetalle: (venta: Venta) => void
  onExportar: () => void
}

const metodoPagoStyles: Record<string, string> = {
  "Efectivo": "bg-success/20 text-success",
  "Tarjeta": "bg-accent/20 text-accent",
  "Transferencia SPEI": "bg-chart-5/20 text-chart-5",
  "Digital": "bg-warning/20 text-warning",
}

export function VentasTable({ ventas, onVerDetalle, onExportar }: VentasTableProps) {
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [sortField, setSortField] = useState<"idVenta" | "fechaHora" | "total">("fechaHora")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const sorted = [...ventas].sort((a, b) => {
    let cmp = 0
    if (sortField === "idVenta") cmp = a.idVenta.localeCompare(b.idVenta)
    else if (sortField === "fechaHora") {
      cmp = a.fechaHora.localeCompare(b.fechaHora)
    } else if (sortField === "total") cmp = a.total - b.total
    return sortDir === "desc" ? -cmp : cmp
  })

  const totalPages = Math.ceil(sorted.length / porPagina)
  const inicio = (pagina - 1) * porPagina
  const paginados = sorted.slice(inicio, inicio + porPagina)

  function toggleSort(field: "idVenta" | "fechaHora" | "total") {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
    setPagina(1)
  }

  function handlePorPagina(val: number) {
    setPorPagina(val)
    setPagina(1)
  }

  // Page numbers to display
  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (pagina > 3) pages.push("...")
      for (let i = Math.max(2, pagina - 1); i <= Math.min(totalPages - 1, pagina + 1); i++) {
        pages.push(i)
      }
      if (pagina < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div
      className="bg-card rounded-xl p-5"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Historial de Ventas</h2>
          <span className="ml-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-accent/20 text-accent">
            {ventas.length} ventas
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExportar}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-accent text-accent hover:bg-accent/10 transition-colors"
          >
            <FileDown className="h-3.5 w-3.5" />
            Exportar Excel
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="por-pagina" className="text-xs text-muted-foreground">
              Mostrar:
            </label>
            <select
              id="por-pagina"
              value={porPagina}
              onChange={(e) => handlePorPagina(Number(e.target.value))}
              className="px-2 py-1 bg-muted border border-border rounded text-foreground text-xs cursor-pointer focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg" style={{ maxHeight: "calc(100vh - 520px)" }}>
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleSort("idVenta")}
              >
                <div className="flex items-center gap-1">
                  <span>ID Venta</span>
                  <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Productos
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleSort("total")}
              >
                <div className="flex items-center gap-1">
                  <span>Total</span>
                  <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleSort("fechaHora")}
              >
                <div className="flex items-center gap-1">
                  <span>Fecha / Hora</span>
                  <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Metodo Pago
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {paginados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  No se encontraron ventas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              paginados.map((venta, idx) => {
                const { fecha, hora } = formatDateTime(venta.fechaHora)
                return (
                  <tr
                    key={venta.id}
                    className="hover:bg-muted/30 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="px-4 py-3 text-sm font-mono text-accent">{venta.idVenta}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{venta.cliente}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {venta.productosResumen}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary">
                      {formatCurrency(venta.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div>{fecha}</div>
                      <div className="text-xs">{hora}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
                          metodoPagoStyles[venta.metodoPago] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {venta.metodoPago}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
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
      {ventas.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-border gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Mostrando</span>
            <span className="font-medium text-foreground">{inicio + 1}</span>
            <span>a</span>
            <span className="font-medium text-foreground">{Math.min(inicio + porPagina, ventas.length)}</span>
            <span>de</span>
            <span className="font-medium text-foreground">{ventas.length}</span>
            <span>ventas</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina(1)}
              disabled={pagina === 1}
              className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-border rounded-l-lg text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
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
                  onClick={() => setPagina(p)}
                  className={`px-2.5 py-1.5 text-xs font-medium border border-border rounded transition-all duration-200 ${
                    pagina === p
                      ? "bg-primary text-primary-foreground border-primary glow-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setPagina((p) => Math.min(totalPages, p + 1))}
              disabled={pagina === totalPages}
              className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-border text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPagina(totalPages)}
              disabled={pagina === totalPages}
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
