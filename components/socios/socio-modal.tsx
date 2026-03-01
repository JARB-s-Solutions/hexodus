"use client"

import { useState, useEffect } from "react"
import {
  X, UserPlus, Pencil, User, FileSignature, ScanEye, Award,
  ScanFace, Fingerprint, Save, ArrowRight, CreditCard, Calendar, Printer,
} from "lucide-react"
import { SociosService } from "@/lib/services/socios"
import { MembresiasService } from "@/lib/services/membresias"
import { CheckoutSocioModal } from "./checkout-socio-modal"
import { ImprimirTicketModal } from "./imprimir-ticket-modal"
import { toast } from "@/hooks/use-toast"
import type { Socio, CreateSocioRequest, CotizacionResponse } from "@/lib/types/socios"
import type { Membresia } from "@/lib/types/membresias"

interface SocioModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void // Cambio: onSuccess para refrescar lista después de crear
  socio: Socio | null // Para editar (próximamente)
}

export function SocioModal({ open, onClose, onSuccess, socio }: SocioModalProps) {
  // ===== Estado del formulario =====
  const [nombre, setNombre] = useState("")
  const [genero, setGenero] = useState<"Masculino" | "Femenino" | "Otro">("Masculino")
  const [correo, setCorreo] = useState("")
  const [telefono, setTelefono] = useState("")
  
  // Membresía
  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [membresiaId, setMembresiaId] = useState<number | null>(null)
  const [nombrePlanOriginal, setNombrePlanOriginal] = useState<string | null>(null) // Para buscar plan cuando se carguen las membresías
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaVencimiento, setFechaVencimiento] = useState("") // Para preservar fecha de vencimiento
  const [editarMembresia, setEditarMembresia] = useState(false) // Toggle para habilitar edición de membresía
  
  // Contrato
  const [firmoContrato, setFirmoContrato] = useState(false)
  const [contratoInicio, setContratoInicio] = useState("")
  const [contratoFin, setContratoFin] = useState("")
  
  // Biometría
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState("")
  const [faceEncoding, setFaceEncoding] = useState<number[]>([])
  const [fingerprintTemplate, setFingerprintTemplate] = useState("")
  const [bioRostro, setBioRostro] = useState(false)
  const [bioHuella, setBioHuella] = useState(false)
  
  // Modales biométricos
  const [showFacialModal, setShowFacialModal] = useState(false)
  const [showHuellaModal, setShowHuellaModal] = useState(false)
  const [facialDetected, setFacialDetected] = useState(false)
  const [huellaCapturing, setHuellaCapturing] = useState(false)
  
  // ===== Estado del flujo de registro =====
  const [loading, setLoading] = useState(false)
  const [loadingSocioData, setLoadingSocioData] = useState(false) // Nuevo: carga de datos completos
  const [cotizacion, setCotizacion] = useState<CotizacionResponse | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showImprimirTicket, setShowImprimirTicket] = useState(false) // Modal de impresión
  const [datosSocioCreado, setDatosSocioCreado] = useState<any>(null) // Datos del socio recién creado
  const [metodoPagoNombre, setMetodoPagoNombre] = useState<string>("") // Nombre del método de pago
  const [datosTemporales, setDatosTemporales] = useState<CreateSocioRequest | null>(null)

  // ===== Función para formatear fechas sin problemas de zona horaria =====
  const formatFecha = (fecha: string | undefined) => {
    if (!fecha) return "-"
    
    // Extraer solo la parte de la fecha (YYYY-MM-DD) ignorando hora y zona horaria
    const fechaSolo = fecha.split('T')[0]
    const [year, month, day] = fechaSolo.split('-').map(Number)
    
    // Crear fecha usando componentes directamente (sin conversión de zona horaria)
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ]
    
    return `${day} de ${meses[month - 1]} de ${year}`
  }

  // ===== Cargar membresías disponibles =====
  useEffect(() => {
    const cargarMembresias = async () => {
      try {
        const planes = await MembresiasService.getAll()
        setMembresias(planes.filter(p => p.estado === "activo"))
      } catch (error) {
        console.error("Error cargando membresías:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los planes de membresía",
          variant: "destructive",
        })
      }
    }
    
    if (open) {
      cargarMembresias()
    }
  }, [open])

  // ===== Resetear formulario cuando cambia socio o se abre =====
  useEffect(() => {
    if (socio && open) {
      // Modo edición: cargar datos COMPLETOS del socio desde API
      console.log('📋 Modo EDICIÓN - Obteniendo datos completos del socio:', socio.id)
      
      const cargarDatosCompletos = async () => {
        setLoadingSocioData(true)
        try {
          const socioCompleto = await SociosService.getById(socio.id)
          console.log('✅ Datos completos obtenidos:', socioCompleto)
          console.log('📅 Fechas del contrato:', {
            inicioContrato: socioCompleto.inicioContrato,
            finContrato: socioCompleto.finContrato,
            firmoContrato: socioCompleto.firmoContrato
          })
          
          // Datos personales
          setNombre(socioCompleto.nombre || "")
          setGenero(socioCompleto.genero || "Masculino")
          setCorreo(socioCompleto.correo || "")
          setTelefono(socioCompleto.telefono || "")
          
          // Membresía
          console.log('📛 Membresía del socio:', {
            planId: socioCompleto.planId,
            nombrePlan: socioCompleto.nombrePlan,
            fechaInicio: socioCompleto.fechaInicioMembresia,
            fechaVencimiento: socioCompleto.fechaVencimientoMembresia
          })
          
          // Guardar el nombre del plan y el ID (se buscará después cuando se carguen las membresías)
          setNombrePlanOriginal(socioCompleto.nombrePlan || null)
          setMembresiaId(socioCompleto.planId || null)
          
          // Formatear fecha de inicio de membresía (YYYY-MM-DD)
          if (socioCompleto.fechaInicioMembresia) {
            const fechaInicioMem = socioCompleto.fechaInicioMembresia.split('T')[0]
            console.log('📅 Fecha inicio membresía formateada:', fechaInicioMem)
            setFechaInicio(fechaInicioMem)
          } else {
            setFechaInicio("")
          }
          
          // Guardar fecha de vencimiento (no formatear, solo para display)
          setFechaVencimiento(socioCompleto.fechaVencimientoMembresia || "")
          setEditarMembresia(false) // Por defecto NO editable
          
          // Contrato - Convertir fechas al formato YYYY-MM-DD si es necesario
          setFirmoContrato(socioCompleto.firmoContrato || false)
          
          // Procesar fecha de inicio del contrato
          if (socioCompleto.inicioContrato) {
            const fechaInicio = new Date(socioCompleto.inicioContrato)
            if (!isNaN(fechaInicio.getTime())) {
              const fechaFormateada = fechaInicio.toISOString().split('T')[0]
              console.log('📅 Fecha inicio formateada:', fechaFormateada)
              setContratoInicio(fechaFormateada)
            } else {
              console.warn('⚠️ Fecha inicio inválida:', socioCompleto.inicioContrato)
              setContratoInicio("")
            }
          } else {
            setContratoInicio("")
          }
          
          // Procesar fecha de fin del contrato
          if (socioCompleto.finContrato) {
            const fechaFin = new Date(socioCompleto.finContrato)
            if (!isNaN(fechaFin.getTime())) {
              const fechaFormateada = fechaFin.toISOString().split('T')[0]
              console.log('📅 Fecha fin formateada:', fechaFormateada)
              setContratoFin(fechaFormateada)
            } else {
              console.warn('⚠️ Fecha fin inválida:', socioCompleto.finContrato)
              setContratoFin("")
            }
          } else {
            setContratoFin("")
          }
          
          // Biometría
          setFotoPerfilUrl(socioCompleto.fotoPerfil || "")
          setBioRostro(socioCompleto.bioRostro || false)
          setBioHuella(socioCompleto.bioHuella || false)
          setFaceEncoding(socioCompleto.faceEncoding || [])
          setFingerprintTemplate(socioCompleto.fingerprintTemplate || "")
        } catch (error: any) {
          console.error('❌ Error cargando datos del socio:', error)
          toast({
            title: "Error",
            description: "No se pudieron cargar los datos del socio",
            variant: "destructive",
          })
        } finally {
          setLoadingSocioData(false)
        }
      }
      
      cargarDatosCompletos()
    } else if (open) {
      // Modo creación: resetear todo
      console.log('✨ Modo CREACIÓN - Formulario limpio')
      
      setLoadingSocioData(false)
      setNombre("")
      setGenero("Masculino")
      setCorreo("")
      setTelefono("")
      setMembresiaId(null)
      setNombrePlanOriginal(null)
      setFechaInicio("")
      setFechaVencimiento("")
      setEditarMembresia(false)
      setFirmoContrato(false)
      setContratoInicio("")
      setContratoFin("")
      setBioRostro(false)
      setBioHuella(false)
      setFotoPerfilUrl("")
      setFaceEncoding([])
      setFingerprintTemplate("")
      setCotizacion(null)
      setShowCheckout(false)
      setDatosTemporales(null)
    }
    setFacialDetected(false)
  }, [socio, open])

  // ===== Buscar plan cuando las membresías se carguen =====
  useEffect(() => {
    // Solo ejecutar si no hay membresiaId pero hay nombre de plan original
    if (membresias.length > 0 && (!membresiaId || membresiaId === 0) && nombrePlanOriginal) {
      console.log('🔍 Buscando plan después de cargar membresías...')
      console.log('   Plan del socio:', nombrePlanOriginal)
      console.log('   Membresías disponibles:', membresias.length, membresias.map(m => m.nombre))
      
      const planEncontrado = membresias.find(m => 
        m.nombre.toLowerCase() === nombrePlanOriginal.toLowerCase()
      )
      
      if (planEncontrado) {
        console.log('✅ Plan encontrado:', planEncontrado.nombre, 'ID:', planEncontrado.id)
        setMembresiaId(planEncontrado.id)
      } else {
        console.warn('❌ No se encontró el plan:', nombrePlanOriginal)
        console.warn('   Planes disponibles:', membresias.map(m => m.nombre))
      }
    }
  }, [membresias, membresiaId, nombrePlanOriginal])

  if (!open) return null

  // ===== STEP 1: Validar y continuar =====
  const handleContinuar = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones comunes
    if (!nombre.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" })
      return
    }

    // Si es modo edición, actualizar directamente sin cotizar
    if (socio) {
      // Solo validar membresía si el toggle está activado
      if (editarMembresia) {
        if (!membresiaId) {
          toast({ title: "Error", description: "Selecciona un plan de membresía", variant: "destructive" })
          return
        }
        if (!fechaInicio) {
          toast({ title: "Error", description: "Selecciona la fecha de inicio", variant: "destructive" })
          return
        }
      }
      await handleActualizarSocio()
      return
    }

    // ===== MODO CREACIÓN: Validar membresía (siempre requerida) =====
    if (!membresiaId) {
      toast({ title: "Error", description: "Selecciona un plan de membresía", variant: "destructive" })
      return
    }
    if (!fechaInicio) {
      toast({ title: "Error", description: "Selecciona la fecha de inicio", variant: "destructive" })
      return
    }

    // Modo creación: continuar con el flujo de cotización
    const datosCompletos: CreateSocioRequest = {
      personal: {
        nombre_completo: nombre.trim(),
        correo_electronico: correo.trim() || undefined,
        numero_telefono: telefono.trim() || undefined,
        genero,
      },
      detalles_contrato: {
        contrato_firmado: firmoContrato,
        inicio_contrato: firmoContrato && contratoInicio ? contratoInicio : undefined,
        fin_contrato: firmoContrato && contratoFin ? contratoFin : undefined,
      },
      biometria: {
        foto_perfil_url: fotoPerfilUrl || undefined,
        face_encoding: faceEncoding.length > 0 ? faceEncoding : undefined,
        fingerprint_template: fingerprintTemplate || undefined,
      },
      membresia: {
        plan_id: membresiaId,
        fecha_inicio: fechaInicio,
        estado_pago: "sin_pagar",
      },
    }

    setDatosTemporales(datosCompletos)

    // STEP 2: Llamar cotizador
    setLoading(true)
    try {
      const cotizacionData = {
        plan_id: membresiaId,
        fecha_inicio: fechaInicio,
      }
      
      const resultado = await SociosService.cotizar(cotizacionData)
      setCotizacion(resultado)
      
      // STEP 3: Abrir modal de checkout
      setShowCheckout(true)
    } catch (error: any) {
      console.error("Error al cotizar:", error)
      toast({
        title: "Error al cotizar",
        description: error.message || "No se pudo calcular el precio",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // ===== NUEVA FUNCIÓN: Actualizar socio existente =====
  const handleActualizarSocio = async () => {
    if (!socio) return
    
    setLoading(true)
    try {
      console.log('✏️ Actualizando socio ID:', socio.id)
      console.log('🔄 Editar membresía:', editarMembresia)
      
      // Construir solo los campos modificados
      const datosActualizados: Partial<CreateSocioRequest> = {
        personal: {
          nombre_completo: nombre.trim(),
          correo_electronico: correo.trim() || undefined,
          numero_telefono: telefono.trim() || undefined,
          genero,
        },
        detalles_contrato: {
          contrato_firmado: firmoContrato,
          inicio_contrato: firmoContrato && contratoInicio ? contratoInicio : undefined,
          fin_contrato: firmoContrato && contratoFin ? contratoFin : undefined,
        },
        biometria: {
          foto_perfil_url: fotoPerfilUrl || undefined,
          face_encoding: faceEncoding.length > 0 ? faceEncoding : undefined,
          fingerprint_template: fingerprintTemplate || undefined,
        },
      }
      
      // SOLO incluir membresía si el toggle está activado
      if (editarMembresia && membresiaId) {
        console.log('📝 Incluyendo membresía en actualización:', {
          plan_id: membresiaId,
          fecha_inicio: fechaInicio,
          // Nota: fechaVencimiento se preserva automáticamente por el backend
        })
        datosActualizados.membresia = {
          plan_id: membresiaId,
          fecha_inicio: fechaInicio,
          estado_pago: socio.estadoPago || 'pagado', // Preservar estado de pago
        }
      } else {
        console.log('⏭️ Membresía NO incluida en actualización (preservando existente)')
      }
      
      await SociosService.update(socio.id, datosActualizados)
      
      toast({
        title: "✅ Socio actualizado",
        description: `Los datos de ${nombre} han sido actualizados correctamente.`,
      })
      
      onClose()
      onSuccess() // Refrescar lista
    } catch (error: any) {
      console.error("❌ Error al actualizar socio:", error)
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el socio",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // ===== STEP 4: Confirmar pago y registrar socio =====
  const handleConfirmarPago = async (metodoPagoId: number, nombreMetodoPago: string) => {
    if (!datosTemporales || !cotizacion) return
    
    setLoading(true)
    try {
      const datosFinales: CreateSocioRequest = {
        ...datosTemporales,
        membresia: {
          ...datosTemporales.membresia,
          estado_pago: "pagado",
          metodo_pago_id: metodoPagoId,
        },
      }
      
      const response = await SociosService.create(datosFinales)
      
      toast({
        title: "¡Socio registrado!",
        description: `${nombre} ha sido inscrito exitosamente y el pago fue registrado.`,
      })
      
      // Guardar datos para impresión
      setDatosSocioCreado({
        nombre: nombre,
        codigoSocio: response.data?.codigo || "N/A",
        ...datosFinales
      })
      setMetodoPagoNombre(nombreMetodoPago)
      
      // Cerrar checkout y mostrar modal de impresión
      setShowCheckout(false)
      setShowImprimirTicket(true)
      
    } catch (error: any) {
      console.error("Error al registrar socio:", error)
      toast({
        title: "Error al registrar",
        description: error.message || "No se pudo completar el registro",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  // ===== Cerrar modal de impresión y limpiar todo =====
  const handleCerrarImpresion = () => {
    setShowImprimirTicket(false)
    setCotizacion(null)
    setDatosTemporales(null)
    setDatosSocioCreado(null)
    setMetodoPagoNombre("")
    onClose()
    onSuccess() // Refrescar lista de socios
  }

  // ===== STEP 4 (alternativo): Inscribir sin pago =====
  const handleInscribirSinPago = async () => {
    if (!datosTemporales || !cotizacion) return
    
    setLoading(true)
    try {
      const datosFinales: CreateSocioRequest = {
        ...datosTemporales,
        membresia: {
          ...datosTemporales.membresia,
          estado_pago: "sin_pagar",
          // No se envía metodo_pago_id
        },
      }
      
      await SociosService.create(datosFinales)
      
      toast({
        title: "¡Socio inscrito!",
        description: `${nombre} ha sido inscrito. El pago queda pendiente.`,
      })
      
      // STEP 5: Limpiar y cerrar
      setShowCheckout(false)
      setCotizacion(null)
      setDatosTemporales(null)
      onClose()
      onSuccess()
    } catch (error: any) {
      console.error("Error al inscribir socio:", error)
      toast({
        title: "Error al inscribir",
        description: error.message || "No se pudo completar la inscripción",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // ===== Handlers de biometría =====
  const handleCapturarRostro = () => {
    setShowFacialModal(true)
    setFacialDetected(false)
    // TODO: Integrar captura real con webcam + upload a Cloudinary
    // Por ahora: simulación
    setTimeout(() => setFacialDetected(true), 2000)
  }

  const handleConfirmarRostro = () => {
    // TODO: Aquí se subiría la foto a Cloudinary y se generaría face_encoding
    // Por ahora: simulación
    setBioRostro(true)
    setFotoPerfilUrl("https://via.placeholder.com/150") // Mock
    setFaceEncoding([0.1, 0.2, 0.3, 0.4, 0.5]) // Mock encoding
    setShowFacialModal(false)
    
    toast({
      title: "Rostro capturado",
      description: "El reconocimiento facial ha sido configurado correctamente",
    })
  }

  const handleCapturarHuella = () => {
    setShowHuellaModal(true)
  }

  const handleSimularHuella = () => {
    setHuellaCapturing(true)
    setTimeout(() => {
      // TODO: Integrar con dispositivo de huellas real
      // Por ahora: simulación
      setBioHuella(true)
      setFingerprintTemplate("MOCK_FINGERPRINT_TEMPLATE_" + Date.now())
      setHuellaCapturing(false)
      setShowHuellaModal(false)
      
      toast({
        title: "Huella capturada",
        description: "La huella dactilar ha sido registrada correctamente",
      })
    }, 2000)
  }

  // ===== Estilos =====
  const inputClass =
    "w-full h-[52px] px-4 text-sm bg-[#1C1F2B]/90 border border-muted-foreground/30 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all"

  return (
    <>
      {/* Main Modal */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 pb-20 overflow-y-auto"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div
          className="w-full max-w-3xl my-4 rounded-2xl overflow-hidden animate-slide-up"
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
              {socio ? (
                <><Pencil className="h-5 w-5 text-primary" /><span>Editar Socio</span></>
              ) : (
                <><UserPlus className="h-5 w-5 text-primary" /><span>Registro de Nuevo Socio</span></>
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
          <form onSubmit={handleContinuar}>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* Mostrar spinner mientras se cargan datos del socio */}
              {loadingSocioData ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Cargando datos del socio...</p>
                </div>
              ) : (
                <>
                  {/* Section: Personal Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-primary text-xs font-extrabold uppercase tracking-widest">
                      <User className="h-4 w-4" />
                      <span>Informacion Personal</span>
                    </div>
                <div
                  className="p-4 rounded-2xl space-y-4"
                  style={{ background: "rgba(21,25,38,0.72)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Nombre Completo <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                        placeholder="Ej. Juan Perez"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Correo Electronico
                      </label>
                      <input
                        type="email"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        placeholder="juan@ejemplo.com"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Numero de Telefono
                      </label>
                      <input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="+52 555 123 4567"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Genero <span className="text-primary">*</span>
                      </label>
                      <div className="flex items-center gap-6 h-[52px]">
                        {(["Masculino", "Femenino", "Otro"] as const).map((g) => (
                          <label key={g} className="inline-flex items-center gap-2 text-sm text-foreground/80 cursor-pointer">
                            <input
                              type="radio"
                              name="genero"
                              value={g}
                              checked={genero === g}
                              onChange={() => setGenero(g)}
                              className="appearance-none w-4 h-4 rounded-full border-2 border-muted-foreground/50 checked:border-accent relative
                                after:content-[''] after:absolute after:inset-[3px] after:rounded-full after:bg-transparent checked:after:bg-accent"
                            />
                            <span>{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Contract + Biometric side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Contract */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-primary text-xs font-extrabold uppercase tracking-widest">
                    <FileSignature className="h-4 w-4" />
                    <span>Detalles del Contrato</span>
                  </div>
                  <div
                    className="p-4 rounded-2xl space-y-4"
                    style={{ background: "rgba(21,25,38,0.72)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Contrato Firmado?</span>
                      <label className="relative inline-block w-[60px] h-[32px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={firmoContrato}
                          onChange={(e) => setFirmoContrato(e.target.checked)}
                          className="sr-only peer"
                        />
                        <span className="absolute inset-0 rounded-full bg-muted border border-border peer-checked:bg-accent/30 peer-checked:border-accent/60 transition-all" />
                        <span className="absolute top-[3px] left-[3px] w-[26px] h-[26px] rounded-full bg-accent shadow-lg peer-checked:translate-x-[28px] transition-transform" />
                      </label>
                    </div>
                    <div className={`grid grid-cols-2 gap-3 transition-all duration-300 ${!firmoContrato ? "opacity-40 pointer-events-none" : ""}`}>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Inicio</label>
                        <input
                          type="date"
                          value={contratoInicio}
                          onChange={(e) => setContratoInicio(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Fin</label>
                        <input
                          type="date"
                          value={contratoFin}
                          onChange={(e) => setContratoFin(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Biometric */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-accent text-xs font-extrabold uppercase tracking-widest">
                    <ScanEye className="h-4 w-4" />
                    <span>Acceso Biometrico Dual</span>
                  </div>
                  <div
                    className="p-4 rounded-2xl"
                    style={{ background: "rgba(21,25,38,0.72)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {/* Facial */}
                      <button
                        type="button"
                        onClick={handleCapturarRostro}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                          bioRostro
                            ? "border-[#22C55E]/50 bg-[#22C55E]/10"
                            : "border-accent/30 bg-accent/5 hover:border-accent/50"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-card/30 border border-border/30 flex items-center justify-center">
                          <ScanFace className={`h-7 w-7 ${bioRostro ? "text-[#22C55E]" : "text-accent"}`} />
                        </div>
                        <span className="text-sm font-semibold text-foreground">Rostro</span>
                        <span className={`text-xs ${bioRostro ? "text-[#22C55E]" : "text-muted-foreground"}`}>
                          {bioRostro ? "Capturado" : "Sin captura"}
                        </span>
                      </button>

                      {/* Fingerprint */}
                      <button
                        type="button"
                        onClick={handleCapturarHuella}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                          bioHuella
                            ? "border-[#22C55E]/50 bg-[#22C55E]/10"
                            : "border-accent/30 bg-accent/5 hover:border-accent/50"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-card/30 border border-border/30 flex items-center justify-center">
                          <Fingerprint className={`h-7 w-7 ${bioHuella ? "text-[#22C55E]" : "text-accent"}`} />
                        </div>
                        <span className="text-sm font-semibold text-foreground">Huella</span>
                        <span className={`text-xs ${bioHuella ? "text-[#22C55E]" : "text-muted-foreground"}`}>
                          {bioHuella ? "Capturado" : "Sin captura"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Membership */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-primary text-xs font-extrabold uppercase tracking-widest">
                  <Award className="h-4 w-4" />
                  <span>Asignacion de Membresia</span>
                </div>
                <div
                  className="p-4 rounded-2xl"
                  style={{ background: "rgba(21,25,38,0.72)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {socio ? (
                    // Modo edición: Toggle para habilitar edición de membresía
                    <div className="space-y-4">
                      {/* Toggle para editar membresía */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">Editar Membresía</p>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400">
                              Especial
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Activa esta opción solo para casos especiales. Las fechas de membresía se preservarán.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditarMembresia(!editarMembresia)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            editarMembresia ? "bg-yellow-500" : "bg-muted"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                              editarMembresia ? "translate-x-6" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Campos de membresía */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Plan de Membresía {editarMembresia && <span className="text-primary">*</span>}
                          </label>
                          {editarMembresia ? (
                            <select
                              value={membresiaId || ""}
                              onChange={(e) => setMembresiaId(e.target.value ? Number(e.target.value) : null)}
                              required={editarMembresia}
                              className={inputClass}
                            >
                              <option value="">Selecciona un plan</option>
                              {membresias.map((m) => {
                                const precioMostrar = m.esOferta && m.precioOferta ? m.precioOferta : m.precioBase
                                return (
                                  <option key={m.id} value={m.id}>
                                    {m.nombre} - ${precioMostrar.toLocaleString()} ({m.duracionCantidad} {m.duracionUnidad})
                                    {m.esOferta && m.precioOferta && ` - ¡OFERTA!`}
                                  </option>
                                )
                              })}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={membresias.find(m => m.id === membresiaId)?.nombre || "Sin plan"}
                              disabled
                              className={`${inputClass} opacity-60 cursor-not-allowed`}
                            />
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Fecha de Inicio {editarMembresia && <span className="text-primary">*</span>}
                          </label>
                          <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            disabled={!editarMembresia}
                            required={editarMembresia}
                            className={`${inputClass} ${!editarMembresia ? 'opacity-60 cursor-not-allowed' : ''}`}
                          />
                        </div>
                      </div>
                      
                      {/* Información sobre vencimiento */}
                      {fechaVencimiento && (
                        <div className="text-xs text-muted-foreground/70 bg-muted/20 p-3 rounded-lg">
                          <p className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              Vencimiento actual: <strong>{formatFecha(fechaVencimiento)}</strong>
                            </span>
                          </p>
                          {editarMembresia && (
                            <p className="mt-1 text-yellow-400/80">
                              ⚠️ El vencimiento se recalculará según el plan y fecha de inicio seleccionados.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Modo creación: Campos editables y requeridos
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Plan de Membresia <span className="text-primary">*</span>
                        </label>
                        <select
                          value={membresiaId || ""}
                          onChange={(e) => setMembresiaId(e.target.value ? Number(e.target.value) : null)}
                          required
                          className={inputClass}
                        >
                          <option value="">Selecciona un plan</option>
                          {membresias.map((m) => {
                            const precioMostrar = m.esOferta && m.precioOferta ? m.precioOferta : m.precioBase
                            return (
                              <option key={m.id} value={m.id}>
                                {m.nombre} - ${precioMostrar.toLocaleString()} ({m.duracionCantidad} {m.duracionUnidad})
                                {m.esOferta && m.precioOferta && ` - ¡OFERTA!`}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Fecha de Inicio <span className="text-primary">*</span>
                        </label>
                        <input
                          type="date"
                          value={fechaInicio}
                          onChange={(e) => setFechaInicio(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    💡 La fecha de vencimiento se calculará automáticamente según el plan seleccionado
                  </p>
                </div>
              </div>
              </>
              )}
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
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl text-primary-foreground bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all glow-primary glow-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {socio ? "Actualizando..." : "Calculando..."}
                  </>
                ) : socio ? (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Continuar a Cotización
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Facial Capture Modal */}
      {showFacialModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowFacialModal(false) }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden animate-slide-up"
            style={{
              background: "linear-gradient(180deg, rgba(22,24,36,0.97), rgba(18,20,32,0.95))",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ScanFace className="h-5 w-5 text-accent" />
                Captura Facial para Acceso
              </h3>
              <button onClick={() => setShowFacialModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {/* Camera placeholder */}
              <div className="relative w-full aspect-video bg-background rounded-xl overflow-hidden mb-4 flex items-center justify-center border border-border">
                <div className="w-48 h-48 rounded-full border-2 border-dashed border-accent/50 flex items-center justify-center">
                  <ScanFace className="h-20 w-20 text-accent/40" />
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-sm font-medium text-foreground">Posiciona tu rostro en el circulo</p>
                  <p className={`text-xs mt-1 ${facialDetected ? "text-[#22C55E]" : "text-muted-foreground"}`}>
                    {facialDetected ? "Rostro detectado correctamente" : "Esperando deteccion..."}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-2">
                  Instrucciones
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Asegurate de tener buena iluminacion</li>
                  <li>Mira directamente a la camara</li>
                  <li>Manten una expresion neutral</li>
                </ul>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFacialModal(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarRostro}
                  disabled={!facialDetected}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-primary"
                >
                  Confirmar Captura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fingerprint Capture Modal */}
      {showHuellaModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowHuellaModal(false) }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden animate-slide-up"
            style={{
              background: "linear-gradient(180deg, rgba(22,24,36,0.97), rgba(18,20,32,0.95))",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-accent" />
                Captura de Huella Dactilar
              </h3>
              <button onClick={() => setShowHuellaModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full border-2 border-dashed border-accent/50 flex items-center justify-center relative">
                <Fingerprint className={`h-16 w-16 ${huellaCapturing ? "text-[#22C55E] animate-pulse" : "text-accent"}`} />
              </div>
              <p className={`text-sm mb-1 ${huellaCapturing ? "text-[#22C55E]" : "text-muted-foreground"}`}>
                {huellaCapturing ? "Capturando huella..." : "Coloca tu dedo en el lector"}
              </p>
              <p className={`text-xs mb-6 ${huellaCapturing ? "text-[#22C55E]" : "text-muted-foreground"}`}>
                {huellaCapturing ? "Manten el dedo firme..." : "Esperando lector biometrico..."}
              </p>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 mb-6 text-left">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Instrucciones</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Conecta el lector de huellas USB</li>
                  <li>Coloca tu dedo indice en el sensor</li>
                  <li>Manten el dedo firme por 3 segundos</li>
                </ul>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowHuellaModal(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSimularHuella}
                  disabled={huellaCapturing}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 glow-primary"
                >
                  {huellaCapturing ? "Capturando..." : "Simular Captura"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal (STEP 3) */}
      {showCheckout && cotizacion && (
        <CheckoutSocioModal
          open={showCheckout}
          onClose={() => setShowCheckout(false)}
          cotizacion={cotizacion}
          onConfirmarPago={handleConfirmarPago}
          onInscribirSinPago={handleInscribirSinPago}
          loading={loading}
        />
      )}

      {/* Modal de Impresión de Ticket */}
      {showImprimirTicket && datosSocioCreado && cotizacion && (
        <ImprimirTicketModal
          open={showImprimirTicket}
          onClose={handleCerrarImpresion}
          socioData={datosSocioCreado}
          cotizacion={cotizacion}
          metodoPago={metodoPagoNombre}
        />
      )}
    </>
  )
}
