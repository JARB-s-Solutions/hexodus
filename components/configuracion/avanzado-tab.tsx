"use client"

import { useState } from "react"
import { Settings, Download, Upload, Trash2, Zap } from "lucide-react"
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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const importedConfig = JSON.parse(event.target?.result as string)
          // Aquí se actualizaría la config con los datos importados
          console.log("Config importada:", importedConfig)
        } catch (error) {
          console.error("Error al importar configuración:", error)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleClearCache = () => {
    setCacheLoading(true)
    // Aquí iría la llamada al backend: POST /api/cache/clear
    setTimeout(() => {
      localStorage.clear()
      setCacheLoading(false)
    }, 2000)
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border animate-fade-in-up">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Configuración Avanzada</h2>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Opciones avanzadas de rendimiento y gestión del sistema.
      </p>

      {/* Performance */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-accent" />
          <h3 className="text-base font-semibold text-foreground">Rendimiento</h3>
        </div>

        <div className="space-y-4 bg-muted/30 rounded-lg p-4 border border-border/50">
          <ToggleRow
            id="cache-sistema"
            label="Caché del Sistema"
            description="Mejorar velocidad de carga con caché local"
            checked={config.cacheSistema}
            onCheckedChange={(v) => onChange({ cacheSistema: v })}
          />
          <ToggleRow
            id="compresion"
            label="Compresión"
            description="Comprimir recursos para reducir tiempos de carga"
            checked={config.compresion}
            onCheckedChange={(v) => onChange({ compresion: v })}
          />
          <ToggleRow
            id="lazy-loading"
            label="Carga Diferida"
            description="Cargar contenido bajo demanda para mejor rendimiento"
            checked={config.lazyLoading}
            onCheckedChange={(v) => onChange({ lazyLoading: v })}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-4">Gestión de Configuración</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border border-accent text-accent hover:bg-accent/10 transition-all"
          >
            <Download className="h-4 w-4" />
            Exportar Config.
          </button>
          
          <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border border-accent text-accent hover:bg-accent/10 transition-all cursor-pointer">
            <Upload className="h-4 w-4" />
            Importar Config.
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImport}
              className="hidden" 
            />
          </label>
          
          <button
            onClick={handleClearCache}
            disabled={cacheLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cacheLoading ? (
              <>
                <span className="h-4 w-4 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                Limpiando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Limpiar Caché
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          La configuración exportada incluye todas tus preferencias excepto roles y permisos del sistema.
        </p>
      </div>
    </div>
  )
}
