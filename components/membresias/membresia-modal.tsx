"use client"

import { useState, useEffect } from "react"
import { X, CreditCard, Pencil, Save, Info, Calendar, Settings } from "lucide-react"
import type { Membresia } from "@/lib/types/membresias"
import type { UnidadDuracion, MembresiaFormData } from "@/lib/membresias-data"

interface MembresiaModalProps {
  open: boolean
  onClose: () => void
  onGuardar: (data: MembresiaFormData) => void
  membresia: Membresia | null
}

export function MembresiaModal({ open, onClose, onGuardar, membresia }: MembresiaModalProps) {
  const [nombre, setNombre] = useState("")
  const [precio, setPrecio] = useState("")
  const [duracionCantidad, setDuracionCantidad] = useState("1")
  const [duracionUnidad, setDuracionUnidad] = useState<UnidadDuracion>("meses")
  const [descripcion, setDescripcion] = useState("")
  const [esOferta, setEsOferta] = useState(false)
  const [precioOriginal, setPrecioOriginal] = useState("")
  const [fechaVencimiento, setFechaVencimiento] = useState("")

  useEffect(() => {
    if (membresia) {
      setNombre(membresia.nombre)
      setPrecio(String(membresia.precioBase))
      
      // Convertir días a unidad apropiada
      const convertirDiasAUnidad = (dias: number): { cantidad: number, unidad: UnidadDuracion } => {
        if (dias % 365 === 0) {
          return { cantidad: dias / 365, unidad: 'años' }
        } else if (dias % 30 === 0) {
          return { cantidad: dias / 30, unidad: 'meses' }
        } else if (dias % 7 === 0) {
          return { cantidad: dias / 7, unidad: 'semanas' }
        } else {
          return { cantidad: dias, unidad: 'dias' }
        }
      }
      
      const { cantidad, unidad } = convertirDiasAUnidad(membresia.duracionCantidad)
      setDuracionCantidad(String(cantidad))
      setDuracionUnidad(unidad)
      
      setDescripcion(membresia.descripcion)
      setEsOferta(membresia.esOferta)
      setPrecioOriginal(membresia.precioOferta ? String(membresia.precioOferta) : "")
      setFechaVencimiento(membresia.fechaFinOferta || "")
    } else {
      setNombre("")
      setPrecio("")
      setDuracionCantidad("1")
      setDuracionUnidad("meses")
      setDescripcion("")
      setEsOferta(false)
      setPrecioOriginal("")
      setFechaVencimiento("")
    }
  }, [membresia, open])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !precio) return

    const data: MembresiaFormData = {
      nombre: nombre.trim(),
      precio: parseFloat(precio),
      tipo: "mensual", // Valor dummy para compatibilidad
      duracion: {
        cantidad: parseInt(duracionCantidad),
        unidad: duracionUnidad,
      },
      descripcion: descripcion.trim(),
      esOferta,
    }

    if (esOferta && precioOriginal) {
      data.precioOriginal = parseFloat(precioOriginal)
    }
    if (esOferta && fechaVencimiento) {
      data.fechaVencimientoOferta = fechaVencimiento
    }

    onGuardar(data)
  }

  const inputClass =
    "w-full h-[44px] px-4 text-sm bg-[#1C1F2B]/90 border border-muted-foreground/30 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all"

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 pb-20 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-2xl my-4 rounded-2xl overflow-hidden animate-slide-up"
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
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            {membresia ? (
              <>
                <Pencil className="h-5 w-5 text-primary" />
                <span>Editar Membresia</span>
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 text-primary" />
                <span>Nueva Membresia</span>
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-border/30 bg-card/20 text-muted-foreground hover:bg-card/50 hover:text-foreground transition flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Section: Basic Info */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-primary text-xs font-extrabold uppercase tracking-widest">
                <Info className="h-4 w-4" />
                <span>Informacion Basica</span>
              </div>
              <div
                className="p-4 rounded-2xl space-y-4"
                style={{ background: "rgba(21,25,38,0.72)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Nombre de la Membresia <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      placeholder="Ej. Mensual VIP"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Precio <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        value={precio}
                        onChange={(e) => setPrecio(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className={`${inputClass} pl-7`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Duration Config */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-primary text-xs font-extrabold uppercase tracking-widest">
                <Calendar className="h-4 w-4" />
                <span>Configuración de Duración</span>
              </div>
              <div
                className="p-4 rounded-2xl"
                style={{ background: "rgba(21,25,38,0.72)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Cantidad <span className="text-primary">*</span>
                    </label>
                    <input
                      type="number"
                      value={duracionCantidad}
                      onChange={(e) => setDuracionCantidad(e.target.value)}
                      required
                      min="1"
                      placeholder="1"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Unidad
                    </label>
                    <select
                      value={duracionUnidad}
                      onChange={(e) => setDuracionUnidad(e.target.value as UnidadDuracion)}
                      className={inputClass}
                    >
                      <option value="dias">Días</option>
                      <option value="semana">Semana</option>
                      <option value="semanas">Semanas</option>
                      <option value="meses">Meses</option>
                      <option value="años">Años</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Additional Options */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-accent text-xs font-extrabold uppercase tracking-widest">
                <Settings className="h-4 w-4" />
                <span>Opciones Adicionales</span>
              </div>
              <div
                className="p-4 rounded-2xl space-y-4"
                style={{ background: "rgba(21,25,38,0.72)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                {/* Offer toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Es una oferta especial?
                  </span>
                  <label className="relative inline-block w-[60px] h-[32px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esOferta}
                      onChange={(e) => setEsOferta(e.target.checked)}
                      className="sr-only peer"
                    />
                    <span className="absolute inset-0 rounded-full bg-muted border border-border peer-checked:bg-accent/30 peer-checked:border-accent/60 transition-all" />
                    <span className="absolute top-[3px] left-[3px] w-[26px] h-[26px] rounded-full bg-accent shadow-lg peer-checked:translate-x-[28px] transition-transform" />
                  </label>
                </div>

                {/* Offer details */}
                {esOferta && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-fade-in-up">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Precio de Oferta (menor al precio base)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          value={precioOriginal}
                          onChange={(e) => setPrecioOriginal(e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className={`${inputClass} pl-7`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Válida hasta
                      </label>
                      <input
                        type="datetime-local"
                        value={fechaVencimiento}
                        onChange={(e) => setFechaVencimiento(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Descripcion
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                    placeholder="Descripcion opcional de la membresia..."
                    className="w-full px-4 py-3 text-sm bg-[#1C1F2B]/90 border border-muted-foreground/30 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/30"
            style={{ background: "rgba(14,16,25,0.95)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 transition-all glow-primary glow-primary-hover"
            >
              <Save className="h-4 w-4" />
              {membresia ? "Guardar Cambios" : "Guardar Membresia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
