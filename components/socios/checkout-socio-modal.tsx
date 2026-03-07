"use client"

import { useState, useEffect } from "react"
import { X, DollarSign, CreditCard, AlertCircle, CheckCircle, Calendar, Tag } from "lucide-react"
import type { CotizacionResponse, MetodoPago } from "@/lib/types/socios"
import { MetodosPagoService } from "@/lib/services/socios"

interface CheckoutSocioModalProps {
  open: boolean
  onClose: () => void
  cotizacion: CotizacionResponse['data'] | null
  onConfirmarPago: (metodoPagoId: number, nombreMetodoPago: string) => void
  onInscribirSinPago: () => void
  loading?: boolean
}

export function CheckoutSocioModal({
  open,
  onClose,
  cotizacion,
  onConfirmarPago,
  onInscribirSinPago,
  loading = false
}: CheckoutSocioModalProps) {
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<number | null>(null)
  const [cargandoMetodos, setCargandoMetodos] = useState(false)

  useEffect(() => {
    if (open) {
      cargarMetodosPago()
    }
  }, [open])

  const cargarMetodosPago = async () => {
    try {
      setCargandoMetodos(true)
      const metodos = await MetodosPagoService.getAll()
      console.log('💳 Métodos de pago cargados en componente:', metodos)
      setMetodosPago(metodos)
      // No seleccionar automáticamente, dejar que el usuario elija
      setMetodoPagoSeleccionado(null)
    } catch (error) {
      console.error('Error al cargar métodos de pago:', error)
      setMetodosPago([])
    } finally {
      setCargandoMetodos(false)
    }
  }

  if (!open || !cotizacion) return null

  const { nombre_plan, duracion_dias, fecha_inicio, fecha_vencimiento, desglose_cobro } = cotizacion

  // Función auxiliar para formatear fechas sin problemas de zona horaria
  const formatearFecha = (fechaString: string) => {
    // Extraer componentes de la fecha (YYYY-MM-DD) sin conversión de zona horaria
    const [year, month, day] = fechaString.split('T')[0].split('-').map(Number)
    
    // Crear fecha en zona horaria local directamente
    const fecha = new Date(year, month - 1, day)
    
    return fecha.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose()
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden animate-slide-up flex flex-col"
        style={{
          background: "linear-gradient(180deg, rgba(22,24,36,0.97), rgba(18,20,32,0.95))",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="relative px-6 py-5 border-b border-border/30 overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(0,191,255,0.12), rgba(13,18,36,0.70))" }}
        >
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              background: "radial-gradient(circle at top right, var(--accent), transparent 70%)"
            }}
          />
          
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, var(--accent), rgba(0,191,255,0.6))",
                  boxShadow: "0 4px 20px rgba(0,191,255,0.4)",
                }}
              >
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-foreground leading-tight">
                  Procesar Pago
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Confirma el método de pago para inscribir al socio
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="w-9 h-9 rounded-lg border border-border/30 bg-card/20 text-muted-foreground hover:bg-card/50 hover:text-foreground transition-all flex items-center justify-center disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Resumen de Membresía */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: "rgba(0,191,255,0.08)",
              border: "1px solid rgba(0,191,255,0.2)",
            }}
          >
            <div className="flex items-start gap-3 mb-3">
              <Tag className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-bold text-foreground mb-1">
                  {nombre_plan}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Duración: {duracion_dias} días
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-accent" />
                <div>
                  <p className="text-muted-foreground">Inicio</p>
                  <p className="font-semibold text-foreground">
                    {formatearFecha(fecha_inicio)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-warning" />
                <div>
                  <p className="text-muted-foreground">Vencimiento</p>
                  <p className="font-semibold text-foreground">
                    {formatearFecha(fecha_vencimiento)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desglose de Cobro */}
          <div
            className="p-5 rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(21,25,38,0.82), rgba(15,18,30,0.72))",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Desglose de Cobro
            </h4>

            <div className="space-y-3">
              {/* Precio Regular */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Precio Regular</span>
                <span className={`text-sm font-semibold ${desglose_cobro.tiene_descuento ? 'line-through opacity-60 text-muted-foreground' : 'text-foreground'}`}>
                  ${desglose_cobro.precio_regular.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Descuento (si aplica) */}
              {desglose_cobro.tiene_descuento && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-success">Descuento</span>
                  <span className="text-sm font-bold text-success">
                    -${desglose_cobro.ahorro.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Separador */}
              <div className="border-t border-border/30 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">Total a Pagar</span>
                  <span 
                    className="text-2xl font-black"
                    style={{
                      color: desglose_cobro.tiene_descuento ? '#4BB543' : 'var(--accent)',
                      textShadow: "0 0 12px rgba(0,191,255,0.3)"
                    }}
                  >
                    ${desglose_cobro.total_a_pagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de Método de Pago */}
          <div>
            <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Método de Pago
            </label>
            {cargandoMetodos ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
              </div>
            ) : (
              <select
                value={metodoPagoSeleccionado ?? ''}
                onChange={(e) => {
                  const value = e.target.value
                  const nuevoValor = value ? Number(value) : null
                  console.log('📋 Selección cambiada:', { value, nuevoValor })
                  setMetodoPagoSeleccionado(nuevoValor)
                }}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 transition-all"
                style={{
                  background: metodoPagoSeleccionado ? 'rgba(0,191,255,0.05)' : undefined,
                  borderColor: metodoPagoSeleccionado ? 'var(--accent)' : undefined,
                }}
              >
                <option value="">Seleccionar método...</option>
                {metodosPago.map((metodo) => {
                  console.log('📋 Renderizando opción:', metodo)
                  return (
                    <option 
                      key={`metodo-${metodo.metodo_pago_id}`} 
                      value={metodo.metodo_pago_id}
                    >
                      {metodo.nombre}
                    </option>
                  )
                })}
              </select>
            )}
          </div>

          {/* Advertencia */}
          <div
            className="p-3 rounded-xl flex items-start gap-2"
            style={{
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.2)",
            }}
          >
            <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Al confirmar el pago, se registrará el ingreso en la caja del día y se activará la membresía del socio.
            </p>
          </div>
        </div>

        {/* Footer con Acciones */}
        <div
          className="flex flex-col gap-3 px-6 py-4 border-t border-border/30"
          style={{ background: "rgba(14,16,25,0.95)" }}
        >
          {/* Botón Principal: Cobrar y Registrar */}
          <button
            onClick={() => {
              if (metodoPagoSeleccionado) {
                const metodoPago = metodosPago.find(m => m.metodo_pago_id === metodoPagoSeleccionado)
                onConfirmarPago(metodoPagoSeleccionado, metodoPago?.nombre || "Desconocido")
              }
            }}
            disabled={!metodoPagoSeleccionado || loading}
            className="w-full px-6 py-3 text-sm font-bold text-white transition-all rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: metodoPagoSeleccionado && !loading
                ? "linear-gradient(135deg, #4BB543, #45a839)"
                : "rgba(75, 181, 67, 0.3)",
              boxShadow: metodoPagoSeleccionado && !loading 
                ? "0 4px 16px rgba(75,181,67,0.4)"
                : "none",
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Cobrar y Registrar Socio</span>
              </>
            )}
          </button>

          {/* Botón Secundario: Solo Inscribir (Sin Pago) */}
          <button
            onClick={onInscribirSinPago}
            disabled={loading}
            className="w-full px-6 py-3 text-sm font-medium text-foreground transition-all rounded-xl border border-border/30 hover:border-border hover:bg-card/30 disabled:opacity-50"
          >
            Solo Inscribir (Dejar Pago Pendiente)
          </button>

          {/* Botón Cancelar */}
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full px-6 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
