"use client"

import { Receipt, MapPin, Phone, FileText, Building2, MessageSquare, Image, AlertCircle } from "lucide-react"
import type { ConfigState } from "./config-types"

interface DatosTicketTabProps {
  config: ConfigState
  onChange: (updates: Partial<ConfigState>) => void
}

export function DatosTicketTab({ config, onChange }: DatosTicketTabProps) {
  return (
    <div className="bg-card rounded-xl p-6 border border-border animate-fade-in-up">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-6 w-6 rounded-md bg-accent/20 flex items-center justify-center">
          <Receipt className="h-4 w-4 text-accent" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Datos del Ticket</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Configura la información del gimnasio que aparecerá impresa en los tickets de membresías y ventas.
      </p>

      <div className="space-y-6">
        {/* Información del Gimnasio */}
        <div>
          <h3 className="text-base font-semibold text-foreground/80 mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" />
            Información del Gimnasio
          </h3>
          
          <div className="space-y-4">
            {/* Nombre del Gimnasio */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Nombre del Gimnasio
              </label>
              <input
                type="text"
                value={config.gimnasioNombre}
                onChange={(e) => onChange({ gimnasioNombre: e.target.value })}
                placeholder="Ej: GYM FITNESS CENTER"
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all"
              />
            </div>

            {/* Domicilio */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Domicilio
              </label>
              <input
                type="text"
                value={config.gimnasioDomicilio}
                onChange={(e) => onChange({ gimnasioDomicilio: e.target.value })}
                placeholder="Ej: Av. Principal #123, Col. Centro, CP 12345"
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Teléfono
              </label>
              <input
                type="text"
                value={config.gimnasioTelefono}
                onChange={(e) => onChange({ gimnasioTelefono: e.target.value })}
                placeholder="Ej: +52 123 456 7890"
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all"
              />
            </div>

            {/* RFC */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                RFC
              </label>
              <input
                type="text"
                value={config.gimnasioRFC}
                onChange={(e) => onChange({ gimnasioRFC: e.target.value.toUpperCase() })}
                placeholder="Ej: GYM123456ABC"
                maxLength={13}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all uppercase"
              />
            </div>

            {/* Logo */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Image className="h-3.5 w-3.5" />
                Logo del Gimnasio (Archivo)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Validar tamaño (máx 2MB)
                    if (file.size > 2 * 1024 * 1024) {
                      alert('El archivo es muy grande. Tamaño máximo: 2MB')
                      return
                    }
                    
                    // Convertir a base64
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      const base64 = event.target?.result as string
                      onChange({ gimnasioLogo: base64 })
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer"
              />
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1.5 flex items-start gap-1">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>El logo se guardará localmente y se imprimirá en blanco/negro. Tamaño máx: 2MB.</span>
              </p>
              {config.gimnasioLogo && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">Vista previa del logo:</p>
                    <button
                      onClick={() => onChange({ gimnasioLogo: '' })}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                  <img 
                    src={config.gimnasioLogo} 
                    alt="Logo del gimnasio" 
                    className="h-16 w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666">❌</text></svg>'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mensajes del Ticket */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-base font-semibold text-foreground/80 mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent" />
            Mensajes del Ticket
          </h3>
          
          <div className="space-y-4">
            {/* Footer del Ticket */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Pie de Página del Ticket
              </label>
              <input
                type="text"
                value={config.ticketFooter}
                onChange={(e) => onChange({ ticketFooter: e.target.value })}
                placeholder="Ej: ¡Gracias por tu visita!"
                maxLength={100}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Máximo 100 caracteres
              </p>
            </div>

            {/* Mensaje de Agradecimiento */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Mensaje de Agradecimiento
              </label>
              <textarea
                value={config.ticketMensajeAgradecimiento}
                onChange={(e) => onChange({ ticketMensajeAgradecimiento: e.target.value })}
                placeholder="Ej: Te esperamos pronto"
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground text-sm focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Máximo 200 caracteres
              </p>
            </div>
          </div>
        </div>

        {/* Vista Previa del Ticket */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-base font-semibold text-foreground/80 mb-4">Vista Previa del Ticket (Simulación Real)</h3>
          
          <div className="flex items-center gap-2 mb-3 text-sm text-green-600 dark:text-green-500">
            <AlertCircle className="h-4 w-4" />
            <p>El logo se almacena localmente y se imprime en blanco/negro (sin problemas de CORS).</p>
          </div>
          
          {/* Simulación de ticket térmico real - 58mm = 32 caracteres */}
          <div className="bg-white rounded-lg border-2 border-dashed border-border max-w-[280px] mx-auto shadow-lg">
            <div className="bg-gray-50 px-4 py-6 font-mono text-[11px] leading-tight text-black whitespace-pre-wrap break-words">
              
              {/* Logo preview si existe - con warning si puede fallar */}
              {config.gimnasioLogo && (
                <div className="mb-3">
                  <div className="flex justify-center">
                    <img 
                      src={config.gimnasioLogo} 
                      alt="Logo" 
                      className="h-16 w-auto object-contain"
                      style={{ 
                        filter: 'grayscale(100%) contrast(200%) brightness(80%)',
                        imageRendering: 'pixelated'
                      }}
                      onError={(e) => {
                        const parent = e.currentTarget.parentElement?.parentElement
                        if (parent) {
                          parent.innerHTML = `
                            <div class="text-center text-[9px] text-red-600 mb-2 p-2 bg-red-50 rounded border border-red-200">
                              ⚠️ Error cargando logo<br/>
                              Verifica la URL
                            </div>
                          `
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Nombre del Gimnasio - Bold normal, centrado, uppercase */}
              <div className="text-center font-bold text-[11px] tracking-wide mb-1">
                {(config.gimnasioNombre || 'GYM FITNESS').toUpperCase()}
              </div>
              
              {/* Domicilio - Centrado, texto pequeño */}
              <div className="text-center text-[9px] mb-0.5 leading-tight">
                {config.gimnasioDomicilio || 'Av. Principal #123, Col. Centro'}
              </div>
              
              {/* Teléfono - Centrado */}
              <div className="text-center text-[9px] mb-0.5">
                Tel: {config.gimnasioTelefono || '+52 123 456 7890'}
              </div>
              
              {/* RFC - Centrado */}
              <div className="text-center text-[9px] mb-2">
                RFC: {config.gimnasioRFC || 'GYM123456ABC'}
              </div>
              
              {/* Domicilio - Centrado */}
              <div className="text-center text-[9px] mb-0.5">
                {config.gimnasioDomicilio || 'Av. Principal #123, Col. Centro'}
              </div>
              
              {/* Teléfono - Centrado */}
              <div className="text-center text-[9px] mb-0.5">
                Tel: {config.gimnasioTelefono || '+52 123 456 7890'}
              </div>
              
              {/* RFC - Centrado */}
              <div className="text-center text-[9px] mb-2">
                RFC: {config.gimnasioRFC || 'GYM123456ABC'}
              </div>
              
              {/* Línea separadora */}
              <div className="text-center mb-2">{'='.repeat(32)}</div>
              
              {/* Tipo de ticket */}
              <div className="text-center font-bold mb-2">TICKET DE VENTA</div>
              
              <div>Ticket: V-0010</div>
              <div>Fecha: 07/03/2026</div>
              <div className="mb-2">Hora: 04:59 p.m.</div>
              
              <div className="text-center mb-2">{'-'.repeat(32)}</div>
              
              {/* Cliente */}
              <div className="font-bold mb-1">CLIENTE</div>
              <div className="mb-2">Nombre: Brayan Chan</div>
              
              <div className="text-center mb-2">{'-'.repeat(32)}</div>
              
              {/* Productos */}
              <div className="font-bold mb-2">PRODUCTOS</div>
              <div className="mb-1">Testrol</div>
              <div className="mb-2">1 x $550.00 = $550.00</div>
              
              <div className="text-center mb-2">{'-'.repeat(32)}</div>
              
              {/* Total */}
              <div className="font-bold text-[13px] mb-1">TOTAL: $550.00</div>
              <div className="mb-2">Metodo Pago: Efectivo</div>
              
              <div className="text-center mb-2">{'='.repeat(32)}</div>
              
              {/* Footer personalizado */}
              <div className="text-center text-[9px] space-y-0.5 mt-2">
                <div className="font-semibold">
                  {config.ticketFooter || '¡Gracias por tu visita!'}
                </div>
                <div>
                  {config.ticketMensajeAgradecimiento || 'Te esperamos pronto'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Información sobre el logo */}
          {config.gimnasioLogo && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>💡 Consejos para mejor impresión:</strong>
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc">
                <li>El logo se guarda en <strong>localStorage del navegador</strong></li>
                <li>Se convierte automáticamente a <strong>blanco/negro</strong> al imprimir</li>
                <li>Logos simples funcionan mejor que diseños complejos</li>
                <li>Formato PNG con fondo blanco/transparente recomendado</li>
                <li>Tamaño máximo del archivo: <strong>2MB</strong></li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
