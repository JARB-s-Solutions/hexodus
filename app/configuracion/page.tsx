"use client"

import { useState, useCallback, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { ConfigHeader } from "@/components/configuracion/config-header"
import { ConfigTabs, type ConfigTab } from "@/components/configuracion/config-tabs"
import { ConfigSidebar } from "@/components/configuracion/config-sidebar"
import { AparienciaTab } from "@/components/configuracion/apariencia-tab"
import { IdiomaTab } from "@/components/configuracion/idioma-tab"
import { NotificacionesTab } from "@/components/configuracion/notificaciones-tab"
import { AvanzadoTab } from "@/components/configuracion/avanzado-tab"
import { MetodosPagoTab } from "@/components/configuracion/metodos-pago-tab"
import { DatosTicketTab } from "@/components/configuracion/datos-ticket-tab"
import { defaultConfig, type ConfigState } from "@/components/configuracion/config-types"
import { ConfiguracionService } from "@/lib/services/configuracion"

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("apariencia")
  const [config, setConfig] = useState<ConfigState>({ ...defaultConfig })
  const [savedConfig, setSavedConfig] = useState<ConfigState>({ ...defaultConfig })
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
  const [loading, setLoading] = useState(false)

  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig)

  // Cargar configuración del gimnasio desde el backend
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const response = await ConfiguracionService.obtenerConfiguracion()
        const configGimnasio = response.data
        
        setConfig((prev) => ({
          ...prev,
          gimnasioNombre: configGimnasio.gimnasioNombre,
          gimnasioDomicilio: configGimnasio.gimnasioDomicilio,
          gimnasioTelefono: configGimnasio.gimnasioTelefono,
          gimnasioRFC: configGimnasio.gimnasioRFC,
          gimnasioLogo: configGimnasio.gimnasioLogo,
          ticketFooter: configGimnasio.ticketFooter,
          ticketMensajeAgradecimiento: configGimnasio.ticketMensajeAgradecimiento,
        }))
        
        setSavedConfig((prev) => ({
          ...prev,
          gimnasioNombre: configGimnasio.gimnasioNombre,
          gimnasioDomicilio: configGimnasio.gimnasioDomicilio,
          gimnasioTelefono: configGimnasio.gimnasioTelefono,
          gimnasioRFC: configGimnasio.gimnasioRFC,
          gimnasioLogo: configGimnasio.gimnasioLogo,
          ticketFooter: configGimnasio.ticketFooter,
          ticketMensajeAgradecimiento: configGimnasio.ticketMensajeAgradecimiento,
        }))
      } catch (error) {
        console.error('Error cargando configuración del gimnasio:', error)
        // No mostrar error, usar valores por defecto
      }
    }

    cargarConfiguracion()
  }, [])

  const handleChange = useCallback((updates: Partial<ConfigState>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleGuardar = useCallback(async () => {
    setLoading(true)
    
    try {
      // Si estamos en el tab de Datos del Ticket, guardar en el backend
      if (activeTab === "datosTicket") {
        const configGimnasio = {
          gimnasioNombre: config.gimnasioNombre,
          gimnasioDomicilio: config.gimnasioDomicilio,
          gimnasioTelefono: config.gimnasioTelefono,
          gimnasioRFC: config.gimnasioRFC,
          gimnasioLogo: config.gimnasioLogo,
          ticketFooter: config.ticketFooter,
          ticketMensajeAgradecimiento: config.ticketMensajeAgradecimiento,
        }
        
        await ConfiguracionService.guardarConfiguracion(configGimnasio)
      }
      
      // Guardar en estado local
      setSavedConfig({ ...config })
      setNotification({ message: "Configuracion guardada exitosamente", type: "success" })
    } catch (error: any) {
      console.error('Error guardando configuración:', error)
      setNotification({ message: error.message || "Error al guardar la configuracion", type: "error" })
    } finally {
      setLoading(false)
      setTimeout(() => setNotification(null), 3000)
    }
  }, [config, activeTab])

  const handleRestablecer = useCallback(() => {
    setConfig({ ...defaultConfig })
    setSavedConfig({ ...defaultConfig })
    setNotification({ message: "Configuracion restablecida a valores por defecto", type: "info" })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="configuracion" />

      <main className="flex-1 flex flex-col min-h-0">
        <ConfigHeader />

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-5">
          {/* Tab Navigation - full width, no KPIs */}
          <ConfigTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Content: sidebar (1/3) + tab content (2/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Save + Status */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <ConfigSidebar
                hasChanges={hasChanges}
                loading={loading}
                onGuardar={handleGuardar}
                onRestablecer={handleRestablecer}
              />
            </div>

            {/* Right column - Tab Content */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              {activeTab === "apariencia" && (
                <AparienciaTab config={config} onChange={handleChange} />
              )}
              {activeTab === "idioma" && (
                <IdiomaTab config={config} onChange={handleChange} />
              )}
              {activeTab === "notificaciones" && (
                <NotificacionesTab config={config} onChange={handleChange} />
              )}
              {activeTab === "datosTicket" && (
                <DatosTicketTab config={config} onChange={handleChange} />
              )}
              {activeTab === "avanzado" && (
                <AvanzadoTab config={config} onChange={handleChange} />
              )}
              {activeTab === "metodosPago" && (
                <MetodosPagoTab />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`
            fixed top-5 right-5 z-50 px-5 py-3 rounded-lg text-sm font-medium text-foreground
            shadow-lg border-l-4 animate-slide-in-right max-w-[350px]
            ${notification.type === "success" ? "bg-[#22c55e] border-[#15803d]" : ""}
            ${notification.type === "error" ? "bg-destructive border-destructive" : ""}
            ${notification.type === "info" ? "bg-accent border-accent" : ""}
          `}
          style={{ color: "#fff" }}
        >
          {notification.message}
        </div>
      )}
    </div>
  )
}
