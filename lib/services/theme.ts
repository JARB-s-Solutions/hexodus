/**
 * Servicio de gestión de tema y personalización visual
 * Maneja la persistencia en localStorage y aplicación de colores en tiempo real
 */

import { ConfiguracionService } from '@/lib/services/configuracion'

export interface ThemeConfig {
  colorPrincipal: string
  colorSecundario: string
  modoTema: "dark" | "light" | "auto"
  nombreSistema: string
  logoSistema: string | null
}

const STORAGE_KEY = 'hexodus_theme_config'
const DEFAULT_THEME: ThemeConfig = {
  colorPrincipal: '#FF3B3B',
  colorSecundario: '#00BFFF',
  modoTema: 'dark',
  nombreSistema: 'HEXODUS',
  logoSistema: null
}

export class ThemeService {
  private static persistTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Cargar configuración de tema desde localStorage
   */
  static cargarTema(): ThemeConfig {
    if (typeof window === 'undefined') return DEFAULT_THEME

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return DEFAULT_THEME

      const parsed = JSON.parse(stored)
      return { ...DEFAULT_THEME, ...parsed }
    } catch (error) {
      console.error('Error cargando tema:', error)
      return DEFAULT_THEME
    }
  }

  /**
   * Guardar configuración de tema en localStorage
   */
  static guardarTema(
    config: Partial<ThemeConfig>,
    options?: { skipRemoteSync?: boolean }
  ): ThemeConfig {
    if (typeof window === 'undefined') return DEFAULT_THEME

    try {
      const current = this.cargarTema()
      const updated = { ...current, ...config }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      
      // Aplicar cambios inmediatamente
      this.aplicarTema(updated)

      // Persistir en backend sin bloquear la UI
      if (!options?.skipRemoteSync) {
        this.programarPersistenciaRemota(updated)
      }
      
      return updated
    } catch (error) {
      console.error('Error guardando tema:', error)
      return DEFAULT_THEME
    }
  }

  /**
   * Aplicar tema al DOM usando CSS variables
   */
  static aplicarTema(config: ThemeConfig): void {
    if (typeof window === 'undefined') return

    const root = document.documentElement

    // Aplicar colores usando CSS variables
    root.style.setProperty('--color-principal', config.colorPrincipal)
    root.style.setProperty('--color-secundario', config.colorSecundario)
    
    // Calcular variaciones del color principal para diferentes opacidades
    root.style.setProperty('--color-principal-rgb', this.hexToRgb(config.colorPrincipal))
    root.style.setProperty('--color-secundario-rgb', this.hexToRgb(config.colorSecundario))

    // Calcular colores de texto óptimos (blanco o negro según luminosidad)
    root.style.setProperty('--color-principal-foreground', this.obtenerColorTextoOptimo(config.colorPrincipal))
    root.style.setProperty('--color-secundario-foreground', this.obtenerColorTextoOptimo(config.colorSecundario))

    // Aplicar modo de tema
    this.aplicarModoTema(config.modoTema)

    // Disparar evento personalizado para que los componentes reaccionen
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: config }))
  }

  /**
   * Aplicar modo oscuro/claro
   */
  private static aplicarModoTema(modo: ThemeConfig['modoTema']): void {
    const root = document.documentElement

    if (modo === 'auto') {
      // Usar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
      root.classList.toggle('light', !prefersDark)
    } else {
      root.classList.toggle('dark', modo === 'dark')
      root.classList.toggle('light', modo === 'light')
    }
  }

  /**
   * Convertir HEX a RGB para CSS variables
   */
  private static hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return '255, 59, 59' // Fallback al color por defecto
    
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
  }

  /**
   * Calcular luminosidad percibida de un color (0-255)
   * Usa la fórmula estándar de luminosidad relativa
   */
  private static calcularLuminosidad(hex: string): number {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return 128 // Valor medio por defecto
    
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    
    // Fórmula de luminosidad percibida (ITU-R BT.601)
    return 0.299 * r + 0.587 * g + 0.114 * b
  }

  /**
   * Determinar si un color es claro u oscuro
   * Retorna el color de texto óptimo (blanco para colores oscuros, negro para claros)
   */
  private static obtenerColorTextoOptimo(hex: string): string {
    const luminosidad = this.calcularLuminosidad(hex)
    // Si la luminosidad es mayor a 128 (medio), usar texto oscuro
    // Si es menor, usar texto claro
    return luminosidad > 128 ? '#000000' : '#FFFFFF'
  }

  /**
   * Subir logo y guardarlo como base64 en localStorage
   */
  static async subirLogo(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        reject(new Error('El archivo debe ser una imagen'))
        return
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        reject(new Error('El logo debe ser menor a 2MB'))
        return
      }

      const reader = new FileReader()
      
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        
        // Guardar logo en la configuración
        const config = this.cargarTema()
        this.guardarTema({ ...config, logoSistema: base64 })
        
        resolve(base64)
      }
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'))
      }
      
      reader.readAsDataURL(file)
    })
  }

  /**
   * Eliminar logo personalizado
   */
  static eliminarLogo(): void {
    const config = this.cargarTema()
    this.guardarTema({ ...config, logoSistema: null })

    void ConfiguracionService.eliminarLogoApariencia().catch((error) => {
      console.error('Error eliminando logo de apariencia en backend:', error)
    })
  }

  /**
   * Restablecer tema a valores por defecto
   */
  static restablecerTema(): ThemeConfig {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    this.aplicarTema(DEFAULT_THEME)
    this.programarPersistenciaRemota(DEFAULT_THEME)
    return DEFAULT_THEME
  }

  /**
   * Obtener el tema por defecto
   */
  static obtenerTemaPorDefecto(): ThemeConfig {
    return { ...DEFAULT_THEME }
  }

  /**
   * Cargar configuración de apariencia desde backend y reflejarla localmente.
   */
  static async sincronizarConBackend(): Promise<ThemeConfig | null> {
    if (typeof window === 'undefined') return null

    // En rutas públicas (ej. login) no debe intentarse sincronizar sin sesión,
    // porque un 401 dispara redirección global y provoca recargas repetidas.
    const token = localStorage.getItem('auth_token')
    if (!token) return null

    try {
      const response = await ConfiguracionService.obtenerConfiguracionUnificada()
      const data = response.data
      const remoteTheme: ThemeConfig = {
        colorPrincipal: data.colorPrincipal,
        colorSecundario: data.colorSecundario,
        modoTema: data.modoTema,
        nombreSistema: data.nombreSistema,
        logoSistema: data.logoSistema,
      }

      const updated = this.guardarTema(remoteTheme, { skipRemoteSync: true })
      this.aplicarTema(updated)
      return updated
    } catch (error) {
      console.warn('No se pudo sincronizar apariencia con backend, se mantiene configuración local')
      return null
    }
  }

  private static programarPersistenciaRemota(config: ThemeConfig): void {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer)
    }

    this.persistTimer = setTimeout(() => {
      void ConfiguracionService.actualizarSoloApariencia({
        colorPrincipal: config.colorPrincipal,
        colorSecundario: config.colorSecundario,
        modoTema: config.modoTema,
        nombreSistema: config.nombreSistema,
        logoSistema: config.logoSistema,
      }).catch((error) => {
        console.error('Error guardando apariencia en backend:', error)
      })
    }, 400)
  }
}

