"use client"

import { useEffect, useState } from "react"
import { X, User, Shield, Key, Eye, EyeOff } from "lucide-react"
import type { Usuario } from "@/lib/usuarios-data"

interface UsuarioModalProps {
  open: boolean
  onClose: () => void
  onGuardar: (data: UsuarioFormData) => void
  usuario?: Usuario | null
  roles: Array<{ id: string; nombre: string }>
  rolesLoading?: boolean
}

export interface UsuarioFormData {
  nombre: string
  email: string
  telefono: string
  username: string
  rolId: string
  activo: boolean
  password?: string
}

export function UsuarioModal({ open, onClose, onGuardar, usuario, roles, rolesLoading }: UsuarioModalProps) {
  const esEdicion = !!usuario

  const [nombre, setNombre] = useState(usuario?.nombre || "")
  const [email, setEmail] = useState(usuario?.email || "")
  const [telefono, setTelefono] = useState(usuario?.telefono || "")
  const [username, setUsername] = useState(usuario?.username || "")
  const [rolId, setRolId] = useState<string>(usuario?.rol.id || "")
  const [activo, setActivo] = useState<boolean>(usuario?.activo ?? true)
  const [password, setPassword] = useState("")
  const [confirmarPassword, setConfirmarPassword] = useState("")
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [error, setError] = useState("")

  // Reinicia campos al abrir el modal para nuevo usuario o precarga para edicion.
  useEffect(() => {
    if (!open) return

    setError("")
    setPassword("")
    setConfirmarPassword("")
    setMostrarPassword(false)
    setMostrarConfirmacion(false)

    if (usuario) {
      setNombre(usuario.nombre || "")
      setEmail(usuario.email || "")
      setTelefono(usuario.telefono || "")
      setUsername(usuario.username || "")
      setRolId(usuario.rol?.id || "")
      setActivo(usuario.activo ?? true)
      return
    }

    setNombre("")
    setEmail("")
    setTelefono("")
    setUsername("")
    setRolId("")
    setActivo(true)
  }, [open, usuario])

  // Si no hay rol seleccionado, usar el primero disponible cuando se carguen roles
  useEffect(() => {
    if (!rolId && !esEdicion && roles.length > 0) {
      setRolId(roles[0].id)
    }
  }, [roles, rolId, esEdicion])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!nombre || !email || !username) {
      setError("Complete todos los campos obligatorios")
      return
    }

    const debeValidarPassword = !esEdicion || password.length > 0 || confirmarPassword.length > 0
    if (debeValidarPassword) {
      if (!password || password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        return
      }
      if (password.length > 72) {
        setError("La contraseña no puede exceder 72 caracteres")
        return
      }
      if (password !== confirmarPassword) {
        setError("Las contraseñas no coinciden")
        return
      }
    }

    onGuardar({
      nombre,
      email,
      telefono,
      username,
      rolId,
      activo,
      password: password || undefined,
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-card rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border animate-slide-up"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="text-lg font-semibold text-foreground">
            {esEdicion ? "Editar Usuario" : "Agregar Nuevo Usuario"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {error && (
            <div className="px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Section: Personal info */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
              <User className="h-4 w-4 text-accent" />
              Informacion Personal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Nombre Completo <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Correo Electronico <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Telefono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Nombre de Usuario <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
                />
              </div>
            </div>
          </div>

          {/* Section: Access config */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
              <Shield className="h-4 w-4 text-accent" />
              Configuracion de Acceso
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Rol <span className="text-destructive">*</span>
                </label>
                <select
                  value={rolId}
                  onChange={(e) => setRolId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 appearance-none"
                  disabled={rolesLoading}
                >
                  {rolesLoading ? (
                    <option value="">Cargando roles...</option>
                  ) : (
                    <>
                      <option value="">Selecciona un rol</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.nombre}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Estado <span className="text-destructive">*</span>
                </label>
                <select
                  value={activo ? "true" : "false"}
                  onChange={(e) => setActivo(e.target.value === "true")}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 appearance-none"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Password */}
          <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
                <Key className="h-4 w-4 text-accent" />
                {esEdicion ? "Cambiar contraseña" : "Contraseña"}
              </h4>
              {esEdicion && (
                <p className="mb-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  La contraseña actual no puede consultarse. Deja ambos campos vacíos para conservarla o escribe una nueva para reemplazarla.
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {esEdicion ? "Nueva contraseña" : "Contraseña"} {!esEdicion && <span className="text-destructive">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      maxLength={72}
                      placeholder={esEdicion ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
                      className="w-full px-3 py-2 pr-10 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword((actual) => !actual)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Confirmar contraseña {!esEdicion && <span className="text-destructive">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarConfirmacion ? "text" : "password"}
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      autoComplete="new-password"
                      maxLength={72}
                      placeholder="Repite la nueva contraseña"
                      className="w-full px-3 py-2 pr-10 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirmacion((actual) => !actual)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label={mostrarConfirmacion ? "Ocultar confirmación" : "Mostrar confirmación"}
                    >
                      {mostrarConfirmacion ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-accent border border-accent rounded-lg hover:bg-accent/10 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-primary-foreground bg-primary rounded-lg glow-primary glow-primary-hover transition-all uppercase"
            >
              {esEdicion ? "Actualizar Usuario" : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
