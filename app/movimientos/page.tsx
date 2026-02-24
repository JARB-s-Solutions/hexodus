"use client"

import { useState, useMemo, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { MovimientosHeader } from "@/components/movimientos/movimientos-header"
import { KpiMovimientos } from "@/components/movimientos/kpi-movimientos"
import { FiltrosMovimientos } from "@/components/movimientos/filtros-movimientos"
import { TablaMovimientos } from "@/components/movimientos/tabla-movimientos"
import { ModalMovimiento } from "@/components/movimientos/modal-movimiento"
import { ComparacionesMovimientos } from "@/components/movimientos/comparaciones-movimientos"
import {
  generateMovimientos,
  filterMovimientos,
  calcularKpis,
  getPeriodosComparacion,
  exportMovimientosCSV,
  type Movimiento,
} from "@/lib/movimientos-data"

// Fixed reference date for SSR-safe deterministic demo data
const FIXED_REF = new Date(Date.UTC(2026, 1, 21, 12, 0, 0))
const initialMovimientos = generateMovimientos(400, FIXED_REF)
const periodos = getPeriodosComparacion(FIXED_REF)

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>(initialMovimientos)

  // Filter state
  const [busqueda, setBusqueda] = useState("")
  const [tipo, setTipo] = useState("todos")
  const [tipoPago, setTipoPago] = useState("todos")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"crear" | "editar" | "ver">("crear")
  const [selectedMov, setSelectedMov] = useState<Movimiento | null>(null)

  // Sidebar filters panel (mobile)
  const [showFilters, setShowFilters] = useState(false)

  // Filtered list
  const filtered = useMemo(
    () =>
      filterMovimientos(movimientos, {
        busqueda,
        tipo,
        tipoPago,
        fechaInicio,
        fechaFin,
      }),
    [movimientos, busqueda, tipo, tipoPago, fechaInicio, fechaFin]
  )

  // KPIs
  const kpis = useMemo(() => {
    if (fechaInicio && fechaFin) {
      const startDate = new Date(fechaInicio + "T12:00:00Z")
      const endDate = new Date(fechaFin + "T12:00:00Z")
      const diffMs = endDate.getTime() - startDate.getTime()
      const prevEnd = new Date(startDate.getTime() - 86400000) // 1 day before
      const prevStart = new Date(prevEnd.getTime() - diffMs)
      const fmtD = (d: Date) => {
        const y = d.getUTCFullYear()
        const m = String(d.getUTCMonth() + 1).padStart(2, "0")
        const day = String(d.getUTCDate()).padStart(2, "0")
        return `${y}-${m}-${day}`
      }
      const prevFiltered = filterMovimientos(movimientos, {
        tipo,
        tipoPago,
        fechaInicio: fmtD(prevStart),
        fechaFin: fmtD(prevEnd),
      })
      return calcularKpis(filtered, prevFiltered)
    }
    return calcularKpis(filtered)
  }, [filtered, movimientos, tipo, tipoPago, fechaInicio, fechaFin])

  // Actions
  const handleLimpiar = useCallback(() => {
    setBusqueda("")
    setTipo("todos")
    setTipoPago("todos")
    setFechaInicio("")
    setFechaFin("")
  }, [])

  const handleExportar = useCallback(() => {
    let label = "todos"
    if (fechaInicio && fechaFin) {
      label = `${fechaInicio}_a_${fechaFin}`
    } else if (fechaInicio) {
      label = `desde_${fechaInicio}`
    } else if (fechaFin) {
      label = `hasta_${fechaFin}`
    }
    exportMovimientosCSV(filtered, kpis, label)
  }, [filtered, kpis, fechaInicio, fechaFin])

  const handleNuevo = useCallback(() => {
    setSelectedMov(null)
    setModalMode("crear")
    setModalOpen(true)
  }, [])

  const handleVer = useCallback((m: Movimiento) => {
    setSelectedMov(m)
    setModalMode("ver")
    setModalOpen(true)
  }, [])

  const handleEditar = useCallback((m: Movimiento) => {
    setSelectedMov(m)
    setModalMode("editar")
    setModalOpen(true)
  }, [])

  const handleEliminar = useCallback((m: Movimiento) => {
    setMovimientos((prev) => prev.filter((x) => x.id !== m.id))
  }, [])

  const handleSave = useCallback(
    (data: Omit<Movimiento, "id" | "fecha" | "hora" | "usuario">) => {
      if (modalMode === "editar" && selectedMov) {
        setMovimientos((prev) =>
          prev.map((m) => (m.id === selectedMov.id ? { ...m, ...data } : m))
        )
      } else {
        const now = new Date()
        const newMov: Movimiento = {
          id: `MOV-${String(movimientos.length + 1).padStart(4, "0")}`,
          fecha: `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`,
          hora: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
          usuario: "Admin",
          ...data,
        }
        setMovimientos((prev) => [newMov, ...prev])
      }
      setModalOpen(false)
      setSelectedMov(null)
    },
    [modalMode, selectedMov, movimientos.length]
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="movimientos" />

      <main className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <MovimientosHeader onToggleFilters={() => setShowFilters((v) => !v)} />

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-4">
            {/* KPIs */}
            <KpiMovimientos kpis={kpis} />

            {/* Main content: Filters sidebar + Table */}
            <div className="flex gap-4">
              {/* Desktop filters */}
              <div className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-0">
                  <FiltrosMovimientos
                    busqueda={busqueda}
                    onBusquedaChange={setBusqueda}
                    tipo={tipo}
                    onTipoChange={setTipo}
                    tipoPago={tipoPago}
                    onTipoPagoChange={setTipoPago}
                    fechaInicio={fechaInicio}
                    onFechaInicioChange={setFechaInicio}
                    fechaFin={fechaFin}
                    onFechaFinChange={setFechaFin}
                    onLimpiar={handleLimpiar}
                    onExportar={handleExportar}
                  />
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 min-w-0">
                <TablaMovimientos
                  movimientos={filtered}
                  onNuevo={handleNuevo}
                  onVer={handleVer}
                  onEditar={handleEditar}
                  onEliminar={handleEliminar}
                />
              </div>
            </div>

            {/* Comparisons */}
            <ComparacionesMovimientos movimientos={movimientos} periodos={periodos} />
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
                onBusquedaChange={setBusqueda}
                tipo={tipo}
                onTipoChange={setTipo}
                tipoPago={tipoPago}
                onTipoPagoChange={setTipoPago}
                fechaInicio={fechaInicio}
                onFechaInicioChange={setFechaInicio}
                fechaFin={fechaFin}
                onFechaFinChange={setFechaFin}
                onLimpiar={handleLimpiar}
                onExportar={handleExportar}
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
      />
    </div>
  )
}
