"use client"

import { X, Mail, Phone, Shield, Calendar, Clock } from "lucide-react"
import type { Usuario } from "@/lib/usuarios-data"
import { formatFechaCorta } from "@/lib/usuarios-data"

interface DetalleUsuarioModalProps {
  usuario: Usuario | null
  open: boolean
  displayId?: number | null
  onClose: () => void
}

export function DetalleUsuarioModal({ usuario, open, displayId, onClose }: DetalleUsuarioModalProps) {
  if (!open || !usuario) return null

  const idVisual = displayId ?? null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-card rounded-2xl w-full max-w-2xl border border-border animate-slide-up overflow-hidden"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.55)" }}
      >
        <div className="h-1 w-full bg-gradient-to-r from-accent via-primary to-accent" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/70">
          <h3 className="text-2xl font-semibold text-foreground">Detalle del Usuario</h3>
          <button
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Cerrar detalle"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User identity */}
          <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 border border-accent/30">
              <span className="text-xl font-bold text-accent">{idVisual ? `#${idVisual}` : '#'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-semibold text-foreground leading-tight truncate">{usuario.nombre}</p>
              <p className="text-base text-muted-foreground truncate">@{usuario.username}</p>
              {idVisual && (
                <p className="text-xs text-muted-foreground mt-1">ID #{idVisual}</p>
              )}
            </div>
            <span className={`ml-auto inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold ${
              usuario.activo 
                ? "bg-[#22C55E]/20 text-[#22C55E]" 
                : "bg-muted text-muted-foreground"
            }`}>
              {usuario.activo && <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />}
              {usuario.activo ? "Activo" : "Inactivo"}
            </span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/10 p-3">
              <Mail className="h-4 w-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground break-all">{usuario.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/10 p-3">
              <Phone className="h-4 w-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Telefono</p>
                <p className="text-sm font-medium text-foreground">{usuario.telefono || "No especificado"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/10 p-3">
              <Shield className="h-4 w-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Rol</p>
                <span 
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: usuario.rol.color }}
                >
                  {usuario.rol.nombre}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/10 p-3">
              <Calendar className="h-4 w-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Creado</p>
                <p className="text-sm font-medium text-foreground">
                  {usuario.fechaCreacion ? formatFechaCorta(usuario.fechaCreacion) : "No disponible"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/10 p-3 md:col-span-2">
              <Clock className="h-4 w-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Ultimo Acceso</p>
                <p className="text-sm font-medium text-foreground">
                  {usuario.ultimoAcceso ? formatFechaCorta(usuario.ultimoAcceso) : "Nunca"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 text-base font-medium text-accent border border-accent rounded-lg hover:bg-accent/10 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
