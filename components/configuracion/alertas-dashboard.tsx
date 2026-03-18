"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, RefreshCw, CheckCircle, X, AlertTriangle, Clock, Package, Activity, CreditCard, Loader2 } from "lucide-react"
import { AlertasService } from "@/lib/services/alertas"
import { apiPost } from "@/lib/api"
import type { AlertaItem, AlertaPrioridad, AlertasResumen } from "@/lib/types/alertas"

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function formatFecha(fecha: string) {
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  const d = new Date(fecha)
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
}

const PRIORIDAD_STYLES: Record<AlertaPrioridad, { label: string; bg: string; text: string; border: string }> = {
  baja:    { label: "Baja",    bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/30" },
  media:   { label: "Media",   bg: "bg-amber-500/10",  text: "text-amber-400",  border: "border-amber-500/30" },
  alta:    { label: "Alta",    bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  urgente: { label: "Urgente", bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/30" },
}

const TIPO_ICON: Record<string, typeof Bell> = {
  vencimiento_membresia: Clock,
  stock_bajo:            Package,
  inactividad_socio:     Activity,
  pago_pendiente:        CreditCard,
}

function PrioridadBadge({ prioridad }: { prioridad: AlertaPrioridad }) {
  const s = PRIORIDAD_STYLES[prioridad] ?? PRIORIDAD_STYLES.media
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  )
}

function ResumenBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-lg bg-muted/40 border border-border/40`}>
      <span className={`text-lg font-bold ${color}`}>{count}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

// -------------------------------------------------------
// Componente principal
// -------------------------------------------------------

interface AlertasDashboardProps {
  compact?: boolean
  onAlertaResuelta?: () => void
}

export function AlertasDashboard({ compact = false, onAlertaResuelta }: AlertasDashboardProps = {}) {
  const [alertas, setAlertas] = useState<AlertaItem[]>([])
  const [resumen, setResumen] = useState<AlertasResumen | null>(null)
  const [cargando, setCargando] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resolviendo, setResolviendo] = useState<string | null>(null)
  const [notasModal, setNotasModal] = useState<{ id: string; titulo: string } | null>(null)
  const [notasTexto, setNotasTexto] = useState("")

  const cargarAlertas = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const response = await AlertasService.getAlertas()
      setAlertas(response.data)
      setResumen(response.resumen)
    } catch (err: any) {
      console.warn("⚠️ No se pudieron cargar las alertas:", err.message)
      setError("No se pudieron cargar las alertas activas.")
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarAlertas()
  }, [cargarAlertas])

  const sincronizarManual = useCallback(async () => {
    setSincronizando(true)
    setError(null)
    try {
      await apiPost('/cron/sincronizar-manual')
    } catch (err: any) {
      console.warn("⚠️ Error al sincronizar alertas:", err.message)
    } finally {
      setSincronizando(false)
    }
    await cargarAlertas()
  }, [cargarAlertas])

  const handleResolver = async (id: string, estado: "resuelta" | "descartada", notas?: string) => {
    setResolviendo(id)
    try {
      await AlertasService.resolverAlerta(id, estado, notas)
      // Remover de la lista local inmediatamente
      setAlertas((prev) => prev.filter((a) => a.id !== id))
      if (resumen) {
        const alerta = alertas.find((a) => a.id === id)
        if (alerta) {
          setResumen((prev) => prev ? { ...prev, [alerta.prioridad]: Math.max(0, prev[alerta.prioridad] - 1), total: Math.max(0, prev.total - 1) } : prev)
        }
      }
      onAlertaResuelta?.()
    } catch (err: any) {
      console.error("Error al resolver alerta:", err.message)
    } finally {
      setResolviendo(null)
    }
  }

  const abrirModalNotas = (id: string, titulo: string) => {
    setNotasModal({ id, titulo })
    setNotasTexto("")
  }

  const confirmarResolucion = async () => {
    if (!notasModal) return
    await handleResolver(notasModal.id, "resuelta", notasTexto || undefined)
    setNotasModal(null)
    setNotasTexto("")
  }

  return (
    <div className={`${compact ? '' : 'mt-6'} ${compact ? 'bg-transparent' : 'bg-muted/20'} rounded-xl border ${compact ? 'border-transparent' : 'border-border/50'} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Alertas Activas</h3>
          {resumen && resumen.total > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-destructive/20 text-destructive border border-destructive/30">
              {resumen.total}
            </span>
          )}
        </div>
        <button
          onClick={sincronizarManual}
          disabled={cargando || sincronizando}
          className="p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title="Sincronizar y recargar alertas"
        >
          <RefreshCw className={`h-4 w-4 ${(cargando || sincronizando) ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Resumen de prioridades */}
      {resumen && resumen.total > 0 && (
        <div className="flex gap-2 flex-wrap px-5 py-3 border-b border-border/30">
          {resumen.urgente > 0 && <ResumenBadge label="Urgente" count={resumen.urgente} color="text-red-400" />}
          {resumen.alta > 0    && <ResumenBadge label="Alta"    count={resumen.alta}    color="text-orange-400" />}
          {resumen.media > 0   && <ResumenBadge label="Media"   count={resumen.media}   color="text-amber-400" />}
          {resumen.baja > 0    && <ResumenBadge label="Baja"    count={resumen.baja}    color="text-blue-400" />}
        </div>
      )}

      {/* Body */}
      <div className="p-4 space-y-3 max-h-105 overflow-y-auto">
        {cargando && (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Cargando alertas...</span>
          </div>
        )}

        {!cargando && error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!cargando && !error && alertas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-2">
            <CheckCircle className="h-8 w-8 text-emerald-400/60" />
            <span>No hay alertas activas. ¡Todo en orden!</span>
          </div>
        )}

        {!cargando && alertas.map((alerta) => {
          const TipoIcon = TIPO_ICON[alerta.tipo] ?? Bell
          const estaResolviendo = resolviendo === alerta.id
          return (
            <div
              key={alerta.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40 hover:border-border/70 transition-all"
            >
              <div className="p-1.5 rounded-md bg-accent/10 shrink-0 mt-0.5">
                <TipoIcon className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-foreground wrap-break-word leading-snug">{alerta.titulo}</span>
                  <PrioridadBadge prioridad={alerta.prioridad} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed wrap-break-word">{alerta.descripcion}</p>
                <span className="text-xs text-muted-foreground/60 mt-1 block">{formatFecha(alerta.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {estaResolviendo ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <button
                      onClick={() => abrirModalNotas(alerta.id, alerta.titulo)}
                      className="p-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                      title="Marcar como resuelta"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleResolver(alerta.id, "descartada")}
                      className="p-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Descartar alerta"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de notas para resolución */}
      {notasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h4 className="text-base font-semibold text-foreground mb-1">Resolver alerta</h4>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{notasModal.titulo}</p>
            <label className="block text-xs text-muted-foreground mb-1.5">Notas de resolución (opcional)</label>
            <textarea
              value={notasTexto}
              onChange={(e) => setNotasTexto(e.target.value)}
              placeholder="Describe cómo se resolvió el problema..."
              rows={3}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none resize-none"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => setNotasModal(null)}
                className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarResolucion}
                className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
              >
                Marcar como resuelta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
