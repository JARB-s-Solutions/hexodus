"use client"

import type { ConfigState } from "./config-types"

interface AparienciaTabProps {
  config: ConfigState
  onChange: (updates: Partial<ConfigState>) => void
}

export function AparienciaTab({ config, onChange }: AparienciaTabProps) {
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
                value={config.colorPrincipal}
                onChange={(e) => onChange({ colorPrincipal: e.target.value })}
                className="w-12 h-10 rounded-lg border-2 border-border cursor-pointer hover:border-accent transition-colors bg-transparent"
              />
              <input
                type="text"
                value={config.colorPrincipal}
                onChange={(e) => {
                  if (/^#[0-9A-F]{0,6}$/i.test(e.target.value) || e.target.value === "#") {
                    onChange({ colorPrincipal: e.target.value })
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
                value={config.colorSecundario}
                onChange={(e) => onChange({ colorSecundario: e.target.value })}
                className="w-12 h-10 rounded-lg border-2 border-border cursor-pointer hover:border-accent transition-colors bg-transparent"
              />
              <input
                type="text"
                value={config.colorSecundario}
                onChange={(e) => {
                  if (/^#[0-9A-F]{0,6}$/i.test(e.target.value) || e.target.value === "#") {
                    onChange({ colorSecundario: e.target.value })
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
              value={config.modoTema}
              onChange={(e) => onChange({ modoTema: e.target.value as ConfigState["modoTema"] })}
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
              <option value="auto">Automatico</option>
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
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: `${config.colorPrincipal}20`, color: config.colorPrincipal }}
              >
                {config.nombreSistema.charAt(0)}
              </div>
              <span
                className="text-xl font-bold tracking-widest uppercase"
                style={{ color: config.colorPrincipal }}
              >
                {config.nombreSistema}
              </span>
            </div>
          </div>

          {/* Upload Logo */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Cambiar Logo
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-accent/20 file:text-accent file:text-sm file:font-medium file:cursor-pointer cursor-pointer focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all"
            />
          </div>

          {/* System Name */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Nombre del Sistema
            </label>
            <input
              type="text"
              value={config.nombreSistema}
              onChange={(e) => onChange({ nombreSistema: e.target.value })}
              className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
