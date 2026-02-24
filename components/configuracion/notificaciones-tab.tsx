"use client"

import { Bell } from "lucide-react"
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

function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-muted-foreground cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-muted-foreground/60">{description}</p>
      </div>
      <ToggleSwitch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function NotificacionesTab({ config, onChange }: NotificacionesTabProps) {
  return (
    <div className="bg-card rounded-xl p-6 border border-border animate-fade-in-up">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Notificaciones</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* General */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-foreground/80">Configuracion General</h3>

          <ToggleRow
            id="notif-push"
            label="Notificaciones Push"
            description="Recibir notificaciones del navegador"
            checked={config.notifPush}
            onCheckedChange={(v) => onChange({ notifPush: v })}
          />
          <ToggleRow
            id="notif-email"
            label="Notificaciones Email"
            description="Enviar resumenes por correo"
            checked={config.notifEmail}
            onCheckedChange={(v) => onChange({ notifEmail: v })}
          />
          <ToggleRow
            id="notif-sounds"
            label="Sonidos"
            description="Reproducir sonidos de alerta"
            checked={config.notifSounds}
            onCheckedChange={(v) => onChange({ notifSounds: v })}
          />
        </div>

        {/* Notification types */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-foreground/80">Tipos de Notificaciones</h3>

          <ToggleRow
            id="notif-socios"
            label="Nuevos Socios"
            description="Registro de nuevos miembros"
            checked={config.notifSocios}
            onCheckedChange={(v) => onChange({ notifSocios: v })}
          />
          <ToggleRow
            id="notif-vencimientos"
            label="Vencimientos"
            description="Membresias proximas a vencer"
            checked={config.notifVencimientos}
            onCheckedChange={(v) => onChange({ notifVencimientos: v })}
          />
          <ToggleRow
            id="notif-ventas"
            label="Ventas"
            description="Nuevas transacciones"
            checked={config.notifVentas}
            onCheckedChange={(v) => onChange({ notifVentas: v })}
          />
          <ToggleRow
            id="notif-inventario"
            label="Inventario Bajo"
            description="Stock minimo de productos"
            checked={config.notifInventario}
            onCheckedChange={(v) => onChange({ notifInventario: v })}
          />
        </div>
      </div>
    </div>
  )
}
