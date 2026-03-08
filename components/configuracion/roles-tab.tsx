"use client"

import { useEffect, useState } from "react"
import { Shield, Plus, Users, ChevronRight, Trash2, Edit2, Copy } from "lucide-react"
import type { Rol } from "@/lib/types/permissions"
import { RolesService } from "@/lib/services/roles"
import { cn } from "@/lib/utils"

interface RolesTabProps {
  // Placeholder para compatibilidad con otros tabs
}

export function RolesTab({}: RolesTabProps) {
  const [roles, setRoles] = useState<Rol[]>([])
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null)
  const [loading, setLoading] = useState(true)

  // Cargar roles
  useEffect(() => {
    cargarRoles()
  }, [])

  const cargarRoles = async () => {
    try {
      setLoading(true)
      const rolesData = await RolesService.obtenerRoles()
      setRoles(rolesData)
      
      // Seleccionar el primer rol por defecto
      if (rolesData.length > 0 && !selectedRol) {
        setSelectedRol(rolesData[0])
      }
    } catch (error) {
      console.error('Error cargando roles:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-accent" />
            Roles y Permisos
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestiona los roles y permisos de los usuarios del sistema
          </p>
        </div>
        
        <button
          className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-all hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          Crear Rol
        </button>
      </div>

      {/* Content Grid - Estilo Discord */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Roles */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Roles - {roles.length}
            </h3>
          </div>

          <div className="space-y-1">
            {roles.map((rol) => (
              <button
                key={rol.id}
                onClick={() => setSelectedRol(rol)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group",
                  selectedRol?.id === rol.id
                    ? "bg-accent/15 border border-accent/50"
                    : "hover:bg-muted/50 border border-transparent"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Color Badge */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: rol.color }}
                  />
                  
                  {/* Nombre */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium truncate flex items-center gap-2">
                      {rol.icono && <span>{rol.icono}</span>}
                      <span>{rol.nombre}</span>
                    </div>
                    {rol.esAdministrador && (
                      <div className="text-xs text-muted-foreground">Acceso total</div>
                    )}
                  </div>
                </div>

                <ChevronRight className={cn(
                  "h-4 w-4 text-muted-foreground transition-all",
                  selectedRol?.id === rol.id && "text-accent"
                )} />
              </button>
            ))}
          </div>
        </div>

        {/* Detalles del Rol */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border">
          {selectedRol ? (
            <RolDetails rol={selectedRol} onUpdate={cargarRoles} />
          ) : (
            <div className="flex items-center justify-center h-96 text-muted-foreground">
              <div className="text-center">
                <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Selecciona un rol para ver sus detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE: Detalles del Rol
// ============================================================================

interface RolDetailsProps {
  rol: Rol
  onUpdate: () => void
}

function RolDetails({ rol, onUpdate }: RolDetailsProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header del Rol */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Color Badge Grande */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: `${rol.color}20`, border: `2px solid ${rol.color}` }}
          >
            {rol.icono || <Shield className="h-8 w-8" style={{ color: rol.color }} />}
          </div>
          
          <div>
            <h3 className="text-2xl font-bold">{rol.nombre}</h3>
            <p className="text-muted-foreground mt-1">{rol.descripcion}</p>
            
            {/* Badges */}
            <div className="flex items-center gap-2 mt-3">
              {rol.esAdministrador && (
                <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full border border-green-500/20">
                  👑 Administrador
                </span>
              )}
              {rol.esSistema && (
                <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-xs font-medium rounded-full border border-blue-500/20">
                  🔒 Rol del Sistema
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {!rol.esSistema && (
            <>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Duplicar">
                <Copy className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Editar">
                <Edit2 className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors" title="Eliminar">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Permisos */}
      <div className="border-t border-border pt-6">
        <h4 className="text-lg font-semibold mb-4">Permisos</h4>
        
        <div className="space-y-4">
          {/* Dashboard */}
          <PermisoModulo
            modulo="Dashboard"
            permisos={rol.permisos.dashboard}
            icono="📊"
          />
          
          {/* Membresías */}
          <PermisoModulo
            modulo="Membresías"
            permisos={rol.permisos.membresias}
            icono="🎫"
          />
          
          {/* Socios */}
          <PermisoModulo
            modulo="Socios"
            permisos={rol.permisos.socios}
            icono="👥"
          />
          
          {/* Asistencia */}
          <PermisoModulo
            modulo="Asistencia"
            permisos={rol.permisos.asistencia}
            icono="📝"
          />
          
          {/* Ventas */}
          <PermisoModulo
            modulo="Ventas"
            permisos={rol.permisos.ventas}
            icono="💰"
          />
          
          {/* Inventario */}
          <PermisoModulo
            modulo="Inventario"
            permisos={rol.permisos.inventario}
            icono="📦"
          />
          
          {/* Movimientos */}
          <PermisoModulo
            modulo="Movimientos"
            permisos={rol.permisos.movimientos}
            icono="💸"
          />
          
          {/* Reportes */}
          <PermisoModulo
            modulo="Reportes"
            permisos={rol.permisos.reportes}
            icono="📈"
          />
          
          {/* Usuarios */}
          <PermisoModulo
            modulo="Usuarios"
            permisos={rol.permisos.usuarios}
            icono="👤"
          />
          
          {/* Configuración */}
          <PermisoModulo
            modulo="Configuración"
            permisos={rol.permisos.configuracion}
            icono="⚙️"
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE: Permiso de Módulo
// ============================================================================

interface PermisoModuloProps {
  modulo: string
  permisos: any
  icono: string
}

function PermisoModulo({ modulo, permisos, icono }: PermisoModuloProps) {
  const [expanded, setExpanded] = useState(false)
  
  // Contar permisos activos
  const permisosActivos = Object.values(permisos).filter(Boolean).length
  const permisosTotal = Object.keys(permisos).length
  const tieneAcceso = permisos.ver === true

  return (
    <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icono}</span>
          <div className="text-left">
            <div className="font-medium">{modulo}</div>
            <div className="text-sm text-muted-foreground">
              {tieneAcceso ? (
                <span className="text-green-500">{permisosActivos} de {permisosTotal} permisos activos</span>
              ) : (
                <span className="text-destructive">Sin acceso</span>
              )}
            </div>
          </div>
        </div>
        
        <ChevronRight className={cn(
          "h-5 w-5 transition-transform",
          expanded && "rotate-90"
        )} />
      </button>

      {/* Detalles */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(permisos).map(([key, value]) => (
              <div
                key={key}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                  value
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  value ? "bg-green-500" : "bg-muted-foreground"
                )} />
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
