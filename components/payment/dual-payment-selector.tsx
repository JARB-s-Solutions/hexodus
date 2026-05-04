"use client"

import { useState, useMemo } from "react"
import { CreditCard, AlertCircle } from "lucide-react"
import { Label } from "@/ui/label"
import type { MetodoPago } from "@/lib/types/socios"
import { formatCurrency } from "@/lib/types/ventas"

export interface PagoSplitRequest {
  metodo_pago_id: number
  monto: number
}

interface DualPaymentSelectorProps {
  /** Total que debe ser pagado */
  total: number
  
  /** Lista de métodos de pago disponibles */
  metodosPago: MetodoPago[]
  
  /** Callback cuando los pagos cambian */
  onPagosChange: (pagos: PagoSplitRequest[]) => void
  
  /** Estado deshabilitado */
  disabled?: boolean
  
  /** Mostrar solo un método (para backward compatibility) */
  soloUnMetodo?: boolean
  
  /** Texto personalizado para label */
  labelText?: string
}

export function DualPaymentSelector({
  total,
  metodosPago,
  onPagosChange,
  disabled = false,
  soloUnMetodo = false,
  labelText = "Métodos de Pago"
}: DualPaymentSelectorProps) {
  const [pagos, setPagos] = useState<PagoSplitRequest[]>([
    { metodo_pago_id: 0, monto: soloUnMetodo ? total : 0 },
    { metodo_pago_id: 0, monto: 0 }
  ])

  // Calcular totales
  const totalPagado = useMemo(() => {
    return pagos.reduce((sum, pago) => sum + pago.monto, 0)
  }, [pagos])

  const diferencia = useMemo(() => {
    return total - totalPagado
  }, [total, totalPagado])

  const esValido = useMemo(() => {
    // Si es solo un método, validar que tenga método seleccionado y monto > 0
    if (soloUnMetodo) {
      return pagos[0].metodo_pago_id > 0 && pagos[0].monto > 0 && Math.abs(diferencia) < 0.01
    }

    // Para dos métodos: al menos uno debe estar seleccionado
    const conMetodo = pagos.filter(p => p.metodo_pago_id > 0)
    if (conMetodo.length === 0) return false

    // Validar que la suma sea exacta (tolerancia de 0.01)
    return Math.abs(diferencia) < 0.01 && totalPagado > 0
  }, [pagos, total, diferencia, soloUnMetodo])

  // Actualizar notificación cuando cambian los pagos
  const notificacion = useMemo(() => {
    if (soloUnMetodo) {
      if (pagos[0].metodo_pago_id === 0) return "Selecciona un método de pago"
      if (pagos[0].monto === 0) return "Ingresa el monto a pagar"
      if (Math.abs(diferencia) > 0.01) {
        return diferencia > 0 
          ? `Faltan $${Math.abs(diferencia).toFixed(2)}`
          : `Sobra $${Math.abs(diferencia).toFixed(2)}`
      }
      return "✓ Listo para procesar"
    }

    // Para dos métodos
    const conMetodo = pagos.filter(p => p.metodo_pago_id > 0)
    if (conMetodo.length === 0) return "Selecciona al menos un método de pago"
    if (totalPagado === 0) return "Ingresa montos a pagar"
    if (Math.abs(diferencia) > 0.01) {
      return diferencia > 0 
        ? `Faltan $${Math.abs(diferencia).toFixed(2)} (tolerancia de 0.01)`
        : `Sobra $${Math.abs(diferencia).toFixed(2)} (tolerancia de 0.01)`
    }
    return "✓ Pagos listos"
  }, [pagos, total, diferencia, soloUnMetodo])

  const handleMetodoChange = (index: number, newMetodoId: number) => {
    const newPagos = [...pagos]
    newPagos[index].metodo_pago_id = newMetodoId
    
    // Si se selecciona el mismo método en ambos, limpiar el segundo
    if (newPagos[0].metodo_pago_id > 0 && 
        newPagos[1].metodo_pago_id > 0 && 
        newPagos[0].metodo_pago_id === newPagos[1].metodo_pago_id) {
      if (index === 0) {
        newPagos[1].metodo_pago_id = 0
      }
    }
    
    setPagos(newPagos)
    onPagosChange(newPagos.filter(p => p.metodo_pago_id > 0))
  }

  const handleMontoChange = (index: number, newMonto: string) => {
    const monto = parseFloat(newMonto) || 0
    const newPagos = [...pagos]
    newPagos[index].monto = Math.max(0, monto)
    setPagos(newPagos)
    onPagosChange(newPagos.filter(p => p.metodo_pago_id > 0))
  }

  const handleMontoWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.currentTarget.blur()
  }

  const handleAutocompletarMonto = (index: number) => {
    const newPagos = [...pagos]
    newPagos[index].monto = Math.max(0, total - pagos.reduce((sum, p, i) => i === index ? sum : sum + p.monto, 0))
    setPagos(newPagos)
    onPagosChange(newPagos.filter(p => p.metodo_pago_id > 0))
  }

  // Métodos disponibles excluyendo los ya seleccionados (salvo el actual)
  const metodosDisponibles = (index: number) => {
    const seleccionados = pagos.map((p, i) => i !== index ? p.metodo_pago_id : 0).filter(id => id > 0)
    return metodosPago.filter(m => !seleccionados.includes(m.metodo_pago_id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-accent" />
          <span>{labelText}</span>
        </Label>
        <div className="text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Métodos de pago */}
      <div className={`space-y-3 ${soloUnMetodo ? "max-w-sm" : "grid grid-cols-2 gap-4"}`}>
        {pagos.map((pago, index) => {
          // En modo solo un método, mostrar solo el primero
          if (soloUnMetodo && index > 0) return null

          const metodoSeleccionado = metodosPago.find(m => m.metodo_pago_id === pago.metodo_pago_id)
          const disponibles = metodosDisponibles(index)
          const mostrarMonto = pago.metodo_pago_id > 0
          const mostrarSegundo = !soloUnMetodo && pagos[0].metodo_pago_id > 0

          return (
            <div key={index} className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {soloUnMetodo ? "Método de Pago" : `Método ${index + 1}`}
                {!soloUnMetodo && index > 0 && <span className="text-muted-foreground ml-1">(Opcional)</span>}
              </label>

              <select
                value={pago.metodo_pago_id}
                onChange={(e) => handleMetodoChange(index, parseInt(e.target.value))}
                disabled={disabled || (index > 0 && !mostrarSegundo)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-0 focus:outline-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value={0}>
                  {index === 0 ? "Selecciona un método..." : "No usar segundo método"}
                </option>
                {disponibles.map((metodo) => (
                  <option key={metodo.metodo_pago_id} value={metodo.metodo_pago_id}>
                    {metodo.nombre}
                  </option>
                ))}
              </select>

              {/* Monto - mostrar solo si hay método seleccionado */}
              {mostrarMonto && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                      Monto
                    </label>
                    <div className="relative flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <input
                        type="number"
                        value={pago.monto || ""}
                        onChange={(e) => handleMontoChange(index, e.target.value)}
                        onWheel={handleMontoWheel}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        disabled={disabled}
                        className="flex-1 px-2 py-2 bg-background border border-border rounded text-foreground text-sm focus:border-accent focus:ring-0 focus:outline-none transition-colors disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Resumen de pagos */}
      <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pagado:</span>
          <span className="font-medium text-foreground">{formatCurrency(totalPagado)}</span>
        </div>

        {!soloUnMetodo && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Diferencia:</span>
            <span className={`font-medium ${Math.abs(diferencia) < 0.01 ? "text-green-600" : "text-amber-600"}`}>
              {Math.abs(diferencia) < 0.01 ? "✓ Exacto" : formatCurrency(diferencia)}
            </span>
          </div>
        )}

        {/* Desglose de métodos */}
        {!soloUnMetodo && pagos.some(p => p.metodo_pago_id > 0) && (
          <div className="border-t border-border pt-2 mt-2 space-y-1">
            {pagos.map((pago, index) => {
              if (pago.metodo_pago_id === 0) return null
              const metodo = metodosPago.find(m => m.metodo_pago_id === pago.metodo_pago_id)
              return (
                <div key={index} className="flex justify-between text-xs text-muted-foreground">
                  <span>{metodo?.nombre}:</span>
                  <span>{formatCurrency(pago.monto)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Notificación de estado */}
      <div className={`flex items-start gap-2 p-3 rounded-lg border ${
        esValido 
          ? "bg-green-500/10 border-green-500/20 text-green-700"
          : "bg-amber-500/10 border-amber-500/20 text-amber-700"
      }`}>
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p className="text-xs font-medium">{notificacion}</p>
      </div>

      {/* Validación */}
      {!esValido && (
        <div className="text-xs text-destructive">
          {pagos.filter(p => p.metodo_pago_id > 0).length === 0 
            ? "Debe seleccionar al menos un método de pago"
            : `Monto incorrecto (diferencia: ${formatCurrency(Math.abs(diferencia))})`
          }
        </div>
      )}
    </div>
  )
}
