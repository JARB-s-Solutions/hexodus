"use client"

import { useState } from "react"
import { X, User, Shield, Key, Settings } from "lucide-react"
import type { Usuario, Rol, Estado, Departamento } from "@/lib/usuarios-data"

interface UsuarioModalProps {
  open: boolean
  onClose: () => void
  onGuardar: (data: UsuarioFormData) => void
  usuario?: Usuario | null
}

export interface UsuarioFormData {
  nombre: string
  email: string
  telefono: string
  username: string
  rol: Rol
  departamento: Departamento
  estado: Estado
  password?: string
  permisos: string[]
}

const permisosDisponibles = [
  { value: "usuarios", label: "Gestion de usuarios" },
  { value: "socios", label: "Gestion de socios" },
  { value: "ventas", label: "Gestion de ventas" },
  { value: "inventario", label: "Gestion de inventario" },
  { value: "reportes", label: "Generar reportes" },
  { value: "configuracion", label: "Configuracion del sistema" },
]

export function UsuarioModal({ open, onClose, onGuardar, usuario }: UsuarioModalProps) {
  const esEdicion = !!usuario

  const [nombre, setNombre] = useState(usuario?.nombre || "")
  const [email, setEmail] = useState(usuario?.email || "")
  const [telefono, setTelefono] = useState(usuario?.telefono || "")
  const [username, setUsername] = useState(usuario?.username || "")
  const [rol, setRol] = useState<Rol>(usuario?.rol || "empleado")
  const [departamento, setDepartamento] = useState<Departamento>(usuario?.departamento || "administracion")
  const [estado, setEstado] = useState<Estado>(usuario?.estado || "activo")
  const [password, setPassword] = useState("")
  const [confirmarPassword, setConfirmarPassword] = useState("")
  const [permisos, setPermisos] = useState<string[]>(usuario?.permisos || [])
  const [error, setError] = useState("")

  function togglePermiso(p: string) {
    setPermisos((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!nombre || !email || !username) {
      setError("Complete todos los campos obligatorios")
      return
    }

    if (!esEdicion) {
      if (!password || password.length < 6) {
        setError("La contrasena debe tener al menos 6 caracteres")
        return
      }
      if (password !== confirmarPassword) {
        setError("Las contrasenas no coinciden")
        return
      }
    }

    onGuardar({
      nombre,
      email,
      telefono,
      username,
      rol,
      departamento,
      estado,
      password: esEdicion ? undefined : password,
      permisos,
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-card rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border animate-slide-up"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Rol <span className="text-destructive">*</span>
                </label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as Rol)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 appearance-none"
                >
                  <option value="admin">Administrador</option>
                  <option value="moderador">Moderador</option>
                  <option value="empleado">Empleado</option>
                  <option value="invitado">Invitado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Departamento <span className="text-destructive">*</span>
                </label>
                <select
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value as Departamento)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 appearance-none"
                >
                  <option value="administracion">Administracion</option>
                  <option value="ventas">Ventas</option>
                  <option value="operaciones">Operaciones</option>
                  <option value="marketing">Marketing</option>
                  <option value="soporte">Soporte</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Estado <span className="text-destructive">*</span>
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as Estado)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 appearance-none"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="bloqueado">Bloqueado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Password (only for new users) */}
          {!esEdicion && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
                <Key className="h-4 w-4 text-accent" />
                Contrasena
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Contrasena <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Confirmar Contrasena <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Permissions */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
              <Settings className="h-4 w-4 text-accent" />
              Permisos Especificos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permisosDisponibles.map((p) => (
                <label key={p.value} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={permisos.includes(p.value)}
                    onChange={() => togglePermiso(p.value)}
                    className="rounded border-border bg-background text-accent focus:ring-accent/50 focus:ring-1 h-4 w-4"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{p.label}</span>
                </label>
              ))}
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
