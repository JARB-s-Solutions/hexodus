"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, AlertCircle, Package, Calendar, Activity, Save, Loader2, CheckCircle, RotateCcw } from "lucide-react"
import { AlertasService } from "@/lib/services/alertas"
import type { AlertaConfig, ActualizarConfigBody } from "@/lib/types/alertas"

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  id: string
}) {
  return (
    <label htmlFor={id} className="relative inline-block w-[50px] h-6 cursor-pointer flex-shrink-0">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="sr-only peer"
      />
      <span
        className="absolute inset-0 rounded-full border transition-all duration-300 peer-checked:border-accent bg-muted border-border"
        style={checked ? { background: "linear-gradient(45deg, var(--primary), var(--accent))", borderColor: "var(--accent)", boxShadow: "0 0 8px rgba(0,191,255,0.3)" } : undefined}
      />
      <span
        className="absolute left-[3px] bottom-[3px] h-[18px] w-[18px] rounded-full transition-all duration-300 peer-checked:translate-x-[24px] peer-checked:bg-foreground bg-muted-foreground"
        style={checked ? { backgroundColor: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" } : undefined}
      />
    </label>
  )
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
interface AlertCardProps {
  icon: typeof Bell
  title: string
  description: string
  id: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  threshold?: number
  onThresholdChange?: (value: number) => void
  thresholdLabel?: string
}

function AlertCard({
  icon: Icon,
  title,
  description,
  id,
  checked,
  onCheckedChange,
  threshold,
  onThresholdChange,
  thresholdLabel,
}: AlertCardProps) {
  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border/50 hover:border-accent/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-accent/10">
            <Icon className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <ToggleSwitch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      </div>

      {threshold !== undefined && onThresholdChange && thresholdLabel && checked && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <label className="text-xs text-muted-foreground mb-2 block">{thresholdLabel}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={threshold}
              onChange={(e) => onThresholdChange(Math.max(1, Number(e.target.value)))}
              className="w-20 px-2 py-1 bg-muted border border-border rounded text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none"
              min="1"
            />
            <span className="text-xs text-muted-foreground">días/unidades</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function AlertCardSkeleton() {
  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border/50 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-muted/60 h-9 w-9" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted/60 rounded w-2/5" />
            <div className="h-3 bg-muted/40 rounded w-3/5" />
          </div>
        </div>
        <div className="h-6 w-[50px] bg-muted/60 rounded-full" />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function NotificacionesTab() {
  const [config, setConfig]           = useState<AlertaConfig | null>(null)
  const [savedConfig, setSavedConfig] = useState<AlertaConfig | null>(null)
  const [loadingFetch, setLoadingFetch] = useState(true)
  const [saving, setSaving]           = useState(false)
  const [fetchError, setFetchError]   = useState<string | null>(null)
  const [saveMsg, setSaveMsg]         = useState<{ text: string; type: "success" | "error" } | null>(null)

  const hasChanges = Boolean(
    config && savedConfig && JSON.stringify(config) !== JSON.stringify(savedConfig)
  )

  // ── Fetch config on mount ──────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoadingFetch(true)
    setFetchError(null)
    try {
      const data = await AlertasService.getConfiguracion()
      setConfig(data)
      setSavedConfig(data)
    } catch {
      setFetchError("No se pudo cargar la configuración de alertas.")
    } finally {
      setLoadingFetch(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = useCallback((updates: Partial<AlertaConfig>) => {
    setConfig(prev => prev ? { ...prev, ...updates } : prev)
  }, [])

  const handleSave = useCallback(async () => {
    if (!config || !hasChanges) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const body: ActualizarConfigBody = {
        alertaVencimientosActiva: config.alertaVencimientosActiva,
        alertaVencimientosDias:   config.alertaVencimientosDias,
        alertaStockActiva:        config.alertaStockActiva,
        alertaStockMinimo:        config.alertaStockMinimo,
        alertaInactividadActiva:  config.alertaInactividadActiva,
        alertaInactividadDias:    config.alertaInactividadDias,
        alertaPagosActiva:        config.alertaPagosActiva,
      }
      const updated = await AlertasService.actualizarConfiguracion(body)
      setConfig(updated)
      setSavedConfig(updated)
      setSaveMsg({ text: "Configuración guardada exitosamente", type: "success" })
    } catch (err: any) {
      setSaveMsg({ text: err.message || "Error al guardar la configuración", type: "error" })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }, [config, hasChanges])

  const handleReset = useCallback(() => {
    if (savedConfig) setConfig({ ...savedConfig })
  }, [savedConfig])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-card rounded-xl p-6 border border-border animate-fade-in-up">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Alertas del Sistema</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Configura las alertas que aparecerán en el dashboard cuando se cumplan ciertas condiciones.
      </p>

      {/* ── Loading ── */}
      {loadingFetch && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <AlertCardSkeleton key={i} />)}
        </div>
      )}

      {/* ── Error ── */}
      {!loadingFetch && fetchError && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{fetchError}</p>
          <button
            onClick={cargar}
            className="ml-auto text-xs text-accent underline underline-offset-2 hover:text-accent/80"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {!loadingFetch && !fetchError && config && (
        <>
          <div className="space-y-4">
            <AlertCard
              icon={Calendar}
              title="Vencimiento de Membresías"
              description="Alertar cuando una membresía esté próxima a vencer"
              id="notif-vencimientos"
              checked={config.alertaVencimientosActiva}
              onCheckedChange={(v) => handleChange({ alertaVencimientosActiva: v })}
              threshold={config.alertaVencimientosDias}
              onThresholdChange={(v) => handleChange({ alertaVencimientosDias: v })}
              thresholdLabel="Alertar con cuántos días de anticipación"
            />

            <AlertCard
              icon={Package}
              title="Stock Bajo de Inventario"
              description="Alertar cuando un producto alcance el stock mínimo"
              id="notif-inventario"
              checked={config.alertaStockActiva}
              onCheckedChange={(v) => handleChange({ alertaStockActiva: v })}
              threshold={config.alertaStockMinimo}
              onThresholdChange={(v) => handleChange({ alertaStockMinimo: v })}
              thresholdLabel="Cantidad mínima de unidades"
            />

            <AlertCard
              icon={Activity}
              title="Inactividad de Socios"
              description="Alertar cuando un socio no haya asistido en varios días"
              id="notif-inactividad"
              checked={config.alertaInactividadActiva}
              onCheckedChange={(v) => handleChange({ alertaInactividadActiva: v })}
              threshold={config.alertaInactividadDias}
              onThresholdChange={(v) => handleChange({ alertaInactividadDias: v })}
              thresholdLabel="Días sin asistir para alertar"
            />

            <AlertCard
              icon={AlertCircle}
              title="Pagos Pendientes"
              description="Alertar sobre pagos pendientes o atrasados"
              id="notif-pagos"
              checked={config.alertaPagosActiva}
              onCheckedChange={(v) => handleChange({ alertaPagosActiva: v })}
            />
          </div>

          {/* ── Save / Reset bar ── */}
          <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:border-accent/50 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Deshacer cambios
            </button>

            <div className="flex items-center gap-3">
              {saveMsg && (
                <span className={`text-sm flex items-center gap-1.5 ${saveMsg.type === "success" ? "text-green-400" : "text-destructive"}`}>
                  {saveMsg.type === "success" && <CheckCircle className="h-4 w-4" />}
                  {saveMsg.text}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
                style={{
                  backgroundColor: hasChanges ? "#22c55e" : "var(--primary)",
                  boxShadow: hasChanges ? "0 0 12px rgba(34,197,94,0.4)" : undefined,
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Guardando..." : "Aplicar Cambios"}
              </button>
            </div>
          </div>

          {/* ── Info box ── */}
          <div className="mt-4 p-4 bg-accent/5 border border-accent/20 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">¿Cómo funcionan las alertas?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Las alertas se mostrarán en tiempo real en el dashboard y se actualizarán automáticamente.
                  Puedes configurar umbrales personalizados para cada tipo de alerta según las necesidades de tu gimnasio.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
