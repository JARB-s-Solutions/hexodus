"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { SociosHeader } from "@/components/socios/socios-header"
import { KpiSocios } from "@/components/socios/kpi-socios"
import { SociosToolbar } from "@/components/socios/socios-toolbar"
import { SociosTable } from "@/components/socios/socios-table"
import { SocioModal } from "@/components/socios/socio-modal"
import { DetalleSocioModal } from "@/components/socios/detalle-socio-modal"
import { EliminarSocioModal } from "@/components/socios/eliminar-socio-modal"
import { CobrarMembresiaModal } from "@/components/socios/cobrar-membresia-modal"
import { RenovarMembresiaModal } from "@/components/socios/renovar-membresia-modal"
import { SociosService } from "@/lib/services/socios"
import { toast } from "@/hooks/use-toast"
import type { Socio } from "@/lib/types/socios"
import { extractYmd } from "@/lib/timezone"
import {
  generateSocios,
  type TipoMembresia,
  type Genero,
  getVigenciaMembresia,
  getEstadoContrato,
  membresiaLabels,
  type Socio as SocioMock,
} from "@/lib/socios-data"

// TODO: Eliminar esto una vez que el backend esté listo
const useMockData = false // Cambiar a false para usar API real

export default function SociosPage() {
  const [socios, setSocios] = useState<(Socio | SocioMock)[]>(useMockData ? generateSocios(345) : [])
  const [cargando, setCargando] = useState(!useMockData)

  // Filters
  const [busqueda, setBusqueda] = useState("")
  const [vigenciaFiltro, setVigenciaFiltro] = useState("todos")
  const [membresiaFiltro, setMembresiaFiltro] = useState<string>("todos")
  const [generoFiltro, setGeneroFiltro] = useState<Genero | "todos">("todos")
  const [contratoFirmaFiltro, setContratoFirmaFiltro] = useState("todos")
  const [contratoVigenciaFiltro, setContratoVigenciaFiltro] = useState("todos")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")

  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [editandoSocio, setEditandoSocio] = useState<Socio | SocioMock | null>(null)
  const [detalleSocioId, setDetalleSocioId] = useState<number | null>(null)
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false)
  const [socioAEliminar, setSocioAEliminar] = useState<Socio | SocioMock | null>(null)
  const [modalCobrarOpen, setModalCobrarOpen] = useState(false)
  const [socioACobrar, setSocioACobrar] = useState<Socio | SocioMock | null>(null)
  const [modalRenovarOpen, setModalRenovarOpen] = useState(false)
  const [socioARenovar, setSocioARenovar] = useState<Socio | SocioMock | null>(null)

  // ===== Cargar socios desde la API =====
  const cargarSocios = useCallback(async () => {
    if (useMockData) return // No cargar si usamos mock data
    
    setCargando(true)
    try {
      const { socios: data, stats } = await SociosService.getAll()
      console.log('📊 Socios cargados:', data.length, 'Stats:', stats)
      setSocios(data)
      
      // Opcional: Podrías usar stats para mostrar en los KPIs reales del backend
      // Por ahora solo cargamos los socios
    } catch (error: any) {
      console.error("Error cargando socios:", error)
      toast({
        title: "Error al cargar socios",
        description: error.message || "No se pudieron cargar los socios",
        variant: "destructive",
      })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarSocios()
  }, [])

  const normalizarTexto = (valor: string | undefined | null): string => {
    if (!valor) return ""
    return valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
  }

  const getMembresiaKey = (s: Socio | SocioMock): string => {
    const esApi = 'fechaVencimientoMembresia' in s
    if (esApi) {
      const socioApi = s as Socio
      return normalizarTexto(socioApi.nombrePlan || (socioApi as any).membresia)
    }
    const socioMock = s as SocioMock
    return normalizarTexto(socioMock.membresia)
  }

  const getMembresiaLabel = (s: Socio | SocioMock): string => {
    const esApi = 'fechaVencimientoMembresia' in s
    if (esApi) {
      const socioApi = s as Socio
      return socioApi.nombrePlan || (socioApi as any).membresia || "Sin plan"
    }
    const socioMock = s as SocioMock
    const key = socioMock.membresia as TipoMembresia
    return membresiaLabels[key] || String(socioMock.membresia)
  }

  const membresiaOpciones = useMemo(() => {
    const opcionesMap = new Map<string, string>()

    socios.forEach((s) => {
      const key = getMembresiaKey(s)
      const label = getMembresiaLabel(s)
      if (!key || !label) return
      if (!opcionesMap.has(key)) {
        opcionesMap.set(key, label)
      }
    })

    return Array.from(opcionesMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"))
  }, [socios])

  // ===== Helper para acceder a campos de forma uniforme =====
  const isSocioAPI = (s: Socio | SocioMock): s is Socio => {
    // El Socio de API tiene 'fechaVencimientoMembresia', el mock tiene 'fechaFin'
    return 'fechaVencimientoMembresia' in s
  }

  const getSocioField = (s: Socio | SocioMock, field: string): any => {
    if (isSocioAPI(s)) {
      // Es del tipo API
      switch (field) {
        case 'nombre': return s.nombre
        case 'correo': return s.correo
        case 'telefono': return s.telefono
        case 'membresia': return s.nombrePlan || (s as any).membresia
        case 'fechaFin': return s.fechaVencimientoMembresia
        case 'genero': {
          // Mapear Genero API a Genero Mock
          const generoMap: Record<string, Genero> = {
            'Masculino': 'M',
            'Femenino': 'F',
            'Otro': 'O'
          }
          return generoMap[s.genero] || 'O'
        }
        case 'firmoContrato': return s.firmoContrato
        case 'estadoSocio': return s.estadoSocio
        case 'contratoInicio': return s.inicioContrato
        case 'contratoFin': return s.finContrato
        default: return (s as any)[field]
      }
    } else {
      // Es del tipo Mock (SocioMock)
      return (s as any)[field]
    }
  }

  // Filtered data
  const sociosFiltrados = useMemo(() => {
    let filtered = socios

    // Search
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      filtered = filtered.filter(
        (s) => {
          const nombre = getSocioField(s, 'nombre')
          const correo = getSocioField(s, 'correo')
          const telefono = getSocioField(s, 'telefono')
          const id = 'id' in s ? s.id : 0
          const clave = getSocioField(s, 'codigoSocio') || getSocioField(s, 'clave')

          const nombreNormalizado = String(nombre || '').toLowerCase()
          const correoNormalizado = String(correo || '').toLowerCase()
          const telefonoNormalizado = String(telefono || '').toLowerCase()
          const claveNormalizada = String(clave || '').toLowerCase()
          
          return (
            nombreNormalizado.includes(q) ||
            claveNormalizada.includes(q) ||
            correoNormalizado.includes(q) ||
            telefonoNormalizado.includes(q) ||
            String(id).includes(q)
          )
        }
      )
    }

    // Vigencia membresia
    if (vigenciaFiltro !== "todos") {
      filtered = filtered.filter((s) => {
        const fechaFin = getSocioField(s, 'fechaFin')
        return getVigenciaMembresia(fechaFin) === vigenciaFiltro
      })
    }

    // Tipo membresia
    if (membresiaFiltro !== "todos") {
      filtered = filtered.filter((s) => getMembresiaKey(s) === membresiaFiltro)
    }

    // Genero
    if (generoFiltro !== "todos") {
      filtered = filtered.filter((s) => getSocioField(s, 'genero') === generoFiltro)
    }

    // Contrato firma
    if (contratoFirmaFiltro !== "todos") {
      if (contratoFirmaFiltro === "firmado") {
        filtered = filtered.filter((s) => getSocioField(s, 'firmoContrato'))
      } else if (contratoFirmaFiltro === "pendiente") {
        filtered = filtered.filter((s) => !getSocioField(s, 'firmoContrato'))
      }
    }

    // Contrato vigencia
    if (contratoVigenciaFiltro !== "todos") {
      filtered = filtered.filter((s) => {
        // Crear un objeto compatible con la función getEstadoContrato
        if (isSocioAPI(s)) {
          const mockForCheck: SocioMock = {
            id: s.id,
            nombre: s.nombre,
            correo: s.correo,
            telefono: s.telefono,
            genero: getSocioField(s, 'genero') as Genero,
            membresia: 'mensual' as TipoMembresia, // no importa para el check de contrato
            fechaInicio: s.fechaInicioMembresia,
            fechaFin: s.fechaVencimientoMembresia,
            estadoSocio: s.estadoSocio as any,
            firmoContrato: s.firmoContrato,
            contratoInicio: s.inicioContrato || null,
            contratoFin: s.finContrato || null,
            fechaRegistro: s.createdAt || '',
            bioRostro: !!s.faceEncoding,
            bioHuella: !!s.fingerprintTemplate,
          }
          return getEstadoContrato(mockForCheck) === contratoVigenciaFiltro
        }
        return getEstadoContrato(s as SocioMock) === contratoVigenciaFiltro
      })
    }

    // Date range (vencimiento)
    if (fechaDesde || fechaHasta) {
      filtered = filtered.filter((s) => {
        const fechaFin = getSocioField(s, 'fechaFin')
        const vencYmd = extractYmd(String(fechaFin || ''))
        if (!vencYmd) return false
        if (fechaDesde && fechaHasta) {
          return vencYmd >= fechaDesde && vencYmd <= fechaHasta
        }
        if (fechaDesde) return vencYmd >= fechaDesde
        if (fechaHasta) return vencYmd <= fechaHasta
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
    getMembresiaKey,
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

  const handleEditar = useCallback((s: Socio | SocioMock) => {
    console.log('📝 Editando socio:', s)
    setEditandoSocio(s as Socio)
    setModalOpen(true)
  }, [])

  const handleSuccess = useCallback(() => {
    // Recargar socios después de crear/editar exitosamente
    cargarSocios()
    setModalOpen(false)
    setEditandoSocio(null)
  }, [cargarSocios])

  const handleEliminar = useCallback((s: Socio | SocioMock) => {
    setSocioAEliminar(s)
    setModalEliminarOpen(true)
  }, [])

  const handleConfirmarEliminacion = useCallback(async () => {
    if (!socioAEliminar) return

    try {
      if (useMockData) {
        setSocios((prev) => prev.filter((x) => x.id !== socioAEliminar.id))
        toast({
          title: "Socio eliminado",
          description: `${getSocioField(socioAEliminar, 'nombre')} ha sido eliminado exitosamente`,
        })
      } else {
        await SociosService.delete(socioAEliminar.id)
        toast({
          title: "Socio eliminado",
          description: `${getSocioField(socioAEliminar, 'nombre')} ha sido eliminado exitosamente`,
        })
        // Recargar lista
        cargarSocios()
      }
    } catch (error: any) {
      console.error('Error eliminando socio:', error)
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el socio",
        variant: "destructive",
      })
    } finally {
      setModalEliminarOpen(false)
      setSocioAEliminar(null)
    }
  }, [socioAEliminar, useMockData, cargarSocios, getSocioField])

  const handleCobrar = useCallback((s: Socio | SocioMock) => {
    console.log('💳 Abriendo modal de cobro para:', s)
    setSocioACobrar(s)
    setModalCobrarOpen(true)
  }, [])

  const handleSuccessCobro = useCallback(() => {
    // Recargar socios después de cobrar exitosamente
    cargarSocios()
    setModalCobrarOpen(false)
    setSocioACobrar(null)
  }, [cargarSocios])

  const handleRenovar = useCallback((s: Socio | SocioMock) => {
    console.log('🔄 Abriendo modal de renovación para:', s)
    setSocioARenovar(s)
    setModalRenovarOpen(true)
  }, [])

  const handleSuccessRenovacion = useCallback(() => {
    cargarSocios()
    setModalRenovarOpen(false)
    setSocioARenovar(null)
  }, [cargarSocios])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="socios" />

      <main className="flex-1 flex flex-col min-h-0">
        <SociosHeader />

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-5">
          {/* KPIs */}
          {/* TODO: Actualizar KpiSocios para aceptar ambos tipos de Socio */}
          <KpiSocios socios={socios as any} />

          {/* Toolbar: search + filters inline */}
          <SociosToolbar
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            vigenciaFiltro={vigenciaFiltro}
            onVigenciaChange={setVigenciaFiltro}
            membresiaFiltro={membresiaFiltro}
            onMembresiaChange={setMembresiaFiltro}
            membresiaOpciones={membresiaOpciones}
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
          {/* TODO: Actualizar SociosTable para aceptar ambos tipos de Socio */}
          <SociosTable
            socios={sociosFiltrados as any}
            onVerDetalle={(socio) => setDetalleSocioId(socio.id)}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
            onCobrar={handleCobrar}
            onRenovar={handleRenovar}
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
        onSuccess={handleSuccess}
        socio={editandoSocio as Socio | null}
      />

      <DetalleSocioModal
        socioId={detalleSocioId}
        open={!!detalleSocioId}
        onClose={() => setDetalleSocioId(null)}
      />

      <EliminarSocioModal
        open={modalEliminarOpen}
        onClose={() => {
          setModalEliminarOpen(false)
          setSocioAEliminar(null)
        }}
        socio={socioAEliminar as Socio | null}
        onConfirmar={handleConfirmarEliminacion}
      />

      <CobrarMembresiaModal
        open={modalCobrarOpen}
        onClose={() => {
          setModalCobrarOpen(false)
          setSocioACobrar(null)
        }}
        socio={socioACobrar as Socio | null}
        onSuccess={handleSuccessCobro}
      />

      <RenovarMembresiaModal
        open={modalRenovarOpen}
        onClose={() => {
          setModalRenovarOpen(false)
          setSocioARenovar(null)
        }}
        socio={socioARenovar as Socio | null}
        onSuccess={handleSuccessRenovacion}
      />
    </div>
  )
}
