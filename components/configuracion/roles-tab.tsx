"use client"

import { useEffect, useMemo, useState } from "react"
import { Shield, Plus, Users, ChevronRight, Trash2, Edit2, Copy } from "lucide-react"
import { RolesService, type RolAPI } from "@/lib/services/roles"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface RolesTabProps {
  // Placeholder para compatibilidad con otros tabs
}

// Definición de módulos y permisos del sistema
const MODULOS_SISTEMA = [
  { id: 'dashboard', nombre: 'Dashboard', icono: '📊', acciones: ['ver'] },
  { id: 'membresias', nombre: 'Membresías', icono: '🎫', acciones: ['ver', 'crear', 'editar', 'eliminar'] },
  { id: 'socios', nombre: 'Socios', icono: '👥', acciones: ['ver', 'crear', 'editar', 'eliminar'] },
  { id: 'asistencia', nombre: 'Asistencia', icono: '📝', acciones: ['ver', 'crear', 'editar', 'eliminar'] },
  { id: 'ventas', nombre: 'Ventas', icono: '💰', acciones: ['ver', 'crear', 'editar', 'eliminar'] },
  { id: 'inventario', nombre: 'Inventario', icono: '📦', acciones: ['ver', 'crear', 'editar', 'eliminar'] },
  { id: 'movimientos', nombre: 'Movimientos', icono: '💸', acciones: ['ver', 'crear', 'editar', 'eliminar'] },
  { id: 'reportes', nombre: 'Reportes', icono: '📈', acciones: ['ver', 'crear', 'editar', 'eliminar'] },
  { id: 'usuarios', nombre: 'Usuarios', icono: '👤', acciones: ['ver', 'crear', 'editar', 'eliminar'] },
  { id: 'configuracion', nombre: 'Configuración', icono: '⚙️', acciones: ['ver', 'editar'] },
]

