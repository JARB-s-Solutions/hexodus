"use client"

import { useState } from "react"
import {
  X,
  Info,
  Settings,
  Database,
  Sliders,
  FileText,
  Download,
  Loader2,
} from "lucide-react"
import { exportReporteToCSV, type TipoReporte } from "@/lib/reportes-data"

interface GenerarReporteModalProps {
  open: boolean
  onClose: () => void
  onGenerar: (config: ReporteConfig) => void | Promise<void>
}

export interface ReporteConfig {
  nombre: string
  descripcion: string
  tipo: TipoReporte | "completo"
  fechaInicio: string
  fechaFin: string
  incluirGraficos: boolean
  incluirDetalles: boolean
}

export function GenerarReporteModal({ open, onClose, onGenerar }: GenerarReporteModalProps) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [tipo, setTipo] = useState<TipoReporte | "completo">("completo")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [incluirGraficos, setIncluirGraficos] = useState(true)
  const [incluirDetalles, setIncluirDetalles] = useState(true)
  const [generando, setGenerando] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !fechaInicio || !fechaFin) return

    setGenerando(true)

    try {
      await onGenerar({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        tipo,
        fechaInicio,
        fechaFin,
        incluirGraficos,
        incluirDetalles,
      })

      // Reset form on success
      setNombre("")
      setDescripcion("")
      setTipo("completo")
      setFechaInicio("")
      setFechaFin("")
      onClose()
    } catch (error) {
      console.error('Error en modal al generar reporte:', error)
      // El error ya se maneja en el handler padre
    } finally {
      setGenerando(false)
    }
  }

  const tipoLabels: Record<string, string> = {
    ventas: "Ventas",
    gastos: "Gastos",
    utilidad: "Utilidad",
    membresias: "Membresias",
    completo: "Reporte Completo",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/85 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up"
        style={{ boxShadow: "0 0 40px rgba(0,0,0,0.5)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10 rounded-t-xl">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Generar Nuevo Reporte</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {/* Section 1: Basic Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-accent" />
              <h4 className="text-sm font-semibold text-muted-foreground">Informacion del Reporte</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre-reporte" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                  Nombre del Reporte <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  id="nombre-reporte"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  placeholder="Ej: Reporte Mensual Febrero"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-0 focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                />
              </div>
              <div>
                <label htmlFor="desc-reporte" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                  Descripcion
                </label>
                <input
                  type="text"
                  id="desc-reporte"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripcion opcional"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-0 focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Type */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-accent" />
              <h4 className="text-sm font-semibold text-muted-foreground">Tipo y Configuracion</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tipo-reporte-modal" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                  Tipo de Reporte <span className="text-destructive">*</span>
                </label>
                <select
                  id="tipo-reporte-modal"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoReporte | "completo")}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-0 focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="completo">Reporte Completo</option>
                  <option value="ventas">Ventas</option>
                  <option value="gastos">Gastos</option>
                  <option value="utilidad">Utilidad</option>
                  <option value="membresias">Membresias</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                  Formato
                </label>
                <div className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm">
                  <span className="text-accent font-medium">Excel (.csv)</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Formato optimizado para Excel con datos ordenados
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Date range */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-accent" />
              <h4 className="text-sm font-semibold text-muted-foreground">Periodo de Datos</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fecha-inicio-modal" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                  Fecha Inicio <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  id="fecha-inicio-modal"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-0 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label htmlFor="fecha-fin-modal" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                  Fecha Fin <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  id="fecha-fin-modal"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-0 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Advanced options */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="h-4 w-4 text-accent" />
              <h4 className="text-sm font-semibold text-muted-foreground">Opciones Avanzadas</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirGraficos}
                  onChange={(e) => setIncluirGraficos(e.target.checked)}
                  className="rounded border-border bg-background text-accent focus:ring-accent focus:ring-0 h-4 w-4"
                />
                <span className="text-sm text-muted-foreground">Incluir graficos y visualizaciones</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirDetalles}
                  onChange={(e) => setIncluirDetalles(e.target.checked)}
                  className="rounded border-border bg-background text-accent focus:ring-accent focus:ring-0 h-4 w-4"
                />
                <span className="text-sm text-muted-foreground">Incluir detalles completos</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-accent border border-accent hover:bg-accent/10 transition-colors uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={generando || !nombre.trim() || !fechaInicio || !fechaFin}
              className="px-5 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground glow-primary glow-primary-hover transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Generar Reporte
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
