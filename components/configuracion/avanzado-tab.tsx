"use client"

import { useState } from "react"
import { Settings, Download, Upload, Trash2, Database } from "lucide-react"
import type { ConfigState } from "./config-types"

interface AvanzadoTabProps {
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

export function AvanzadoTab({ config, onChange }: AvanzadoTabProps) {
  const [backupLoading, setBackupLoading] = useState(false)
  const [cacheLoading, setCacheLoading] = useState(false)

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hexodus_config_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleBackup = () => {
    setBackupLoading(true)
    setTimeout(() => {
      const backupData = {
        configuracion: config,
        fecha: new Date().toISOString(),
        version: "2.1.3",
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `hexodus_backup_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setBackupLoading(false)
    }, 2000)
  }

  const handleClearCache = () => {
    setCacheLoading(true)
    setTimeout(() => setCacheLoading(false), 2000)
  }

  const selectBg = {
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2300BFFF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: "right 0.5rem center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "1.5em 1.5em",
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border animate-fade-in-up">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Configuracion Avanzada</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Backup & Security */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-foreground/80">Backup y Seguridad</h3>

          <ToggleRow
            id="backup-auto"
            label="Backup Automatico"
            description="Respaldo diario de datos"
            checked={config.backupAuto}
            onCheckedChange={(v) => onChange({ backupAuto: v })}
          />

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Frecuencia de Backup
            </label>
            <select
              value={config.backupFrecuencia}
              onChange={(e) => onChange({ backupFrecuencia: e.target.value })}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all cursor-pointer"
              style={selectBg}
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>
        </div>

        {/* Performance */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-foreground/80">Rendimiento</h3>

          <ToggleRow
            id="cache-sistema"
            label="Cache del Sistema"
            description="Mejorar velocidad de carga"
            checked={config.cacheSistema}
            onCheckedChange={(v) => onChange({ cacheSistema: v })}
          />
          <ToggleRow
            id="compresion"
            label="Compresion"
            description="Comprimir recursos web"
            checked={config.compresion}
            onCheckedChange={(v) => onChange({ compresion: v })}
          />
          <ToggleRow
            id="lazy-loading"
            label="Carga Diferida"
            description="Cargar contenido bajo demanda"
            checked={config.lazyLoading}
            onCheckedChange={(v) => onChange({ lazyLoading: v })}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-border">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border border-accent text-accent hover:bg-accent/10 transition-all duration-300 uppercase tracking-wide"
        >
          <Download className="h-4 w-4" />
          Exportar Config.
        </button>
        <label className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border border-accent text-accent hover:bg-accent/10 transition-all duration-300 uppercase tracking-wide cursor-pointer">
          <Upload className="h-4 w-4" />
          Importar Config.
          <input type="file" accept=".json" className="hidden" />
        </label>
        <button
          onClick={handleClearCache}
          disabled={cacheLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border border-accent text-accent hover:bg-accent/10 transition-all duration-300 uppercase tracking-wide disabled:opacity-50"
        >
          {cacheLoading ? (
            <span className="h-4 w-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {cacheLoading ? "Limpiando..." : "Limpiar Cache"}
        </button>
        <button
          onClick={handleBackup}
          disabled={backupLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/80 transition-all duration-300 uppercase tracking-wide glow-primary disabled:opacity-50"
        >
          {backupLoading ? (
            <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          {backupLoading ? "Respaldando..." : "Backup Manual"}
        </button>
      </div>
    </div>
  )
}
