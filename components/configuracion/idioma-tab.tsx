"use client"

import { Globe } from "lucide-react"
import type { ConfigState } from "./config-types"

interface IdiomaTabProps {
  config: ConfigState
  onChange: (updates: Partial<ConfigState>) => void
}

const selectClass =
  "w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all cursor-pointer"

const selectBg = {
  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2300BFFF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
  backgroundPosition: "right 0.5rem center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "1.5em 1.5em",
}

export function IdiomaTab({ config, onChange }: IdiomaTabProps) {
  return (
    <div className="bg-card rounded-xl p-6 border border-border animate-fade-in-up">
      <div className="flex items-center gap-2 mb-6">
        <Globe className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Idioma y Localizacion</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Idioma del Sistema
          </label>
          <select
            value={config.idiomaSistema}
            onChange={(e) => onChange({ idiomaSistema: e.target.value })}
            className={selectClass}
            style={selectBg}
          >
            <option value="es-MX">Espanol (Mexico)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Espanol (Espana)</option>
            <option value="pt-BR">Portugues (Brasil)</option>
            <option value="fr-FR">Francais</option>
          </select>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Zona Horaria
          </label>
          <select
            value={config.zonaHoraria}
            onChange={(e) => onChange({ zonaHoraria: e.target.value })}
            className={selectClass}
            style={selectBg}
          >
            <option value="America/Mexico_City">GMT-6 Mexico Central</option>
            <option value="America/New_York">GMT-5 New York</option>
            <option value="America/Los_Angeles">GMT-8 Los Angeles</option>
            <option value="Europe/Madrid">GMT+1 Madrid</option>
            <option value="America/Sao_Paulo">GMT-3 Sao Paulo</option>
          </select>
        </div>

        {/* Date Format */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Formato de Fecha
          </label>
          <select
            value={config.formatoFecha}
            onChange={(e) => onChange({ formatoFecha: e.target.value })}
            className={selectClass}
            style={selectBg}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
          </select>
        </div>
      </div>
    </div>
  )
}
