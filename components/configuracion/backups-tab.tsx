"use client"

import { useState } from "react"
import { Database, Download, Upload, Clock, CheckCircle, AlertCircle, HardDrive, Calendar, RefreshCw } from "lucide-react"
import type { ConfigState } from "./config-types"

interface BackupsTabProps {
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

interface BackupHistoryItem {
  id: string
  fecha: string
  hora: string
  tipo: "automatico" | "manual"
  tamano: string
  estado: "exitoso" | "fallido"
}

export function BackupsTab({ config, onChange }: BackupsTabProps) {
  const [creandoBackup, setCreandoBackup] = useState(false)
  const [importandoBackup, setImportandoBackup] = useState(false)
  
  // Mock de historial - En producción vendría del backend
  const [historialBackups] = useState<BackupHistoryItem[]>([
    { id: "1", fecha: "2026-03-08", hora: "00:00", tipo: "automatico", tamano: "24.5 MB", estado: "exitoso" },
    { id: "2", fecha: "2026-03-07", hora: "00:00", tipo: "automatico", tamano: "24.3 MB", estado: "exitoso" },
    { id: "3", fecha: "2026-03-06", hora: "15:30", tipo: "manual", tamano: "24.2 MB", estado: "exitoso" },
    { id: "4", fecha: "2026-03-06", hora: "00:00", tipo: "automatico", tamano: "24.1 MB", estado: "exitoso" },
    { id: "5", fecha: "2026-03-05", hora: "00:00", tipo: "automatico", tamano: "23.9 MB", estado: "fallido" },
  ])

  const handleCrearBackup = async () => {
    setCreandoBackup(true)
    // Aquí iría la llamada al backend: POST /api/backups
    await new Promise(resolve => setTimeout(resolve, 3000))
    setCreandoBackup(false)
    // Mostrar notificación de éxito
  }

  const handleImportarBackup = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".sql,.json,.backup"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setImportandoBackup(true)
        // Aquí iría la llamada al backend: POST /api/backups/restore con FormData
        await new Promise(resolve => setTimeout(resolve, 4000))
        setImportandoBackup(false)
        // Mostrar notificación de éxito
      }
    }
    input.click()
  }

  const handleDescargarBackup = (backupId: string) => {
    // Aquí iría: GET /api/backups/:id/download
    console.log("Descargando backup:", backupId)
  }

  const selectBg = {
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2300BFFF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: "right 0.5rem center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "1.5em 1.5em",
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Respaldos y Recuperación</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Protege tus datos con respaldos automáticos en Supabase. Crea respaldos manuales o restaura versiones anteriores.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Configuración de Backups Automáticos */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-accent" />
            <h3 className="text-base font-semibold text-foreground">Respaldos Automáticos</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Activar respaldos automáticos</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Se ejecutarán según la frecuencia configurada
                </p>
              </div>
              <ToggleSwitch 
                id="backup-auto" 
                checked={config.backupAuto} 
                onCheckedChange={(v) => onChange({ backupAuto: v })}
              />
            </div>

            {config.backupAuto && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Frecuencia de respaldo
                </label>
                <select
                  value={config.backupFrecuencia}
                  onChange={(e) => onChange({ backupFrecuencia: e.target.value })}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all cursor-pointer"
                  style={selectBg}
                >
                  <option value="diario">Diario (00:00 hrs)</option>
                  <option value="semanal">Semanal (Domingos)</option>
                  <option value="mensual">Mensual (día 1)</option>
                </select>

                <div className="mt-3 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                  <div className="flex gap-2">
                    <Calendar className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Próximo respaldo</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {config.backupFrecuencia === "diario" && "Mañana a las 00:00 hrs"}
                        {config.backupFrecuencia === "semanal" && "Domingo a las 00:00 hrs"}
                        {config.backupFrecuencia === "mensual" && "1 de Abril a las 00:00 hrs"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Retención de respaldos
              </label>
              <select
                value={config.backupRetencion}
                onChange={(e) => onChange({ backupRetencion: e.target.value })}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all cursor-pointer"
                style={selectBg}
              >
                <option value="7">7 días</option>
                <option value="15">15 días</option>
                <option value="30">30 días</option>
                <option value="60">60 días</option>
                <option value="90">90 días</option>
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Los respaldos más antiguos se eliminarán automáticamente
              </p>
            </div>
          </div>
        </div>

        {/* Acciones Manuales */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="h-5 w-5 text-accent" />
            <h3 className="text-base font-semibold text-foreground">Acciones Manuales</h3>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCrearBackup}
              disabled={creandoBackup}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creandoBackup ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Creando respaldo...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Crear Respaldo Ahora
                </>
              )}
            </button>

            <button
              onClick={handleImportarBackup}
              disabled={importandoBackup}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-all border border-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importandoBackup ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Restaurar Respaldo
                </>
              )}
            </button>

            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-yellow-500">Advertencia</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Restaurar un respaldo sobrescribirá todos los datos actuales. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Backups */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-accent" />
          <h3 className="text-base font-semibold text-foreground">Historial de Respaldos</h3>
        </div>

        <div className="space-y-2">
          {historialBackups.map((backup) => (
            <div
              key={backup.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-accent/30 transition-all group"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-lg ${backup.estado === "exitoso" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  {backup.estado === "exitoso" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{backup.fecha}</p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground">{backup.hora}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      backup.tipo === "automatico" 
                        ? "bg-blue-500/10 text-blue-500" 
                        : "bg-purple-500/10 text-purple-500"
                    }`}>
                      {backup.tipo === "automatico" ? "Automático" : "Manual"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tamaño: {backup.tamano}
                  </p>
                </div>
              </div>
              
              {backup.estado === "exitoso" && (
                <button
                  onClick={() => handleDescargarBackup(backup.id)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 hover:bg-accent hover:text-accent-foreground text-accent rounded-lg text-sm font-medium transition-all opacity-0 group-hover:opacity-100"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info de Supabase */}
      <div className="bg-gradient-to-r from-accent/5 to-primary/5 rounded-xl p-6 border border-accent/20">
        <div className="flex gap-3">
          <Database className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Almacenamiento en Supabase</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Tus respaldos se almacenan de forma segura en Supabase PostgreSQL con cifrado en reposo. 
              Los datos incluyen: socios, membresías, inventario, ventas, movimientos, usuarios y configuración del sistema.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 bg-card/50 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Último respaldo</p>
                <p className="text-sm font-semibold text-foreground">Hace 12 horas</p>
              </div>
              <div className="p-3 bg-card/50 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Almacenamiento usado</p>
                <p className="text-sm font-semibold text-foreground">245.3 MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
