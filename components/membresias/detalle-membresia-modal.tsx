"use client"

import { 
  X, CreditCard, Calendar, Tag, Clock, FileText, 
  Sparkles, CalendarDays, Users, Hash, DollarSign,
  TrendingUp, Zap, Award, Gift
} from "lucide-react"
import type { Membresia } from "@/lib/types/membresias"

function getDuracionTexto(cantidad: number, unidad: string): string {
  const textos: Record<string, string> = {
    'dia': cantidad === 1 ? 'Diaria' : 'Diaria',
    'semana': cantidad === 1 ? 'Semanal' : 'Semanal',
    'mes': cantidad === 1 ? 'Mensual' : 'Mensual',
    'año': cantidad === 1 ? 'Anual' : 'Anual',
  }
  return textos[unidad] || `${cantidad} ${unidad}`
}

function getCategoria(cantidad: number, unidad: string): string {
  const textos: Record<string, string> = {
    'dia': 'Diaria',
    'semana': 'Semanal',
    'mes': 'Mensual',
    'año': 'Anual',
  }
  return textos[unidad] || 'Personalizada'
}

function getIconoTipo(cantidad: number, unidad: string) {
  if (unidad === 'dia') return Zap
  if (unidad === 'semana') return CalendarDays
  if (unidad === 'mes') return Calendar
  if (unidad === 'año') return Award
  return CreditCard
}

function getDescuento(membresia: Membresia): number | null {
  if (!membresia.esOferta || !membresia.precioOferta) return null
  return Math.round(((membresia.precioBase - membresia.precioOferta) / membresia.precioBase) * 100)
}

interface DetalleMembresiaMoalProps {
  open: boolean
  onClose: () => void
  membresia: Membresia | null
  onEditar?: (m: Membresia) => void
}

