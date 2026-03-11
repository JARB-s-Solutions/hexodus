"use client"

import { Save, Check, RefreshCw, Info, Loader2 } from "lucide-react"

interface ConfigSidebarProps {
  hasChanges: boolean
  loading: boolean
  onGuardar: () => void
  onRestablecer: () => void
  hideGuardar?: boolean // Nueva prop para ocultar botón guardar en tabs que guardan automáticamente
}

export function ConfigSidebar({ hasChanges, loading, onGuardar, onRestablecer, hideGuardar = false }: ConfigSidebarProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Save Card */}
      <div className="bg-card rounded-xl p-6 border border-border flex flex-col items-center">
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: "rgba(255,59,59,0.15)" }}
        >
          <Save className="h-6 w-6 text-primary" style={{ filter: "drop-shadow(0 0 4px rgba(255,59,59,0.5))" }} />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          {hideGuardar ? "Opciones" : "Guardar Configuracion"}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-5">
          {hideGuardar 
            ? "Los cambios se aplican automáticamente en tiempo real."
            : "Aplicar todos los cambios realizados al sistema."
          }
        </p>

        {!hideGuardar && (
          <button
            onClick={onGuardar}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-300 text-primary-foreground disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: hasChanges ? "#22c55e" : "var(--primary)",
              boxShadow: hasChanges
                ? "0 0 12px rgba(34,197,94,0.5)"
                : "0 0 10px rgba(255,59,59,0.5)",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                {hasChanges ? "Guardar Cambios" : "Aplicar Cambios"}
              </>
            )}
          </button>
        )}

        <button
          onClick={onRestablecer}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold uppercase tracking-wide border border-accent text-accent hover:bg-accent/10 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${hideGuardar ? '' : 'mt-3'}`}
        >
          <RefreshCw className="h-5 w-5" />
          Restablecer
        </button>
      </div>

      {/* System Status Card */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-accent mb-4">Estado del Sistema</h2>

        <div className="flex flex-col gap-0">
          <StatusRow label="Base de Datos" status="Conectado" color="#22c55e" />
          <StatusRow label="API Externa" status="Activa" color="#22c55e" />
          <StatusRow label="Respaldos" status="Disponible" color="#eab308" />
          <StatusRow label="Sistema" status="Operativo" color="#22c55e" />
        </div>

        {/* Info */}
        <div className="mt-5 pt-4 border-t border-border">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
            <Info className="h-4 w-4 text-accent" />
            Informacion
          </h4>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Version</span>
              <span className="text-foreground font-semibold">v2.1.3</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Tiempo Activo</span>
              <span className="text-accent font-semibold">15d 4h 23m</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Usuarios Online</span>
              <span className="font-semibold" style={{ color: "#22c55e" }}>11/24</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusRow({ label, status, color }: { label: string; status: string; color: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 font-semibold text-sm" style={{ color }}>
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}80`,
            animation: "pulse 2s infinite",
          }}
        />
        {status}
      </span>
    </div>
  )
}
