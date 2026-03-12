"use client"

import React, { useState, useCallback, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { AuditoriaService, type AuditoriaEntry, type FiltrosAuditoria } from "@/lib/services/auditoria"
import { useToast } from "@/hooks/use-toast"

// ── Helpers ────────────────────────────────────────────────

const MODULOS_DISPONIBLES = [
  "ventas", "socios", "asistencia", "inventario",
  "movimientos", "usuarios", "reportes", "configuracion", "membresias", "seguridad",
]

const ACCIONES_DISPONIBLES = [
  { value: "login",        label: "Inicio de sesión" },
  { value: "crear",        label: "Registro nuevo" },
  { value: "editar",       label: "Modificación" },
  { value: "eliminar",     label: "Baja / Eliminación" },
  { value: "renovar",      label: "Renovación" },
  { value: "pagar",        label: "Pago registrado" },
  { value: "abrir_caja",   label: "Apertura de caja" },
  { value: "cierre_caja",  label: "Cierre de caja" },
  { value: "ajustarstock", label: "Ajuste de inventario" },
]

function formatFechaHora(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function getModuloColor(modulo: string): string {
  const colores: Record<string, string> = {
    ventas:        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    socios:        "bg-blue-500/15 text-blue-400 border-blue-500/30",
    asistencia:    "bg-violet-500/15 text-violet-400 border-violet-500/30",
    inventario:    "bg-orange-500/15 text-orange-400 border-orange-500/30",
    movimientos:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    usuarios:      "bg-pink-500/15 text-pink-400 border-pink-500/30",
    reportes:      "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    configuracion: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    membresias:    "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    seguridad:     "bg-rose-500/15 text-rose-400 border-rose-500/30",
  }
  return colores[modulo] ?? "bg-muted text-muted-foreground border-border"
}

const MODULO_LABELS: Record<string, string> = {
  ventas:        "Caja / Ventas",
  socios:        "Socios",
  inventario:    "Inventario",
  movimientos:   "Movimientos de caja",
  usuarios:      "Usuarios",
  reportes:      "Reportes",
  configuracion: "Configuración",
  membresias:    "Membresías",
  seguridad:     "Seguridad",
  asistencia:    "Asistencia",
}

function getModuloLabel(modulo: string): string {
  return MODULO_LABELS[modulo] ?? (modulo.charAt(0).toUpperCase() + modulo.slice(1))
}

const ACCION_CONFIG: Record<string, { label: string; color: string }> = {
  login:        { label: "Inicio de sesión",    color: "bg-green-500/15 text-green-400 border-green-500/30" },
  crear:        { label: "Registro nuevo",       color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  editar:       { label: "Modificación",         color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  eliminar:     { label: "Baja / Eliminación",   color: "bg-red-500/15 text-red-400 border-red-500/30" },
  renovar:      { label: "Renovación",           color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" },
  pagar:        { label: "Pago registrado",      color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  abrir_caja:   { label: "Apertura de caja",     color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  cierre_caja:  { label: "Cierre de caja",       color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  ajustarstock: { label: "Ajuste de inventario", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
}

function getAccionConfig(accion: string): { label: string; color: string } {
  const key = accion.toLowerCase().replace(/\s+/g, '_')
  return ACCION_CONFIG[key] ?? { label: accion, color: "bg-muted/50 text-muted-foreground border-border" }
}

const DETALLES_LABELS: Record<string, string> = {
  registroId:     "ID del registro",
  nombrePlan:     "Plan",
  precio:         "Precio",
  nombreSocio:    "Socio",
  codigoSocio:    "Código de socio",
  nombreProducto: "Producto",
  stockAnterior:  "Stock anterior",
  stockNuevo:     "Stock nuevo",
  motivo:         "Motivo",
  usuario:        "Usuario",
}

function DetallesExpandidos({ detalles, userAgent }: { detalles: Record<string, unknown>; userAgent: string }) {
  const entradas = Object.entries(detalles)
  return (
    <div className="space-y-3">
      {entradas.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Información adicional</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-1.5">
            {entradas.map(([key, val]) => (
              <div key={key} className="flex gap-2 text-xs min-w-0">
                <span className="text-muted-foreground shrink-0 min-w-28">
                  {DETALLES_LABELS[key] ?? key}:
                </span>
                <span className="text-foreground font-medium break-all">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Navegador / Dispositivo</p>
        <p className="text-xs text-muted-foreground break-all leading-relaxed">{userAgent || "No registrado"}</p>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────

export function AuditoriaPanel() {
  const { toast } = useToast()

  const [registros, setRegistros]       = useState<AuditoriaEntry[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal]               = useState(0)
  const LIMITE = 20

  // Filtros
  const [moduloFiltro, setModuloFiltro] = useState("")
  const [moduloAplicado, setModuloAplicado] = useState("")
  const [accionFiltro, setAccionFiltro]     = useState("")
  const [accionAplicada, setAccionAplicada] = useState("")

  // Detalle expandido
  const [expandido, setExpandido] = useState<string | null>(null)

  const cargarAuditoria = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const filtros: FiltrosAuditoria = {
        page:  paginaActual,
        limit: LIMITE,
      }
      if (moduloAplicado) filtros.modulo = moduloAplicado
      if (accionAplicada) filtros.accion = accionAplicada

      const resp = await AuditoriaService.obtenerAuditoria(filtros)

      if (resp.success) {
        setRegistros(resp.data)
        setTotal(resp.pagination.total)
        setTotalPaginas(resp.pagination.paginas)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar auditoría"
      setError(msg)
      toast({ variant: "destructive", title: "Error", description: msg })
    } finally {
      setLoading(false)
    }
  }, [paginaActual, moduloAplicado, accionAplicada, toast])

  useEffect(() => {
    cargarAuditoria()
  }, [cargarAuditoria])

  const aplicarFiltro = useCallback(() => {
    setModuloAplicado(moduloFiltro)
    setAccionAplicada(accionFiltro)
    setPaginaActual(1)
  }, [moduloFiltro, accionFiltro])

  const limpiarFiltro = useCallback(() => {
    setModuloFiltro("")
    setModuloAplicado("")
    setAccionFiltro("")
    setAccionAplicada("")
    setPaginaActual(1)
  }, [])

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={moduloFiltro}
          onChange={(e) => setModuloFiltro(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos los módulos</option>
          {MODULOS_DISPONIBLES.map((m) => (
            <option key={m} value={m}>
              {getModuloLabel(m)}
            </option>
          ))}
        </select>

        <select
          value={accionFiltro}
          onChange={(e) => setAccionFiltro(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todas las acciones</option>
          {ACCIONES_DISPONIBLES.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>

        <button
          onClick={aplicarFiltro}
          disabled={loading}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          Filtrar
        </button>

        {(moduloAplicado || accionAplicada) && (
          <button
            onClick={limpiarFiltro}
            className="h-9 px-4 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent/10"
          >
            Limpiar filtros
          </button>
        )}

        <span className="ml-auto text-sm text-muted-foreground">
          {loading ? "Cargando..." : `${total} registros`}
        </span>

        <button
          onClick={cargarAuditoria}
          disabled={loading}
          className="h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent/10 disabled:opacity-50"
          title="Actualizar"
        >
          ↺
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <p className="font-semibold text-sm">Error al cargar auditoría</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={cargarAuditoria}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha / Hora</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuario</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Módulo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acción</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">IP</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {loading && registros.length === 0 ? (
              /* Skeleton */
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : registros.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-muted-foreground">
                  No hay registros de auditoría
                </td>
              </tr>
            ) : (
              registros.map((r) => (
                <React.Fragment key={r.id}>
                  <tr
                    className="border-b border-border/50 hover:bg-accent/5 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                      {formatFechaHora(r.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-foreground">{r.usuario.nombreCompleto}</span>
                        <span className="text-xs text-muted-foreground">@{r.usuario.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getModuloColor(r.modulo)}`}>
                        {getModuloLabel(r.modulo)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const cfg = getAccionConfig(r.accion)
                        return (
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground max-w-xs">
                      <span className="line-clamp-2 leading-relaxed">{r.descripcion}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {r.ip}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setExpandido(expandido === r.id ? null : r.id)}
                        className="text-xs text-primary underline hover:no-underline"
                      >
                        {expandido === r.id ? "Ocultar" : "Ver más"}
                      </button>
                    </td>
                  </tr>
                  {/* Fila de detalles expandidos */}
                  {expandido === r.id && (
                    <tr key={`${r.id}-detail`} className="border-b border-border/50 bg-muted/20">
                      <td colSpan={7} className="px-6 py-4">
                        <DetallesExpandidos
                          detalles={r.detalles && Object.keys(r.detalles).length > 0 ? r.detalles : {}}
                          userAgent={r.userAgent}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ── */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Página {paginaActual} de {totalPaginas} &bull; Total: {total} registros
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1 || loading}
              className="px-4 py-2 bg-card border border-border rounded-lg text-sm hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            {/* Números de página visibles */}
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              const offset = Math.max(0, Math.min(paginaActual - 3, totalPaginas - 5))
              const num = i + 1 + offset
              return (
                <button
                  key={num}
                  onClick={() => setPaginaActual(num)}
                  disabled={loading}
                  className={`w-9 h-9 rounded-lg text-sm border transition-colors disabled:opacity-50 ${
                    num === paginaActual
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-accent/10 text-foreground"
                  }`}
                >
                  {num}
                </button>
              )
            })}
            <button
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas || loading}
              className="px-4 py-2 bg-card border border-border rounded-lg text-sm hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
