"use client"

import { useState, useMemo, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { SociosHeader } from "@/components/socios/socios-header"
import { KpiSocios } from "@/components/socios/kpi-socios"
import { SociosToolbar } from "@/components/socios/socios-toolbar"
import { SociosTable } from "@/components/socios/socios-table"
import { SocioModal, type SocioFormData } from "@/components/socios/socio-modal"
import { DetalleSocioModal } from "@/components/socios/detalle-socio-modal"
import {
  generateSocios,
  type Socio,
  type TipoMembresia,
  type Genero,
  getVigenciaMembresia,
  getEstadoContrato,
} from "@/lib/socios-data"

const initialSocios = generateSocios(345)

export default function SociosPage() {
  const [socios, setSocios] = useState<Socio[]>(initialSocios)

  // Filters
  const [busqueda, setBusqueda] = useState("")
  const [vigenciaFiltro, setVigenciaFiltro] = useState("todos")
  const [membresiaFiltro, setMembresiaFiltro] = useState<TipoMembresia | "todos">("todos")
  const [generoFiltro, setGeneroFiltro] = useState<Genero | "todos">("todos")
  const [contratoFirmaFiltro, setContratoFirmaFiltro] = useState("todos")
  const [contratoVigenciaFiltro, setContratoVigenciaFiltro] = useState("todos")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")

  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [editandoSocio, setEditandoSocio] = useState<Socio | null>(null)
  const [detalleSocio, setDetalleSocio] = useState<Socio | null>(null)

  // Filtered data
  const sociosFiltrados = useMemo(() => {
    let filtered = socios

    // Search
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.nombre.toLowerCase().includes(q) ||
          s.correo.toLowerCase().includes(q) ||
          s.telefono.includes(q) ||
          String(s.id).includes(q)
      )
    }

    // Vigencia membresia
    if (vigenciaFiltro !== "todos") {
      filtered = filtered.filter((s) => getVigenciaMembresia(s.fechaFin) === vigenciaFiltro)
    }

    // Tipo membresia
    if (membresiaFiltro !== "todos") {
      filtered = filtered.filter((s) => s.membresia === membresiaFiltro)
    }

    // Genero
    if (generoFiltro !== "todos") {
      filtered = filtered.filter((s) => s.genero === generoFiltro)
    }

    // Contrato firma
    if (contratoFirmaFiltro !== "todos") {
      if (contratoFirmaFiltro === "firmado") {
        filtered = filtered.filter((s) => s.firmoContrato)
      } else if (contratoFirmaFiltro === "pendiente") {
        filtered = filtered.filter((s) => !s.firmoContrato)
      }
    }

    // Contrato vigencia
    if (contratoVigenciaFiltro !== "todos") {
      filtered = filtered.filter((s) => getEstadoContrato(s) === contratoVigenciaFiltro)
    }

    // Date range (vencimiento)
    if (fechaDesde || fechaHasta) {
      filtered = filtered.filter((s) => {
        if (!s.fechaFin) return false
        const venc = new Date(s.fechaFin)
        if (fechaDesde && fechaHasta) {
          return venc >= new Date(fechaDesde) && venc <= new Date(fechaHasta)
        }
        if (fechaDesde) return venc >= new Date(fechaDesde)
        if (fechaHasta) return venc <= new Date(fechaHasta)
        return true
      })
    }

    return filtered
  }, [
    socios,
    busqueda,
    vigenciaFiltro,
    membresiaFiltro,
    generoFiltro,
    contratoFirmaFiltro,
    contratoVigenciaFiltro,
    fechaDesde,
    fechaHasta,
  ])

  // Handlers
  const handleLimpiar = useCallback(() => {
    setBusqueda("")
    setVigenciaFiltro("todos")
    setMembresiaFiltro("todos")
    setGeneroFiltro("todos")
    setContratoFirmaFiltro("todos")
    setContratoVigenciaFiltro("todos")
    setFechaDesde("")
    setFechaHasta("")
  }, [])

  const handleNuevoSocio = useCallback(() => {
    setEditandoSocio(null)
    setModalOpen(true)
  }, [])

  const handleEditar = useCallback((s: Socio) => {
    setEditandoSocio(s)
    setModalOpen(true)
  }, [])

  const handleGuardar = useCallback(
    (data: SocioFormData) => {
      if (editandoSocio) {
        setSocios((prev) =>
          prev.map((s) =>
            s.id === editandoSocio.id
              ? { ...s, ...data, estadoSocio: s.estadoSocio, fechaRegistro: s.fechaRegistro }
              : s
          )
        )
      } else {
        const maxId = socios.length > 0 ? Math.max(...socios.map((s) => s.id)) : 0
        const nuevo: Socio = {
          id: maxId + 1,
          ...data,
          estadoSocio: "activo",
          fechaRegistro: new Date().toISOString().split("T")[0],
        }
        setSocios((prev) => [nuevo, ...prev])
      }
      setModalOpen(false)
      setEditandoSocio(null)
    },
    [editandoSocio, socios]
  )

  const handleEliminar = useCallback((s: Socio) => {
    if (confirm(`Eliminar a ${s.nombre}? Esta accion no se puede deshacer.`)) {
      setSocios((prev) => prev.filter((x) => x.id !== s.id))
    }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="socios" />

      <main className="flex-1 flex flex-col min-h-0">
        <SociosHeader />

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-5">
          {/* KPIs */}
          <KpiSocios socios={socios} />

          {/* Toolbar: search + filters inline */}
          <SociosToolbar
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            vigenciaFiltro={vigenciaFiltro}
            onVigenciaChange={setVigenciaFiltro}
            membresiaFiltro={membresiaFiltro}
            onMembresiaChange={setMembresiaFiltro}
            generoFiltro={generoFiltro}
            onGeneroChange={setGeneroFiltro}
            contratoFirmaFiltro={contratoFirmaFiltro}
            onContratoFirmaChange={setContratoFirmaFiltro}
            contratoVigenciaFiltro={contratoVigenciaFiltro}
            onContratoVigenciaChange={setContratoVigenciaFiltro}
            fechaDesde={fechaDesde}
            onFechaDesdeChange={setFechaDesde}
            fechaHasta={fechaHasta}
            onFechaHastaChange={setFechaHasta}
            onLimpiar={handleLimpiar}
            onNuevoSocio={handleNuevoSocio}
            totalFiltrados={sociosFiltrados.length}
            totalSocios={socios.length}
          />

          {/* Table - full width */}
          <SociosTable
            socios={sociosFiltrados}
            onVerDetalle={setDetalleSocio}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
          />
        </div>
      </main>

      {/* Modals */}
      <SocioModal
        key={editandoSocio?.id ?? "new"}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditandoSocio(null)
        }}
        onGuardar={handleGuardar}
        socio={editandoSocio}
      />

      <DetalleSocioModal
        socio={detalleSocio}
        open={!!detalleSocio}
        onClose={() => setDetalleSocio(null)}
      />
    </div>
  )
}
