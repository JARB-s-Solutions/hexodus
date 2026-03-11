"use client"

import { useState, useCallback, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { UsuariosHeader } from "@/components/usuarios/usuarios-header"
import { KpiUsuarios } from "@/components/usuarios/kpi-usuarios"
import { UsuariosToolbar } from "@/components/usuarios/usuarios-toolbar"
import { UsuariosTable } from "@/components/usuarios/usuarios-table"
import { UsuarioModal, type UsuarioFormData } from "@/components/usuarios/usuario-modal"
import { DetalleUsuarioModal } from "@/components/usuarios/detalle-usuario-modal"
import { SesionesActivas } from "@/components/usuarios/sesiones-activas"
import { AuthService } from "@/lib/auth"
import { RolesService } from "@/lib/services/roles"
import { UsuariosService } from "@/lib/services/usuarios"
import { transformarUsuarioAPI, type Usuario } from "@/lib/usuarios-data"
import { useToast } from "@/hooks/use-toast"

function esRolAdmin(u: Usuario): boolean {
  const rolId = (u.rol?.id || '').toLowerCase()
  const rolNombre = (u.rol?.nombre || '').toLowerCase()
  return rolId === 'admin' || rolNombre.includes('admin')
}

export default function UsuariosPage() {
  const { toast } = useToast()
  
  // Estados principales
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalUsuarios, setTotalUsuarios] = useState(0)
  const [limite, setLimite] = useState(20)

  // Filtros
  const [busqueda, setBusqueda] = useState("")
  const [busquedaAplicada, setBusquedaAplicada] = useState("")
  const [rolFiltro, setRolFiltro] = useState<string>("todos")
  const [activoFiltro, setActivoFiltro] = useState<boolean | "todos">("todos")

  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null)
  const [detalleUsuario, setDetalleUsuario] = useState<Usuario | null>(null)
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null)
  const [eliminandoUsuario, setEliminandoUsuario] = useState(false)

  const [roles, setRoles] = useState<Array<{ id: string; nombre: string }>>([])
  const [rolesLoading, setRolesLoading] = useState(false)

  // Cargar roles desde la API
  const cargarRoles = useCallback(async () => {
    try {
      setRolesLoading(true)
      const rolesData = await RolesService.obtenerRoles()
      setRoles(rolesData.map((r) => ({ id: r.id, nombre: r.nombre })))
    } catch (err: any) {
      console.error('[UsuariosPage] Error cargando roles:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'No se pudieron cargar los roles'
      })
    } finally {
      setRolesLoading(false)
    }
  }, [toast])

  // Cargar usuarios desde la API
  const cargarUsuarios = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const filtros: any = {
        page: paginaActual,
        limit: limite,
      }

      if (busquedaAplicada.trim()) {
        filtros.search = busquedaAplicada.trim()
      }

      if (rolFiltro !== "todos") {
        filtros.rol = rolFiltro
      }

      if (activoFiltro !== "todos") {
        filtros.activo = activoFiltro
      }

      console.log('[UsuariosPage] Cargando usuarios con filtros:', filtros)

      const response = await UsuariosService.obtenerUsuarios(filtros)

      if (response.success && response.data) {
        const usuariosTransformados = response.data.usuarios.map(transformarUsuarioAPI)
        setUsuarios(usuariosTransformados)
        setTotalPaginas(response.data.paginacion.totalPaginas)
        setTotalUsuarios(response.data.paginacion.total)
        
        console.log('[UsuariosPage] Usuarios cargados:', {
          cantidad: usuariosTransformados.length,
          total: response.data.paginacion.total,
          pagina: response.data.paginacion.pagina,
          totalPaginas: response.data.paginacion.totalPaginas
        })
      }
    } catch (err: any) {
      console.error('[UsuariosPage] Error:', err)
      setError(err.message || 'Error al cargar usuarios')
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'No se pudieron cargar los usuarios'
      })
    } finally {
      setLoading(false)
    }
  }, [paginaActual, limite, busquedaAplicada, rolFiltro, activoFiltro, toast])

  // Cargar roles y usuarios al montar y cuando cambien los filtros
  useEffect(() => {
    cargarRoles()
    cargarUsuarios()
  }, [cargarRoles, cargarUsuarios])

  // Aplicar búsqueda (con debounce manual)
  const aplicarBusqueda = useCallback(() => {
    setBusquedaAplicada(busqueda)
    setPaginaActual(1) // Resetear a página 1 al buscar
  }, [busqueda])

  // Handlers
  const handleLimpiar = useCallback(() => {
    setBusqueda("")
    setBusquedaAplicada("")
    setRolFiltro("todos")
    setActivoFiltro("todos")
    setPaginaActual(1)
  }, [])

  const handleNuevoUsuario = useCallback(() => {
    setEditandoUsuario(null)
    setModalOpen(true)
  }, [])

  const handleEditar = useCallback((u: Usuario) => {
    setEditandoUsuario(u)
    setModalOpen(true)
  }, [])

  const handleGuardar = useCallback(
    async (data: UsuarioFormData) => {
      try {
        if (editandoUsuario) {
          // Actualizar usuario existente
          await UsuariosService.actualizarUsuario(editandoUsuario.id, {
            nombre: data.nombre,
            email: data.email,
            telefono: data.telefono || undefined,
            username: data.username,
            rolId: data.rolId,
            activo: data.activo,
            password: data.password || undefined,
          })
          
          toast({
            title: 'Usuario actualizado',
            description: 'El usuario se actualizó correctamente'
          })
        } else {
          // Crear nuevo usuario
          if (!data.password) {
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'La contraseña es requerida para nuevos usuarios'
            })
            return
          }

          await UsuariosService.crearUsuario({
            nombre: data.nombre,
            email: data.email,
            telefono: data.telefono || undefined,
            username: data.username,
            password: data.password,
            rolId: data.rolId,
          })
          
          toast({
            title: 'Usuario creado',
            description: 'El usuario se creó correctamente'
          })
        }

        setModalOpen(false)
        setEditandoUsuario(null)
        
        // Recargar usuarios
        await cargarUsuarios()
      } catch (err: any) {
        console.error('[UsuariosPage] Error al guardar:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.message || 'No se pudo guardar el usuario'
        })
      }
    },
    [editandoUsuario, cargarUsuarios, toast]
  )

  const handleCambiarEstado = useCallback(async (u: Usuario) => {
    try {
      await UsuariosService.cambiarEstado(u.id, !u.activo)
      
      toast({
        title: 'Estado actualizado',
        description: `Usuario ${!u.activo ? 'activado' : 'desactivado'} correctamente`
      })
      
      // Recargar usuarios
      await cargarUsuarios()
    } catch (err: any) {
      console.error('[UsuariosPage] Error al cambiar estado:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'No se pudo cambiar el estado'
      })
    }
  }, [cargarUsuarios, toast])

  const handleEliminar = useCallback(async (u: Usuario) => {
    try {
      const currentUser = AuthService.getUser()

      if (!u.id) {
        toast({
          variant: 'destructive',
          title: 'No se puede eliminar',
          description: 'El usuario no tiene un identificador valido.'
        })
        return
      }

      if (currentUser?.id && currentUser.id === u.id) {
        toast({
          variant: 'destructive',
          title: 'Operacion no permitida',
          description: 'No puedes eliminar tu propio usuario mientras tienes sesion iniciada.'
        })
        return
      }

      const adminsActivos = usuarios.filter((item) => item.activo && esRolAdmin(item)).length
      if (u.activo && esRolAdmin(u) && adminsActivos <= 1) {
        toast({
          variant: 'destructive',
          title: 'Operacion bloqueada',
          description: 'No puedes eliminar el ultimo administrador activo del sistema.'
        })
        return
      }

      setUsuarioAEliminar(u)
    } catch (err: any) {
      console.error('[UsuariosPage] Error al eliminar:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'No se pudo eliminar el usuario'
      })
    }
  }, [toast, usuarios])

  const handleConfirmarEliminacion = useCallback(async () => {
    if (!usuarioAEliminar) return

    try {
      setEliminandoUsuario(true)
      await UsuariosService.eliminarUsuario(usuarioAEliminar.id)

      toast({
        title: 'Usuario eliminado',
        description: 'El usuario se eliminó correctamente'
      })

      setUsuarioAEliminar(null)
      await cargarUsuarios()
    } catch (err: any) {
      console.error('[UsuariosPage] Error al eliminar:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'No se pudo eliminar el usuario'
      })
    } finally {
      setEliminandoUsuario(false)
    }
  }, [usuarioAEliminar, cargarUsuarios, toast])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="usuarios" />

      <main className="flex-1 flex flex-col min-h-0">
        <UsuariosHeader />

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-5">
          {/* KPIs - full width */}
          <KpiUsuarios usuarios={usuarios} loading={loading} total={totalUsuarios} />

          {/* Toolbar: search + filters inline - full width */}
          <UsuariosToolbar
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            onAplicarBusqueda={aplicarBusqueda}
            rolFiltro={rolFiltro}
            onRolChange={(rol) => {
              setRolFiltro(rol)
              setPaginaActual(1)
            }}
            activoFiltro={activoFiltro}
            onActivoChange={(estado) => {
              setActivoFiltro(estado)
              setPaginaActual(1)
            }}
            onLimpiar={handleLimpiar}
            onNuevoUsuario={handleNuevoUsuario}
            loading={loading}
          />

          {/* Mensajes de estado */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">
              <p className="font-semibold">Error al cargar usuarios</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={cargarUsuarios}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Table - full width, no side column */}
          <UsuariosTable
            usuarios={usuarios}
            onVerDetalle={setDetalleUsuario}
            onEditar={handleEditar}
            onCambiarEstado={handleCambiarEstado}
            onEliminar={handleEliminar}
          />

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Página {paginaActual} de {totalPaginas} • Total: {totalUsuarios} usuarios
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1 || loading}
                  className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas || loading}
                  className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Sessions bar - full width at bottom */}
          <SesionesActivas usuarios={usuarios} />
        </div>
      </main>

      {/* Modals */}
      <UsuarioModal
        key={editandoUsuario?.id ?? "new"}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditandoUsuario(null) }}
        onGuardar={handleGuardar}
        usuario={editandoUsuario}
        roles={roles}
        rolesLoading={rolesLoading}
      />

      <DetalleUsuarioModal
        usuario={detalleUsuario}
        open={!!detalleUsuario}
        onClose={() => setDetalleUsuario(null)}
      />

      {usuarioAEliminar && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => !eliminandoUsuario && setUsuarioAEliminar(null)}
            aria-label="Cerrar modal de confirmacion"
          />

          <div
            className="relative w-full max-w-xl rounded-xl border border-border bg-card p-6"
            style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
          >
            <h3 className="text-xl font-semibold text-foreground">Confirmar eliminacion</h3>
            <p className="mt-4 text-base text-foreground/90">
              Se eliminara el usuario <strong>"{usuarioAEliminar.nombre}"</strong> (@{usuarioAEliminar.username}).
            </p>
            <p className="mt-3 text-base text-muted-foreground">
              Esta accion lo desactivara en el sistema.
            </p>
            <p className="mt-6 text-base font-medium text-foreground">Deseas continuar?</p>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg border border-accent text-accent hover:bg-accent/10 transition-colors disabled:opacity-60"
                onClick={() => setUsuarioAEliminar(null)}
                disabled={eliminandoUsuario}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
                onClick={handleConfirmarEliminacion}
                disabled={eliminandoUsuario}
              >
                {eliminandoUsuario ? 'Eliminando...' : 'Eliminar usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
