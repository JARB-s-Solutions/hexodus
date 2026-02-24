"use client"

import { useState, useEffect, useRef } from "react"
import { X, Save, PlusCircle, Eye, DollarSign, FileText, User, CreditCard, MessageSquare } from "lucide-react"
import type { Movimiento, TipoMovimiento, TipoPago } from "@/lib/movimientos-data"

type ModalMode = "crear" | "editar" | "ver"

interface ModalMovimientoProps {
  open: boolean
  mode: ModalMode
  movimiento?: Movimiento | null
  onClose: () => void
  onSave: (data: Omit<Movimiento, "id" | "fecha" | "hora" | "usuario">) => void
}

function fmtMoney(n: number): string {
  const fixed = n.toFixed(2)
  const [intPart, decPart] = fixed.split(".")
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `$${formatted}.${decPart}`
}

function formatFechaLong(fecha: string, hora: string): string {
  const parts = fecha.split("-")
  if (parts.length !== 3) return `${fecha} ${hora}`
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]
  const month = months[parseInt(parts[1], 10) - 1] || parts[1]
  return `${parseInt(parts[2], 10)} de ${month} de ${parts[0]} a las ${hora} hrs`
}

export function ModalMovimiento({ open, mode, movimiento, onClose, onSave }: ModalMovimientoProps) {
  const [tipo, setTipo] = useState<TipoMovimiento>("ingreso")
  const [concepto, setConcepto] = useState("")
  const [total, setTotal] = useState("")
  const [tipoPago, setTipoPago] = useState<TipoPago>("efectivo")
  const [observaciones, setObservaciones] = useState("")
  const firstInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (movimiento && (mode === "editar" || mode === "ver")) {
      setTipo(movimiento.tipo)
      setConcepto(movimiento.concepto)
      setTotal(String(movimiento.total))
      setTipoPago(movimiento.tipoPago)
      setObservaciones(movimiento.observaciones || "")
    } else {
      setTipo("ingreso")
      setConcepto("")
      setTotal("")
      setTipoPago("efectivo")
      setObservaciones("")
    }
  }, [movimiento, mode, open])

  useEffect(() => {
    if (open && mode === "crear" && firstInput.current) {
      setTimeout(() => firstInput.current?.focus(), 200)
    }
  }, [open, mode])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const isReadOnly = mode === "ver"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadOnly) return
    onSave({
      tipo,
      concepto,
      total: parseFloat(total) || 0,
      tipoPago,
      observaciones: observaciones || undefined,
    })
  }

  const title =
    mode === "crear"
      ? "Registrar Movimiento"
      : mode === "editar"
        ? "Editar Movimiento"
        : "Detalle del Movimiento"

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex items-start justify-center min-h-screen pt-8 px-4 pb-20">
        <div
          className="relative bg-card rounded-2xl w-full max-w-lg animate-slide-up overflow-hidden border border-border"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5)", maxHeight: "90vh" }}
        >
          {/* Colored top bar */}
          <div className={`h-1 ${mode === "ver" ? "bg-accent" : "bg-primary"}`} />

          <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 4px)" }}>
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className={`text-xl font-bold flex items-center gap-2 ${mode === "ver" ? "text-accent" : "text-primary"}`}>
                    {mode === "ver" ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <PlusCircle className="h-5 w-5" />
                    )}
                    {title}
                  </h3>
                  {mode === "ver" && movimiento && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{movimiento.id}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* View mode */}
              {isReadOnly && movimiento ? (
                <div className="space-y-1">
                  {/* Summary card */}
                  <div
                    className={`rounded-xl p-5 mb-4 border ${
                      movimiento.tipo === "ingreso"
                        ? "bg-success/5 border-success/20"
                        : "bg-destructive/5 border-destructive/20"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground mb-1">Monto del movimiento</p>
                    <p
                      className={`text-3xl font-bold ${
                        movimiento.tipo === "ingreso" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {movimiento.tipo === "ingreso" ? "+" : "-"}
                      {fmtMoney(movimiento.total)}
                    </p>
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded mt-2 ${
                        movimiento.tipo === "ingreso"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {movimiento.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-1 gap-4">
                    <DetailRow
                      icon={<FileText className="h-4 w-4" />}
                      label="Concepto"
                      value={movimiento.concepto}
                    />
                    <DetailRow
                      icon={<CreditCard className="h-4 w-4" />}
                      label="Metodo de Pago"
                      value={tipoPagoLabels[movimiento.tipoPago] || movimiento.tipoPago}
                    />
                    <DetailRow
                      icon={<User className="h-4 w-4" />}
                      label="Registrado por"
                      value={movimiento.usuario}
                    />
                    <DetailRow
                      icon={<DollarSign className="h-4 w-4" />}
                      label="Fecha y Hora"
                      value={formatFechaLong(movimiento.fecha, movimiento.hora)}
                    />
                    {movimiento.observaciones && (
                      <DetailRow
                        icon={<MessageSquare className="h-4 w-4" />}
                        label="Observaciones"
                        value={movimiento.observaciones}
                      />
                    )}
                  </div>

                  <div className="pt-5">
                    <button
                      onClick={onClose}
                      className="w-full py-2.5 font-medium rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                /* Create / Edit form */
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Tipo de Movimiento - Toggle */}
                  <div>
                    <label className="block text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">
                      Tipo de Movimiento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTipo("ingreso")}
                        className={`py-3 rounded-lg text-sm font-semibold border transition-all duration-200 ${
                          tipo === "ingreso"
                            ? "bg-success/15 border-success/50 text-success"
                            : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                        }`}
                      >
                        Ingreso
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipo("egreso")}
                        className={`py-3 rounded-lg text-sm font-semibold border transition-all duration-200 ${
                          tipo === "egreso"
                            ? "bg-destructive/15 border-destructive/50 text-destructive"
                            : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                        }`}
                      >
                        Egreso
                      </button>
                    </div>
                  </div>

                  {/* Concepto */}
                  <div>
                    <label className="block text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">
                      Concepto <span className="text-destructive">*</span>
                    </label>
                    <input
                      ref={firstInput}
                      type="text"
                      value={concepto}
                      onChange={(e) => setConcepto(e.target.value)}
                      required
                      placeholder="Ej: Pago de membresia, Compra de equipo..."
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground/50 focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                    />
                  </div>

                  {/* Total */}
                  <div>
                    <label className="block text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">
                      Total (MXN) <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm">$</span>
                      <input
                        type="number"
                        value={total}
                        onChange={(e) => setTotal(e.target.value)}
                        required
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground/50 focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Tipo de Pago */}
                  <div>
                    <label className="block text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">
                      Metodo de Pago
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["efectivo", "transferencia", "tarjeta"] as TipoPago[]).map((tp) => (
                        <button
                          key={tp}
                          type="button"
                          onClick={() => setTipoPago(tp)}
                          className={`py-2.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                            tipoPago === tp
                              ? "bg-accent/15 border-accent/50 text-accent"
                              : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                          }`}
                        >
                          {tipoPagoLabels[tp]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">
                      Observaciones
                    </label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      rows={3}
                      placeholder="Notas adicionales (opcional)..."
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground/50 focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors resize-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 font-medium rounded-lg text-sm bg-primary text-primary-foreground transition-all duration-300 glow-primary glow-primary-hover flex items-center justify-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {mode === "editar" ? "Actualizar" : "Registrar"}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2.5 font-medium rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const tipoPagoLabels: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
      <div className="mt-0.5 text-muted-foreground/60">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  )
}
