"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ThemeService, type ThemeConfig } from '@/lib/services/theme'

interface ThemeContextType {
  theme: ThemeConfig
  actualizarTema: (updates: Partial<ThemeConfig>) => void
  restablecerTema: () => void
  subirLogo: (file: File) => Promise<string>
  eliminarLogo: () => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(() => ThemeService.cargarTema())
  const [isLoading, setIsLoading] = useState(true)

  // Cargar y aplicar tema al montar
  useEffect(() => {
    const loadedTheme = ThemeService.cargarTema()
    setTheme(loadedTheme)
    ThemeService.aplicarTema(loadedTheme)
    setIsLoading(false)
  }, [])

  // Escuchar cambios de preferencia de sistema cuando el modo es 'auto'
  useEffect(() => {
    if (theme.modoTema !== 'auto') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      ThemeService.aplicarTema(theme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const actualizarTema = (updates: Partial<ThemeConfig>) => {
    const updated = ThemeService.guardarTema(updates)
    setTheme(updated)
  }

  const restablecerTema = () => {
    const defaultTheme = ThemeService.restablecerTema()
    setTheme(defaultTheme)
  }

  const subirLogo = async (file: File): Promise<string> => {
    try {
      const logoBase64 = await ThemeService.subirLogo(file)
      const updated = ThemeService.cargarTema()
      setTheme(updated)
      return logoBase64
    } catch (error) {
      throw error
    }
  }

  const eliminarLogo = () => {
    ThemeService.eliminarLogo()
    const updated = ThemeService.cargarTema()
    setTheme(updated)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        actualizarTema,
        restablecerTema,
        subirLogo,
        eliminarLogo,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider')
  }
  return context
}
