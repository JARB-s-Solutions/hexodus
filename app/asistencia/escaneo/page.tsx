"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  const [modelosCargados, setModelosCargados] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const faceapiRef = useRef<typeof import("face-api.js") | null>(null)
  const audioRef = useRef<{ success: HTMLAudioElement | null; warning: HTMLAudioElement | null; error: HTMLAudioElement | null }>({
    success: null,
    warning: null,
    error: null,
  })
  const estadoRef = useRef(estado)
  estadoRef.current = estado

  // Load config from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("config_registro_cliente")
      if (saved) setConfig(JSON.parse(saved))
    } catch {}
  }, [])

  // Listen for config messages from admin window
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.tipo === "configuracion") {
        setConfig(event.data.config)
        localStorage.setItem("config_registro_cliente", JSON.stringify(event.data.config))
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // Load face-api.js models
  useEffect(() => {
    async function loadModels() {
      try {
        const faceapi = await import("face-api.js")
        faceapiRef.current = faceapi

        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/"
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])

        setModelosCargados(true)
        setEstado("listo")
      } catch (err) {
        console.error("[v0] Error loading face-api models:", err)
        setEstado("error")
      }
    }
    loadModels()
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
  // CAMERA
  // ============================================================================

  const activarCamara = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
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
    if (scanIntervalRef.current) return
    setEstado("escaneando")

    scanIntervalRef.current = setInterval(async () => {
      if (!faceapiRef.current || !videoRef.current || !streamRef.current) return
      if (estadoRef.current === "resultado") return

      const faceapi = faceapiRef.current
      const video = videoRef.current

      if (video.readyState < 2 || video.videoWidth === 0) return

      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor()

        // Draw on canvas
        if (canvasRef.current && config.mostrarDeteccion && detection) {
          const canvas = canvasRef.current
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext("2d")
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
          faceapi.draw.drawDetections(canvas, detection)
          faceapi.draw.drawFaceLandmarks(canvas, detection)
        }

        if (detection) {
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
  }, [config.mostrarDeteccion])

  // ============================================================================
  // SEARCH & MATCH
  // ============================================================================

  const buscarSocio = useCallback(
    async (descriptor: Float32Array) => {
      const faceapi = faceapiRef.current
      if (!faceapi) return

      // Get socios from localStorage
      let socios: Socio[] = []
      try {
        const raw = localStorage.getItem("hexodus_socios")
        if (raw) {
          const parsed = JSON.parse(raw)
          socios = parsed.filter((s: Socio) => s.faceDescriptor && s.faceDescriptor.length > 0)
        }
      } catch {}

      if (socios.length === 0) {
        mostrarResultado({
          socio: null,
          estado: "no_registrado",
          confianza: "0",
          membresia: "Sin registro en el sistema",
          vencimiento: "",
          diasRestantes: 0,
        })
        return
      }

      let mejorSocio: Socio | null = null
      let mejorDistancia = 1

      for (const socio of socios) {
        if (socio.faceDescriptor) {
          const saved = new Float32Array(socio.faceDescriptor)
          const dist = faceapi.euclideanDistance(descriptor, saved)
          if (dist < mejorDistancia) {
            mejorDistancia = dist
            mejorSocio = socio
          }
        }
      }

      if (mejorSocio && mejorDistancia < config.umbralConfianza) {
        const confianza = ((1 - mejorDistancia) * 100).toFixed(1)
        procesarAcceso(mejorSocio, confianza)
      } else {
        mostrarResultado({
          socio: null,
          estado: "no_registrado",
          confianza: "0",
          membresia: "Sin registro en el sistema",
          vencimiento: "",
          diasRestantes: 0,
        })
      }
    },
    [config.umbralConfianza]
  )

  const procesarAcceso = useCallback(
    (socio: Socio, confianza: string) => {
      // Check membership
      if (!socio.membresiaInfo || socio.estado === "inactivo") {
        mostrarResultado({
          socio,
          estado: "sin_membresia",
          confianza,
          membresia: "Sin membresia activa",
          vencimiento: "N/A",
          diasRestantes: 0,
        })
        registrarAcceso(socio, "denegado", "Sin membresia activa", confianza)
        return
      }

      // Check payment
      try {
        const membresiasRaw = localStorage.getItem("hexodus_membresias")
        const pagosRaw = localStorage.getItem("hexodus_pagos")
        if (membresiasRaw && pagosRaw) {
          const membresias = JSON.parse(membresiasRaw)
          const pagos = JSON.parse(pagosRaw)
          const activa = membresias.find((m: { socioId: string; activa: boolean }) => m.socioId === socio.id && m.activa)
          if (activa) {
            const pagosMem = pagos.filter((p: { membresiaId: string }) => p.membresiaId === activa.id)
            const totalPagado = pagosMem.reduce((s: number, p: { importe: number }) => s + p.importe, 0)
            if (totalPagado === 0 || totalPagado < activa.precio) {
              mostrarResultado({
                socio,
                estado: "sin_pago",
                confianza,
                membresia: socio.membresiaInfo?.nombre || socio.membresia,
                vencimiento: socio.fechaVencimiento,
                diasRestantes: 0,
              })
              registrarAcceso(socio, "denegado", "Membresia sin pagar", confianza)
              return
            }
          }
        }
      } catch {}

      // Check expiration
      const venc = new Date(socio.fechaVencimiento)
      const ahora = new Date()
      const dias = Math.ceil((venc.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))

      if (venc < ahora) {
        mostrarResultado({
          socio,
          estado: "vencida",
          confianza,
          membresia: (socio.membresiaInfo?.nombre || socio.membresia) + " (Vencida)",
          vencimiento: socio.fechaVencimiento,
          diasRestantes: dias,
        })
        registrarAcceso(socio, "denegado", "Membresia vencida", confianza)
      } else if (dias <= 3) {
        mostrarResultado({
          socio,
          estado: "proximo_vencer",
          confianza,
          membresia: socio.membresiaInfo?.nombre || socio.membresia,
          vencimiento: socio.fechaVencimiento,
          diasRestantes: dias,
        })
        registrarAcceso(socio, "permitido", "Acceso con advertencia - proxima a vencer", confianza)
      } else {
        mostrarResultado({
          socio,
          estado: "permitido",
          confianza,
          membresia: socio.membresiaInfo?.nombre || socio.membresia,
          vencimiento: socio.fechaVencimiento,
          diasRestantes: dias,
        })
        registrarAcceso(socio, "permitido", "Acceso permitido", confianza)
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
      const soundType = res.estado === "permitido" ? "success" : res.estado === "proximo_vencer" ? "warning" : "error"
      reproducirSonido(soundType)

      // Start countdown
      let secs = config.tiempoReset
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
        setResultado(null)
        setEstado("escaneando")
        // Restart scanning
        if (config.deteccionAutomatica) {
          iniciarEscaneo()
        }
      }, config.tiempoReset * 1000)
    },
    [config.tiempoReset, config.deteccionAutomatica]
  )

  // ============================================================================
  // REGISTER ACCESS
  // ============================================================================

  const registrarAcceso = useCallback(
    (socio: Socio, tipo: "permitido" | "denegado", motivo: string, confianza: string) => {
      const registro = {
        id: `acc_${Date.now()}`,
        socioId: socio.id,
        nombreSocio: socio.nombre,
        tipo,
        motivo,
        confianza,
        timestamp: new Date().toISOString(),
      }

      // Save to localStorage
      try {
        const existing = JSON.parse(localStorage.getItem("registros_acceso") || "[]")
        existing.push(registro)
        if (existing.length > 100) existing.splice(0, existing.length - 100)
        localStorage.setItem("registros_acceso", JSON.stringify(existing))
      } catch {}

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
  // AUDIO
  // ============================================================================

  const reproducirSonido = useCallback(
    (tipo: "success" | "warning" | "error") => {
      if (!config.sonidoHabilitado || !audioDesbloqueado) return
      const audio = audioRef.current[tipo]
      if (audio) {
        audio.currentTime = 0
        audio.play().catch(() => {})
      }
    },
    [config.sonidoHabilitado, audioDesbloqueado]
  )

  // ============================================================================
  // ACTIVATE SYSTEM
  // ============================================================================

  const activarSistema = useCallback(async () => {
    // Unlock audio
    try {
      audioRef.current.success = new Audio()
      audioRef.current.warning = new Audio()
      audioRef.current.error = new Audio()

      // Just play silence to unlock
      for (const key of ["success", "warning", "error"] as const) {
        const a = audioRef.current[key]
        if (a) {
          a.volume = 0.5
          await a.play().catch(() => {})
          a.pause()
          a.currentTime = 0
        }
      }
      setAudioDesbloqueado(true)
    } catch {}

    // Activate camera
    await activarCamara()

    // Start auto-scan
    if (config.deteccionAutomatica) {
      // Small delay for camera to stabilize
      setTimeout(() => {
        iniciarEscaneo()
      }, 1000)
    }
  }, [activarCamara, config.deteccionAutomatica, iniciarEscaneo])

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  function getEstadoConfig(estadoMem: EstadoMembresia) {
    switch (estadoMem) {
      case "permitido":
        return {
          color: "text-success",
          border: "border-success",
          bg: "bg-success/10",
          glow: "shadow-[0_0_40px_rgba(75,181,67,0.3)]",
          icon: <CheckCircle className="h-16 w-16 text-success" />,
          title: "BIENVENIDO",
          message: "Que tengas un excelente entrenamiento!",
        }
      case "proximo_vencer":
        return {
          color: "text-warning",
          border: "border-warning",
          bg: "bg-warning/10",
          glow: "shadow-[0_0_40px_rgba(255,215,0,0.3)]",
          icon: <AlertTriangle className="h-16 w-16 text-warning" />,
          title: "BIENVENIDO",
          message: "",
        }
      case "vencida":
        return {
          color: "text-destructive",
          border: "border-destructive",
          bg: "bg-destructive/10",
          glow: "shadow-[0_0_40px_rgba(255,0,0,0.3)]",
          icon: <XCircle className="h-16 w-16 text-destructive" />,
          title: "ACCESO DENEGADO",
          message: "Por favor, renueva tu membresia en recepcion",
        }
      case "sin_pago":
        return {
          color: "text-destructive",
          border: "border-destructive",
          bg: "bg-destructive/10",
          glow: "shadow-[0_0_40px_rgba(255,0,0,0.3)]",
          icon: <XCircle className="h-16 w-16 text-destructive" />,
          title: "ACCESO DENEGADO",
          message: "Membresia sin pagar - Realiza tu pago en recepcion",
        }
      case "sin_membresia":
        return {
          color: "text-destructive",
          border: "border-destructive",
          bg: "bg-destructive/10",
          glow: "shadow-[0_0_40px_rgba(255,0,0,0.3)]",
          icon: <XCircle className="h-16 w-16 text-destructive" />,
          title: "ACCESO DENEGADO",
          message: "Dirigete a recepcion para adquirir una membresia",
        }
      default:
        return {
          color: "text-destructive",
          border: "border-destructive",
          bg: "bg-destructive/10",
          glow: "shadow-[0_0_40px_rgba(255,0,0,0.3)]",
          icon: <XCircle className="h-16 w-16 text-destructive" />,
          title: "NO REGISTRADO",
          message: "Por favor, dirigete a recepcion para registrarte",
        }
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden select-none">
      {/* Header */}
      <header className="flex-shrink-0 py-5 text-center border-b border-accent/20" style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className="flex items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
            <ScanFace className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-widest text-primary">HEXODUS</h1>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">Sistema de Reconocimiento Facial</p>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="relative w-full max-w-[850px] aspect-[4/3]">
          {/* Video Feed */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-accent/40 glow-accent bg-card">
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
              <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-20">
                <div className="text-center">
                  <Loader2 className="h-16 w-16 text-accent animate-spin mx-auto mb-4" />
                  <p className="text-xl font-bold text-accent">Inicializando Sistema...</p>
                  <p className="text-sm text-muted-foreground mt-2">Cargando modelos de reconocimiento</p>
                </div>
              </div>
            )}

            {/* Activation Button State */}
            {estado === "listo" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/95 z-20">
                <div className="text-center">
                  <Volume2 className="h-20 w-20 text-accent mx-auto mb-6 animate-pulse" />
                  <h2 className="text-3xl font-bold text-foreground mb-3">Sistema Listo</h2>
                  <p className="text-muted-foreground mb-8 text-lg">Presiona el boton para activar el sistema</p>
                  <button
                    onClick={activarSistema}
                    className="flex items-center gap-3 mx-auto px-10 py-5 text-xl font-bold rounded-xl text-primary-foreground transition-all duration-300 hover:scale-105 glow-primary"
                    style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
                  >
                    <PlayCircle className="h-7 w-7" />
                    ACTIVAR SISTEMA
                  </button>
                  <p className="text-xs text-muted-foreground mt-5">
                    Esto habilitara el audio y el reconocimiento facial
                  </p>
                </div>
              </div>
            )}

            {/* Scanning Overlay */}
            {estado === "escaneando" && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="text-center" style={{ background: "rgba(16,16,20,0.6)", padding: "2rem 3rem", borderRadius: "1rem" }}>
                  <ScanFace className="h-24 w-24 text-accent mx-auto mb-4 animate-pulse" />
                  <h2 className="text-2xl font-bold text-accent mb-2">Acercate al Escaner</h2>
                  <p className="text-muted-foreground">Posiciona tu rostro frente a la camara</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-accent animate-pulse" />
                    <span className="text-muted-foreground text-sm">Esperando...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Result Overlay */}
            {estado === "resultado" && resultado && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/80 backdrop-blur-sm animate-fade-in-up">
                {(() => {
                  const cfg = getEstadoConfig(resultado.estado)
                  return (
                    <div
                      className={`bg-card border-2 ${cfg.border} rounded-2xl p-8 max-w-md w-full mx-4 text-center ${cfg.glow}`}
                    >
                      {/* Photo */}
                      <div className="mb-4 flex justify-center">
                        {resultado.socio?.foto ? (
                          <img
                            src={resultado.socio.foto}
                            alt="Foto socio"
                            className={`w-28 h-28 rounded-full border-4 ${cfg.border} object-cover`}
                            style={{ boxShadow: "0 0 30px rgba(0,191,255,0.5)" }}
                          />
                        ) : (
                          <div
                            className={`w-28 h-28 rounded-full border-4 ${cfg.border} bg-muted flex items-center justify-center`}
                            style={{ boxShadow: "0 0 30px rgba(0,191,255,0.3)" }}
                          >
                            <User className="h-14 w-14 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        {resultado.socio?.nombre || "Rostro No Registrado"}
                      </h2>

                      {/* Status badge */}
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${cfg.bg} border ${cfg.border} mb-4`}>
                        {cfg.icon && <span className="[&>svg]:h-5 [&>svg]:w-5">{cfg.icon}</span>}
                        <span className={`text-lg font-black ${cfg.color}`}>{cfg.title}</span>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-left mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Membresia:</span>
                          <span className="font-semibold text-foreground">{resultado.membresia}</span>
                        </div>
                        {resultado.vencimiento && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Vencimiento:</span>
                            <span className="font-semibold text-foreground">{resultado.vencimiento}</span>
                          </div>
                        )}
                      </div>

                      {/* Warning for expiring soon */}
                      {resultado.estado === "proximo_vencer" && (
                        <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 mb-4">
                          <p className="text-warning text-sm font-semibold">
                            Tu membresia vence en {resultado.diasRestantes} dia(s)
                          </p>
                        </div>
                      )}

                      {/* Message */}
                      <p className="text-muted-foreground text-sm mb-4">{cfg.message}</p>

                      {/* Countdown */}
                      <div className="flex items-center justify-center gap-2 text-accent text-sm font-medium">
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
              <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-20">
                <div className="text-center">
                  <AlertTriangle className="h-20 w-20 text-destructive mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
                  <p className="text-muted-foreground">No se pudo inicializar el sistema de reconocimiento</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}