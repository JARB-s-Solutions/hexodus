"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Script from "next/script"
import {
  ScanFace,
  Volume2,
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Loader2,
} from "lucide-react"
import type { ConfigRegistro, Socio, EstadoMembresia } from "@/lib/asistencia-data"
import { DEFAULT_CONFIG } from "@/lib/asistencia-data"
import { AsistenciaService } from "@/lib/services/asistencia"
import { SociosService } from "@/lib/services/socios"

// Declare face-api on window
declare global {
  interface Window {
    faceapi: typeof import("face-api.js") | undefined
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface ResultadoEscaneo {
  socio: Socio | null
  estado: EstadoMembresia
  confianza: string
  membresia: string
  vencimiento: string
  diasRestantes: number
  motivoDenegacion?: string
  accionSugerida?: string
}

function construirContextoAlerta(
  estado: EstadoMembresia,
  diasRestantes: number,
  motivoBackend?: string,
): { motivoDenegacion?: string; accionSugerida?: string } {
  const motivoLimpio = motivoBackend?.trim()

  if (estado === 'sin_pago') {
    return {
      motivoDenegacion: motivoLimpio || 'La membresia del socio esta en estado SIN PAGAR.',
      accionSugerida: 'Acude a recepcion para registrar el pago del adeudo y habilitar el acceso.',
    }
  }

  if (estado === 'vencida') {
    const motivoVencida =
      diasRestantes < 0
        ? `La membresia vencio hace ${Math.abs(diasRestantes)} dia(s).`
        : 'La membresia del socio se encuentra vencida.'

    return {
      motivoDenegacion: motivoLimpio || motivoVencida,
      accionSugerida: 'Solicita la renovacion de membresia en recepcion para reactivar el acceso.',
    }
  }

  if (estado === 'sin_membresia') {
    return {
      motivoDenegacion: motivoLimpio || 'El socio no tiene una membresia activa asignada.',
      accionSugerida: 'Asigna o vende una membresia en recepcion antes de permitir el ingreso.',
    }
  }

  if (estado === 'no_registrado') {
    return {
      motivoDenegacion: motivoLimpio || 'No se encontro un rostro registrado para este escaneo.',
      accionSugerida: 'Verifica identidad del usuario y realiza su registro biometrico en recepcion.',
    }
  }

  return {
    motivoDenegacion: motivoLimpio,
  }
}

function inferirEstadoMembresia(response: any): EstadoMembresia {
  const texto = `${response?.message || ''} ${response?.error || ''} ${response?.data?.sugerencia || ''}`.toLowerCase()
  const estadoPago = String(response?.data?.socio?.estado_pago || response?.data?.estado_pago || '').toLowerCase()
  const vigencia = String(response?.data?.socio?.vigencia_membresia || response?.data?.vigencia_membresia || '').toLowerCase()
  const motivoCodigo = String(response?.data?.motivo_codigo || '').toLowerCase()

  if (
    estadoPago === 'sin_pagar' ||
    motivoCodigo.includes('sin_pago') ||
    texto.includes('sin pagar') ||
    texto.includes('adeudo')
  ) {
    return 'sin_pago'
  }

  if (
    vigencia.includes('vencid') ||
    motivoCodigo.includes('vencid') ||
    texto.includes('membresia vencida') ||
    texto.includes('membresía vencida')
  ) {
    return 'vencida'
  }

  if (motivoCodigo.includes('proximo') || texto.includes('proximo') || texto.includes('por vencer')) {
    return 'proximo_vencer'
  }

  if (motivoCodigo.includes('sin_membresia') || texto.includes('sin membresia') || texto.includes('sin membresía')) {
    return 'sin_membresia'
  }

  if (motivoCodigo.includes('no_registrado') || texto.includes('no reconocido') || texto.includes('no registrado')) {
    return 'no_registrado'
  }

  return response?.success ? 'permitido' : 'no_registrado'
}

function calcularDiasRestantes(fechaISO?: string): number {
  if (!fechaISO) return 0
  const fecha = new Date(fechaISO)
  if (Number.isNaN(fecha.getTime())) return 0
  return Math.ceil((fecha.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function guardarOverrideDenegacion(
  asistenciaId: string | number | undefined,
  data: { estadoMembresia: EstadoMembresia; motivo: string; socioId?: string }
) {
  if (!asistenciaId || typeof window === 'undefined') return

  try {
    const key = 'asistencia_denegaciones_override'
    const actual = JSON.parse(localStorage.getItem(key) || '{}')
    actual[String(asistenciaId)] = {
      ...data,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(key, JSON.stringify(actual))
  } catch (error) {
    console.warn('[Escaneo] No se pudo guardar override de denegacion:', error)
  }
}

async function validarEstadoDesdeSocioDetalle(socioId: number): Promise<EstadoMembresia | null> {
  try {
    const socioDetalle = await SociosService.getById(socioId)

    if (!socioDetalle.nombrePlan) {
      return 'sin_membresia'
    }

    if (socioDetalle.estadoPago === 'sin_pagar' || socioDetalle.estadoPago === 'pendiente') {
      return 'sin_pago'
    }

    const diasRestantes = calcularDiasRestantes(socioDetalle.fechaVencimientoMembresia)
    if (diasRestantes < 0) {
      return 'vencida'
    }

    if (diasRestantes <= 3) {
      return 'proximo_vencer'
    }

    return 'permitido'
  } catch (error) {
    console.warn('[Escaneo] No se pudo validar estado desde detalle de socio:', error)
    return null
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EscaneoPage() {
  const [estado, setEstado] = useState<"cargando" | "listo" | "escaneando" | "resultado" | "error">("cargando")
  const [config, setConfig] = useState<ConfigRegistro>(DEFAULT_CONFIG)
  const [resultado, setResultado] = useState<ResultadoEscaneo | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [audioDesbloqueado, setAudioDesbloqueado] = useState(false)
  const [faceapiReady, setFaceapiReady] = useState(false)
  const [statusMsg, setStatusMsg] = useState("Cargando libreria...")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const estadoRef = useRef(estado)
  estadoRef.current = estado
  const configRef = useRef(config)
  configRef.current = config
  const audioSuccessRef = useRef<HTMLAudioElement | null>(null)
  const audioLoadedRef = useRef(false)

  // Initialize audio on mount
  useEffect(() => {
    // Pre-load success audio
    const audio = new Audio('/sounds/success.wav')
    audio.volume = 0.7
    audio.preload = 'auto'
    audio.load() // Forzar carga inmediata
    
    audio.addEventListener('canplaythrough', () => {
      console.log('[Audio] success.wav loaded and ready')
      audioLoadedRef.current = true
    })
    
    audio.addEventListener('loadeddata', () => {
      console.log('[Audio] success.wav data loaded')
    })
    
    audio.addEventListener('error', (e) => {
      console.error('[Audio] Error loading success.wav:', e)
    })
    
    audioSuccessRef.current = audio
    
    return () => {
      if (audioSuccessRef.current) {
        audioSuccessRef.current.pause()
        audioSuccessRef.current = null
      }
    }
  }, [])

  // Load config from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("config_registro_cliente")
      if (saved) setConfig(JSON.parse(saved))
    } catch {
      // ignore
    }
  }, [])

  // Listen for config messages from admin window
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.tipo === "configuracion") {
        setConfig(event.data.config)
        configRef.current = event.data.config
        localStorage.setItem("config_registro_cliente", JSON.stringify(event.data.config))
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [])

  // ============================================================================
  // FACE-API LOADING (via CDN script tag)
  // ============================================================================

  const handleFaceapiScriptLoad = useCallback(async () => {
    console.log("[v0] face-api.js script loaded from CDN")
    setStatusMsg("Cargando modelos de reconocimiento...")

    try {
      const faceapi = window.faceapi
      if (!faceapi) {
        console.error("[v0] faceapi not available on window after script load")
        setEstado("error")
        return
      }

      const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/"
      console.log("[v0] Loading models from:", MODEL_URL)

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])

      console.log("[v0] All face-api models loaded successfully")
      setFaceapiReady(true)
      setEstado("listo")
    } catch (err) {
      console.error("[v0] Error loading face-api models:", err)
      setStatusMsg("Error al cargar modelos")
      setEstado("error")
    }
  }, [])

  // ============================================================================
  // CAMERA
  // ============================================================================

  const activarCamara = useCallback(async () => {
    console.log("[v0] Activating camera...")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      })
      streamRef.current = stream
      console.log("[v0] Camera stream obtained")

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Wait for video metadata to load
        await new Promise<void>((resolve) => {
          const video = videoRef.current!
          if (video.readyState >= 2) {
            resolve()
            return
          }
          video.onloadeddata = () => {
            console.log("[v0] Video loaded data")
            resolve()
          }
        })

        await videoRef.current.play()
        console.log("[v0] Video playing, dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight)
      }
    } catch (err) {
      console.error("[v0] Camera error:", err)
      setEstado("error")
    }
  }, [])

  // ============================================================================
  // SCANNING
  // ============================================================================

  const iniciarEscaneo = useCallback(() => {
    if (scanIntervalRef.current) {
      console.log("[v0] Scan already running, skipping")
      return
    }

    console.log("[v0] Starting face scan interval...")
    setEstado("escaneando")

    scanIntervalRef.current = setInterval(async () => {
      const faceapi = window.faceapi
      if (!faceapi || !videoRef.current || !streamRef.current) return
      if (estadoRef.current === "resultado") return

      const video = videoRef.current
      if (video.readyState < 2 || video.videoWidth === 0) return

      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor()

        // Draw on canvas if enabled
        if (canvasRef.current && configRef.current.mostrarDeteccion && detection) {
          const canvas = canvasRef.current
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext("2d")
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
          const resized = faceapi.resizeResults(detection, { width: canvas.width, height: canvas.height })
          faceapi.draw.drawDetections(canvas, resized)
          faceapi.draw.drawFaceLandmarks(canvas, resized)
        }

        if (detection) {
          console.log("[v0] Face detected! Processing...")
          // Stop scanning during processing
          if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
            scanIntervalRef.current = null
          }
          await buscarSocio(detection.descriptor)
        }
      } catch (err) {
        console.error("[v0] Detection error:", err)
      }
    }, 1500)
  }, [])

  // ============================================================================
  // SEARCH & MATCH
  // ============================================================================

  const buscarSocio = useCallback(
    async (descriptor: Float32Array) => {
      console.log("[Escaneo] Enviando descriptor facial a la API...")

      try {
        // Convertir Float32Array a array normal
        const faceDescriptorArray = Array.from(descriptor)
        
        // Llamar a la API de validación facial
        const response = await AsistenciaService.registrarFacial({
          tipo: 'IN',
          kioskId: 'PUERTA_PRINCIPAL_01', // TODO: Hacer configurable
          faceDescriptor: faceDescriptorArray
        })

        let estadoAcceso = inferirEstadoMembresia(response)

        if (response.data?.socio) {
          const { socio, asistencia } = response.data

          // Validación reforzada: el detalle del socio es la fuente de verdad para pago/vigencia.
          const estadoDesdeDetalle = await validarEstadoDesdeSocioDetalle(socio.id)
          if (estadoDesdeDetalle) {
            estadoAcceso = estadoDesdeDetalle
          }

          const accesoPermitido = estadoAcceso === 'permitido' || estadoAcceso === 'proximo_vencer'

          console.log(
            accesoPermitido ? "[Escaneo] ✅ Acceso permitido:" : "[Escaneo] ⛔ Acceso denegado:",
            socio.nombre_completo,
            "Estado:",
            estadoAcceso,
          )

          const socioUI: Socio = {
            id: socio.codigo_socio,
            socioDbId: socio.id,
            nombre: socio.nombre_completo,
            email: '',
            telefono: '',
            genero: '',
            foto: socio.foto_perfil_url,
            faceDescriptor: null,
            fechaVencimiento: socio.fecha_fin_membresia,
            estado: accesoPermitido ? 'activo' : 'inactivo',
            membresia: socio.membresia,
            membresiaInfo: null,
          }

          const confianzaResultado = asistencia?.confidence || '0'
          const diasRestantes = socio.fecha_fin_membresia
            ? calcularDiasRestantes(socio.fecha_fin_membresia)
            : 0
          const contextoAlerta = construirContextoAlerta(
            estadoAcceso,
            diasRestantes,
            response.error || response.message || undefined,
          )
          const motivo = accesoPermitido
            ? (response.message || 'Acceso permitido')
            : (contextoAlerta.motivoDenegacion || 'Acceso denegado')

          mostrarResultado({
            socio: socioUI,
            estado: estadoAcceso,
            confianza: confianzaResultado,
            membresia: socio.membresia,
            vencimiento: socio.fecha_fin_membresia
              ? new Date(socio.fecha_fin_membresia).toLocaleDateString('es-MX')
              : '',
            diasRestantes,
            motivoDenegacion: contextoAlerta.motivoDenegacion,
            accionSugerida: contextoAlerta.accionSugerida,
          })

          registrarAccesoLocal(
            socioUI,
            accesoPermitido ? 'permitido' : 'denegado',
            motivo,
            confianzaResultado,
            estadoAcceso,
            asistencia?.id,
          )

          if (!accesoPermitido) {
            guardarOverrideDenegacion(asistencia?.id, {
              estadoMembresia: estadoAcceso,
              motivo,
              socioId: socio.codigo_socio,
            })
          }

          return
        }

        console.log("[Escaneo] ❌ No se pudo validar:", response.error || response.message || "Desconocido")

        const contextoAlerta = construirContextoAlerta(
          estadoAcceso,
          0,
          response.error || response.message || "Sin registro en el sistema",
        )

        mostrarResultado({
          socio: null,
          estado: estadoAcceso,
          confianza: "0",
          membresia: response.error || response.message || "Sin registro en el sistema",
          vencimiento: "",
          diasRestantes: 0,
          motivoDenegacion: contextoAlerta.motivoDenegacion,
          accionSugerida: contextoAlerta.accionSugerida,
        })

      } catch (error: any) {
        console.error("[Escaneo] Error al validar:", error)
        
        mostrarResultado({
          socio: null,
          estado: "no_registrado",
          confianza: "0",
          membresia: error.message || "Error al validar acceso",
          vencimiento: "",
          diasRestantes: 0,
          motivoDenegacion: error.message || 'No se pudo validar el rostro con el servidor.',
          accionSugerida: 'Reintenta el escaneo o solicita apoyo en recepcion.',
        })
      }
    },
    []
  )

  // ============================================================================
  // DISPLAY RESULT
  // ============================================================================

  const mostrarResultado = useCallback(
    (res: ResultadoEscaneo) => {
      setResultado(res)
      setEstado("resultado")

      // Play sound
      console.log('[Audio] Attempting to play sound...', {
        sonidoHabilitado: configRef.current.sonidoHabilitado,
        audioDesbloqueado,
        estado: res.estado,
        audioLoaded: audioLoadedRef.current
      })

      // Intentar reproducir sonido (incluso si audioDesbloqueado es false)
      if (configRef.current.sonidoHabilitado) {
        // Si no está desbloqueado, intentar desbloquear automáticamente
        if (!audioDesbloqueado) {
          console.log('[Audio] ⚠️ Audio no desbloqueado, intentando desbloquear automáticamente...')
          setAudioDesbloqueado(true)
        }

        try {
          if (res.estado === "permitido" && audioSuccessRef.current) {
            // Play success.wav for successful access
            console.log('[Audio] Playing success.wav...')
            audioSuccessRef.current.currentTime = 0
            audioSuccessRef.current.volume = 0.7
            audioSuccessRef.current.play()
              .then(() => {
                console.log('[Audio] ✅ success.wav played successfully')
              })
              .catch(err => {
                console.error('[Audio] ❌ Could not play success.wav:', err)
                // Fallback: intentar con beep si falla el archivo
                try {
                  const audioCtx = new AudioContext()
                  const oscillator = audioCtx.createOscillator()
                  const gainNode = audioCtx.createGain()
                  oscillator.connect(gainNode)
                  gainNode.connect(audioCtx.destination)
                  oscillator.frequency.value = 880 // A5 - success tone
                  oscillator.type = "sine"
                  gainNode.gain.value = 0.3
                  oscillator.start()
                  oscillator.stop(audioCtx.currentTime + 0.2)
                  console.log('[Audio] ✅ Fallback beep played')
                } catch (fallbackErr) {
                  console.error('[Audio] ❌ Fallback beep also failed:', fallbackErr)
                }
              })
          } else if (res.estado === "proximo_vencer" || res.estado === "vencida" || res.estado === "sin_membresia" || res.estado === "sin_pago" || res.estado === "no_registrado") {
            // Use Web Audio API for warning/error beeps
            const audioCtx = new AudioContext()
            const oscillator = audioCtx.createOscillator()
            const gainNode = audioCtx.createGain()
            oscillator.connect(gainNode)
            gainNode.connect(audioCtx.destination)
            gainNode.gain.value = 0.3

            if (res.estado === "proximo_vencer") {
              oscillator.frequency.value = 660 // E - warning
              oscillator.type = "triangle"
            } else {
              oscillator.frequency.value = 330 // E low - error
              oscillator.type = "square"
            }

            oscillator.start()
            oscillator.stop(audioCtx.currentTime + 0.3)
          }
        } catch (error) {
          console.warn('[Audio] Error playing sound:', error)
        }
      }

      // Start countdown
      let secs = configRef.current.tiempoReset
      setCountdown(secs)

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = setInterval(() => {
        secs--
        setCountdown(secs)
        if (secs <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
        }
      }, 1000)

      // Reset after timeout
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = setTimeout(() => {
        console.log("[v0] Resetting screen after timeout")
        setResultado(null)
        setEstado("escaneando")
        // Restart scanning
        if (configRef.current.deteccionAutomatica) {
          // Need to restart after a small delay
          setTimeout(() => {
            iniciarEscaneo()
          }, 500)
        }
      }, configRef.current.tiempoReset * 1000)
    },
    [audioDesbloqueado, iniciarEscaneo]
  )

  // ============================================================================
  // REGISTER ACCESS (Local history)
  // ============================================================================

  const registrarAccesoLocal = useCallback(
    (
      socio: Socio,
      tipo: "permitido" | "denegado",
      motivo: string,
      confianza: string,
      estadoMembresia?: EstadoMembresia,
      asistenciaId?: string | number,
    ) => {
      const accionRecomendada =
        estadoMembresia === 'sin_pago'
          ? 'cobrar_adeudo'
          : estadoMembresia === 'vencida' || estadoMembresia === 'sin_membresia'
          ? 'renovar_membresia'
          : 'ninguna'

      const registro = {
        id: asistenciaId ? String(asistenciaId) : `acc_${Date.now()}`,
        socioId: socio.id,
        socioDbId: socio.socioDbId,
        nombreSocio: socio.nombre,
        tipo,
        motivo,
        confianza,
        timestamp: new Date().toISOString(),
        estadoMembresia,
        accionRecomendada,
        fotoUrl: socio.foto || undefined,
      }

      // Save to localStorage for local history
      try {
        const existing = JSON.parse(localStorage.getItem("registros_acceso") || "[]")
        existing.push(registro)
        if (existing.length > 100) existing.splice(0, existing.length - 100)
        localStorage.setItem("registros_acceso", JSON.stringify(existing))
      } catch {
        // ignore
      }

      // Notify admin window
      if (window.opener) {
        window.opener.postMessage(
          { tipo: "registro_acceso", datos: registro },
          window.location.origin
        )
      }
    },
    []
  )

  // ============================================================================
  // ACTIVATE SYSTEM
  // ============================================================================

  const activarSistema = useCallback(async () => {
    console.log("[Audio] Activar Sistema clicked")
    console.log("[Audio] Config sonido habilitado:", configRef.current.sonidoHabilitado)
    console.log("[Audio] Audio loaded:", audioLoadedRef.current)

    // Unlock audio with both AudioContext and HTMLAudioElement
    try {
      // 1. Unlock AudioContext (for beeps)
      const audioCtx = new AudioContext()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      gainNode.gain.value = 0 // silent
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.01)
      console.log("[Audio] AudioContext unlocked")

      // 2. Unlock HTMLAudioElement (for success.wav)
      if (audioSuccessRef.current && audioLoadedRef.current) {
        console.log("[Audio] Attempting to unlock HTMLAudioElement...")
        const originalVolume = audioSuccessRef.current.volume
        audioSuccessRef.current.volume = 0.3 // Audible for testing
        audioSuccessRef.current.currentTime = 0
        
        try {
          await audioSuccessRef.current.play()
          console.log("[Audio] ✅ Test sound played successfully")
          
          // Pause after 100ms
          setTimeout(() => {
            if (audioSuccessRef.current) {
              audioSuccessRef.current.pause()
              audioSuccessRef.current.currentTime = 0
              audioSuccessRef.current.volume = originalVolume
              console.log("[Audio] HTMLAudioElement unlocked and ready")
            }
          }, 100)
        } catch (err) {
          console.error("[Audio] ❌ Failed to play test sound:", err)
        }
      } else {
        console.warn("[Audio] Audio not ready yet")
      }

      setAudioDesbloqueado(true)
      console.log("[Audio] System unlocked")
    } catch (error) {
      console.error("[Audio] Error during unlock:", error)
    }

    // Activate camera
    await activarCamara()

    // Start auto-scan after camera stabilizes
    if (configRef.current.deteccionAutomatica) {
      console.log("[v0] Starting auto-scan in 1.5s...")
      setTimeout(() => {
        iniciarEscaneo()
      }, 1500)
    }
  }, [activarCamara, iniciarEscaneo])

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  function getEstadoConfig(estadoMem: EstadoMembresia) {
    switch (estadoMem) {
      case "permitido":
        return {
          color: "text-green-400",
          border: "border-green-500",
          bg: "bg-green-500/10",
          glow: "shadow-[0_0_40px_rgba(75,181,67,0.3)]",
          icon: <CheckCircle className="h-16 w-16 text-green-400" />,
          title: "BIENVENIDO",
          message: "Que tengas un excelente entrenamiento!",
        }
      case "proximo_vencer":
        return {
          color: "text-yellow-400",
          border: "border-yellow-500",
          bg: "bg-yellow-500/10",
          glow: "shadow-[0_0_40px_rgba(255,215,0,0.3)]",
          icon: <AlertTriangle className="h-16 w-16 text-yellow-400" />,
          title: "BIENVENIDO",
          message: "",
        }
      case "vencida":
        return {
          color: "text-red-500",
          border: "border-red-500",
          bg: "bg-red-500/10",
          glow: "shadow-[0_0_40px_rgba(255,0,0,0.3)]",
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "ACCESO DENEGADO",
          message: "Por favor, renueva tu membresia en recepcion",
        }
      case "sin_pago":
        return {
          color: "text-red-500",
          border: "border-red-500",
          bg: "bg-red-500/10",
          glow: "shadow-[0_0_40px_rgba(255,0,0,0.3)]",
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "ACCESO DENEGADO",
          message: "Membresia sin pagar - Realiza tu pago en recepcion",
        }
      case "sin_membresia":
        return {
          color: "text-red-500",
          border: "border-red-500",
          bg: "bg-red-500/10",
          glow: "shadow-[0_0_40px_rgba(255,0,0,0.3)]",
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "ACCESO DENEGADO",
          message: "Dirigete a recepcion para adquirir una membresia",
        }
      default:
        return {
          color: "text-red-500",
          border: "border-red-500",
          bg: "bg-red-500/10",
          glow: "shadow-[0_0_40px_rgba(255,0,0,0.3)]",
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "NO REGISTRADO",
          message: "Por favor, dirigete a recepcion para registrarte",
        }
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Load face-api.js from CDN */}
      <Script
        src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"
        strategy="afterInteractive"
        onLoad={handleFaceapiScriptLoad}
        onError={() => {
          console.error("[v0] Failed to load face-api.js script")
          setStatusMsg("Error al cargar face-api.js")
          setEstado("error")
        }}
      />

      <div className="h-screen w-screen flex flex-col overflow-hidden select-none" style={{ background: "#0a0e1a" }}>
        {/* Header */}
        <header className="flex-shrink-0 py-5 text-center border-b border-cyan-900/30" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ background: "rgba(220,38,38,0.15)" }}>
              <ScanFace className="h-7 w-7 text-red-500" />
            </div>
            <h1 className="text-4xl font-bold tracking-widest text-red-500">HEXODUS</h1>
          </div>
          <p className="text-slate-400 mt-1 text-sm">Sistema de Reconocimiento Facial</p>
          {audioDesbloqueado && (
            <p className="text-cyan-400/50 text-xs mt-1">Audio listo</p>
          )}
        </header>

        {/* Accent line */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, #06b6d4, transparent)" }} />

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="relative w-full max-w-[850px] aspect-[4/3]">
            {/* Video Feed Container */}
            <div
              className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-cyan-800/40"
              style={{
                background: "#111827",
                boxShadow: "0 0 40px rgba(6,182,212,0.08), inset 0 0 60px rgba(0,0,0,0.5)",
              }}
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Loading State */}
              {estado === "cargando" && (
                <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: "rgba(10,14,26,0.95)" }}>
                  <div className="text-center">
                    <Loader2 className="h-16 w-16 text-cyan-400 animate-spin mx-auto mb-4" />
                    <p className="text-xl font-bold text-cyan-400">{statusMsg}</p>
                    <p className="text-sm text-slate-500 mt-2">Esto puede tardar unos segundos</p>
                  </div>
                </div>
              )}

              {/* Activation Button State */}
              {estado === "listo" && (
                <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: "rgba(10,14,26,0.95)" }}>
                  <div className="text-center">
                    <Volume2 className="h-20 w-20 text-cyan-400 mx-auto mb-6 animate-pulse" />
                    <h2 className="text-3xl font-bold text-white mb-3">Sistema Listo</h2>
                    <p className="text-slate-400 mb-8 text-lg">Presiona el boton para activar el sistema</p>
                    <button
                      onClick={activarSistema}
                      className="flex items-center gap-3 mx-auto px-10 py-5 text-xl font-bold rounded-xl text-white transition-all duration-300 hover:scale-105 cursor-pointer"
                      style={{
                        background: "linear-gradient(135deg, #ef4444, #06b6d4)",
                        boxShadow: "0 0 30px rgba(239,68,68,0.3), 0 0 60px rgba(6,182,212,0.2)",
                      }}
                    >
                      <PlayCircle className="h-7 w-7" />
                      ACTIVAR SISTEMA
                    </button>
                    <p className="text-xs text-slate-500 mt-5">
                      Esto habilitara el audio y el reconocimiento facial
                    </p>
                  </div>
                </div>
              )}

              {/* Scanning Overlay */}
              {estado === "escaneando" && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className="text-center" style={{ background: "rgba(10,14,26,0.6)", padding: "2rem 3rem", borderRadius: "1rem" }}>
                    <ScanFace className="h-24 w-24 text-cyan-400 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold text-red-500 mb-2">Acercate al Escaner</h2>
                    <p className="text-slate-400">Posiciona tu rostro frente a la camara</p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-slate-400 text-sm">Esperando...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Result Overlay */}
              {estado === "resultado" && resultado && (
                <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: "rgba(10,14,26,0.85)", backdropFilter: "blur(4px)" }}>
                  {(() => {
                    const cfg = getEstadoConfig(resultado.estado)
                    return (
                      <div
                        className={`border-2 ${cfg.border} rounded-2xl p-8 max-w-md w-full mx-4 text-center ${cfg.glow}`}
                        style={{ background: "#111827" }}
                      >
                        {/* Photo */}
                        <div className="mb-4 flex justify-center">
                          {resultado.socio?.foto ? (
                            <img
                              src={resultado.socio.foto}
                              alt="Foto socio"
                              className={`w-28 h-28 rounded-full border-4 ${cfg.border} object-cover`}
                              crossOrigin="anonymous"
                              style={{ boxShadow: "0 0 30px rgba(6,182,212,0.5)" }}
                            />
                          ) : (
                            <div
                              className={`w-28 h-28 rounded-full border-4 ${cfg.border} flex items-center justify-center`}
                              style={{ background: "#1f2937", boxShadow: "0 0 30px rgba(6,182,212,0.3)" }}
                            >
                              <User className="h-14 w-14 text-slate-500" />
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <h2 className="text-2xl font-bold text-white mb-1">
                          {resultado.socio?.nombre || "Rostro No Registrado"}
                        </h2>
                        {resultado.socio?.id && (
                          <p className="text-sm text-slate-400 mb-3">Código: {resultado.socio.id}</p>
                        )}

                        {/* Status badge */}
                        <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg ${cfg.bg} border-2 ${cfg.border} mb-4`}>
                          <span className={`text-2xl font-black ${cfg.color}`}>{cfg.title}</span>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 text-left mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Membresia:</span>
                            <span className="font-semibold text-white">{resultado.membresia}</span>
                          </div>
                          {resultado.vencimiento && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Vencimiento:</span>
                              <span className="font-semibold text-white">
                                {resultado.vencimiento}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Warning for expiring soon */}
                        {resultado.estado === "proximo_vencer" && (
                          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-4">
                            <p className="text-yellow-400 text-sm font-semibold">
                              Tu membresia vence en {resultado.diasRestantes} dia(s)
                            </p>
                          </div>
                        )}

                        {/* Message */}
                        {cfg.message && (
                          <p className="text-slate-400 text-sm mb-4">{cfg.message}</p>
                        )}

                        {/* Contexto de denegacion */}
                        {(resultado.estado === "sin_pago" || resultado.estado === "vencida" || resultado.estado === "sin_membresia" || resultado.estado === "no_registrado") && (
                          <div className="text-left rounded-lg border border-red-500/35 bg-red-500/10 p-3 mb-4 space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-red-300">Motivo del rechazo</p>
                            <p className="text-sm text-red-100">
                              {resultado.motivoDenegacion || "No se pudo validar el acceso en este momento."}
                            </p>
                            {resultado.accionSugerida && (
                              <p className="text-xs text-red-200/90">
                                <span className="font-semibold">Accion recomendada:</span> {resultado.accionSugerida}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Countdown */}
                        <div className="flex items-center justify-center gap-2 text-cyan-400 text-sm font-medium">
                          <Clock className="h-4 w-4" />
                          <span>Siguiente escaneo en: {countdown}s</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Error State */}
              {estado === "error" && (
                <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: "rgba(10,14,26,0.95)" }}>
                  <div className="text-center">
                    <AlertTriangle className="h-20 w-20 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-500 mb-2">Error del Sistema</h2>
                    <p className="text-slate-400 mb-6">{statusMsg || "No se pudo inicializar el sistema de reconocimiento"}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 font-medium hover:bg-red-500/30 transition-colors cursor-pointer"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}