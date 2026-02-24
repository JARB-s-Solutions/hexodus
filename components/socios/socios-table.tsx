"use client"

import { useState, useMemo } from "react"
import {
  Eye, Pencil, Trash2, ListChecks, ChevronsLeft, ChevronLeft,
  ChevronRight, ChevronsRight, ChevronsUpDown,
} from "lucide-react"
import type { Socio } from "@/lib/socios-data"
import {
  getVigenciaMembresia, getEstadoContrato, getInicialesSocio,
  membresiaLabels,
} from "@/lib/socios-data"

interface SociosTableProps {
  socios: Socio[]
  onVerDetalle: (s: Socio) => void
  onEditar: (s: Socio) => void
  onEliminar: (s: Socio) => void
}

type SortKey = "id" | "nombre" | "vencimiento"
type SortDir = "asc" | "desc"

export function SociosTable({ socios, onVerDetalle, onEditar, onEliminar }: SociosTableProps) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [sortKey, setSortKey] = useState<SortKey>("id")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const sorted = useMemo(() => {
    return [...socios].sort((a, b) => {
      let cmp = 0
      if (sortKey === "id") cmp = a.id - b.id
      else if (sortKey === "nombre") cmp = a.nombre.localeCompare(b.nombre)
      else if (sortKey === "vencimiento") cmp = new Date(a.fechaFin).getTime() - new Date(b.fechaFin).getTime()
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [socios, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const start = (page - 1) * perPage
  const paginated = sorted.slice(start, start + perPage)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setPage(1)
  }

  const vigenciaColors = {
    vigente: "bg-[#22C55E]/15 text-[#22C55E]",
    por_vencer: "bg-[#FFD700]/15 text-[#FFD700]",
    vencida: "bg-primary/15 text-primary",
  }

  const contratoColors = {
    activo: "bg-[#22C55E]/15 text-[#22C55E]",
    por_vencer: "bg-[#FF8C00]/15 text-[#FF8C00]",
    vencido: "bg-primary/15 text-primary",
    sin_contrato: "bg-muted text-muted-foreground",
  }

  const contratoLabels = {
    activo: "Activo",
    por_vencer: "Por vencer",
    vencido: "Vencido",
    sin_contrato: "Pendiente",
  }

  const vigenciaLabels = {
    vigente: "Vigente",
    por_vencer: "Por vencer",
    vencida: "Vencido",
  }

  const generoColors = {
    M: "bg-accent/15 text-accent",
    F: "bg-primary/15 text-primary",
    O: "bg-muted text-muted-foreground",
  }

  // Pagination range
  const maxButtons = 5
  let pStart = Math.max(1, page - Math.floor(maxButtons / 2))
  let pEnd = Math.min(totalPages, pStart + maxButtons - 1)
  if (pEnd - pStart < maxButtons - 1) pStart = Math.max(1, pEnd - maxButtons + 1)
  const pageNumbers = Array.from({ length: pEnd - pStart + 1 }, (_, i) => pStart + i)

  return (
    <div
      className="bg-card rounded-xl overflow-hidden"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <ListChecks className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Lista de Socios</h2>
          <span className="ml-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-accent/15 text-accent">
            {socios.length} socios
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Mostrar:</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
            className="px-2 py-1 bg-muted border border-border rounded text-foreground text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>por pagina</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{ maxHeight: "calc(100vh - 460px)" }}>
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted/70 transition"
                onClick={() => toggleSort("id")}
              >
                <span className="flex items-center gap-1">
                  Clave <ChevronsUpDown className="h-3 w-3" />
                </span>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted/70 transition"
                onClick={() => toggleSort("nombre")}
              >
                <span className="flex items-center gap-1">
                  Nombre <ChevronsUpDown className="h-3 w-3" />
                </span>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Genero
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Contacto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Membresia
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted/70 transition"
                onClick={() => toggleSort("vencimiento")}
              >
                <span className="flex items-center gap-1">
                  Vencimiento <ChevronsUpDown className="h-3 w-3" />
                </span>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Vigencia
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estado Contrato
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                  <p className="text-base">No se encontraron socios</p>
                  <p className="text-xs mt-1">Intenta ajustar los filtros de busqueda</p>
                </td>
              </tr>
            ) : (
              paginated.map((s) => {
                const iniciales = getInicialesSocio(s.nombre)
                const vigencia = getVigenciaMembresia(s.fechaFin)
                const contrato = getEstadoContrato(s)
                const fechaVenc = new Date(s.fechaFin)
                const diffDias = Math.ceil((fechaVenc.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

                return (
                  <tr
                    key={s.id}
                    className="hover:bg-muted/30 transition-colors duration-150 animate-fade-in-up"
                  >
                    {/* Clave */}
                    <td className="px-4 py-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          vigencia === "vigente"
                            ? "bg-[#22C55E]/15 text-[#22C55E]"
                            : vigencia === "por_vencer"
                            ? "bg-[#FFD700]/15 text-[#FFD700]"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        {iniciales}
                      </div>
                    </td>
                    {/* Nombre */}
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-foreground">{s.nombre}</div>
                      <div className="text-xs text-muted-foreground">{s.correo}</div>
                    </td>
                    {/* Genero */}
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${generoColors[s.genero]}`}>
                        {s.genero === "M" ? "Masculino" : s.genero === "F" ? "Femenino" : "Otro"}
                      </span>
                    </td>
                    {/* Contacto */}
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div>{s.telefono}</div>
                    </td>
                    {/* Membresia */}
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {membresiaLabels[s.membresia]}
                    </td>
                    {/* Vencimiento */}
                    <td className="px-4 py-3">
                      <div className={`text-sm font-semibold ${vigencia === "vigente" ? "text-[#22C55E]" : vigencia === "por_vencer" ? "text-[#FFD700]" : "text-primary"}`}>
                        {fechaVenc.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </div>
                      <div className={`text-xs ${diffDias < 0 ? "text-primary" : diffDias <= 7 ? "text-[#FFD700]" : "text-muted-foreground"}`}>
                        {diffDias < 0
                          ? `Vencido hace ${Math.abs(diffDias)} dias`
                          : diffDias === 0
                          ? "Vence hoy"
                          : `En ${diffDias} dias`}
                      </div>
                    </td>
                    {/* Vigencia */}
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${vigenciaColors[vigencia]}`}>
                        {vigenciaLabels[vigencia]}
                      </span>
                    </td>
                    {/* Estado Contrato */}
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${contratoColors[contrato]}`}>
                        {contratoLabels[contrato]}
                      </span>
                    </td>
                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onVerDetalle(s)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditar(s)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEliminar(s)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-border">
        <span className="text-sm text-muted-foreground mb-2 sm:mb-0">
          Mostrando {sorted.length > 0 ? start + 1 : 0} a {Math.min(start + perPage, sorted.length)} de {sorted.length} socios
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-2.5 py-1.5 text-sm rounded-l-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-2.5 py-1.5 text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`px-3 py-1.5 text-sm border border-border transition ${
                n === page
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 text-sm rounded-r-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
