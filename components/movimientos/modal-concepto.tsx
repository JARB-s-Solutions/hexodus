"use client"

import { useState, useEffect, useRef } from "react"
import { X, Save, TrendingUp, TrendingDown } from "lucide-react"
import type { Concepto } from "@/lib/types/movimientos"

type ModalMode = "crear" | "editar"

interface ModalConceptoProps {
  open: boolean
  mode: ModalMode
  concepto?: Concepto | null
  onClose: () => void
  onSave: (data: {
    nombre: string
    tipo: "ingreso" | "egreso"
  }) => void
}

export function ModalConcepto({ 
  open, 
  mode, 
  concepto, 
  onClose, 
  onSave,
}: ModalConceptoProps) {
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState<"ingreso" | "egreso">("ingreso")
  const firstInput = useRef<HTMLInputElement>(null)

  // Resetear o cargar datos cuando cambia el modal
  useEffect(() => {
    if (concepto && mode === "editar") {
      setNombre(concepto.nombre)
      // Convertir "gasto" a "egreso" para el backend
      setTipo(concepto.tipo === "gasto" ? "egreso" : "ingreso")
    } else {
      setNombre("")
      setTipo("ingreso")
    }
  }, [concepto, mode, open])

  // Focus en el primer input al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInput.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!nombre.trim()) {
      alert("Por favor ingresa un nombre para el concepto")
      return
    }

    console.log("📝 Guardando concepto:", { nombre: nombre.trim(), tipo })

    onSave({
      nombre: nombre.trim(),
      tipo,
    })
  }

  if (!open) return null

  const titulo = mode === "crear" ? "Nuevo Concepto" : "Editar Concepto"
  const icono = tipo === "ingreso" ? TrendingUp : TrendingDown
  const colorIcono = tipo === "ingreso" ? "text-success" : "text-destructive"

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-lg border border-border shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${colorIcono}`}>
              {icono === TrendingUp ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
            <h2 className="text-xl font-semibold">{titulo}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 space-y-6">
            {/* Tipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Tipo de Concepto
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipo("ingreso")}
                  className={`
                    px-4 py-3 rounded-lg border transition-all
                    ${tipo === "ingreso"
                      ? "border-success bg-success/10 text-success"
                      : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">Ingreso</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTipo("egreso")}
                  className={`
                    px-4 py-3 rounded-lg border transition-all
                    ${tipo === "egreso"
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    <span className="font-medium">Egreso</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <label htmlFor="nombre" className="text-sm font-medium text-foreground">
                Nombre del Concepto
              </label>
              <input
                ref={firstInput}
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Venta de membresía, Pago de luz, etc."
                className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {nombre.length}/100 caracteres
              </p>
            </div>

            {/* Preview */}
            {nombre && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Vista previa:</p>
                <div className="flex items-center gap-2">
                  {tipo === "ingreso" ? (
                    <div className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Ingreso
                    </div>
                  ) : (
                    <div className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Egreso
                    </div>
                  )}
                  <span className="text-foreground font-medium">{nombre}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-muted/30 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium"
            >
              <Save className="h-4 w-4" />
              {mode === "crear" ? "Crear Concepto" : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
