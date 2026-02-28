"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { AsistenciaHeader } from "@/components/asistencia/asistencia-header"
import { KpiAsistenciaCards } from "@/components/asistencia/kpi-asistencia"
import { PanelEscaneo } from "@/components/asistencia/panel-escaneo"
import { HistorialRegistros } from "@/components/asistencia/historial-registros"
import {
  generateDemoRegistros,
  computeKpis,
  DEFAULT_CONFIG,
  type RegistroAcceso,
  type ConfigRegistro,
} from "@/lib/asistencia-data"

const initialRegistros = generateDemoRegistros(25)

export default function AsistenciaPage() {
  const [registros, setRegistros] = useState<RegistroAcceso[]>(initialRegistros)
  const [config, setConfig] = useState<ConfigRegistro>(DEFAULT_CONFIG)
  const [pantallaAbierta, setPantallaAbierta] = useState(false)
  const [sistemaListo, setSistemaListo] = useState(false)
  const ventanaRef = useRef<Window | null>(null)

  // Simulate system ready after mount
  useEffect(() => {
    const timer = setTimeout(() => setSistemaListo(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Check if client window is still open
  useEffect(() => {
    const interval = setInterval(() => {
      if (ventanaRef.current && ventanaRef.current.closed) {
        ventanaRef.current = null
        setPantallaAbierta(false)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Listen for messages from scanner window
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.tipo === "registro_acceso") {
        setRegistros((prev) => [event.data.datos, ...prev])
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // Save config to localStorage for scanner window
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("config_registro_cliente", JSON.stringify(config))
    }
  }, [config])

  const kpis = computeKpis(registros)

  const handleAbrirPantalla = useCallback(() => {
    if (ventanaRef.current && !ventanaRef.current.closed) {
      ventanaRef.current.focus()
      return
    }

    const ancho = screen.width
    const alto = screen.height
    const ventana = window.open(
      "/asistencia/escaneo",
      "VentanaEscaneo",
      `width=${ancho},height=${alto},left=0,top=0,fullscreen=yes,location=no,menubar=no,toolbar=no,status=no`
    )

    if (ventana) {
      ventanaRef.current = ventana
      setPantallaAbierta(true)

      // Send config once window is loaded
      ventana.addEventListener("load", () => {
        setTimeout(() => {
          ventana.postMessage(
            { tipo: "configuracion", config },
            window.location.origin
          )
        }, 1000)
      })
    }
  }, [config])

  const handleCerrarPantalla = useCallback(() => {
    if (ventanaRef.current && !ventanaRef.current.closed) {
      ventanaRef.current.close()
      ventanaRef.current = null
      setPantallaAbierta(false)
    }
  }, [])

  const handleLimpiarHistorial = useCallback(() => {
    if (confirm("Deseas limpiar el historial de registros de hoy?")) {
      setRegistros([])
    }
  }, [])

  const handleConfigChange = useCallback(
    (newConfig: ConfigRegistro) => {
      setConfig(newConfig)
      // Sync with client window
      if (ventanaRef.current && !ventanaRef.current.closed) {
        ventanaRef.current.postMessage(
          { tipo: "configuracion", config: newConfig },
          window.location.origin
        )
      }
    },
    []
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="asistencia" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5">
        <AsistenciaHeader />

        {/* KPIs */}
        <KpiAsistenciaCards data={kpis} />

        {/* Main content: Control + History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
          {/* Left: Scanner control + config */}
          <div className="lg:col-span-1">
            <PanelEscaneo
              config={config}
              onConfigChange={handleConfigChange}
              pantallaAbierta={pantallaAbierta}
              sistemaListo={sistemaListo}
              onAbrirPantalla={handleAbrirPantalla}
              onCerrarPantalla={handleCerrarPantalla}
            />
          </div>

          {/* Right: History */}
          <div className="lg:col-span-2">
            <HistorialRegistros
              registros={registros}
              onLimpiar={handleLimpiarHistorial}
            />
          </div>
        </div>
      </main>
    </div>
  )
}