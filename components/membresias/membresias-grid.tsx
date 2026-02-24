"use client"

import { useState, useMemo } from "react"
import {
  Eye, Pencil, Trash2, ToggleLeft, ToggleRight,
  Calendar, ChevronsLeft, ChevronLeft, ChevronRight,
  ChevronsRight, CreditCard, Tag,
} from "lucide-react"
import type { Membresia } from "@/lib/types/membresias"

interface MembresiasGridProps {
  membresias: Membresia[]
  onVerDetalle: (m: Membresia) => void
  onEditar: (m: Membresia) => void
  onToggleEstado: (m: Membresia) => void
  onEliminar: (m: Membresia) => void
}

function getDuracionTexto(cantidad: number, unidad: string): string {
  return `${cantidad} ${unidad}`
}

function getDescuento(membresia: Membresia): number | null {
  if (!membresia.esOferta || !membresia.precioOferta) return null
  return Math.round(((membresia.precioBase - membresia.precioOferta) / membresia.precioBase) * 100)
}

export function MembresiasGrid({
  membresias,
  onVerDetalle,
  onEditar,
  onToggleEstado,
  onEliminar,
}: MembresiasGridProps) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const totalPages = Math.max(1, Math.ceil(membresias.length / perPage))
  const start = (page - 1) * perPage
  const paginated = membresias.slice(start, start + perPage)

  // Reset page when data changes
  useMemo(() => {
    if (page > totalPages) setPage(1)
  }, [membresias.length, totalPages, page])

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
          <CreditCard className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Tipos de Membresias</h2>
          <span className="ml-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-accent/15 text-accent">
            {membresias.length} membresias
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Mostrar:</span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value))
              setPage(1)
            }}
            className="px-2 py-1 bg-muted border border-border rounded text-foreground text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>por pagina</span>
        </div>
      </div>

      {/* Grid */}
      <div className="p-5">
        {paginated.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-base text-muted-foreground">No se encontraron membresias</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Intenta ajustar los filtros de busqueda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginated.map((m, index) => (
              <MembresiaCard
                key={`membresia-${m.id}-${index}`}
                membresia={m}
                onVerDetalle={onVerDetalle}
                onEditar={onEditar}
                onToggleEstado={onToggleEstado}
                onEliminar={onEliminar}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-border">
        <span className="text-sm text-muted-foreground mb-2 sm:mb-0">
          Mostrando {membresias.length > 0 ? start + 1 : 0} a{" "}
          {Math.min(start + perPage, membresias.length)} de {membresias.length} membresias
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

// ============================================================================
// MEMBRESIA CARD
// ============================================================================

interface MembresiaCardProps {
  membresia: Membresia
  onVerDetalle: (m: Membresia) => void
  onEditar: (m: Membresia) => void
  onToggleEstado: (m: Membresia) => void
  onEliminar: (m: Membresia) => void
}

function MembresiaCard({
  membresia: m,
  onVerDetalle,
  onEditar,
  onToggleEstado,
  onEliminar,
}: MembresiaCardProps) {
  const descuento = getDescuento(m)

  return (
    <div
      className="group relative flex flex-col rounded-xl border border-border/50 overflow-hidden transition-all duration-300 hover:border-accent/50 animate-fade-in-up"
      style={{
        background: "linear-gradient(135deg, var(--card) 0%, #252529 100%)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-[3px] w-full"
        style={{
          background: m.estado === 'activo'
            ? "linear-gradient(90deg, var(--accent), rgba(0,191,255,0.3))"
            : "linear-gradient(90deg, var(--muted-foreground), rgba(160,160,160,0.3))",
          boxShadow: m.estado === 'activo' ? "0 0 8px rgba(0,191,255,0.4)" : "none",
        }}
      />

      {/* Offer badge */}
      {m.esOferta && descuento !== null && (
        <div className="absolute top-4 right-4 z-10">
          <span
            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full text-primary-foreground"
            style={{
              background: "linear-gradient(135deg, #FF3B3B, #FF6B6B)",
              boxShadow: "0 4px 12px rgba(255,59,59,0.35)",
            }}
          >
            -{descuento}% OFF
          </span>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
              m.estado === 'activo'
                ? "bg-success/15 text-success border border-success/30"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {m.estado === 'activo' ? "Activa" : "Inactiva"}
          </span>
        </div>

        <h3 className="text-base font-bold text-foreground mb-2 leading-tight">{m.nombre}</h3>

        <div className="flex items-baseline gap-2">
          <span
            className="text-2xl font-extrabold text-accent"
            style={{ textShadow: "0 0 12px rgba(0,191,255,0.25)" }}
          >
            ${(m.esOferta && m.precioOferta ? m.precioOferta : m.precioBase).toLocaleString()}
          </span>
          {m.esOferta && m.precioOferta && (
            <span className="text-sm text-muted-foreground line-through">
              ${m.precioBase.toLocaleString()}
            </span>
          )}
        </div>

        {m.esOferta && m.fechaFinOferta && (
          <p className="text-[11px] text-warning mt-1.5 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            Válida hasta{" "}
            {new Date(m.fechaFinOferta).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 flex-shrink-0 text-accent/70" />
          <span>{getDuracionTexto(m.duracionCantidad, m.duracionUnidad)}</span>
        </div>

        {m.descripcion && (
          <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">
            {m.descripcion}
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-border/30 bg-background/20 flex items-center justify-end gap-1">
        <button
          onClick={() => onVerDetalle(m)}
          className="p-2 rounded-lg text-muted-foreground/60 hover:text-accent hover:bg-accent/10 transition-all group-hover:text-muted-foreground"
          title="Ver detalle"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => onEditar(m)}
          className="p-2 rounded-lg text-muted-foreground/60 hover:text-warning hover:bg-warning/10 transition-all group-hover:text-muted-foreground"
          title="Editar"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onToggleEstado(m)}
          className="p-2 rounded-lg text-muted-foreground/60 hover:text-success hover:bg-success/10 transition-all group-hover:text-muted-foreground"
          title={m.estado === 'activo' ? "Desactivar" : "Activar"}
        >
          {m.estado === 'activo' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </button>
        <button
          onClick={() => onEliminar(m)}
          className="p-2 rounded-lg text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-all group-hover:text-muted-foreground"
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
