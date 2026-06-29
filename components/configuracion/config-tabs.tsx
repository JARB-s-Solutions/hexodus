"use client"

import { Palette, Shield, Bell, CreditCard, Receipt, Database } from "lucide-react"

export type ConfigTab = "apariencia" | "roles" | "notificaciones" | "backups" | "metodosPago" | "datosTicket"

const tabs: { id: ConfigTab; label: string; icon: typeof Palette }[] = [
  { id: "apariencia", label: "Apariencia", icon: Palette },
  { id: "roles", label: "Roles y Permisos", icon: Shield },
  { id: "notificaciones", label: "Alertas", icon: Bell },
  { id: "backups", label: "Respaldos", icon: Database },
  { id: "datosTicket", label: "Datos del Ticket", icon: Receipt },
  { id: "metodosPago", label: "Métodos de Pago", icon: CreditCard },
]

interface ConfigTabsProps {
  activeTab: ConfigTab
  onTabChange: (tab: ConfigTab) => void
}

export function ConfigTabs({ activeTab, onTabChange }: ConfigTabsProps) {
  return (
    <div className="bg-card rounded-xl p-2 border border-border">
      <div className="custom-scrollbar flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                min-w-[132px] shrink-0 flex items-center justify-center gap-2 px-4 py-3 md:flex-1 md:min-w-[140px] md:px-5
                rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden
                ${
                  isActive
                    ? "bg-accent/15 border-2 border-accent text-foreground"
                    : "bg-muted/50 border-2 border-transparent text-muted-foreground hover:bg-muted/80 hover:border-accent/30 hover:text-accent hover:-translate-y-0.5"
                }
              `}
              style={
                isActive
                  ? {
                      boxShadow:
                        "0 0 20px rgba(0,191,255,0.4), inset 0 0 20px rgba(0,191,255,0.1)",
                    }
                  : undefined
              }
            >
              <tab.icon
                className={`h-5 w-5 transition-all duration-300 ${
                  isActive ? "text-accent" : ""
                }`}
                style={
                  isActive
                    ? { filter: "drop-shadow(0 0 8px rgba(0,191,255,0.6))" }
                    : undefined
                }
              />
              <span className="truncate">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
