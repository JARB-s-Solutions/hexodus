"use client"

import { useState, useEffect } from "react"
import { X, Fingerprint, CheckCircle2, AlertCircle } from "lucide-react"
import { FingerprintReader, SampleFormat } from '@digitalpersona/devices'

interface CapturaHuellaModalProps {
  open: boolean
  onClose: () => void
  onCapture: (template: string) => void
}

export function CapturaHuellaModal({ open, onClose, onCapture }: CapturaHuellaModalProps) {
  const [status, setStatus] = useState('Listo para capturar')
  const [capturing, setCapturing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (open) {
      setStatus('Listo para capturar')
      setCapturing(false)
      setSuccess(false)
      setError(null)
    }
  }, [open])

  const handleCapturar = async () => {

    setCapturing(true)
    setError(null)
    setStatus('🔍 Buscando lector de huellas...')

    const reader = new FingerprintReader()

    try {
      const devices = await reader.enumerateDevices()
      
      if (devices.length === 0) {
        throw new Error('No se detectó ningún lector de huellas. Conecta el dispositivo.')
      }

      setStatus('🟢 Lector detectado. Coloca tu dedo en el sensor...')
      console.log('✅ Lector detectado:', devices[0])

      reader.on('SamplesAcquired', (event: any) => {
        const template = event.samples[0].Data
        console.log('✅ Huella capturada:', template.substring(0, 50) + '...')
        
        reader.stopAcquisition()
        setStatus('✅ ¡Huella capturada exitosamente!')
        setSuccess(true)
        setCapturing(false)
        
        // Esperar un momento antes de cerrar para mostrar el éxito
        setTimeout(() => {
          onCapture(template)
          onClose()
        }, 1000)
      })

      reader.on('ErrorOccurred', (errorEvent: any) => {
        console.error('❌ Error del lector:', errorEvent)
        reader.stopAcquisition()
        setError(`Error del lector: ${errorEvent.message || 'Desconocido'}`)
        setStatus('❌ Error al capturar')
        setCapturing(false)
      })

      await reader.startAcquisition(SampleFormat.Intermediate, devices[0])
    } catch (err: any) {
      console.error('❌ Error en captura:', err)
      setError(err.message || 'Error desconocido al capturar huella')
      setStatus('❌ Error')
      setCapturing(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !capturing) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: "linear-gradient(180deg, rgba(22,24,36,0.97), rgba(18,20,32,0.95))",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-border/30"
          style={{ background: "linear-gradient(180deg, rgba(13,18,36,0.70), rgba(12,15,28,0.28))" }}
        >
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-accent" />
            Captura de Huella Dactilar
          </h3>
          <button 
            onClick={onClose} 
            disabled={capturing}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-6">
          {/* Icono animado */}
          <div className="flex justify-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
              success 
                ? 'bg-[#22C55E]/10 border-2 border-[#22C55E]' 
                : error 
                ? 'bg-red-500/10 border-2 border-red-500'
                : 'bg-accent/10 border-2 border-accent'
            } ${capturing ? 'animate-pulse' : ''}`}>
              {success ? (
                <CheckCircle2 className="h-12 w-12 text-[#22C55E]" />
              ) : error ? (
                <AlertCircle className="h-12 w-12 text-red-500" />
              ) : (
                <Fingerprint className="h-12 w-12 text-accent" />
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className={`text-lg font-semibold ${
              success 
                ? 'text-[#22C55E]' 
                : error 
                ? 'text-red-500'
                : 'text-foreground'
            }`}>
              {status}
            </p>
            {error && (
              <p className="text-sm text-red-400 mt-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}
          </div>

          {/* Instrucciones */}
          {!capturing && !success && !error && (
            <div className="text-sm text-muted-foreground bg-card/30 p-4 rounded-xl border border-border/30 text-left">
              <p className="font-semibold mb-2">📋 Instrucciones:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Conecta el lector de huellas al equipo</li>
                <li>Haz clic en "Capturar Huella"</li>
                <li>Coloca tu dedo en el sensor cuando se solicite</li>
                <li>Mantén el dedo firme hasta que se complete</li>
              </ol>
            </div>
          )}

          {/* Botón */}
          {!success && (
            <button
              type="button"
              onClick={handleCapturar}
              disabled={capturing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-xl text-primary-foreground bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {capturing ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Capturando...
                </>
              ) : (
                <>
                  <Fingerprint className="h-5 w-5" />
                  Capturar Huella
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
