"use client"

import { useRef, useState } from "react"
import { Upload, X, Image as ImageIcon, RotateCcw } from "lucide-react"
import { useTheme } from "@/components/theme-provider-custom"
import { useToast } from "@/hooks/use-toast"
import { ConfiguracionService } from "@/lib/services/configuracion"
import { ThemeService } from "@/lib/services/theme"

export function AparienciaTab() {
  const { theme, actualizarTema, subirLogo, eliminarLogo } = useTheme()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isRestoringAppearance, setIsRestoringAppearance] = useState(false)

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)

    try {
      await subirLogo(file)
      toast({
        title: "Logo actualizado",
        description: "El logo se ha actualizado correctamente",
      })
    } catch (error: any) {
      toast({
        title: "Error al subir logo",
        description: error.message || "No se pudo subir el logo",
        variant: "destructive",
      })
    } finally {
      setIsUploadingLogo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleEliminarLogo = () => {
    eliminarLogo()
    toast({
      title: "Logo eliminado",
      description: "Se ha eliminado el logo personalizado",
    })
  }

  const handleRestablecerApariencia = async () => {
    setIsRestoringAppearance(true)

    try {
      const response = await ConfiguracionService.restablecerApariencia()
      const data = response.data

      // Guardar en tema sin sincronizar al backend (ya lo hizo el endpoint)
      ThemeService.guardarTema(
        {
          colorPrincipal: data.colorPrincipal,
          colorSecundario: data.colorSecundario,
          modoTema: data.modoTema,
          nombreSistema: data.nombreSistema,
          logoSistema: data.logoSistema,
        },
        { skipRemoteSync: true }
      )

      toast({
        title: "Apariencia restablecida",
        description: "Los colores y logo han sido restaurados a valores de fábrica",
      })
    } catch (error: any) {
      toast({
        title: "Error al restablecer",
        description: error.message || "No se pudo restablecer la apariencia",
        variant: "destructive",
      })
    } finally {
      setIsRestoringAppearance(false)
    }
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border animate-fade-in-up">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-6 w-6 rounded-md bg-accent/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Apariencia y Tema</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Colors Section */}
        <div className="flex flex-col gap-5">
          <h3 className="text-base font-semibold text-foreground/80">Colores del Sistema</h3>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Color Principal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={theme.colorPrincipal}
                onChange={(e) => actualizarTema({ colorPrincipal: e.target.value })}
                className="w-12 h-10 rounded-lg border-2 border-border cursor-pointer hover:border-accent transition-colors bg-transparent"
              />
              <input
                type="text"
                value={theme.colorPrincipal}
                onChange={(e) => {
                  if (/^#[0-9A-F]{0,6}$/i.test(e.target.value) || e.target.value === "#") {
                    actualizarTema({ colorPrincipal: e.target.value })
                  }
                }}
                className="flex-1 px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Color Secundario
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={theme.colorSecundario}
                onChange={(e) => actualizarTema({ colorSecundario: e.target.value })}
                className="w-12 h-10 rounded-lg border-2 border-border cursor-pointer hover:border-accent transition-colors bg-transparent"
              />
              <input
                type="text"
                value={theme.colorSecundario}
                onChange={(e) => {
                  if (/^#[0-9A-F]{0,6}$/i.test(e.target.value) || e.target.value === "#") {
                    actualizarTema({ colorSecundario: e.target.value })
                  }
                }}
                className="flex-1 px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all"
              />
            </div>
          </div>

          {/* Theme Mode */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Modo de Tema
            </label>
            <select
              value={theme.modoTema}
              onChange={(e) => actualizarTema({ modoTema: e.target.value as any })}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground text-sm appearance-none focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2300BFFF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.5em 1.5em",
              }}
            >
              <option value="dark">Modo Oscuro</option>
              <option value="light">Modo Claro</option>
              <option value="auto">Automático</option>
            </select>
          </div>
        </div>

        {/* Logo & Brand Section */}
        <div className="flex flex-col gap-5">
          <h3 className="text-base font-semibold text-foreground/80">Logo y Marca</h3>

          {/* Logo Preview */}
          <div className="bg-muted/30 p-4 rounded-lg border border-accent/20">
            <p className="text-xs text-muted-foreground mb-3">Vista Previa:</p>
            <div className="flex items-center gap-3 p-3 bg-accent/10 border border-accent/20 rounded-lg">
              {theme.logoSistema ? (
                <img 
                  src={theme.logoSistema} 
                  alt="Logo" 
                  className="h-10 w-10 object-contain rounded-lg"
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: `${theme.colorPrincipal}20`, color: theme.colorPrincipal }}
                >
                  {theme.nombreSistema.charAt(0)}
                </div>
              )}
              <span
                className="text-xl font-bold tracking-widest uppercase"
                style={{ color: theme.colorPrincipal }}
              >
                {theme.nombreSistema}
              </span>
            </div>
          </div>

          {/* Upload Logo */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {theme.logoSistema ? 'Cambiar Logo' : 'Subir Logo'}
            </label>
            
            {theme.logoSistema && (
              <div className="mb-3 flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                <img 
                  src={theme.logoSistema} 
                  alt="Logo actual" 
                  className="h-12 w-12 object-contain rounded-lg bg-background p-1"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">Logo actual</p>
                  <p className="text-xs text-muted-foreground">Personalizado</p>
                </div>
                <button
                  onClick={handleEliminarLogo}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                  title="Eliminar logo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              disabled={isUploadingLogo}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground text-sm hover:bg-muted hover:border-accent transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingLogo ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Seleccionar archivo</span>
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              Formatos: JPG, PNG, GIF. Máximo 2MB
            </p>
          </div>

          {/* System Name */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Nombre del Sistema
            </label>
            <input
              type="text"
              value={theme.nombreSistema}
              onChange={(e) => actualizarTema({ nombreSistema: e.target.value })}
              className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all"
              placeholder="HEXODUS"
            />
          </div>
        </div>
      </div>

      {/* Restore Button */}
      <div className="mt-8 pt-6 border-t border-border">
        <button
          onClick={handleRestablecerApariencia}
          disabled={isRestoringAppearance}
          className="w-full px-4 py-3 bg-accent/10 hover:bg-accent/20 border border-accent text-accent rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRestoringAppearance ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
              <span>Restaurando...</span>
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4" />
              <span>Restaurar Apariencia</span>
            </>
          )}
        </button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Restaura los colores a rojo y azul oscuro, y quita el logo
        </p>
      </div>
    </div>
  )
}
