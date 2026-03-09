"use client"

import { useEffect, useState } from "react"
import { X, User, ScanFace, Fingerprint, Loader2, Mail, Phone, Calendar, CreditCard, FileCheck, IdCard } from "lucide-react"
import type { Socio } from "@/lib/types/socios"
import { SociosService } from "@/lib/services/socios"
import { toast } from "@/hooks/use-toast"
import { getIniciales } from "@/lib/utils"
import { SocioAvatar } from "@/components/socios/socio-avatar"

interface DetalleSocioModalProps {
  socioId: number | null
  open: boolean
  onClose: () => void
}

export function DetalleSocioModal({ socioId, open, onClose }: DetalleSocioModalProps) {
  const [socio, setSocio] = useState<Socio | null>(null)
  const [cargando, setCargando] = useState(false)

  // Cargar datos completos del socio cuando se abre el modal
  useEffect(() => {
    if (!open || !socioId) {
      setSocio(null)
      return
    }

    const cargarSocio = async () => {
      setCargando(true)
      try {
        console.log(`🔍 Cargando socio con ID: ${socioId}`)
        const data = await SociosService.getById(socioId)
        console.log('✅ Socio cargado:', data)
        setSocio(data)
      } catch (error: any) {
        console.error('❌ Error cargando socio:', error)
        toast({
          title: "Error",
          description: error.message || "No se pudo cargar la información del socio",
          variant: "destructive",
        })
        onClose() // Cerrar el modal si hay error
      } finally {
        setCargando(false)
      }
    }

    cargarSocio()
  }, [open, socioId, onClose])

  if (!open) return null

  // Formatear fechas SIN problema de zona horaria
  const formatFecha = (fecha: string | undefined) => {
    if (!fecha) return "-"
    
    // Extraer solo la parte de la fecha (YYYY-MM-DD) ignorando la hora y zona horaria
    const fechaSolo = fecha.split('T')[0]
    const [year, month, day] = fechaSolo.split('-').map(Number)
    
    // Crear fecha usando los componentes directamente (sin conversión de zona horaria)
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", 
                   "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    
    return `${day} de ${meses[month - 1]} de ${year}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 pb-20 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-4xl my-4 rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: "linear-gradient(180deg, rgba(22,24,36,0.97), rgba(18,20,32,0.95))",
          border: "1px solid rgba(255,255,255,0.09)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <User className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Detalle del Socio</h3>
              <p className="text-xs text-muted-foreground">Información completa del socio</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground transition p-2 hover:bg-muted/50 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading state */}
          {cargando && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Cargando información del socio...</p>
            </div>
          )}

          {/* Socio data */}
          {!cargando && socio && (() => {
            // Mapear género a texto completo
            let generoLabel = "Otro"
            if (socio.genero === 'Masculino') generoLabel = 'Masculino'
            else if (socio.genero === 'Femenino') generoLabel = 'Femenino'
            
            // Determinar estados con colores
            const vigenciaActiva = socio.vigenciaMembresia?.toLowerCase().includes('vigente')
            const contratoFirmado = socio.firmoContrato
            const contratoVigente = socio.estadoContrato?.toLowerCase().includes('vigente')
            const estadoPago = socio.estadoPago || 'sin_pagar'
            const pagoLabel = estadoPago === 'pagado'
              ? 'Pagado'
              : estadoPago === 'sin_pagar'
              ? 'Sin pagar'
              : 'Pendiente'

            return (
              <div className="space-y-4">
                {/* Sección de Header con Avatar y Datos Principales */}
                <div 
                  className="p-5 rounded-xl border border-border/30"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <div className="flex items-center gap-5">
                    {/* Avatar con componente reutilizable */}
                    <SocioAvatar 
                      nombre={socio.nombre}
                      fotoPerfil={socio.fotoPerfil}
                      size="xl"
                      variant="default"
                      className="rounded-xl border-2 border-accent/30"
                    />
                    
                    {/* Info Principal */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-xl font-bold text-foreground">{socio.nombre}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {generoLabel}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <IdCard className="h-4 w-4" />
                          <span className="font-mono">{socio.codigoSocio}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{socio.correo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{socio.telefono}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Fecha de Registro */}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Fecha de Registro</p>
                      <p className="text-sm font-medium text-foreground">{formatFecha(socio.fechaRegistro)}</p>
                    </div>
                  </div>
                </div>

                {/* Grid de 2 Columnas - Secciones Principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* ===== SECCIÓN: MEMBRESÍA ===== */}
                  <div 
                    className="p-5 rounded-xl border border-border/30"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-lg bg-blue-500/10">
                        <CreditCard className="h-4 w-4 text-blue-400" />
                      </div>
                      <h5 className="text-sm font-bold uppercase tracking-wider text-foreground">Membresía</h5>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Plan */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Plan</p>
                        <p className="text-base font-semibold text-foreground">{socio.nombrePlan || "-"}</p>
                      </div>
                      
                      {/* Estado de Vigencia */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Vigencia</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                          vigenciaActiva 
                            ? "bg-green-500/15 text-green-400 border border-green-500/30" 
                            : "bg-red-500/15 text-red-400 border border-red-500/30"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${vigenciaActiva ? "bg-green-400" : "bg-red-400"}`}></span>
                          {socio.vigenciaMembresia || "Sin información"}
                        </span>
                      </div>

                      {/* Estado de Pago */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Pago</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                          estadoPago === 'pagado'
                            ? "bg-green-500/15 text-green-400 border border-green-500/30"
                            : estadoPago === 'sin_pagar'
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            estadoPago === 'pagado'
                              ? "bg-green-400"
                              : estadoPago === 'sin_pagar'
                              ? "bg-amber-400"
                              : "bg-yellow-400"
                          }`}></span>
                          {pagoLabel}
                        </span>
                      </div>
                      
                      {/* Fechas */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Inicio</p>
                          <p className="text-xs font-medium text-foreground">{formatFecha(socio.fechaInicioMembresia)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Vencimiento</p>
                          <p className="text-xs font-medium text-foreground">{formatFecha(socio.fechaVencimientoMembresia)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ===== SECCIÓN: CONTRATO ===== */}
                  <div 
                    className="p-5 rounded-xl border border-border/30"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-lg bg-purple-500/10">
                        <FileCheck className="h-4 w-4 text-purple-400" />
                      </div>
                      <h5 className="text-sm font-bold uppercase tracking-wider text-foreground">Contrato</h5>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Estado de Firma */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Firma</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                          contratoFirmado 
                            ? "bg-green-500/15 text-green-400 border border-green-500/30" 
                            : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${contratoFirmado ? "bg-green-400" : "bg-yellow-400"}`}></span>
                          {contratoFirmado ? "Firmado" : "Pendiente"}
                        </span>
                      </div>
                      
                      {/* Estado del Contrato */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Estado</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                          contratoVigente 
                            ? "bg-green-500/15 text-green-400 border border-green-500/30" 
                            : "bg-gray-500/15 text-gray-400 border border-gray-500/30"
                        }`}>
                          {socio.estadoContrato || "Sin información"}
                        </span>
                      </div>
                      
                      {/* Fechas */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Inicio</p>
                          <p className="text-xs font-medium text-foreground">{formatFecha(socio.inicioContrato)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Fin</p>
                          <p className="text-xs font-medium text-foreground">{formatFecha(socio.finContrato)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== SECCIÓN: BIOMETRÍA (Ancho Completo) ===== */}
                <div 
                  className="p-5 rounded-xl border border-border/30"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10">
                      <ScanFace className="h-4 w-4 text-cyan-400" />
                    </div>
                    <h5 className="text-sm font-bold uppercase tracking-wider text-foreground">Datos Biométricos</h5>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Rostro */}
                    <div 
                      className={`p-4 rounded-lg border ${
                        socio.bioRostro 
                          ? "bg-green-500/5 border-green-500/30" 
                          : "bg-muted/30 border-border/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${socio.bioRostro ? "bg-green-500/15" : "bg-muted"}`}>
                            <ScanFace className={`h-5 w-5 ${socio.bioRostro ? "text-green-400" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">Reconocimiento Facial</p>
                            <p className="text-xs text-muted-foreground">Biometría de rostro</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          socio.bioRostro 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {socio.bioRostro ? "Registrado" : "No Registrado"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Huella */}
                    <div 
                      className={`p-4 rounded-lg border ${
                        socio.bioHuella 
                          ? "bg-green-500/5 border-green-500/30" 
                          : "bg-muted/30 border-border/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${socio.bioHuella ? "bg-green-500/15" : "bg-muted"}`}>
                            <Fingerprint className={`h-5 w-5 ${socio.bioHuella ? "text-green-400" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">Huella Digital</p>
                            <p className="text-xs text-muted-foreground">Biometría de huella</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          socio.bioHuella 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {socio.bioHuella ? "Registrado" : "No Registrado"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
