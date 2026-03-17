"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { MovimientosHeader } from "@/components/movimientos/movimientos-header"
import { KpiMovimientos } from "@/components/movimientos/kpi-movimientos"
import { FiltrosMovimientos } from "@/components/movimientos/filtros-movimientos"
import { TablaMovimientos } from "@/components/movimientos/tabla-movimientos"
import { ModalMovimiento } from "@/components/movimientos/modal-movimiento"
import { ComparacionesMovimientos } from "@/components/movimientos/comparaciones-movimientos"
import { ConceptosTable } from "@/components/movimientos/conceptos-table"
import { ModalConcepto } from "@/components/movimientos/modal-concepto"
import { MovimientosService } from "@/lib/services/movimientos"
import { getMetodosPago, type MetodoPago } from "@/lib/services/metodos-pago"
import { exportMovimientosCSV } from "@/lib/movimientos-data"
import type { 
  Movimiento, 
  MovimientoKpis, 
  PaginationInfo,
  CreateMovimientoData,
  Concepto,
} from "@/lib/types/movimientos"
import { CONCEPTOS_INGRESO as conceptosIngreso, CONCEPTOS_GASTO as conceptosGasto } from "@/lib/types/movimientos"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/lib/contexts/auth-context"

type MovimientosTabKey = "historial" | "comparaciones" | "conceptos"

