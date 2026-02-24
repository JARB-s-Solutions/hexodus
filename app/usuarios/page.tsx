"use client"

import { useState, useMemo, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { UsuariosHeader } from "@/components/usuarios/usuarios-header"
import { KpiUsuarios } from "@/components/usuarios/kpi-usuarios"
import { UsuariosToolbar } from "@/components/usuarios/usuarios-toolbar"
import { UsuariosTable } from "@/components/usuarios/usuarios-table"
import { UsuarioModal, type UsuarioFormData } from "@/components/usuarios/usuario-modal"
import { DetalleUsuarioModal } from "@/components/usuarios/detalle-usuario-modal"
import { SesionesActivas } from "@/components/usuarios/sesiones-activas"
import { generateUsuarios, type Usuario, type Rol, type Estado, type Departamento } from "@/lib/usuarios-data"

const initialUsuarios = generateUsuarios(24)

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios)

  // Filters
  const [busqueda, setBusqueda] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState<Estado | "todos">("todos")
  const [rolFiltro, setRolFiltro] = useState<Rol | "todos">("todos")
  const [departamentoFiltro, setDepartamentoFiltro] = useState<Departamento | "todos">("todos")

  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null)
  const [detalleUsuario, setDetalleUsuario] = useState<Usuario | null>(null)

  // Filtered data
  const usuariosActivos = useMemo(() => usuarios.filter((u) => u.activo), [usuarios])

  const usuariosFiltrados = useMemo(() => {
    let filtered = usuariosActivos

    if (estadoFiltro !== "todos") {
      filtered = filtered.filter((u) => u.estado === estadoFiltro)
    }
    if (rolFiltro !== "todos") {
      filtered = filtered.filter((u) => u.rol === rolFiltro)
    }
    if (departamentoFiltro !== "todos") {
      filtered = filtered.filter((u) => u.departamento === departamentoFiltro)
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.nombre.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [usuariosActivos, estadoFiltro, rolFiltro, departamentoFiltro, busqueda])

  // Handlers
  const handleLimpiar = useCallback(() => {
    setBusqueda("")
    setEstadoFiltro("todos")
    setRolFiltro("todos")
    setDepartamentoFiltro("todos")
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
    (data: UsuarioFormData) => {
      if (editandoUsuario) {
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === editandoUsuario.id
              ? { ...u, ...data, permisos: data.permisos }
              : u
          )
        )
      } else {
        const maxId = Math.max(...usuarios.map((u) => u.id))
        const nuevo: Usuario = {
          id: maxId + 1,
          nombre: data.nombre,
          username: data.username,
          email: data.email,
          telefono: data.telefono,
          rol: data.rol,
          departamento: data.departamento,
          estado: data.estado,
          fechaCreacion: new Date().toISOString().slice(0, 10),
          ultimoAcceso: new Date().toISOString().slice(0, 10),
          permisos: data.permisos,
          sesionActiva: false,
          activo: true,
        }
        setUsuarios((prev) => [nuevo, ...prev])
      }
      setModalOpen(false)
      setEditandoUsuario(null)
    },
    [editandoUsuario, usuarios]
  )

  const handleCambiarEstado = useCallback((u: Usuario) => {
    const nuevosEstados: Record<Estado, Estado> = {
      activo: "inactivo",
      inactivo: "activo",
      bloqueado: "activo",
    }
    setUsuarios((prev) =>
      prev.map((usr) =>
        usr.id === u.id
          ? { ...usr, estado: nuevosEstados[usr.estado], sesionActiva: nuevosEstados[usr.estado] === "activo" ? Math.random() > 0.5 : false }
          : usr
      )
    )
  }, [])

  const handleEliminar = useCallback((u: Usuario) => {
    setUsuarios((prev) =>
      prev.map((usr) => (usr.id === u.id ? { ...usr, activo: false } : usr))
    )
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="usuarios" />

      <main className="flex-1 flex flex-col min-h-0">
        <UsuariosHeader />

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-5">
          {/* KPIs - full width */}
          <KpiUsuarios usuarios={usuarios} />

          {/* Toolbar: search + filters inline - full width */}
          <UsuariosToolbar
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            estadoFiltro={estadoFiltro}
            onEstadoChange={setEstadoFiltro}
            rolFiltro={rolFiltro}
            onRolChange={setRolFiltro}
            departamentoFiltro={departamentoFiltro}
            onDepartamentoChange={setDepartamentoFiltro}
            onLimpiar={handleLimpiar}
            onNuevoUsuario={handleNuevoUsuario}
            totalFiltrados={usuariosFiltrados.length}
            totalUsuarios={usuariosActivos.length}
          />

          {/* Table - full width, no side column */}
          <UsuariosTable
            usuarios={usuariosFiltrados}
            onVerDetalle={setDetalleUsuario}
            onEditar={handleEditar}
            onCambiarEstado={handleCambiarEstado}
            onEliminar={handleEliminar}
          />

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
      />

      <DetalleUsuarioModal
        usuario={detalleUsuario}
        open={!!detalleUsuario}
        onClose={() => setDetalleUsuario(null)}
      />
    </div>
  )
}
