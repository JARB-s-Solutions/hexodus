"use client"

import { useState, useEffect } from "react"
import {
  X, UserPlus, Pencil, User, FileSignature, ScanEye, Award,
  ScanFace, Fingerprint, Save, ArrowRight, CreditCard, Calendar, Printer,
} from "lucide-react"
import { FingerprintReader, SampleFormat } from '@digitalpersona/devices'
import { SociosService } from "@/lib/services/socios"
import { MembresiasService } from "@/lib/services/membresias"
import { CheckoutSocioModal } from "./checkout-socio-modal"
import { ImprimirTicketModal } from "./imprimir-ticket-modal"
import { CapturaFacialModal } from "./captura-facial-modal"
import { toast } from "@/hooks/use-toast"
import type { Socio, CreateSocioRequest, CotizacionResponse } from "@/lib/types/socios"
import type { Membresia } from "@/lib/types/membresias"

// ============================================================
// HELPER: Validar estado de pago de forma segura
// ============================================================
/**
 * Valida y normaliza el estado_pago para evitar estados inválidos.
 * CRÍTICO para cambios de plan y actualizaciones de membresía.
 * 
 * @param estadoPago - Estado de pago recibido (puede ser undefined, null o inválido)
 * @param contexto - Contexto de donde viene (para logs de depuración)
 * @returns Estado de pago válido ('pagado' | 'sin_pagar')
 */
