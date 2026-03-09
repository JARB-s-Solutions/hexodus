"use client"

import { useState } from "react"
import {
  Eye, Edit2, ToggleLeft, Trash2, ShieldCheck,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ChevronsUpDown,
} from "lucide-react"
import type { Usuario } from "@/lib/usuarios-data"
import { formatFechaCorta } from "@/lib/usuarios-data"

interface UsuariosTableProps {
  usuarios: Usuario[]
  onVerDetalle: (u: Usuario) => void
  onEditar: (u: Usuario) => void
  onCambiarEstado: (u: Usuario) => void
  onEliminar: (u: Usuario) => void
}

export function UsuariosTable({
  usuarios,
  onVerDetalle,
  onEditar,
  onCambiarEstado,
  onEliminar,
}: UsuariosTableProps) {
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [sortField, setSortField] = useState<"nombre" | "ultimoAcceso">("ultimoAcceso")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // Sort
  const sorted = [...usuarios].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1
    if (sortField === "nombre") return a.nombre.localeCompare(b.nombre) * dir
    
    // Manejar valores null en ultimoAcceso - mover nulls al final
    if (!a.ultimoAcceso && !b.ultimoAcceso) return 0
    if (!a.ultimoAcceso) return 1  // a va al final
    if (!b.ultimoAcceso) return -1 // b va al final
    return a.ultimoAcceso.localeCompare(b.ultimoAcceso) * dir
  })

  const totalPaginas = Math.max(1, Math.ceil(sorted.length / porPagina))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * porPagina
  const usuariosPagina = sorted.slice(inicio, inicio + porPagina)

  function toggleSort(field: "nombre" | "ultimoAcceso") {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  function generarBotonesPagina() {
    const botones: (number | "...")[] = []
    const max = 5
    let start = Math.max(1, paginaActual - Math.floor(max / 2))
    let end = Math.min(totalPaginas, start + max - 1)
    if (end - start + 1 < max) start = Math.max(1, end - max + 1)

    if (start > 1) {
      botones.push(1)
      if (start > 2) botones.push("...")
    }
    for (let i = start; i <= end; i++) botones.push(i)
    if (end < totalPaginas) {
      if (end < totalPaginas - 1) botones.push("...")
      botones.push(totalPaginas)
    }
    return botones
  }

  return (
    <div
      className="bg-card rounded-xl overflow-hidden"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      {/* Table header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <h2 className="text-base font-semibold text-foreground">Lista de Usuarios</h2>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground" htmlFor="per-page">Mostrar:</label>
          <select
            id="per-page"
            value={porPagina}
            onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1) }}
            className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-accent"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-xs text-muted-foreground">por pagina</span>
        </div>
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
                onClick={() => toggleSort("nombre")}
              >
                <div className="flex items-center gap-1">
                  <span>ID / Usuario</span>
                  <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Informacion
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Rol
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estado
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
                onClick={() => toggleSort("ultimoAcceso")}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Ultimo Acceso</span>
                  <ChevronsUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usuariosPagina.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No se encontraron usuarios con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              usuariosPagina.map((u) => {

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-muted/30 transition-colors duration-200 animate-fade-in-up"
                  >
                    {/* ID / User */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-accent">#{u.id}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{u.nombre}</p>
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                        </div>
                      </div>
                    </td>

                    {/* Info */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm font-medium text-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.telefono}</p>
                    </td>

                    {/* Rol */}
                    <td className="px-4 py-3 text-center">
                      <span 
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: u.rol.color }}
                      >
                        {u.rol.nombre}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.activo 
                          ? "bg-[#22C55E]/20 text-[#22C55E]" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {u.activo && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                        )}
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    {/* Ultimo Acceso */}
                    <td className="px-4 py-3 text-center">
                      <p className="text-sm font-medium text-foreground">
                        {u.ultimoAcceso ? formatFechaCorta(u.ultimoAcceso) : "Nunca"}
                      </p>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onVerDetalle(u)}
                          className="p-1.5 rounded text-muted-foreground hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors"
                          title="Ver Detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditar(u)}
                          className="p-1.5 rounded text-muted-foreground hover:text-[#22C55E] hover:bg-[#22C55E]/10 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onCambiarEstado(u)}
                          className="p-1.5 rounded text-muted-foreground hover:text-[#FBB424] hover:bg-[#FBB424]/10 transition-colors"
                          title="Cambiar Estado"
                        >
                          <ToggleLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEliminar(u)}
                          className="p-1.5 rounded text-muted-foreground hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
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

      {/* Pagination footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-border gap-3">
        <p className="text-xs text-muted-foreground">
          Mostrando{" "}
          <span className="font-semibold text-foreground">{sorted.length > 0 ? inicio + 1 : 0}</span>
          {" - "}
          <span className="font-semibold text-foreground">{Math.min(inicio + porPagina, sorted.length)}</span>
          {" de "}
          <span className="font-semibold text-foreground">{sorted.length}</span> usuarios
        </p>

        <div className="flex items-center gap-1.5">
          <button
            disabled={paginaActual === 1}
            onClick={() => setPagina(1)}
            className="px-2 py-1.5 text-sm text-muted-foreground bg-muted/50 border border-border rounded hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            disabled={paginaActual === 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            className="px-2 py-1.5 text-sm text-muted-foreground bg-muted/50 border border-border rounded hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {generarBotonesPagina().map((b, i) =>
            b === "..." ? (
              <span key={`dots-${i}`} className="px-1.5 text-xs text-muted-foreground">...</span>
            ) : (
              <button
                key={b}
                onClick={() => setPagina(b as number)}
                className={`px-3 py-1.5 text-xs font-medium border rounded transition-colors duration-200 ${
                  b === paginaActual
                    ? "bg-primary text-primary-foreground border-primary glow-primary"
                    : "text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                }`}
              >
                {b}
              </button>
            )
          )}

          <button
            disabled={paginaActual === totalPaginas}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            className="px-2 py-1.5 text-sm text-muted-foreground bg-muted/50 border border-border rounded hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            disabled={paginaActual === totalPaginas}
            onClick={() => setPagina(totalPaginas)}
            className="px-2 py-1.5 text-sm text-muted-foreground bg-muted/50 border border-border rounded hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