export default function MovimientosPage() {
  const { toast } = useToast()
  const { tienePermiso } = useAuthContext()

  // Data state
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [kpis, setKpis] = useState<MovimientoKpis>({
    totalIngresos: 0,
    totalEgresos: 0,
    balanceNeto: 0,
    totalMovimientos: 0,
  })
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    limit: 20,
    total_records: 0,
    total_pages: 0,
  })

  // Loading & Error state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Métodos de pago disponibles
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])

  // Conceptos dinámicos desde API
  const [conceptos, setConceptos] = useState<Concepto[]>([])
  const [conceptosLoading, setConceptosLoading] = useState(true)

  // Filter state
  const [busqueda, setBusqueda] = useState("")
  const [tipo, setTipo] = useState("todos")
  const [tipoPago, setTipoPago] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")

  // Log cambios de filtros
  useEffect(() => {
    console.log("🛠️ Filtros actualizados:", {
      busqueda,
      tipo,
      tipoPago,
      fechaInicio,
      fechaFin,
    })
  }, [busqueda, tipo, tipoPago, fechaInicio, fechaFin])

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"crear" | "editar" | "ver">("crear")
  const [selectedMov, setSelectedMov] = useState<Movimiento | null>(null)

  // Log cambios de modal
  useEffect(() => {
    console.log("📝 Modal state cambio:", {
      open: modalOpen,
      mode: modalMode,
      hasSelection: !!selectedMov,
      selectedFolio: selectedMov?.folio,
    })
  }, [modalOpen, modalMode, selectedMov])

  // Tab state
  const [activeTab, setActiveTab] = useState<MovimientosTabKey>("historial")
  const puedeExportar = tienePermiso("movimientos", "exportar")
  const puedeVerComparaciones = tienePermiso("movimientos", "verComparaciones")
  const puedeVerConceptos =
    tienePermiso("movimientos", "verConceptos") ||
    tienePermiso("movimientos", "crearConcepto") ||
    tienePermiso("movimientos", "editarConcepto") ||
    tienePermiso("movimientos", "eliminarConcepto")

  const tabsDisponibles = useMemo<Array<{ key: MovimientosTabKey; label: string }>>(() => {
    const tabs: Array<{ key: MovimientosTabKey; label: string }> = [{ key: "historial", label: "Historial" }]
    if (puedeVerComparaciones) tabs.push({ key: "comparaciones", label: "Comparaciones" })
    if (puedeVerConceptos) tabs.push({ key: "conceptos", label: "Conceptos" })
    return tabs
  }, [puedeVerComparaciones, puedeVerConceptos])

  useEffect(() => {
    if (!tabsDisponibles.some((tab) => tab.key === activeTab)) {
      setActiveTab(tabsDisponibles[0]?.key ?? "historial")
    }
  }, [activeTab, tabsDisponibles])

  // Log cambios de tab
  useEffect(() => {
    console.log("📂 Tab activo cambio:", activeTab)
  }, [activeTab])

  // Modal conceptos state
  const [modalConceptoOpen, setModalConceptoOpen] = useState(false)
  const [modalConceptoMode, setModalConceptoMode] = useState<"crear" | "editar">("crear")
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState<Concepto | null>(null)

  // Sidebar filters panel (mobile)
  const [showFilters, setShowFilters] = useState(false)

  // ==============================
  // Cargar métodos de pago y conceptos al montar
  // ==============================
  useEffect(() => {
    const cargarMetodosPago = async () => {
      try {
        console.log("📥 Iniciando carga de métodos de pago...")
        const metodos = await getMetodosPago()
        // Filtrar solo los activos
        const metodosActivos = metodos.filter((m) => m.activo !== false)
        setMetodosPago(metodosActivos)
        console.log("✅ Métodos de pago cargados:", metodosActivos.length)
        console.log("  Métodos:", metodosActivos.map(m => `${m.id}: ${m.nombre}`))
      } catch (err) {
        console.error("⚠️ Error cargando métodos de pago:", err)
        // No es crítico, continuar sin métodos de pago dinámicos
      }
    }

    const cargarConceptos = async () => {
      if (!puedeVerConceptos) {
        setConceptos([])
        setConceptosLoading(false)
        return
      }

      try {
        setConceptosLoading(true)
        console.log("📋 Iniciando carga de conceptos...")
        const conceptosAPI = await MovimientosService.getConceptos()
        setConceptos(conceptosAPI)
        console.log("✅ Conceptos cargados:", conceptosAPI.length)
        console.log("  Conceptos:", conceptosAPI.map(c => `${c.id}: ${c.nombre} (${c.tipo})`))
      } catch (err) {
        console.error("⚠️ Error cargando conceptos:", err)
        // Usar hardcoded como fallback
        setConceptos([...conceptosIngreso, ...conceptosGasto])
      } finally {
        setConceptosLoading(false)
      }
    }

    cargarMetodosPago()
    cargarConceptos()
  }, [puedeVerConceptos])

  // ==============================
  // Cargar movimientos desde API
  // ==============================
  const cargarMovimientos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Mapear tipo frontend → backend
      let tipoAPI: "Ingresos" | "Egresos" | "Todos" = "Todos"
      if (tipo === "ingreso") tipoAPI = "Ingresos"
      else if (tipo === "egreso") tipoAPI = "Egresos"

      const busquedaNormalizada = busqueda.trim()
      const fechaInicioParam = fechaInicio && fechaFin && fechaInicio > fechaFin ? fechaFin : fechaInicio
      const fechaFinParam = fechaInicio && fechaFin && fechaInicio > fechaFin ? fechaInicio : fechaFin

      const params = {
        page: pagination.current_page,
        limit: pagination.limit,
        tipo: tipoAPI,
        metodo_pago: tipoPago || undefined,
        search: busquedaNormalizada || undefined,
        fecha_inicio: fechaInicioParam || undefined,
        fecha_fin: fechaFinParam || undefined,
      }

      console.log("🔄 Cargando movimientos con params:", params)

      const response = await MovimientosService.getAll(params)

      setMovimientos(response.movimientos)
      setKpis(response.kpis)
      setPagination(response.pagination)

      console.log("✅ Movimientos cargados:", {
        count: response.movimientos.length,
        kpis: response.kpis,
      })
    } catch (err: any) {
      console.error("❌ Error cargando movimientos:", err)
      setError(err.message || "Error al cargar movimientos")
      toast({
        title: "Error",
        description: "No se pudieron cargar los movimientos. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [
    pagination.current_page,
    pagination.limit,
    tipo,
    tipoPago,
    busqueda,
    fechaInicio,
    fechaFin,
    toast,
  ])

  // Cargar movimientos al montar y cuando cambien los filtros
  useEffect(() => {
    console.log("🔄 useEffect cargarMovimientos ejecutándose...")
    console.log("  - Filtros actuales:", {
      page: pagination.current_page,
      limit: pagination.limit,
      tipo,
      tipoPago,
      busqueda,
      fechaInicio,
      fechaFin,
    })
    cargarMovimientos()
  }, [cargarMovimientos])

  // Filtered list (ya viene filtrado del backend, pero mantenemos para compatibilidad)
  const filtered = useMemo(() => {
    console.log("🔍 Recalculando filtered list...")
    console.log("  Movimientos actuales:", movimientos.length)
    return movimientos
  }, [movimientos])

  // Actions
  // Handlers de paginación
  const handlePageChange = useCallback((newPage: number) => {
    console.log("📄 Cambiando a página:", newPage)
    setPagination((prev) => ({ ...prev, current_page: newPage }))
  }, [])

  const handleLimitChange = useCallback((newLimit: number) => {
    console.log("🔢 Cambiando límite a:", newLimit)
    setPagination((prev) => ({ ...prev, limit: newLimit, current_page: 1 }))
  }, [])

  // Wrappers de filtros que resetean la página
  const handleBusquedaChange = useCallback((value: string) => {
    setBusqueda(value)
    setPagination((prev) => ({ ...prev, current_page: 1 }))
  }, [])

  const handleTipoChange = useCallback((value: string) => {
    setTipo(value)
    setPagination((prev) => ({ ...prev, current_page: 1 }))
  }, [])

  const handleTipoPagoChange = useCallback((value: string) => {
    setTipoPago(value)
    setPagination((prev) => ({ ...prev, current_page: 1 }))
  }, [])

  const handleFechaInicioChange = useCallback((value: string) => {
    setFechaInicio(value)
    setPagination((prev) => ({ ...prev, current_page: 1 }))
  }, [])

  const handleFechaFinChange = useCallback((value: string) => {
    setFechaFin(value)
    setPagination((prev) => ({ ...prev, current_page: 1 }))
  }, [])

  const handleLimpiar = useCallback(() => {
    console.log("🧹 Limpiando filtros...")
    setBusqueda("")
    setTipo("todos")
    setTipoPago("")
    setFechaInicio("")
    setFechaFin("")
    setPagination((prev) => ({ ...prev, current_page: 1 }))
    console.log("✅ Filtros limpiados")
  }, [])

  const handleExportar = useCallback(() => {
    console.log("📤 Exportando movimientos a CSV...")
    console.log("  - Movimientos a exportar:", filtered.length)
    console.log("  - KPIs:", kpis)
    
    let label = "todos"
    if (fechaInicio && fechaFin) {
      label = `${fechaInicio}_a_${fechaFin}`
    } else if (fechaInicio) {
      label = `desde_${fechaInicio}`
    } else if (fechaFin) {
      label = `hasta_${fechaFin}`
    }
    
    console.log("  - Label del archivo:", label)
    exportMovimientosCSV(filtered, kpis, label)
    console.log("✅ Exportación completada")
  }, [filtered, kpis, fechaInicio, fechaFin])

  const handleNuevo = useCallback(() => {
    console.log("➕ Abriendo modal para crear nuevo movimiento")
    setSelectedMov(null)
    setModalMode("crear")
    setModalOpen(true)
  }, [])

  const handleVer = useCallback((m: Movimiento) => {
    console.log("👁️ Abriendo modal para ver movimiento:", {
      folio: m.folio,
      tipo: m.tipo,
      concepto: m.concepto,
      total: m.total,
    })
    setSelectedMov(m)
    setModalMode("ver")
    setModalOpen(true)
  }, [])

  const handleEditar = useCallback((m: Movimiento) => {
    console.log("✏️ Abriendo modal para editar movimiento:", {
      folio: m.folio,
      tipo: m.tipo,
      concepto: m.concepto,
      total: m.total,
    })
    setSelectedMov(m)
    setModalMode("editar")
    setModalOpen(true)
  }, [])

  const handleEliminar = useCallback(
    async (m: Movimiento) => {
      try {
        // Extraer ID numérico del folio (ej: "MOV-0058" → 58)
        const idNumerico = parseInt(m.folio?.replace(/\D/g, "") || "0")
        
        if (!idNumerico) {
          toast({
            title: "Error",
            description: "No se pudo identificar el movimiento a eliminar",
            variant: "destructive",
          })
          return
        }

        console.log("🗑️ Eliminando movimiento:", idNumerico)

        await MovimientosService.delete(idNumerico)

        toast({
          title: "Éxito",
          description: "Movimiento eliminado correctamente",
        })

        // Recargar lista
        cargarMovimientos()
      } catch (err: any) {
        console.error("❌ Error eliminando movimiento:", err)
        toast({
          title: "Error",
          description: err.message || "No se pudo eliminar el movimiento",
          variant: "destructive",
        })
      }
    },
    [toast, cargarMovimientos]
  )

  const handleSave = useCallback(
    async (data: {
      tipo: "ingreso" | "egreso"
      concepto_id: number
      concepto_nombre: string
      total: number
      metodo_pago_id: number
      metodo_pago_nombre: string
      observaciones?: string
    }) => {
      console.log("💾 handleSave llamado con data:", data)

      try {
        setLoading(true)

        // Mapear tipo frontend → backend
        const tipoBackend = data.tipo === "ingreso" ? "ingreso" : "gasto"

        const requestData: CreateMovimientoData = {
          tipo_movimiento: tipoBackend,
          concepto_id: data.concepto_id,
          total: data.total,
          metodo_pago_id: data.metodo_pago_id,
          observaciones: data.observaciones || undefined,
        }

        console.log("📦 Request data preparado:", requestData)

        if (modalMode === "editar" && selectedMov) {
          // Extraer ID numérico del folio
          const idNumerico = parseInt(selectedMov.folio?.replace(/\D/g, "") || "0")
          
          if (!idNumerico) {
            toast({
              title: "Error",
              description: "No se pudo identificar el movimiento a actualizar",
              variant: "destructive",
            })
            return
          }

          console.log("✏️ Actualizando movimiento:", idNumerico, requestData)

          await MovimientosService.update(idNumerico, requestData)

          toast({
            title: "Éxito",
            description: "Movimiento actualizado correctamente",
          })
        } else {
          console.log("📝 Creando movimiento:", requestData)

          const response = await MovimientosService.create(requestData)

          console.log("✅ Response recibida en handleSave:", response)

          toast({
            title: "Éxito",
            description: `Movimiento registrado correctamente. Saldo restante: $${response.data.saldo_restante_caja}`,
          })
        }

        // Cerrar modal y recargar lista
        console.log("🔄 Cerrando modal y recargando movimientos")
        setModalOpen(false)
        setSelectedMov(null)
        cargarMovimientos()
      } catch (err: any) {
        console.error("❌ Error capturado en handleSave")
        console.error("  - Error type:", err?.constructor?.name)
        console.error("  - Error message:", err?.message)
        console.error("  - Error completo:", err)

        toast({
          title: "Error",
          description: err.message || "No se pudo guardar el movimiento",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [modalMode, selectedMov, toast, cargarMovimientos]
  )

  // ==============================
  // Handler para guardar concepto
  // ==============================
  const handleSaveConcepto = useCallback(
    async (data: {
      nombre: string
      tipo: "ingreso" | "egreso"
    }) => {
      console.log("💾 handleSaveConcepto llamado con data:", data)

      try {
        setConceptosLoading(true)

        // Crear concepto
        const nuevoConcepto = await MovimientosService.createConcepto({
          nombre: data.nombre,
          tipo: data.tipo,
        })

        console.log("✅ Concepto creado exitosamente:", nuevoConcepto)

        toast({
          title: "Éxito",
          description: `Concepto "${nuevoConcepto.nombre}" creado exitosamente`,
        })

        // Cerrar modal
        setModalConceptoOpen(false)
        setConceptoSeleccionado(null)

        // Recargar conceptos
        const conceptosActualizados = await MovimientosService.getConceptos()
        setConceptos(conceptosActualizados)
      } catch (err: any) {
        console.error("❌ Error guardando concepto:", err)
        toast({
          title: "Error",
          description: err.message || "No se pudo guardar el concepto",
          variant: "destructive",
        })
      } finally {
        setConceptosLoading(false)
      }
    },
    [toast]
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="movimientos" />

      <main className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <MovimientosHeader onToggleFilters={() => setShowFilters((v) => !v)} />

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-4">
            {/* Tabs */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1 bg-card rounded-lg p-1" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                {tabsDisponibles.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      activeTab === tab.key
                        ? "bg-primary text-primary-foreground glow-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            {activeTab === "historial" && (
              <>
                {/* KPIs */}
                <KpiMovimientos kpis={kpis} />

                {/* Barra de filtros (desktop/tablet) */}
                <div className="hidden lg:block">
                  <FiltrosMovimientos
                    layout="bar"
                    busqueda={busqueda}
                    onBusquedaChange={handleBusquedaChange}
                    tipo={tipo}
                    onTipoChange={handleTipoChange}
                    tipoPago={tipoPago}
                    onTipoPagoChange={handleTipoPagoChange}
                    fechaInicio={fechaInicio}
                    onFechaInicioChange={handleFechaInicioChange}
                    fechaFin={fechaFin}
                    onFechaFinChange={handleFechaFinChange}
                    onLimpiar={handleLimpiar}
                    onExportar={handleExportar}
                    metodosPago={metodosPago}
                    canExportar={puedeExportar}
                  />
                </div>

            {/* Main content: Table */}
            <div className="min-w-0">
                {loading && movimientos.length === 0 ? (
                  <div className="flex items-center justify-center h-96 bg-card rounded-lg border border-border">
                    <div className="text-center space-y-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground">Cargando movimientos...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-96 bg-card rounded-lg border border-border">
                    <div className="text-center space-y-3">
                      <p className="text-destructive font-medium">⚠️ Error al cargar</p>
                      <p className="text-muted-foreground text-sm">{error}</p>
                      <button
                        onClick={cargarMovimientos}
                        className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      >
                        Reintentar
                      </button>
                    </div>
                  </div>
                ) : (
                  <TablaMovimientos
                    movimientos={filtered}
                    onNuevo={handleNuevo}
                    onVer={handleVer}
                    onEditar={handleEditar}
                    onEliminar={handleEliminar}
                    serverPagination={pagination}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                  />
                )}
            </div>

              </>
            )}

            {/* Tab: Comparaciones */}
            {activeTab === "comparaciones" && puedeVerComparaciones && (
              <ComparacionesMovimientos />
            )}

            {/* Tab: Conceptos */}
            {activeTab === "conceptos" && puedeVerConceptos && (
              <ConceptosTable
                conceptos={conceptos}
                loading={conceptosLoading}
                onNuevo={() => {
                  setModalConceptoMode("crear")
                  setConceptoSeleccionado(null)
                  setModalConceptoOpen(true)
                }}
                onEditar={(concepto) => {
                  setModalConceptoMode("editar")
                  setConceptoSeleccionado(concepto)
                  setModalConceptoOpen(true)
                }}
                onEliminar={(concepto) => {
                  // TODO: Implementar DELETE cuando el backend lo soporte
                  toast({
                    title: "Eliminar Concepto",
                    description: `La funcionalidad de eliminar conceptos estará disponible próximamente.`,
                  })
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Mobile filters drawer */}
      {showFilters && (
        <>
          <div
            className="fixed inset-0 bg-background/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setShowFilters(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-72 z-50 overflow-y-auto bg-card border-l border-border lg:hidden animate-slide-in-right">
            <div className="p-4">
              <FiltrosMovimientos
                busqueda={busqueda}
                onBusquedaChange={handleBusquedaChange}
                tipo={tipo}
                onTipoChange={handleTipoChange}
                tipoPago={tipoPago}
                onTipoPagoChange={handleTipoPagoChange}
                fechaInicio={fechaInicio}
                onFechaInicioChange={handleFechaInicioChange}
                fechaFin={fechaFin}
                onFechaFinChange={handleFechaFinChange}
                onLimpiar={handleLimpiar}
                onExportar={handleExportar}
                metodosPago={metodosPago}
                canExportar={puedeExportar}
              />
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      <ModalMovimiento
        open={modalOpen}
        mode={modalMode}
        movimiento={selectedMov}
        onClose={() => {
          setModalOpen(false)
          setSelectedMov(null)
        }}
        onSave={handleSave}
        conceptos={conceptos}
        metodosPago={metodosPago}
      />

      {/* Modal Concepto */}
      <ModalConcepto
        open={modalConceptoOpen}
        mode={modalConceptoMode}
        concepto={conceptoSeleccionado}
        onClose={() => {
          setModalConceptoOpen(false)
          setConceptoSeleccionado(null)
        }}
        onSave={handleSaveConcepto}
      />
    </div>
  )
}