function validarEstadoPago(
  estadoPago: string | undefined | null,
  contexto: string
): 'pagado' | 'sin_pagar' {
  const estadosValidos = ['pagado', 'sin_pagar']
  
  if (!estadoPago) {
    console.warn(`⚠️ [${contexto}] Estado de pago undefined/null → Usando default: sin_pagar`)
    return 'sin_pagar'
  }
  
  if (!estadosValidos.includes(estadoPago)) {
    console.error(`❌ [${contexto}] Estado de pago inválido: "${estadoPago}"`)
    console.error(`   Estados válidos: ${estadosValidos.join(', ')}`)
    console.error(`   → Usando default seguro: sin_pagar`)
    return 'sin_pagar'
  }
  
  console.log(`✅ [${contexto}] Estado de pago válido: ${estadoPago}`)
  return estadoPago as 'pagado' | 'sin_pagar'
}

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
  const [huellaStatus, setHuellaStatus] = useState("Listo para capturar")
  
  // ===== Estado del flujo de registro =====
  const [loading, setLoading] = useState(false)
  const [loadingSocioData, setLoadingSocioData] = useState(false) // Nuevo: carga de datos completos
  const [cotizacion, setCotizacion] = useState<CotizacionResponse | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showImprimirTicket, setShowImprimirTicket] = useState(false) // Modal de impresión
  const [datosSocioCreado, setDatosSocioCreado] = useState<any>(null) // Datos del socio recién creado
  const [metodoPagoNombre, setMetodoPagoNombre] = useState<string>("") // Nombre del método de pago
  const [datosTemporales, setDatosTemporales] = useState<CreateSocioRequest | null>(null)

  // ===== Funciones auxiliares para manejo de fechas =====
  // Obtener fecha actual en formato YYYY-MM-DD
  const obtenerFechaActual = () => {
    const hoy = new Date()
    const year = hoy.getFullYear()
    const month = String(hoy.getMonth() + 1).padStart(2, '0')
    const day = String(hoy.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Calcular fecha + 1 año en formato YYYY-MM-DD
  const calcularFechaUnAnoDespues = (fechaInicio: string) => {
    if (!fechaInicio) return ""
    const fecha = new Date(fechaInicio + 'T00:00:00') // Evitar problemas de zona horaria
    fecha.setFullYear(fecha.getFullYear() + 1)
    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, '0')
    const day = String(fecha.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Formatear fechas sin problemas de zona horaria
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
      
      // Verificar estado de WebSdk cuando se abre el modal
      console.log('🔧 Estado de WebSdk al abrir modal:')
      console.log('   - window definido:', typeof window !== 'undefined')
      console.log('   - WebSdk en window:', typeof window !== 'undefined' ? !!(window as any).WebSdk : 'N/A')
      console.log('   - WebSdk objeto:', typeof window !== 'undefined' ? (window as any).WebSdk : 'N/A')
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
      // Modo creación: resetear todo y establecer fecha actual por defecto
      console.log('✨ Modo CREACIÓN - Formulario limpio')
      
      const fechaActual = obtenerFechaActual()
      
      setLoadingSocioData(false)
      setNombre("")
      setGenero("Masculino")
      setCorreo("")
      setTelefono("")
      setMembresiaId(null)
      setNombrePlanOriginal(null)
      setFechaInicio(fechaActual) // Fecha actual por defecto
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
    setHuellaStatus("Listo para capturar")
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
        estado_pago: "sin_pagar", // 🔒 Default seguro inicial (se cambiará en checkout)
      },
    }

    console.log('📝 Datos temporales preparados (antes de cotizar):')
    console.log('   Plan ID:', membresiaId)
    console.log('   Fecha inicio:', fechaInicio)
    console.log('   Estado pago inicial:', 'sin_pagar (temporal)')

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
        // ⚠️ VALIDACIÓN CRÍTICA: Determinar estado_pago de forma segura
        const estadoPagoSeguro = validarEstadoPago(
          socio.estadoPago,
          'Actualización de Socio'
        )
        
        // 🔍 VERIFICACIÓN ADICIONAL: ¿Es cambio de plan?
        const esCambioDePlan = socio.planId !== membresiaId
        if (esCambioDePlan) {
          console.warn('🔄 CAMBIO DE PLAN DETECTADO:')
          console.warn('   Socio ID:', socio.id)
          console.warn('   Plan anterior:', socio.planId)
          console.warn('   Plan nuevo:', membresiaId)
          console.warn('   Estado pago actual:', socio.estadoPago)
          console.warn('   Estado pago que se enviará:', estadoPagoSeguro)
          console.warn('   ⚠️ CRÍTICO: Backend DEBE:')
          console.warn('      1. Calcular diferencia de precio')
          console.warn('      2. Devolver monto anterior si corresponde')
          console.warn('      3. Cobrar nuevo plan SOLO si estado_pago=pagado')
          console.warn('      4. NO cobrar si estado_pago=sin_pagar')
          
          // MEJORA FUTURA: Aquí podrías mostrar un modal de confirmación
          // preguntando: "¿Desea cobrar la nueva membresía ahora?"
          // y permitir al usuario cambiar el estado_pago explícitamente
        }
        
        console.log('📝 Incluyendo membresía en actualización:', {
          plan_id: membresiaId,
          fecha_inicio: fechaInicio,
          estado_pago: estadoPagoSeguro,
          es_cambio_de_plan: esCambioDePlan,
        })
        
        datosActualizados.membresia = {
          plan_id: membresiaId,
          fecha_inicio: fechaInicio,
          estado_pago: estadoPagoSeguro,
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
    
    console.log('💳 Confirmando pago para nuevo socio:')
    console.log('   Método de pago ID:', metodoPagoId)
    console.log('   Método de pago:', nombreMetodoPago)
    console.log('   Total a cobrar:', cotizacion.total_a_pagar)
    console.log('   Plan:', cotizacion.plan_nombre)
    
    setLoading(true)
    try {
      const datosFinales: CreateSocioRequest = {
        ...datosTemporales,
        membresia: {
          ...datosTemporales.membresia,
          estado_pago: "pagado", // ✅ EXPlÍCITO: Usuario confirmó pago
          metodo_pago_id: metodoPagoId,
        },
      }
      
      console.log('📤 Enviando registro con pago confirmado')
      console.log('   estado_pago:', 'pagado')
      console.log('   metodo_pago_id:', metodoPagoId)
      
      const response = await SociosService.create(datosFinales)
      
      toast({
        title: "¡Socio registrado!",
        description: `${nombre} ha sido inscrito exitosamente y el pago fue registrado.`,
      })
      
      // Guardar datos para impresión
      setDatosSocioCreado({
        nombre: nombre,
        codigoSocio: response.codigo_socio || "N/A",
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
    
    console.log('⚠️ Inscribiendo socio SIN PAGO:')
    console.log('   Nombre:', nombre)
    console.log('   Plan:', cotizacion.plan_nombre)
    console.log('   Monto pendiente:', cotizacion.total_a_pagar)
    console.warn('   💵 El cobro quedará PENDIENTE')
    
    setLoading(true)
    try {
      const datosFinales: CreateSocioRequest = {
        ...datosTemporales,
        membresia: {
          ...datosTemporales.membresia,
          estado_pago: "sin_pagar", // ⚠️ EXPlÍCITO: Usuario eligió pagar después
          // No se envía metodo_pago_id
        },
      }
      
      console.log('📤 Enviando registro sin pago')
      console.log('   estado_pago:', 'sin_pagar')
      console.log('   metodo_pago_id:', 'undefined (no se envía)')
      
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
  }

  const handleCapturaFacialCompleta = async (imageData: string, faceEncoding?: number[]) => {
    console.log('📸 Captura facial completada')
    console.log('🖼️ Tamaño de imagen:', imageData.length, 'caracteres')
    
    try {
      // Mostrar loading mientras se sube la imagen
      toast({
        title: "⏳ Subiendo imagen...",
        description: "Procesando captura facial",
      })

      // Subir imagen a Cloudinary
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imageData,
          type: 'profile' // Usaremos esta imagen como foto de perfil
        })
      })

      if (!uploadResponse.ok) {
        throw new Error('Error al subir la imagen')
      }

      const { imageUrl, publicId } = await uploadResponse.json()
      
      console.log('✅ Imagen subida a Cloudinary:', imageUrl)
      
      // Guardar URL de Cloudinary (no el base64)
      setFotoPerfilUrl(imageUrl)
      
      if (faceEncoding) {
        console.log('🔢 Face encoding recibido:', faceEncoding.length, 'dimensiones')
        setFaceEncoding(faceEncoding)
      }
      
      setBioRostro(true)
      setFacialDetected(true)
      
      toast({
        title: "✓ Rostro capturado",
        description: "Imagen facial registrada correctamente",
      })

    } catch (error) {
      console.error('❌ Error al procesar captura facial:', error)
      
      // En caso de error, guardamos el base64 como fallback
      setFotoPerfilUrl(imageData)
      
      if (faceEncoding) {
        setFaceEncoding(faceEncoding)
      }
      
      setBioRostro(true)
      setFacialDetected(true)
      
      toast({
        title: "⚠️ Rostro capturado (local)",
        description: "Imagen guardada localmente. Verifica la conexión.",
        variant: "destructive",
      })
    }
  }

  const handleConfirmarRostro = () => {
    // Esta función ya no se usa, la captura se maneja en CapturaFacialModal
    // Dejamos por compatibilidad
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
    setHuellaStatus("Listo para capturar")
    setShowHuellaModal(true)
  }

  const handleCapturarHuellaReal = async () => {
    setHuellaCapturing(true)
    setHuellaStatus("Verificando WebSdk...")
    
    try {
      // Verificar que WebSdk esté disponible en el window
      console.log('🔍 Verificando WebSdk en window...', typeof window !== 'undefined' ? !!(window as any).WebSdk : 'window no disponible')
      
      if (typeof window !== 'undefined' && !(window as any).WebSdk) {
        throw new Error("WebSdk no está cargado. Por favor recarga la página.")
      }
      
      console.log('✅ WebSdk disponible')
      setHuellaStatus("Inicializando lector...")
      
      console.log('📱 Creando FingerprintReader...')
      const reader = new FingerprintReader()
      console.log('✅ FingerprintReader creado:', reader)
      
      setHuellaStatus("Buscando lector...")
      console.log('🔎 Enumerando dispositivos...')
      
      const devices = await reader.enumerateDevices()
      console.log('📋 Dispositivos encontrados:', devices.length, devices)
      
      if (devices.length === 0) {
        console.error('❌ No se encontraron dispositivos de huella')
        throw new Error("Conecta el lector de huellas")
      }
      
      console.log('🎯 Usando dispositivo:', devices[0])
      setHuellaStatus("🟢 Lector encendido... pon tu dedo")
      
      reader.on('SamplesAcquired', (event: any) => {
        console.log('✨ SamplesAcquired event:', event)
        const template = event.samples[0].Data
        console.log('📝 Template capturado, longitud:', template?.length || 0)
        reader.stopAcquisition()
        
        // Guardar el template de huella
        setFingerprintTemplate(template)
        setBioHuella(true)
        setHuellaCapturing(false)
        setHuellaStatus("✅ Huella capturada correctamente")
        
        // Cerrar modal después de un momento
        setTimeout(() => {
          setShowHuellaModal(false)
        }, 1500)
        
        toast({
          title: "✓ Huella capturada",
          description: "La huella dactilar ha sido registrada correctamente",
        })
      })

      reader.on('ErrorOccurred', (error: any) => {
        console.error('❌ ErrorOccurred event:', error)
        reader.stopAcquisition()
        setHuellaStatus("❌ Error al capturar")
        setHuellaCapturing(false)
        
        toast({
          title: "Error",
          description: `Error en el lector: ${error.message || 'Desconocido'}`,
          variant: "destructive",
        })
      })

      console.log('▶️ Iniciando adquisición...')
      await reader.startAcquisition(SampleFormat.Intermediate, devices[0])
      console.log('✅ Adquisición iniciada correctamente')
      
    } catch (err: any) {
      console.error('💥 Error fatal en captura de huella:')
      console.error('   Tipo:', err.constructor.name)
      console.error('   Mensaje:', err.message)
      console.error('   Stack:', err.stack)
      console.error('   Error completo:', err)
      
      // Detectar error de conexión al servicio local
      let errorMessage = err.message || "No se pudo iniciar la captura de huella"
      
      if (err.message?.includes('Communication failure') || 
          err.message?.includes('404') ||
          err.message?.includes('get_connection')) {
        errorMessage = "El servicio de DigitalPersona no está corriendo. Instala y ejecuta 'DigitalPersona UareU SDK' en tu computadora."
        console.error('⚠️ DIAGNÓSTICO: El servicio local de DigitalPersona (puerto 52181) no responde.')
        console.error('   Solución: Instala DigitalPersona UareU SDK y asegúrate que el servicio esté corriendo.')
      }
      
      setHuellaStatus(`❌ Error: ${errorMessage}`)
      setHuellaCapturing(false)
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
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
                          onChange={(e) => {
                            const checked = e.target.checked
                            setFirmoContrato(checked)
                            
                            // Si se activa el contrato, establecer fechas por defecto
                            if (checked) {
                              const fechaActual = obtenerFechaActual()
                              const fechaFin = calcularFechaUnAnoDespues(fechaActual)
                              setContratoInicio(fechaActual)
                              setContratoFin(fechaFin)
                              console.log('📅 Contrato activado - Inicio:', fechaActual, 'Fin:', fechaFin)
                            } else {
                              // Si se desactiva, limpiar fechas
                              setContratoInicio("")
                              setContratoFin("")
                            }
                          }}
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
                          onChange={(e) => {
                            const nuevaFechaInicio = e.target.value
                            setContratoInicio(nuevaFechaInicio)
                            
                            // Calcular automáticamente fecha fin (+1 año)
                            if (nuevaFechaInicio) {
                              const fechaFin = calcularFechaUnAnoDespues(nuevaFechaInicio)
                              setContratoFin(fechaFin)
                              console.log('📅 Fecha inicio cambiada - Nuevo fin:', fechaFin)
                            }
                          }}
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
      <CapturaFacialModal
        open={showFacialModal}
        onClose={() => setShowFacialModal(false)}
        onCapture={handleCapturaFacialCompleta}
      />

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
                <Fingerprint className={`h-16 w-16 ${bioHuella ? "text-[#22C55E]" : huellaCapturing ? "text-[#22C55E] animate-pulse" : "text-accent"}`} />
              </div>
              <p className={`text-sm font-semibold mb-2 ${bioHuella ? "text-[#22C55E]" : huellaCapturing ? "text-[#22C55E]" : "text-foreground"}`}>
                {huellaStatus}
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                {bioHuella 
                  ? "Puedes cerrar esta ventana" 
                  : huellaCapturing 
                  ? "No retires el dedo hasta que termine la captura" 
                  : "Haz clic en Capturar para iniciar"}
              </p>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 mb-6 text-left">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Instrucciones</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Conecta el lector de huellas USB</li>
                  <li>Haz clic en "Capturar Huella"</li>
                  <li>Coloca tu dedo índice en el sensor</li>
                  <li>Mantén el dedo firme hasta escuchar el beep</li>
                </ul>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowHuellaModal(false)}
                  disabled={huellaCapturing}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                >
                  {bioHuella ? "Cerrar" : "Cancelar"}
                </button>
                {!bioHuella && (
                  <button
                    type="button"
                    onClick={handleCapturarHuellaReal}
                    disabled={huellaCapturing}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 glow-primary"
                  >
                    <Fingerprint className="h-4 w-4" />
                    {huellaCapturing ? "Capturando..." : "Capturar Huella"}
                  </button>
                )}
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