/**
 * Hook personalizado para usar el tema en componentes React
 */
export function useTheme() {
  if (typeof window === 'undefined') {
    return {
      theme: DEFAULT_THEME,
      actualizarTema: () => {},
      restablecerTema: () => {},
    }
  }

  const [theme, setTheme] = React.useState<ThemeConfig>(ThemeService.cargarTema())

  React.useEffect(() => {
    // Cargar y aplicar tema inicial
    const loadedTheme = ThemeService.cargarTema()
    setTheme(loadedTheme)
    ThemeService.aplicarTema(loadedTheme)

    // Escuchar cambios de tema
    const handleThemeChange = (e: CustomEvent<ThemeConfig>) => {
      setTheme(e.detail)
    }

    window.addEventListener('theme-changed', handleThemeChange as EventListener)

    return () => {
      window.removeEventListener('theme-changed', handleThemeChange as EventListener)
    }
  }, [])

  const actualizarTema = React.useCallback((updates: Partial<ThemeConfig>) => {
    const updated = ThemeService.guardarTema(updates)
    setTheme(updated)
  }, [])

  const restablecerTema = React.useCallback(() => {
    const defaultTheme = ThemeService.restablecerTema()
    setTheme(defaultTheme)
  }, [])

  return {
    theme,
    actualizarTema,
    restablecerTema,
  }
}

// Import React for the hook
import React from 'react'
