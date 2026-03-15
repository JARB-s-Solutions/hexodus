"use client"

import { useState, useRef, useCallback } from "react"
import {
  MonitorPlay,
  MonitorOff,
  Info,
  Clock,
  Volume2,
  VolumeOff,
  Eye,
  EyeOff,
  ScanFace,
  RotateCcw,
  Settings2,
} from "lucide-react"
import { Switch } from "@/ui/switch"
import { Slider } from "@/ui/slider"
import { Input } from "@/ui/input"
import { Label } from "@/ui/label"
import type { ConfigRegistro } from "@/lib/asistencia-data"

interface Props {
  config: ConfigRegistro
  onConfigChange: (config: ConfigRegistro) => void
  pantallaAbierta: boolean
  sistemaListo: boolean
  onAbrirPantalla: () => void
  onCerrarPantalla: () => void
}

export function PanelEscaneo({
  config,
  onConfigChange,
  pantallaAbierta,
  sistemaListo,
  onAbrirPantalla,
  onCerrarPantalla,
}: Props) {
  const [showConfig, setShowConfig] = useState(false)

  const updateConfig = useCallback(
    (key: keyof ConfigRegistro, value: boolean | number) => {
      onConfigChange({ ...config, [key]: value })
    },
    [config, onConfigChange]
  )

  return (
    <div className="space-y-4">
      {/* Scanner Control Card */}
      <div
        className="bg-card rounded-xl p-5 border border-border"
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
      >
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <MonitorPlay className="h-4 w-4 text-accent" />
          Pantalla de Escaneo
        </h3>

        {/* Status indicators */}
        <div className="flex items-center gap-6 mb-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Estado:</span>
            <div className="flex items-center gap-1.5">
              <div
                className={`h-2 w-2 rounded-full ${
                  pantallaAbierta ? "bg-success animate-pulse" : "bg-muted-foreground"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  pantallaAbierta ? "text-success" : "text-muted-foreground"
                }`}
              >
                {pantallaAbierta ? "Abierta" : "Cerrada"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sistema:</span>
            <div className="flex items-center gap-1.5">
              <div
                className={`h-2 w-2 rounded-full ${
                  sistemaListo ? "bg-success animate-pulse" : "bg-warning animate-pulse"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  sistemaListo ? "text-success" : "text-warning"
                }`}
              >
                {sistemaListo ? "Listo" : "Cargando..."}
              </span>
            </div>
          </div>
        </div>

        {/* Open/Close button */}
        {!pantallaAbierta ? (
          <button
            onClick={onAbrirPantalla}
            disabled={!sistemaListo}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed glow-primary"
          >
            <MonitorPlay className="h-5 w-5" />
            Abrir Pantalla de Escaneo
          </button>
        ) : (
          <button
            onClick={onCerrarPantalla}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-lg border-2 border-accent text-accent font-semibold text-sm transition-all hover:bg-accent/10 glow-accent"
          >
            <MonitorOff className="h-5 w-5" />
            Cerrar Pantalla
          </button>
        )}

        {/* Info box */}
        <div className="mt-4 p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex items-start gap-2 mb-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              La pantalla de escaneo se abrira en una ventana separada para que los socios registren su entrada.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Despues de cada escaneo, la pantalla se reiniciara en {config.tiempoReset} segundos.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Card */}
      <div
        className="bg-card rounded-xl border border-border overflow-hidden"
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
      >
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
        >
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-accent" />
            Configuracion del Sistema
          </h3>
          <RotateCcw
            className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
              showConfig ? "rotate-180" : ""
            }`}
          />
        </button>

        {showConfig && (
          <div className="px-5 pb-5 space-y-5 animate-fade-in-up">
            {/* Sound toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {config.sonidoHabilitado ? (
                  <Volume2 className="h-4 w-4 text-accent" />
                ) : (
                  <VolumeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">Sonido de Alertas</p>
                  <p className="text-[11px] text-muted-foreground">Reproducir sonido al detectar</p>
                </div>
              </div>
              <Switch
                checked={config.sonidoHabilitado}
                onCheckedChange={(v) => updateConfig("sonidoHabilitado", v)}
              />
            </div>

            {/* Auto detection toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ScanFace className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-sm font-medium text-foreground">Deteccion Automatica</p>
                  <p className="text-[11px] text-muted-foreground">Escanear continuamente</p>
                </div>
              </div>
              <Switch
                checked={config.deteccionAutomatica}
                onCheckedChange={(v) => updateConfig("deteccionAutomatica", v)}
              />
            </div>

            {/* Show detection toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {config.mostrarDeteccion ? (
                  <Eye className="h-4 w-4 text-accent" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">Mostrar Deteccion</p>
                  <p className="text-[11px] text-muted-foreground">Visualizar puntos faciales</p>
                </div>
              </div>
              <Switch
                checked={config.mostrarDeteccion}
                onCheckedChange={(v) => updateConfig("mostrarDeteccion", v)}
              />
            </div>

            {/* Confidence threshold */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Umbral de Confianza: {config.umbralConfianza.toFixed(2)}
              </Label>
              <Slider
                value={[config.umbralConfianza]}
                onValueChange={([v]) => updateConfig("umbralConfianza", v)}
                min={0.3}
                max={0.7}
                step={0.05}
                className="w-full"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Permisivo (0.30)</span>
                <span>Estricto (0.70)</span>
              </div>
            </div>

            {/* Reset time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Tiempo de Reset (segundos)
              </Label>
              <Input
                type="number"
                min={5}
                max={30}
                value={config.tiempoReset}
                onChange={(e) => updateConfig("tiempoReset", Number(e.target.value))}
                className="bg-muted border-border"
              />
              <p className="text-[11px] text-muted-foreground">
                Tiempo antes de permitir nuevo escaneo
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}