export function RolesTab({}: RolesTabProps) {
  const [roles, setRoles] = useState<RolAPI[]>([])
  const [selectedRol, setSelectedRol] = useState<RolAPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [creatingRole, setCreatingRole] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const { toast } = useToast()

  const defaultPermisos = useMemo(() => {
    const permisos: Record<string, Record<string, boolean>> = {}
    MODULOS_SISTEMA.forEach((modulo) => {
      permisos[modulo.id] = {}
      modulo.acciones.forEach((accion) => {
        permisos[modulo.id][accion] = false
      })
    })
    return permisos
  }, [])

  const [nuevoRol, setNuevoRol] = useState<{
    id: string
    nombre: string
    descripcion: string
    color: string
    permisos: Record<string, Record<string, boolean>>
  }>({
    id: '',
    nombre: '',
    descripcion: '',
    color: '#22c55e',
    permisos: defaultPermisos,
  })

  // Cargar roles
  useEffect(() => {
    cargarRoles()
  }, [])

  // Reiniciar formulario al abrir/cerrar el modal de creación
  useEffect(() => {
    if (!modalCrearAbierto) {
      setNuevoRol({
        id: '',
        nombre: '',
        descripcion: '',
        color: '#22c55e',
        permisos: defaultPermisos,
      })
      setCreateError(null)
      setCreatingRole(false)
    }
  }, [modalCrearAbierto, defaultPermisos])

  const cargarRoles = async () => {
    try {
      setLoading(true)
      const rolesData = await RolesService.obtenerRoles()
      setRoles(rolesData)
      
      // Seleccionar el primer rol por defecto
      if (rolesData.length > 0 && !selectedRol) {
        setSelectedRol(rolesData[0])
      }
    } catch (error: any) {
      console.error('Error cargando roles:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudieron cargar los roles'
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePermiso = (moduloId: string, accion: string) => {
    setNuevoRol((prev) => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [moduloId]: {
          ...prev.permisos[moduloId],
          [accion]: !prev.permisos[moduloId]?.[accion],
        },
      },
    }))
  }

  const handleCrearRol = async () => {
    if (!nuevoRol.id.trim() || !nuevoRol.nombre.trim()) {
      setCreateError('El ID y nombre del rol son obligatorios')
      return
    }

    try {
      setCreatingRole(true)
      setCreateError(null)

      const created = await RolesService.crearRol({
        id: nuevoRol.id.trim(),
        nombre: nuevoRol.nombre.trim(),
        descripcion: nuevoRol.descripcion.trim() || undefined,
        color: nuevoRol.color,
        permisos: nuevoRol.permisos,
      })

      toast({
        title: 'Rol creado',
        description: `El rol "${created.nombre}" se creó correctamente.`,
      })

      // Refrescar lista y seleccionar el nuevo rol
      await cargarRoles()
      setSelectedRol(created)
      setModalCrearAbierto(false)
    } catch (error: any) {
      console.error('Error creando rol:', error)
      setCreateError(error.message || 'Error creando el rol')
      toast({
        variant: 'destructive',
        title: 'No se pudo crear el rol',
        description: error.message || 'Revisa la consola para más detalles',
      })
    } finally {
      setCreatingRole(false)
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
          onClick={() => setModalCrearAbierto(true)}
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
                    style={{ backgroundColor: rol.color || '#6b7280' }}
                  />
                  
                  {/* Nombre */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium truncate flex items-center gap-2">
                      <span>{rol.nombre}</span>
                    </div>
                    {rol.esSistema && (
                      <div className="text-xs text-muted-foreground">Rol del sistema</div>
                    )}
                  </div>
                  
                  {/* Badge de usuarios activos */}
                  {rol.usuariosActivos > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{rol.usuariosActivos}</span>
                    </div>
                  )}
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

      {/* Modal para crear un nuevo rol */}
      <Dialog open={modalCrearAbierto} onOpenChange={setModalCrearAbierto}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear nuevo rol</DialogTitle>
            <DialogDescription>
              Define el ID, nombre y los permisos que tendrá este rol.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rol-id">ID del rol</Label>
                <Input
                  id="rol-id"
                  value={nuevoRol.id}
                  onChange={(e) => setNuevoRol((prev) => ({ ...prev, id: e.target.value }))}
                  placeholder="recepcionista_test"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="rol-nombre">Nombre</Label>
                <Input
                  id="rol-nombre"
                  value={nuevoRol.nombre}
                  onChange={(e) => setNuevoRol((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Recepcionista de Prueba"
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="rol-descripcion">Descripción (opcional)</Label>
                <Textarea
                  id="rol-descripcion"
                  value={nuevoRol.descripcion}
                  onChange={(e) => setNuevoRol((prev) => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción del rol"
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="rol-color">Color</Label>
                <div className="mt-1 flex items-center gap-3">
                  <Input
                    id="rol-color"
                    type="color"
                    value={nuevoRol.color}
                    onChange={(e) => setNuevoRol((prev) => ({ ...prev, color: e.target.value }))}
                    className="h-10 w-14 p-0"
                  />
                  <span className="text-sm text-muted-foreground">Color del rol (opcional)</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-lg font-semibold">Permisos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Selecciona los permisos que tendrá este rol en cada módulo.
              </p>

              <div className="mt-4 space-y-3">
                {MODULOS_SISTEMA.map((modulo) => (
                  <div key={modulo.id} className="border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        <span className="mr-2">{modulo.icono}</span>
                        {modulo.nombre}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {modulo.acciones.length} permisos
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {modulo.acciones.map((accion) => (
                        <label
                          key={accion}
                          className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={nuevoRol.permisos[modulo.id]?.[accion] || false}
                            onCheckedChange={() => togglePermiso(modulo.id, accion)}
                          />
                          <span className="text-sm capitalize">{accion}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {createError && (
              <div className="text-sm text-destructive">{createError}</div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => setModalCrearAbierto(false)}
                disabled={creatingRole}
              >
                Cancelar
              </Button>
              <Button onClick={handleCrearRol} disabled={creatingRole}>
                {creatingRole ? 'Creando...' : 'Crear rol'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// COMPONENTE: Detalles del Rol
// ============================================================================

interface RolDetailsProps {
  rol: RolAPI
  onUpdate: () => void
}

function RolDetails({ rol, onUpdate }: RolDetailsProps) {
  const esAdministrador = rol.permisos?.todo === 'absoluto'
  
  return (
    <div className="p-6 space-y-6">
      {/* Header del Rol */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Color Badge Grande */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ 
              backgroundColor: `${rol.color || '#6b7280'}20`, 
              border: `2px solid ${rol.color || '#6b7280'}` 
            }}
          >
            <Shield className="h-8 w-8" style={{ color: rol.color || '#6b7280' }} />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold">{rol.nombre}</h3>
            <p className="text-muted-foreground mt-1">{rol.descripcion || 'Sin descripción'}</p>
            
            {/* Badges */}
            <div className="flex items-center gap-2 mt-3">
              {esAdministrador && (
                <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full border border-green-500/20">
                  👑 Administrador
                </span>
              )}
              {rol.esSistema && (
                <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-xs font-medium rounded-full border border-blue-500/20">
                  🔒 Rol del Sistema
                </span>
              )}
              {rol.usuariosActivos > 0 && (
                <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full border border-accent/20">
                  <Users className="h-3 w-3 inline mr-1" />
                  {rol.usuariosActivos} usuario{rol.usuariosActivos !== 1 ? 's' : ''}
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
        
        {esAdministrador ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">👑</div>
            <h5 className="text-lg font-semibold text-green-500 mb-2">Acceso Total</h5>
            <p className="text-sm text-muted-foreground">
              Este rol tiene acceso completo a todas las funcionalidades del sistema
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(rol.permisos).length === 0 ? (
              <div className="bg-muted/30 border border-border rounded-lg p-6 text-center">
                <div className="text-4xl mb-3">🚫</div>
                <h5 className="text-lg font-semibold mb-2">Sin permisos asignados</h5>
                <p className="text-sm text-muted-foreground">
                  Este rol no tiene permisos configurados
                </p>
              </div>
            ) : (
              <>
                {/* Dashboard */}
                {rol.permisos.dashboard && (
                  <PermisoModulo
                    modulo="Dashboard"
                    permisos={rol.permisos.dashboard}
                    icono="📊"
                  />
                )}
                
                {/* Membresías */}
                {rol.permisos.membresias && (
                  <PermisoModulo
                    modulo="Membresías"
                    permisos={rol.permisos.membresias}
                    icono="🎫"
                  />
                )}
                
                {/* Socios */}
                {rol.permisos.socios && (
                  <PermisoModulo
                    modulo="Socios"
                    permisos={rol.permisos.socios}
                    icono="👥"
                  />
                )}
                
                {/* Asistencia */}
                {rol.permisos.asistencia && (
                  <PermisoModulo
                    modulo="Asistencia"
                    permisos={rol.permisos.asistencia}
                    icono="📝"
                  />
                )}
                
                {/* Ventas */}
                {rol.permisos.ventas && (
                  <PermisoModulo
                    modulo="Ventas"
                    permisos={rol.permisos.ventas}
                    icono="💰"
                  />
                )}
                
                {/* Inventario */}
                {rol.permisos.inventario && (
                  <PermisoModulo
                    modulo="Inventario"
                    permisos={rol.permisos.inventario}
                    icono="📦"
                  />
                )}
                
                {/* Movimientos */}
                {rol.permisos.movimientos && (
                  <PermisoModulo
                    modulo="Movimientos"
                    permisos={rol.permisos.movimientos}
                    icono="💸"
                  />
                )}
                
                {/* Reportes */}
                {rol.permisos.reportes && (
                  <PermisoModulo
                    modulo="Reportes"
                    permisos={rol.permisos.reportes}
                    icono="📈"
                  />
                )}
                
                {/* Usuarios */}
                {rol.permisos.usuarios && (
                  <PermisoModulo
                    modulo="Usuarios"
                    permisos={rol.permisos.usuarios}
                    icono="👤"
                  />
                )}
                
                {/* Configuración */}
                {rol.permisos.configuracion && (
                  <PermisoModulo
                    modulo="Configuración"
                    permisos={rol.permisos.configuracion}
                    icono="⚙️"
                  />
                )}
              </>
            )}
          </div>
        )}
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
  
  // Validar que permisos sea un objeto y no null/undefined
  if (!permisos || typeof permisos !== 'object') {
    return null
  }
  
  // Contar permisos activos
  const permisosArray = Object.entries(permisos)
  const permisosActivos = permisosArray.filter(([_, value]) => value === true).length
  const permisosTotal = permisosArray.length
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
      {expanded && permisosArray.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {permisosArray.map(([key, value]) => (
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
