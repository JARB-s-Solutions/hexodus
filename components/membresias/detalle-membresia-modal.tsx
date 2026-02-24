"use client"

import { X, CreditCard, Calendar, Tag, Clock, FileText } from "lucide-react"
import type { Membresia } from "@/lib/types/membresias"

function getDuracionTexto(cantidad: number, unidad: string): string {
  return `${cantidad} ${unidad}`
}

function getDescuento(membresia: Membresia): number | null {
  if (!membresia.esOferta || !membresia.precioOferta) return null
  return Math.round(((membresia.precioBase - membresia.precioOferta) / membresia.precioBase) * 100)
}

interface DetalleMembresiaMoalProps {
  open: boolean
  onClose: () => void
  membresia: Membresia | null
}

export function DetalleMembresiaMoal({ open, onClose, membresia }: DetalleMembresiaMoalProps) {
  if (!open || !membresia) return null

  const m = membresia
  const descuento = getDescuento(m)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-20 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-lg my-4 rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: "linear-gradient(180deg, rgba(22,24,36,0.97), rgba(18,20,32,0.95))",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b border-border/30"
          style={{ background: "linear-gradient(180deg, rgba(13,18,36,0.70), rgba(12,15,28,0.28))" }}
        >
          <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-accent" />
            Detalle de Membresia
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-border/30 bg-card/20 text-muted-foreground hover:bg-card/50 hover:text-foreground transition flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Title and status */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">{m.nombre}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                    m.estado === 'activo'
                      ? "bg-success/15 text-success border border-success/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {m.estado === 'activo' ? "Activa" : "Inactiva"}
                </span>
                {m.esOferta && (
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full text-primary-foreground"
                    style={{ background: "linear-gradient(135deg, #FF3B3B, #FF6B6B)" }}
                  >
                    Oferta
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price section */}
          <div
            className="p-4 rounded-2xl"
            style={{ background: "rgba(21,25,38,0.72)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-baseline gap-3">
              <span
                className="text-3xl font-extrabold text-accent"
                style={{ textShadow: "0 0 12px rgba(0,191,255,0.25)" }}
              >
                ${(m.esOferta && m.precioOferta ? m.precioOferta : m.precioBase).toLocaleString()}
              </span>
              {m.esOferta && m.precioOferta && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    ${m.precioBase.toLocaleString()}
                  </span>
                  {descuento !== null && (
                    <span className="text-sm font-bold text-primary">-{descuento}%</span>
                  )}
                </>
              )}
            </div>
            {m.esOferta && m.fechaFinOferta && (
              <p className="text-xs text-warning mt-2 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Oferta válida hasta{" "}
                {new Date(m.fechaFinOferta).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoItem
              icon={<Calendar className="h-4 w-4 text-accent" />}
              label="Duración"
              value={getDuracionTexto(m.duracionCantidad, m.duracionUnidad)}
            />
            <InfoItem
              icon={<CreditCard className="h-4 w-4 text-accent" />}
              label="ID"
              value={`#${m.id}`}
            />
            {m.createdAt && (
              <InfoItem
                icon={<Clock className="h-4 w-4 text-accent" />}
                label="Creada"
                value={new Date(m.createdAt).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              />
            )}
          </div>

          {/* Description */}
          {m.descripcion && (
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(21,25,38,0.72)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Descripcion
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{m.descripcion}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end px-6 py-4 border-t border-border/30"
          style={{ background: "rgba(14,16,25,0.95)" }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition rounded-xl border border-border/30 hover:border-border"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="p-3 rounded-xl flex items-center gap-3"
      style={{ background: "rgba(21,25,38,0.72)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {icon}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}
