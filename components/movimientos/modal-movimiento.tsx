"use client"

import { useState, useEffect, useRef } from "react"
import { X, Save, PlusCircle, Eye, DollarSign, FileText, User, CreditCard, MessageSquare } from "lucide-react"
import type { Movimiento, TipoMovimiento, TipoPago, Concepto } from "@/lib/types/movimientos"

interface MetodoPago {
  id: string
  nombre: string
}

type ModalMode = "crear" | "editar" | "ver"

interface ModalMovimientoProps {
  open: boolean
  mode: ModalMode
  movimiento?: Movimiento | null
  onClose: () => void
  onSave: (data: {
    tipo: TipoMovimiento
    concepto_id: number
    concepto_nombre: string // Para mostrar en la UI
    total: number
    metodo_pago_id: number
    metodo_pago_nombre: string // Para mostrar en la UI
    observaciones?: string
  }) => void
  conceptos?: Concepto[]
  metodosPago?: MetodoPago[]
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

export function ModalMovimiento({ 
  open, 
  mode, 
  movimiento, 
  onClose, 
  onSave,
  conceptos = [],
  metodosPago = [],
}: ModalMovimientoProps) {
  const [tipo, setTipo] = useState<TipoMovimiento>("ingreso")
  const [conceptoId, setConceptoId] = useState<number>(0)
  const [total, setTotal] = useState("")
  const [metodoPagoId, setMetodoPagoId] = useState<number>(0)
  const [observaciones, setObservaciones] = useState("")
  const firstInput = useRef<HTMLSelectElement>(null)

  // Filtrar conceptos según el tipo seleccionado
  const conceptosFiltrados = conceptos.filter((c) => {
    if (tipo === "ingreso") return c.tipo === "ingreso"
    if (tipo === "egreso") return c.tipo === "gasto"
    return true
  })

  // Debug logs
  useEffect(() => {
    console.log("🔍 Modal abierto - Estado actual:")
    console.log("  - Conceptos disponibles:", conceptos.length)
    console.log("  - Métodos de pago disponibles:", metodosPago.length)
    console.log("  - Conceptos filtrados:", conceptosFiltrados.length)
    console.log("  - Tipo seleccionado:", tipo)
    console.log("  - Concepto ID seleccionado:", conceptoId)
    console.log("  - Método pago ID seleccionado:", metodoPagoId)
  }, [open, conceptos, metodosPago, conceptosFiltrados, tipo, conceptoId, metodoPagoId])

  useEffect(() => {
    if (movimiento && (mode === "editar" || mode === "ver")) {
      setTipo(movimiento.tipo)
      // Intentar encontrar el concepto por nombre (es una aproximación)
      const conceptoEncontrado = conceptos.find((c) => c.nombre === movimiento.concepto)
      setConceptoId(conceptoEncontrado?.id || 0)
      setTotal(String(movimiento.total))
      // Intentar encontrar el método de pago por nombre
      const metodoPagoEncontrado = metodosPago.find((m) => 
        m.nombre.toLowerCase().includes(movimiento.tipoPago.toLowerCase())
      )
      setMetodoPagoId(metodoPagoEncontrado ? parseInt(metodoPagoEncontrado.id) : 0)
      setObservaciones(movimiento.observaciones || "")
    } else {
      setTipo("ingreso")
      setConceptoId(0)
      setTotal("")
      setMetodoPagoId(0)
      setObservaciones("")
    }
  }, [movimiento, mode, open, conceptos, metodosPago])

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

    console.log("📝 Submitted desde modal:")
    console.log("  - Tipo:", tipo)
    console.log("  - Concepto ID:", conceptoId)
    console.log("  - Total:", total)
    console.log("  - Método pago ID:", metodoPagoId)
    console.log("  - Observaciones:", observaciones)

    // Validaciones
    if (!conceptoId || conceptoId === 0) {
      console.error("❌ Validación fallida: concepto inválido")
      alert("Por favor selecciona un concepto")
      return
    }

    if (!metodoPagoId || metodoPagoId === 0) {
      console.error("❌ Validación fallida: método de pago inválido")
      alert("Por favor selecciona un método de pago")
      return
    }

    const conceptoSeleccionado = conceptos.find((c) => c.id === conceptoId)
    const metodoPagoSeleccionado = metodosPago.find((m) => parseInt(m.id) === metodoPagoId)

    console.log("✅ Validaciones pasadas:")
    console.log("  - Concepto seleccionado:", conceptoSeleccionado)
    console.log("  - Método pago seleccionado:", metodoPagoSeleccionado)

    const dataToSave = {
      tipo,
      concepto_id: conceptoId,
      concepto_nombre: conceptoSeleccionado?.nombre || "",
      total: parseFloat(total) || 0,
      metodo_pago_id: metodoPagoId,
      metodo_pago_nombre: metodoPagoSeleccionado?.nombre || "",
      observaciones: observaciones || undefined,
    }

    console.log("📤 Llamando a onSave con:", dataToSave)

    onSave(dataToSave)
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
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {movimiento.folio || movimiento.id}
                    </p>
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
                    <select
                      ref={firstInput}
                      value={conceptoId}
                      onChange={(e) => setConceptoId(parseInt(e.target.value))}
                      required
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                    >
                      <option value={0}>Selecciona un concepto...</option>
                      {conceptosFiltrados.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                    {conceptosFiltrados.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        No hay conceptos disponibles para {tipo === "ingreso" ? "ingresos" : "gastos"}
                      </p>
                    )}
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
                      Método de Pago <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={metodoPagoId}
                      onChange={(e) => setMetodoPagoId(parseInt(e.target.value))}
                      required
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                    >
                      <option value={0}>Selecciona un método de pago...</option>
                      {metodosPago.map((mp) => (
                        <option key={mp.id} value={parseInt(mp.id)}>
                          {mp.nombre}
                        </option>
                      ))}
                    </select>
                    {metodosPago.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        No hay métodos de pago disponibles
                      </p>
                    )}
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
