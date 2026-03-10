"use client"

import { Bell, AlertCircle, Package, Calendar, Activity } from "lucide-react"
import type { ConfigState } from "./config-types"

interface NotificacionesTabProps {
  config: ConfigState
  onChange: (updates: Partial<ConfigState>) => void
}

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
              onChange={(e) => onThresholdChange(Number(e.target.value))}
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

export function NotificacionesTab({ config, onChange }: NotificacionesTabProps) {
  return (
    <div className="bg-card rounded-xl p-6 border border-border animate-fade-in-up">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Alertas del Sistema</h2>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Configura las alertas que aparecerán en el dashboard cuando se cumplan ciertas condiciones.
      </p>

      <div className="space-y-4">
        <AlertCard
          icon={Calendar}
          title="Vencimiento de Membresías"
          description="Alertar cuando una membresía esté próxima a vencer"
          id="notif-vencimientos"
          checked={config.notifVencimientos}
          onCheckedChange={(v) => onChange({ notifVencimientos: v })}
          threshold={config.notifVencimientoDias}
          onThresholdChange={(v) => onChange({ notifVencimientoDias: v })}
          thresholdLabel="Alertar con cuántos días de anticipación"
        />

        <AlertCard
          icon={Package}
          title="Stock Bajo de Inventario"
          description="Alertar cuando un producto alcance el stock mínimo"
          id="notif-inventario"
          checked={config.notifInventario}
          onCheckedChange={(v) => onChange({ notifInventario: v })}
          threshold={config.notifStockMinimo}
          onThresholdChange={(v) => onChange({ notifStockMinimo: v })}
          thresholdLabel="Cantidad mínima de unidades"
        />

        <AlertCard
          icon={Activity}
          title="Inactividad de Socios"
          description="Alertar cuando un socio no haya asistido en varios días"
          id="notif-inactividad"
          checked={config.notifInactividad}
          onCheckedChange={(v) => onChange({ notifInactividad: v })}
          threshold={config.notifInactividadDias}
          onThresholdChange={(v) => onChange({ notifInactividadDias: v })}
          thresholdLabel="Días sin asistir para alertar"
        />

        <AlertCard
          icon={AlertCircle}
          title="Pagos Pendientes"
          description="Alertar sobre pagos pendientes o atrasados"
          id="notif-pagos"
          checked={config.notifPagosPendientes}
          onCheckedChange={(v) => onChange({ notifPagosPendientes: v })}
        />
      </div>

      {/* Info adicional */}
      <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-lg">
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
    </div>
  )
}
