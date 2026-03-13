"use client"

import { useState, useRef, useEffect } from "react"
import { Unlock, DollarSign, Loader2, AlertTriangle, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCaja } from "@/lib/contexts/caja-context"
import { useToast } from "@/hooks/use-toast"
import { CajaService } from "@/lib/services/caja"
import { AuthService } from "@/lib/auth"
import { ModalCierreCaja } from "./modal-cierre-caja"
import { ModalCierreAutomatico } from "./modal-cierre-automatico"

interface ModalAperturaCajaProps {
  open: boolean
  onSuccess: () => void
}

export function ModalAperturaCaja({ open, onSuccess }: ModalAperturaCajaProps) {
  const [montoInicial, setMontoInicial] = useState("")
  const [loading, setLoading] = useState(false)
  const [showModalCierre, setShowModalCierre] = useState(false)
  const [showModalCierreAutomatico, setShowModalCierreAutomatico] = useState(false)
  const [cajaAntigua, setCajaAntigua] = useState<{
    monto_inicial: number
    monto_actual: number
    fecha_apertura: string | null
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { abrirCaja, refrescarEstado } = useCaja()
  const { toast } = useToast()

  // Focus en el input al abrir
  useEffect(() => {
    if (open && !showModalCierre && !showModalCierreAutomatico && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, showModalCierre, showModalCierreAutomatico])

  // CRÍTICO: Verificar si hay caja antigua al abrir el modal
  useEffect(() => {
    if (open && !showModalCierre && !showModalCierreAutomatico) {
      console.log("🔍 Modal de apertura abierto, verificando caja antigua...")
      verificarCajaAntigua()
    }
  }, [open])

  const verificarCajaAntigua = async () => {
    try {
      console.log("🔍 Verificando si hay caja antigua abierta...")
      // IMPORTANTE: Usar consultarCajaAmplio() para buscar en los últimos 7 días
      const response = await CajaService.consultarCajaAmplio()
      
      console.log("📝 Movimientos recibidos:", response.movimientos.length)
      response.movimientos.forEach((mov, idx) => {
        console.log(`  ${idx + 1}. ${mov.concepto} - ${mov.tipo} - $${mov.monto}`)
      })
      
      // Buscar movimiento de apertura (búsqueda flexible)
      const movApertura = response.movimientos.find((mov) => {
        const conceptoNormalizado = mov.concepto.toLowerCase().trim()
        const esApertura = 
          conceptoNormalizado.includes("apertura") || 
          conceptoNormalizado.includes("fondo de caja")
        const esIngreso = mov.tipo === "ingreso"
        return esApertura && esIngreso
      })
      
      if (movApertura) {
        console.log("⚠️ Detectada caja abierta:", response.resumen)
        console.log("   Movimiento de apertura:", movApertura)
        
        // Verificar si es antigua (más de 12 horas)
        const fechaApertura = new Date(movApertura.fecha)
        const ahora = new Date()
        const diffHoras = (ahora.getTime() - fechaApertura.getTime()) / (1000 * 60 * 60)
        
        console.log(`   📅 Tiempo desde apertura: ${diffHoras.toFixed(1)} horas`)
        
        setCajaAntigua({
          monto_inicial: response.resumen.efectivo_inicial,
          monto_actual: response.resumen.efectivo_final,
          fecha_apertura: movApertura.fecha,
        })
        
        if (diffHoras > 12) {
          // Caja antigua (más de 12 horas) - Mostrar modal de cierre automático
          console.log(`🤖 Caja antigua detectada (>${diffHoras.toFixed(0)}h) - Cierre automático disponible`)
          
          setShowModalCierreAutomatico(true)
        } else {
          // Caja del mismo día - Mostrar modal de cierre manual
          console.log("📝 Caja del mismo día (<12h) - Cierre manual requerido")
          
          setShowModalCierre(true)
        }
        
        return true
      }
      
      console.log("✅ No hay caja antigua, se puede abrir")
      return false
    } catch (error) {
      console.error("Error al verificar caja antigua:", error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const monto = parseFloat(montoInicial)

    // Validaciones
    if (isNaN(monto) || monto <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un monto válido mayor a 0",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      console.log("💰 Abriendo caja con monto:", monto)
      await abrirCaja(monto)

      toast({
        title: "✅ Caja Abierta",
        description: `Caja iniciada con $${monto.toFixed(2)}`,
      })

      // Limpiar form
      setMontoInicial("")
      onSuccess()
    } catch (error: any) {
      console.error("Error al abrir caja:", error)
      
      // Detectar error específico de caja ya abierta
      if (
        error.message?.includes("Ya hay una caja abierta") ||
        error.message?.includes("Ya existe un turno")
      ) {
        console.log("🔄 Redirigiendo a cierre de caja antigua...")
        await verificarCajaAntigua()
      } else {
        toast({
          title: "Error al abrir caja",
          description: error.message || "No se pudo abrir la caja. Intenta nuevamente.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCierreSuccess = async () => {
    console.log("✅ Caja antigua cerrada, recargando estado...")
    setShowModalCierre(false)
    setCajaAntigua(null)
    
    // Refrescar estado del contexto
    await refrescarEstado()
    
    toast({
      title: "✅ Listo para abrir caja",
      description: "Ahora puedes abrir una nueva caja",
    })
    
    // Focus en el input de apertura
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  const handleCierreAutomaticoSuccess = async () => {
    console.log("✅ Caja antigua cerrada automáticamente, limpiando estado...")
    setShowModalCierreAutomatico(false)
    setCajaAntigua(null)
    
    // Refrescar estado para detectar que ya no hay caja antigua
    await refrescarEstado()
    
    toast({
      title: "✅ Listo para Abrir Caja",
      description: "Ahora puedes abrir una nueva caja para el día de hoy",
    })
    
    // Focus en el input de apertura
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  const handleCierreCancel = () => {
    setShowModalCierre(false)
    // Note: No permitimos cancelar el flujo completamente,
    // ya que el usuario DEBE cerrar la caja antigua para continuar
    toast({
      title: "Acción requerida",
      description: "Debes cerrar la caja anterior para poder abrir una nueva",
      variant: "destructive",
    })
  }

  const handleLogout = async () => {
    if (confirm("¿Estás seguro de que deseas cerrar sesión? Deberás abrir la caja la próxima vez que inicies sesión.")) {
      await AuthService.logout()
      router.push("/login")
    }
  }

  if (!open) return null

  // Si hay modal de cierre automático, mostrar ese con prioridad
  if (showModalCierreAutomatico && cajaAntigua && cajaAntigua.fecha_apertura) {
    return (
      <ModalCierreAutomatico
        open={showModalCierreAutomatico}
        cajaAntigua={{
          monto_inicial: cajaAntigua.monto_inicial,
          monto_actual: cajaAntigua.monto_actual,
          fecha_apertura: cajaAntigua.fecha_apertura,
        }}
        onSuccess={handleCierreAutomaticoSuccess}
        onCancel={() => {
          setShowModalCierreAutomatico(false)
          toast({
            title: "⚠️ Acción requerida",
            description: "Debes cerrar la caja anterior para continuar",
            variant: "destructive",
          })
        }}
      />
    )
  }

  // Si hay modal de cierre manual, mostrar ese
  if (showModalCierre && cajaAntigua) {
    return (
      <ModalCierreCaja
        open={showModalCierre}
        onSuccess={handleCierreSuccess}
        onCancel={handleCierreCancel}
        estadoCajaActual={cajaAntigua}
      />
    )
  }

  return (
    <div
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.stopPropagation()} // Evitar cerrar modal
    >
      <div
        className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md transform transition-all"
        style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
      >
        {/* Header con gradiente */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20" />
          <div className="relative px-6 py-6 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Unlock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Apertura de Caja</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Registra el monto inicial para comenzar
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 space-y-6">
            {/* Info box */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                🎯 <strong className="text-foreground">Importante:</strong> Verifica que el monto
                coincida con el efectivo disponible en caja antes de continuar.
              </p>
            </div>

            {/* Monto Inicial */}
            <div className="space-y-2">
              <label htmlFor="monto" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" />
                Monto Inicial *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                  $
                </span>
                <input
                  ref={inputRef}
                  id="monto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 bg-background border-2 border-input rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                           text-lg font-semibold text-foreground placeholder:text-muted-foreground/50
                           transition-all"
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ingresa el efectivo disponible al inicio del turno
              </p>
            </div>

            {/* Preview */}
            {montoInicial && parseFloat(montoInicial) > 0 && (
              <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Monto a registrar:</span>
                  <span className="text-xl font-bold text-success">
                    ${parseFloat(montoInicial).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-muted/30 border-t border-border space-y-3">
            <button
              type="submit"
              disabled={loading || !montoInicial || parseFloat(montoInicial) <= 0}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg 
                       hover:bg-primary/90 transition-all flex items-center justify-center gap-2 
                       font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed
                       transform active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Abriendo caja...
                </>
              ) : (
                <>
                  <Unlock className="h-5 w-5" />
                  Abrir Caja
                </>
              )}
            </button>
            
            {/* Botón de escape: Cerrar Sesión */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="w-full px-4 py-2 bg-muted text-muted-foreground rounded-lg 
                       hover:bg-destructive/10 hover:text-destructive transition-all 
                       flex items-center justify-center gap-2 text-sm
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
            
            <p className="text-xs text-center text-muted-foreground">
              No podrás acceder al sistema hasta abrir la caja
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
