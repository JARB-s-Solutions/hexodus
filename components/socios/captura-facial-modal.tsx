"use client"

import { useState, useEffect, useRef } from "react"
import { X, ScanFace, Camera, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { initializeFaceAPI, detectFaceDescriptor } from "@/lib/faceapi-config"

interface CapturaFacialModalProps {
  open: boolean
  onClose: () => void
  onCapture: (imageData: string, faceEncoding?: number[]) => void
}

export function CapturaFacialModal({ open, onClose, onCapture }: CapturaFacialModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsReady, setModelsReady] = useState(false)
  const [cameraStatus, setCameraStatus] = useState<"idle" | "requesting" | "active" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [facialDetected, setFacialDetected] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [currentDescriptor, setCurrentDescriptor] = useState<number[] | null>(null)

  // Inicializar Face-API y cámara cuando el modal se abre
  useEffect(() => {
    if (open) {
      loadModelsAndInitCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [open])

  // Detectar rostro continuamente mientras la cámara está activa
  useEffect(() => {
    if (cameraStatus === "active" && modelsReady && !capturing) {
      startFaceDetection()
    } else {
      stopFaceDetection()
    }

    return () => {
      stopFaceDetection()
    }
  }, [cameraStatus, modelsReady, capturing])

  const loadModelsAndInitCamera = async () => {
    try {
      setModelsLoading(true)
      console.log("📦 Cargando modelos de Face-API.js...")
      
      await initializeFaceAPI()
      
      setModelsReady(true)
      console.log("✅ Modelos cargados, iniciando cámara...")
      
      await initCamera()
    } catch (error) {
      console.error("❌ Error cargando modelos:", error)
      setCameraStatus("error")
      setErrorMessage("Error al cargar los modelos de reconocimiento facial. Por favor, recarga la página.")
    } finally {
      setModelsLoading(false)
    }
  }

  const startFaceDetection = () => {
    if (detectionIntervalRef.current) return

    // Detectar rostro cada 500ms
    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || capturing) return

      try {
        const descriptor = await detectFaceDescriptor(videoRef.current)
        
        if (descriptor) {
          setFacialDetected(true)
          setCurrentDescriptor(descriptor)
          console.log("✅ Rostro detectado con", descriptor.length, "dimensiones")
        } else {
          setFacialDetected(false)
          setCurrentDescriptor(null)
        }
      } catch (error) {
        console.error("Error en detección:", error)
      }
    }, 500)
  }

  const stopFaceDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
  }

  const initCamera = async () => {
    try {
      setCameraStatus("requesting")
      setErrorMessage("")

      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user" // Cámara frontal
        },
        audio: false
      })

      streamRef.current = stream

      // Asignar stream al video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setCameraStatus("active")
        }
      }

      console.log("✅ Cámara inicializada correctamente")
    } catch (error: any) {
      console.error("❌ Error al acceder a la cámara:", error)
      setCameraStatus("error")

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setErrorMessage("Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.")
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setErrorMessage("No se encontró ninguna cámara conectada. Por favor, conecta una cámara web.")
      } else if (error.name === "NotReadableError") {
        setErrorMessage("La cámara está siendo usada por otra aplicación. Por favor, cierra otras aplicaciones que puedan estar usando la cámara.")
      } else {
        setErrorMessage("Error al acceder a la cámara. Por favor, intenta nuevamente.")
      }
    }
  }

  const stopCamera = () => {
    stopFaceDetection()

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraStatus("idle")
    setFacialDetected(false)
    setCapturing(false)
    setCountdown(null)
    setCurrentDescriptor(null)
  }

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Dibujar el frame actual del video en el canvas
    const context = canvas.getContext("2d")
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convertir a base64
      const imageData = canvas.toDataURL("image/jpeg", 0.9)

      return imageData
    }

    return null
  }

  const handleConfirmarCaptura = async () => {
    if (!facialDetected || capturing || !currentDescriptor) return

    setCapturing(true)

    // Countdown de 3 segundos
    for (let i = 3; i > 0; i--) {
      setCountdown(i)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setCountdown(null)

    // Capturar imagen
    const imageData = captureImage()

    if (imageData && currentDescriptor) {
      console.log("📸 Imagen capturada correctamente")
      console.log("🧬 Descriptor facial generado:", currentDescriptor.length, "dimensiones")
      
      // Retornar imagen y descriptor facial real
      onCapture(imageData, currentDescriptor)
      stopCamera()
      onClose()
    } else {
      setErrorMessage("Error al capturar la imagen. Por favor, intenta nuevamente.")
      setCapturing(false)
    }
  }

  const handleReintentar = () => {
    setErrorMessage("")
    loadModelsAndInitCamera()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && cameraStatus !== "requesting") onClose() }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: "linear-gradient(180deg, rgba(22,24,36,0.97), rgba(18,20,32,0.95))",
          border: "1px solid rgba(255,255,255,0.09)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ScanFace className="h-5 w-5 text-accent" />
            Captura Facial para Acceso
          </h3>
          <button
            onClick={onClose}
            disabled={capturing || cameraStatus === "requesting"}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Camera View */}
          <div className="relative w-full aspect-video bg-background rounded-xl overflow-hidden mb-4 border border-border">
            {/* Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraStatus === "active" ? "block" : "hidden"}`}
            />

            {/* Canvas oculto para captura */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay Circle for Face Detection */}
            {cameraStatus === "active" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`w-64 h-64 rounded-full border-4 transition-all duration-300 ${
                    facialDetected
                      ? "border-[#22C55E] shadow-[0_0_30px_rgba(34,197,94,0.6)]"
                      : "border-accent/50 border-dashed"
                  }`}
                >
                  {facialDetected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CheckCircle2 className="h-12 w-12 text-[#22C55E] animate-scale-in" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-8xl font-bold text-white animate-ping-once">
                  {countdown}
                </div>
              </div>
            )}

            {/* Status Text */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              {cameraStatus === "active" && !capturing && (
                <>
                  <p className="text-sm font-medium text-foreground backdrop-blur-sm bg-background/80 inline-block px-4 py-2 rounded-full">
                    Posiciona tu rostro en el círculo
                  </p>
                  <p className={`text-xs mt-2 ${facialDetected ? "text-[#22C55E]" : "text-muted-foreground"}`}>
                    {facialDetected ? "✓ Rostro detectado correctamente" : "Esperando detección..."}
                  </p>
                </>
              )}
            </div>

            {/* Loading State */}
            {(cameraStatus === "requesting" || modelsLoading) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 text-accent animate-spin" />
                <p className="text-sm text-muted-foreground">
                  {modelsLoading ? "Cargando modelos de reconocimiento facial..." : "Solicitando acceso a la cámara..."}
                </p>
              </div>
            )}

            {/* Error State */}
            {cameraStatus === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                <AlertCircle className="h-16 w-16 text-destructive" />
                <p className="text-sm text-center text-destructive font-medium">{errorMessage}</p>
                <button
                  onClick={handleReintentar}
                  className="mt-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Idle State */}
            {cameraStatus === "idle" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <Camera className="h-20 w-20 text-accent/40" />
                  <p className="text-sm text-muted-foreground">Presiona "Iniciar Cámara" para comenzar</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Instrucciones
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Asegúrate de tener buena iluminación</li>
              <li>Mira directamente a la cámara</li>
              <li>Mantén una expresión neutral</li>
              <li>Evita usar lentes o accesorios que cubran tu rostro</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={capturing || cameraStatus === "requesting"}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition disabled:opacity-50"
            >
              Cancelar
            </button>

            {cameraStatus === "idle" && !modelsLoading && (
              <button
                type="button"
                onClick={loadModelsAndInitCamera}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl text-primary-foreground bg-accent hover:bg-accent/90 transition-all glow-accent"
              >
                <Camera className="h-4 w-4" />
                Iniciar Cámara
              </button>
            )}

            {cameraStatus === "active" && (
              <button
                type="button"
                onClick={handleConfirmarCaptura}
                disabled={!facialDetected || capturing}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-primary"
              >
                {capturing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Capturando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmar Captura
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