export function DetalleMembresiaMoal({ open, onClose, membresia, onEditar }: DetalleMembresiaMoalProps) {
  if (!open || !membresia) return null

  const m = membresia
  const descuento = getDescuento(m)
  const IconoTipo = getIconoTipo(m.duracionCantidad, m.duracionUnidad)
  const categoria = getCategoria(m.duracionCantidad, m.duracionUnidad)
  
  // Datos simulados de socios activos (en producción vendrían del backend)
  const sociosActivos = 0 // Por ahora en 0, se actualizará cuando tengamos la data real
  const ingresosEstimados = sociosActivos * (m.esOferta && m.precioOferta ? m.precioOferta : m.precioBase)
  const promedioPorSocio = sociosActivos > 0 ? ingresosEstimados / sociosActivos : 0

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
        {/* Header Dinámico */}
        <div
          className="relative px-6 py-5 border-b border-border/30 overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(13,18,36,0.90), rgba(12,15,28,0.50))" }}
        >
          {/* Efectos de fondo  */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              background: m.esOferta 
                ? "radial-gradient(circle at top right, #FF3B3B, transparent 70%)"
                : "radial-gradient(circle at top right, var(--accent), transparent 70%)"
            }}
          />
          
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: m.esOferta 
                      ? "linear-gradient(135deg, #FF3B3B, #FF6B6B)"
                      : "linear-gradient(135deg, var(--accent), rgba(0,191,255,0.6))",
                    boxShadow: m.esOferta 
                      ? "0 4px 16px rgba(255,59,59,0.4)"
                      : "0 4px 16px rgba(0,191,255,0.3)"
                  }}
                >
                  {m.esOferta ? (
                    <Gift className="h-5 w-5 text-white" />
                  ) : (
                    <IconoTipo className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-foreground leading-tight">
                    {m.nombre}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.esOferta ? "Membresía en Promoción Especial" : "Membresía Regular"}
                  </p>
                </div>
              </div>

              {/* Badges de Estado */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Estado Activo/Inactivo */}
                <span
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 ${
                    m.estado === 'activo'
                      ? "bg-success/20 text-success border border-success/40"
                      : "bg-muted/50 text-muted-foreground border border-border"
                  }`}
                  style={{
                    boxShadow: m.estado === 'activo' ? "0 0 12px rgba(34,197,94,0.25)" : "none"
                  }}
                >
                  {m.estado === 'activo' ? "✅ ACTIVA" : "❌ INACTIVA"}
                </span>

                {/* Badge de Oferta con Descuento */}
                {m.esOferta && descuento !== null && (
                  <span
                    className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full text-white flex items-center gap-1.5"
                    style={{
                      background: "linear-gradient(135deg, #FF3B3B, #FF6B6B)",
                      boxShadow: "0 4px 16px rgba(255,59,59,0.4)",
                    }}
                  >
                    🏷️ AHORRA {descuento}%
                  </span>
                )}

                {/* Badge de Categoría */}
                <span
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-accent/15 text-accent border border-accent/30 flex items-center gap-1.5"
                >
                  📅 {categoria}
                </span>
              </div>
            </div>

            {/* Botón de Cierre */}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl border border-border/30 bg-card/20 text-muted-foreground hover:bg-card/50 hover:text-foreground transition-all flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Sección de Precio Destacada */}
          <div
            className="p-5 rounded-2xl relative overflow-hidden"
            style={{ 
              background: "linear-gradient(135deg, rgba(21,25,38,0.82), rgba(15,18,30,0.72))", 
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
            }}
          >
            {/* Efecto de brillo */}
            <div 
              className="absolute top-0 right-0 w-32 h-32 opacity-20"
              style={{
                background: "radial-gradient(circle, var(--accent), transparent 70%)",
                filter: "blur(40px)"
              }}
            />
            
            <div className="relative">
              <div className="flex items-baseline gap-3 mb-2">
                <span
                  className="text-4xl font-black"
                  style={{ 
                    color: m.esOferta && m.precioOferta ? "#FF3B3B" : "var(--accent)",
                    textShadow: m.esOferta && m.precioOferta 
                      ? "0 0 16px rgba(255,59,59,0.35)" 
                      : "0 0 16px rgba(0,191,255,0.35)"
                  }}
                >
                  ${(m.esOferta && m.precioOferta ? m.precioOferta : m.precioBase).toLocaleString()}
                </span>
                
                {/* Precio original tachado si es oferta */}
                {m.esOferta && m.precioOferta && (
                  <div className="flex flex-col">
                    <span className="text-lg text-muted-foreground line-through opacity-60">
                      ${m.precioBase.toLocaleString()}
                    </span>
                    {descuento !== null && (
                      <span 
                        className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary mt-1 inline-block"
                      >
                        AHORRA ${(m.precioBase - m.precioOferta).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent/70" />
                Duración: <span className="font-semibold text-foreground">{getDuracionTexto(m.duracionCantidad, m.duracionUnidad)}</span>
              </p>

              {/* Fecha de vencimiento de oferta */}
              {m.esOferta && m.fechaFinOferta && (
                <div 
                  className="mt-3 pt-3 border-t border-border/20 flex items-center gap-2 text-xs"
                >
                  <Tag className="h-4 w-4 text-warning flex-shrink-0" />
                  <span className="text-warning font-semibold">
                    Oferta válida hasta {new Date(m.fechaFinOferta).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Grid de Información (3 Cards) */}
          <div className="grid grid-cols-3 gap-3">
            <InfoCard
              icon={<Users className="h-5 w-5" />}
              iconColor="text-success"
              iconBg="bg-success/15"
              label="Socios Activos"
              value={sociosActivos.toString()}
            />
            <InfoCard
              icon={<Calendar className="h-5 w-5" />}
              iconColor="text-accent"
              iconBg="bg-accent/15"
              label="Fecha de Creación"
              value={m.createdAt 
                ? new Date(m.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
                : "N/A"
              }
            />
            <InfoCard
              icon={<Hash className="h-5 w-5" />}
              iconColor="text-warning"
              iconBg="bg-warning/15"
              label="ID de Membresía"
              value={`#${m.id}`}
            />
          </div>

          {/* Descripción Completa */}
          {m.descripcion && (
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(21,25,38,0.72)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Descripción
                </span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">{m.descripcion}</p>
            </div>
          )}

          {/* Configuración Técnica */}
          <div
            className="p-4 rounded-2xl"
            style={{ background: "rgba(21,25,38,0.72)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Configuración Técnica
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                  Duración
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {m.duracionCantidad} {m.duracionUnidad}
                  {m.duracionCantidad > 1 && m.duracionUnidad !== 'mes' ? 's' : ''}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                  Categoría
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {categoria}
                </p>
              </div>
            </div>
          </div>

          {/* Estadísticas (si hay socios activos) */}
          {sociosActivos > 0 && (
            <div
              className="p-4 rounded-2xl"
              style={{ 
                background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(21,25,38,0.72))", 
                border: "1px solid rgba(34,197,94,0.2)" 
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-xs font-bold uppercase tracking-wider text-success">
                  Estadísticas de Ingresos
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                    💰 Ingresos Estimados
                  </p>
                  <p className="text-lg font-bold text-success">
                    ${ingresosEstimados.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                    📊 Promedio por Socio
                  </p>
                  <p className="text-lg font-bold text-accent">
                    ${promedioPorSocio.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con Acciones */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t border-border/30"
          style={{ background: "rgba(14,16,25,0.95)" }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all rounded-xl border border-border/30 hover:border-border hover:bg-card/30"
          >
            Cerrar
          </button>
          
          {onEditar && (
            <button
              onClick={() => {
                onEditar(m)
                onClose()
              }}
              className="px-6 py-2.5 text-sm font-bold text-primary-foreground transition-all rounded-xl flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, var(--accent), rgba(0,191,255,0.8))",
                boxShadow: "0 4px 16px rgba(0,191,255,0.3)",
              }}
            >
              <Sparkles className="h-4 w-4" />
              EDITAR MEMBRESÍA
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente InfoCard mejorado
function InfoCard({ 
  icon, 
  iconColor, 
  iconBg, 
  label, 
  value 
}: { 
  icon: React.ReactNode
  iconColor: string
  iconBg: string
  label: string
  value: string 
}) {
  return (
    <div
      className="p-3 rounded-xl"
      style={{ background: "rgba(21,25,38,0.72)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
        {label}
      </p>
      <p className="text-sm font-bold text-foreground truncate">
        {value}
      </p>
    </div>
  )
}
