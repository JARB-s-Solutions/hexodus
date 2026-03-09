"use client"

import { X, Mail, Phone, Shield, Calendar, Clock } from "lucide-react"
import type { Usuario } from "@/lib/usuarios-data"
import { formatFechaCorta } from "@/lib/usuarios-data"

interface DetalleUsuarioModalProps {
  usuario: Usuario | null
  open: boolean
  onClose: () => void
}

export function DetalleUsuarioModal({ usuario, open, onClose }: DetalleUsuarioModalProps) {
  if (!open || !usuario) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-card rounded-xl w-full max-w-lg border border-border animate-slide-up"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Detalle del Usuario</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* User identity */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-accent">#{usuario.id}</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{usuario.nombre}</p>
              <p className="text-sm text-muted-foreground">@{usuario.username}</p>
            </div>
            <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              usuario.activo 
                ? "bg-[#22C55E]/20 text-[#22C55E]" 
                : "bg-muted text-muted-foreground"
            }`}>
              {usuario.activo && <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />}
              {usuario.activo ? "Activo" : "Inactivo"}
            </span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm text-foreground break-all">{usuario.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Telefono</p>
                <p className="text-sm text-foreground">{usuario.telefono || "No especificado"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Rol</p>
                <span 
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: usuario.rol.color }}
                >
                  {usuario.rol.nombre}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Creado</p>
                <p className="text-sm text-foreground">
                  {usuario.fechaCreacion ? formatFechaCorta(usuario.fechaCreacion) : "No disponible"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Clock className="h-4 w-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Ultimo Acceso</p>
                <p className="text-sm text-foreground">
                  {usuario.ultimoAcceso ? formatFechaCorta(usuario.ultimoAcceso) : "Nunca"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-accent border border-accent rounded-lg hover:bg-accent/10 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
