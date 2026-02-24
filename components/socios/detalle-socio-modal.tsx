"use client"

import { X, User, ScanFace, Fingerprint } from "lucide-react"
import type { Socio } from "@/lib/socios-data"
import { getInicialesSocio, membresiaLabels, getVigenciaMembresia, getEstadoContrato } from "@/lib/socios-data"

interface DetalleSocioModalProps {
  socio: Socio | null
  open: boolean
  onClose: () => void
}

export function DetalleSocioModal({ socio, open, onClose }: DetalleSocioModalProps) {
  if (!open || !socio) return null

  const iniciales = getInicialesSocio(socio.nombre)
  const generoLabel = socio.genero === "M" ? "Masculino" : socio.genero === "F" ? "Femenino" : "Otro"
  const vigencia = getVigenciaMembresia(socio.fechaFin)
  const contrato = getEstadoContrato(socio)

  const rows = [
    { label: "ID", value: `#${socio.id}` },
    { label: "Genero", value: generoLabel },
    { label: "Correo", value: socio.correo || "-" },
    { label: "Telefono", value: socio.telefono || "-" },
    { label: "Membresia", value: membresiaLabels[socio.membresia] },
    { label: "Vigencia", value: vigencia === "vigente" ? "Vigente" : vigencia === "por_vencer" ? "Por vencer" : "Vencida" },
    { label: "Estado Contrato", value: contrato === "activo" ? "Activo" : contrato === "por_vencer" ? "Por vencer" : contrato === "vencido" ? "Vencido" : "Pendiente" },
    { label: "Firmo Contrato", value: socio.firmoContrato ? "Si" : "No" },
    { label: "Fecha Registro", value: socio.fechaRegistro || "-" },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 pb-20 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg my-4 rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: "linear-gradient(180deg, rgba(22,24,36,0.97), rgba(18,20,32,0.95))",
          border: "1px solid rgba(255,255,255,0.09)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <h3 className="text-lg font-bold text-accent flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalle del Socio
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4 mb-5 pb-4 border-b border-border/30">
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center text-lg font-bold text-primary">
              {iniciales}
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{socio.nombre}</p>
              <p className="text-sm text-muted-foreground">{socio.correo || "-"}</p>
            </div>
          </div>

          {/* Detail rows */}
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{r.label}:</span>
                <span className="text-sm font-medium text-foreground">{r.value}</span>
              </div>
            ))}
          </div>

          {/* Biometric status */}
          <div className="mt-5 pt-4 border-t border-border/30">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Biometricos</p>
            <div className="flex gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${socio.bioRostro ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-muted text-muted-foreground"}`}>
                <ScanFace className="h-4 w-4" />
                Rostro: {socio.bioRostro ? "Capturado" : "No"}
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${socio.bioHuella ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-muted text-muted-foreground"}`}>
                <Fingerprint className="h-4 w-4" />
                Huella: {socio.bioHuella ? "Capturado" : "No"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
