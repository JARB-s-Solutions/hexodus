"use client"

import { AlertTriangle, X, Trash2, User } from "lucide-react"
import type { Socio } from "@/lib/types/socios"

interface EliminarSocioModalProps {
  open: boolean
  onClose: () => void
  socio: Socio | null
  onConfirmar: () => void
}

export function EliminarSocioModal({ 
  open, 
  onClose, 
  socio,
  onConfirmar 
}: EliminarSocioModalProps) {
  if (!open || !socio) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: "linear-gradient(180deg, rgba(40,20,20,0.97), rgba(30,18,18,0.95))",
          border: "1px solid rgba(255,59,59,0.2)",
          boxShadow: "0 24px 60px rgba(255,0,0,0.35)",
        }}
      >
        {/* Header con advertencia */}
        <div
          className="relative px-6 py-5 border-b border-border/30 overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(255,59,59,0.15), rgba(139,0,0,0.08))" }}
        >
          {/* Efecto de fondo pulsante */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              background: "radial-gradient(circle at center, #FF3B3B, transparent 70%)",
            }}
          />
          
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #FF3B3B, #FF6B6B)",
                  boxShadow: "0 4px 20px rgba(255,59,59,0.5)",
                }}
              >
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-foreground leading-tight">
                  Eliminar Socio
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Esta acción es permanente y no se puede deshacer
                </p>
              </div>
            </div>

            {/* Botón de Cierre */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg border border-border/30 bg-card/20 text-muted-foreground hover:bg-card/50 hover:text-foreground transition-all flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Información del socio a eliminar */}
          <div
            className="p-4 rounded-xl border"
            style={{
              background: "rgba(255,59,59,0.05)",
              borderColor: "rgba(255,59,59,0.2)",
            }}
          >
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  Estás a punto de eliminar el siguiente socio:
                </p>
                <h3 className="text-base font-bold text-foreground mb-1">
                  {socio.nombre}
                </h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    Código: <span className="font-semibold text-foreground">{socio.codigoSocio}</span>
                  </span>
                  <span>•</span>
                  <span>
                    Membresía: <span className="font-semibold text-foreground">{socio.nombrePlan}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Advertencias */}
          <div 
            className="p-4 rounded-xl"
            style={{
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.2)",
            }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-warning mb-1">
                  Advertencia
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Se eliminarán todos los datos del socio</li>
                  <li>• Se perderá el historial de pagos y accesos</li>
                  <li>• Esta acción no se puede deshacer</li>
                  <li>• Se recomienda desactivar en lugar de eliminar</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/30"
          style={{ background: "rgba(14,16,25,0.95)" }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-foreground transition-all rounded-xl border border-border/30 hover:border-border hover:bg-card/30"
          >
            Cancelar
          </button>
          
          <button
            onClick={() => {
              onConfirmar()
              onClose()
            }}
            className="px-6 py-2.5 text-sm font-bold text-white transition-all rounded-xl flex items-center gap-2"
            style={{
              background: "linear-gradient(135deg, #FF3B3B, #DC2626)",
              boxShadow: "0 4px 16px rgba(255,59,59,0.4)",
            }}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar Socio
          </button>
        </div>
      </div>
    </div>
  )
}
