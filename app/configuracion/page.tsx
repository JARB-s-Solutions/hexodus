"use client"

import { useState, useCallback, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { ConfigHeader } from "@/components/configuracion/config-header"
import { ConfigTabs, type ConfigTab } from "@/components/configuracion/config-tabs"
import { ConfigSidebar } from "@/components/configuracion/config-sidebar"
import { AparienciaTab } from "@/components/configuracion/apariencia-tab"
import { RolesTab } from "@/components/configuracion/roles-tab"
import { NotificacionesTab } from "@/components/configuracion/notificaciones-tab"
import { BackupsTab } from "@/components/configuracion/backups-tab"
import { AvanzadoTab } from "@/components/configuracion/avanzado-tab"
import { MetodosPagoTab } from "@/components/configuracion/metodos-pago-tab"
import { DatosTicketTab } from "@/components/configuracion/datos-ticket-tab"
import { defaultConfig, type ConfigState } from "@/components/configuracion/config-types"
import { ConfiguracionService } from "@/lib/services/configuracion"
import { AlertasService } from "@/lib/services/alertas"
import { ThemeService } from "@/lib/services/theme"

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("apariencia")
  const [config, setConfig] = useState<ConfigState>({ ...defaultConfig })
  const [savedConfig, setSavedConfig] = useState<ConfigState>({ ...defaultConfig })
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
  const [loading, setLoading] = useState(false)

  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig)

  // Cargar configuración del gimnasio y de alertas desde el backend
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

    const cargarConfigAlertas = async () => {
      try {
        const data = await AlertasService.getConfiguracion()
        const alertasUpdate: Partial<typeof defaultConfig> = {
          notifVencimientos:    data.alertaVencimientosActiva,
          notifVencimientoDias: data.alertaVencimientosDias,
          notifInventario:      data.alertaStockActiva,
          notifStockMinimo:     data.alertaStockMinimo,
          notifInactividad:     data.alertaInactividadActiva,
          notifInactividadDias: data.alertaInactividadDias,
          notifPagosPendientes: data.alertaPagosActiva,
        }
        setConfig((prev) => ({ ...prev, ...alertasUpdate }))
        setSavedConfig((prev) => ({ ...prev, ...alertasUpdate }))
      } catch (error) {
        console.error('Error cargando configuración de alertas:', error)
        // No mostrar error, los valores por defecto del ConfigState son suficientes
      }
    }

    cargarConfiguracion()
    cargarConfigAlertas()
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

      // Si estamos en el tab de Notificaciones, guardar config de alertas en el backend
      if (activeTab === "notificaciones") {
        await AlertasService.actualizarConfiguracion({
          alertaVencimientosActiva: config.notifVencimientos,
          alertaVencimientosDias:   config.notifVencimientoDias,
          alertaStockActiva:        config.notifInventario,
          alertaStockMinimo:        config.notifStockMinimo,
          alertaInactividadActiva:  config.notifInactividad,
          alertaInactividadDias:    config.notifInactividadDias,
          alertaPagosActiva:        config.notifPagosPendientes,
        })
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
    // Si estamos en el tab de apariencia, usar el servicio de tema
    if (activeTab === "apariencia") {
      ThemeService.restablecerTema()
      setNotification({ message: "Tema restablecido a valores por defecto", type: "info" })
      setTimeout(() => setNotification(null), 3000)
      return
    }
    
    // Si estamos en el tab de roles, no hacer nada (el tab maneja su propia lógica)
    if (activeTab === "roles") {
      setNotification({ message: "Los roles del sistema no se pueden restablecer", type: "info" })
      setTimeout(() => setNotification(null), 3000)
      return
    }
    
    // Para otros tabs, restablecer config normal
    setConfig({ ...defaultConfig })
    setSavedConfig({ ...defaultConfig })
    setNotification({ message: "Configuracion restablecida a valores por defecto", type: "info" })
    setTimeout(() => setNotification(null), 3000)
  }, [activeTab])

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
                hideGuardar={activeTab === "apariencia" || activeTab === "roles" || activeTab === "backups"}
              />
            </div>

            {/* Right column - Tab Content */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              {activeTab === "apariencia" && (
                <AparienciaTab />
              )}
              {activeTab === "roles" && (
                <RolesTab />
              )}
              {activeTab === "notificaciones" && (
                <NotificacionesTab config={config} onChange={handleChange} />
              )}
              {activeTab === "backups" && (
                <BackupsTab config={config} onChange={handleChange} />
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
