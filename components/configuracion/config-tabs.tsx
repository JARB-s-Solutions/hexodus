"use client"

import { Palette, Globe, Bell, Settings } from "lucide-react"

export type ConfigTab = "apariencia" | "idioma" | "notificaciones" | "avanzado"

const tabs: { id: ConfigTab; label: string; icon: typeof Palette }[] = [
  { id: "apariencia", label: "Apariencia", icon: Palette },
  { id: "idioma", label: "Idioma y Region", icon: Globe },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
  { id: "avanzado", label: "Avanzado", icon: Settings },
]

interface ConfigTabsProps {
  activeTab: ConfigTab
  onTabChange: (tab: ConfigTab) => void
}

export function ConfigTabs({ activeTab, onTabChange }: ConfigTabsProps) {
  return (
    <div className="bg-card rounded-xl p-2 border border-border">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3
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
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
