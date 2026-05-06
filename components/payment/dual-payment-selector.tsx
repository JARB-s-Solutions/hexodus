"use client"

import { useState, useMemo } from "react"
import { CreditCard, AlertCircle, CheckCircle2 } from "lucide-react"
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
  // Estados: modo simple (un método) vs multipago (dos métodos)
  const [enableMultiple, setEnableMultiple] = useState(false)
  const [pagos, setPagos] = useState<PagoSplitRequest[]>([
    { metodo_pago_id: 0, monto: total }, // En modo simple, el monto ya está al 100%
    { metodo_pago_id: 0, monto: 0 }
  ])

  // Calcular totales
  const totalPagado = useMemo(() => {
    // Solo sumar montos de métodos realmente seleccionados (metodo_pago_id > 0)
    return pagos.reduce((sum, pago) => pago.metodo_pago_id > 0 ? sum + pago.monto : sum, 0)
  }, [pagos])

  const diferencia = useMemo(() => {
    return total - totalPagado
  }, [total, totalPagado])

  const esValido = useMemo(() => {
    // En modo simple: solo requiere método seleccionado
    if (!enableMultiple) {
      return pagos[0].metodo_pago_id > 0 && pagos[0].monto === total
    }

    // En modo múltiple: requiere al menos un método y suma exacta
    const conMetodo = pagos.filter(p => p.metodo_pago_id > 0)
    if (conMetodo.length === 0) return false
    return Math.abs(diferencia) < 0.01 && totalPagado > 0
  }, [pagos, total, diferencia, enableMultiple])

  // Mensaje de estado
  const notificacion = useMemo(() => {
    if (!enableMultiple) {
      if (pagos[0].metodo_pago_id === 0) return "Selecciona un método de pago"
      return "✓ Listo para procesar"
    }

    // Modo múltiple
    const conMetodo = pagos.filter(p => p.metodo_pago_id > 0)
    if (conMetodo.length === 0) return "Selecciona al menos un método de pago"
    if (totalPagado === 0) return "Ingresa montos a pagar"
    if (Math.abs(diferencia) > 0.01) {
      return diferencia > 0 
        ? `Faltan $${Math.abs(diferencia).toFixed(2)}`
        : `Sobra $${Math.abs(diferencia).toFixed(2)}`
    }
    return "✓ Pagos listos"
  }, [pagos, total, diferencia, enableMultiple])

  // Manejo de cambio de modo
  const handleToggleMultiple = (newValue: boolean) => {
    setEnableMultiple(newValue)
    
    if (newValue) {
      // Cambiar a modo múltiple: dividir el total entre los dos
      // Pero NO asignar monto al segundo si no está seleccionado
      setPagos([
        { metodo_pago_id: pagos[0].metodo_pago_id, monto: pagos[0].metodo_pago_id > 0 ? total / 2 : 0 },
        { metodo_pago_id: 0, monto: 0 } // No asignar monto si no hay método seleccionado
      ])
    } else {
      // Cambiar a modo simple: usar el monto del primer método al 100%
      setPagos([
        { metodo_pago_id: pagos[0].metodo_pago_id, monto: total },
        { metodo_pago_id: 0, monto: 0 }
      ])
    }
  }

  const handleMetodoChange = (index: number, newMetodoId: number) => {
    const newPagos = [...pagos]
    newPagos[index].metodo_pago_id = newMetodoId

    // Si se selecciona el mismo método en ambos, limpiar el segundo
    if (
      newPagos[0].metodo_pago_id > 0 &&
      newPagos[1].metodo_pago_id > 0 &&
      newPagos[0].metodo_pago_id === newPagos[1].metodo_pago_id
    ) {
      if (index === 0) {
        newPagos[1].metodo_pago_id = 0
        newPagos[1].monto = 0 // Limpiar monto del segundo si se duplica
      }
    }

    // En modo simple: asegurar que el monto es el 100% del total
    if (!enableMultiple && index === 0) {
      newPagos[0].monto = total
    }

    // En modo múltiple: si se selecciona el segundo método y no tiene monto,
    // asignar automáticamente el monto restante
    if (enableMultiple && index === 1 && newMetodoId > 0 && newPagos[1].monto === 0) {
      newPagos[1].monto = Math.max(0, total - newPagos[0].monto)
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
    // Calcular el monto restante sumando solo métodos que están realmente seleccionados
    const montoOtros = pagos.reduce((sum, p, i) => {
      if (i === index) return sum // Ignorar el método actual
      if (p.metodo_pago_id === 0) return sum // Ignorar métodos no seleccionados
      return sum + p.monto
    }, 0)
    newPagos[index].monto = Math.max(0, total - montoOtros)
    setPagos(newPagos)
    onPagosChange(newPagos.filter(p => p.metodo_pago_id > 0))
  }

  // Métodos disponibles
  const metodosDisponibles = (index: number) => {
    const seleccionados = pagos.map((p, i) => i !== index ? p.metodo_pago_id : 0).filter(id => id > 0)
    return metodosPago.filter(m => !seleccionados.includes(m.metodo_pago_id))
  }

  if (soloUnMetodo) {
    // Modo backward compatibility (sin cambios)
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

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Método de Pago</label>
          <select
            value={pagos[0].metodo_pago_id}
            onChange={(e) => handleMetodoChange(0, parseInt(e.target.value))}
            disabled={disabled}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-0 focus:outline-none transition-colors cursor-pointer disabled:opacity-50"
          >
            <option value={0}>Selecciona un método...</option>
            {metodosPago.map((metodo) => (
              <option key={metodo.metodo_pago_id} value={metodo.metodo_pago_id}>
                {metodo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className={`flex items-start gap-2 p-3 rounded-lg border ${
          esValido 
            ? "bg-green-500/10 border-green-500/20 text-green-700"
            : "bg-amber-500/10 border-amber-500/20 text-amber-700"
        }`}>
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-medium">{notificacion}</p>
        </div>
      </div>
    )
  }

  // MODO DINÁMICO: Simple vs Múltiple
  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* MODO SIMPLE: Un solo método */}
      {!enableMultiple && (
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Método de Pago</label>
          <select
            value={pagos[0].metodo_pago_id}
            onChange={(e) => handleMetodoChange(0, parseInt(e.target.value))}
            disabled={disabled}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-0 focus:outline-none transition-colors cursor-pointer disabled:opacity-50"
          >
            <option value={0}>Selecciona un método...</option>
            {metodosPago.map((metodo) => (
              <option key={metodo.metodo_pago_id} value={metodo.metodo_pago_id}>
                {metodo.nombre}
              </option>
            ))}
          </select>

          {/* Resumen en modo simple */}
          {pagos[0].metodo_pago_id > 0 && (
            <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monto:</span>
                <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{metodosPago.find(m => m.metodo_pago_id === pagos[0].metodo_pago_id)?.nombre}:</span>
                <span className="font-medium text-foreground">{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checkbox: Habilitar multipagos */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
        <input
          type="checkbox"
          id="enable-multiple"
          checked={enableMultiple}
          onChange={(e) => handleToggleMultiple(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 cursor-pointer"
        />
        <label htmlFor="enable-multiple" className="text-sm font-medium text-foreground cursor-pointer flex-1">
          Habilitar múltiples métodos de pago
        </label>
      </div>

      {/* MODO MÚLTIPLE: Dos métodos */}
      {enableMultiple && (
        <div className="space-y-4">
          {/* Grid de métodos */}
          <div className="grid grid-cols-2 gap-4">
            {pagos.map((pago, index) => {
              const disponibles = metodosDisponibles(index)
              const mostrarMonto = pago.metodo_pago_id > 0
              const mostrarSegundo = pagos[0].metodo_pago_id > 0

              return (
                <div key={index} className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Método {index + 1}
                    {index > 0 && <span className="text-muted-foreground ml-1">(Opcional)</span>}
                  </label>

                  <select
                    value={pago.metodo_pago_id}
                    onChange={(e) => handleMetodoChange(index, parseInt(e.target.value))}
                    disabled={disabled || (index > 0 && !mostrarSegundo)}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-0 focus:outline-none transition-colors cursor-pointer disabled:opacity-50"
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

                  {/* Monto */}
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
                            className="flex-1 px-2 py-2 bg-background border border-border rounded text-foreground text-sm focus:border-accent focus:ring-0 focus:outline-none transition-colors disabled:opacity-50 w-3"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Resumen en modo múltiple */}
          <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pagado:</span>
              <span className="font-medium text-foreground">{formatCurrency(totalPagado)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Diferencia:</span>
              <span className={`font-medium ${Math.abs(diferencia) < 0.01 ? "text-green-600" : "text-amber-600"}`}>
                {Math.abs(diferencia) < 0.01 ? "✓ Exacto" : formatCurrency(diferencia)}
              </span>
            </div>

            {/* Desglose de métodos */}
            {pagos.some(p => p.metodo_pago_id > 0) && (
              <div className="border-t border-border pt-2 mt-2 space-y-1">
                {pagos.map((pago, index) => {
                  if (pago.metodo_pago_id === 0) return null
                  const metodo = metodosPago.find(m => m.metodo_pago_id === pago.metodo_pago_id)
                  return (
                    <div key={index} className="flex justify-between text-xs text-muted-foreground">
                      <span>{metodo?.nombre}:</span>
                      <span className="font-medium">{formatCurrency(pago.monto)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notificación de estado */}
      <div className={`flex items-start gap-2 p-3 rounded-lg border ${
        esValido 
          ? "bg-green-500/10 border-green-500/20 text-green-700"
          : "bg-amber-500/10 border-amber-500/20 text-amber-700"
      }`}>
        {esValido ? (
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        )}
        <p className="text-xs font-medium">{notificacion}</p>
      </div>

      {/* Validación */}
      {!esValido && (
        <div className="text-xs text-destructive">
          {!enableMultiple && pagos[0].metodo_pago_id === 0
            ? "Selecciona un método de pago"
            : enableMultiple && pagos.filter(p => p.metodo_pago_id > 0).length === 0
            ? "Selecciona al menos un método de pago"
            : `Monto incorrecto (diferencia: ${formatCurrency(Math.abs(diferencia))})`
          }
        </div>
      )}
    </div>
  )
}
