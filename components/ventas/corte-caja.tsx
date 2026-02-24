"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Wallet,
  CreditCard,
  Building2,
  Smartphone,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  PlusCircle,
  Eye,
  Trash2,
  FileSpreadsheet,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
} from "lucide-react"
import type { Venta, MetodoPago } from "@/lib/ventas-data"
import { formatCurrency, getMetodoPagoLabel, getVentasPorMetodo } from "@/lib/ventas-data"

// ====== Types ======

interface Movimiento {
  fecha: string
  hora: string
  concepto: string
  tipoPago: string
  usuario: string
  ingreso: number
  egreso: number
}

interface CorteCajaRecord {
  id: string
  fechaInicio: string
  fechaFin: string
  ingresos: number
  egresos: number
  cajaInicial: number
  cajaFinal: number
  usuario: string
  fechaCreacion: string
  observacion: string
  movimientos: Movimiento[]
}

interface CorteCajaProps {
  ventasHoy: Venta[]
  allVentas: Venta[]
  fondoInicial: number
}

// ====== Seeded PRNG for deterministic demo data (avoids hydration mismatch) ======

function createSeededRandom(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const seededRandom = createSeededRandom(99)

// ====== Demo Cortes Data Generator ======

function generateDemoCortes(allVentas: Venta[], fondoInicial: number): CorteCajaRecord[] {
  const cortes: CorteCajaRecord[] = []
  // Use a fixed UTC reference date to match the UTC-based ventas data
  const today = new Date(Date.UTC(2026, 1, 21))

  for (let i = 6; i >= 1; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
    const dayVentas = allVentas.filter((v) => v.fecha === dateStr)
    const ingresos = dayVentas.reduce((sum, v) => sum + v.total, 0)
    const egresos = Math.round(ingresos * (seededRandom() * 0.3 + 0.1))
    const cajaFinal = fondoInicial + ingresos - egresos

    const movimientos: Movimiento[] = dayVentas.map((v) => ({
      fecha: v.fecha,
      hora: v.hora,
      concepto: `Venta ${v.id}`,
      tipoPago: getMetodoPagoLabel(v.metodoPago),
      usuario: "admin",
      ingreso: v.total,
      egreso: 0,
    }))

    // Add some expenses
    if (egresos > 0) {
      movimientos.push({
        fecha: dateStr,
        hora: "10:00",
        concepto: "Pago Proveedores",
        tipoPago: "Efectivo",
        usuario: "admin",
        ingreso: 0,
        egreso: Math.round(egresos * 0.6),
      })
      movimientos.push({
        fecha: dateStr,
        hora: "14:30",
        concepto: "Gastos Operativos",
        tipoPago: "Transferencia",
        usuario: "admin",
        ingreso: 0,
        egreso: Math.round(egresos * 0.4),
      })
    }

    cortes.push({
      id: `CC-${String(i).padStart(4, "0")}`,
      fechaInicio: dateStr,
      fechaFin: dateStr,
      ingresos,
      egresos,
      cajaInicial: fondoInicial,
      cajaFinal,
      usuario: "admin",
      fechaCreacion: `${dateStr} ${String(18 + Math.floor(seededRandom() * 3)).padStart(2, "0")}:00`,
      observacion: i % 2 === 0 ? "Corte normal del dia" : "",
      movimientos: movimientos.sort((a, b) => a.hora.localeCompare(b.hora)),
    })
  }

  return cortes.reverse()
}

// ====== Generate Movimientos from Ventas for a date range ======

function generateMovimientos(ventas: Venta[]): Movimiento[] {
  const movimientos: Movimiento[] = ventas.map((v) => ({
    fecha: v.fecha,
    hora: v.hora,
    concepto: `Venta ${v.id} - ${v.cliente}`,
    tipoPago: getMetodoPagoLabel(v.metodoPago),
    usuario: "admin",
    ingreso: v.total,
    egreso: 0,
  }))

  // Simulate some egresos based on ventas
  const totalVentas = ventas.reduce((s, v) => s + v.total, 0)
  if (totalVentas > 0) {
    const dates = [...new Set(ventas.map((v) => v.fecha))].sort()
    if (dates.length > 0) {
      movimientos.push({
        fecha: dates[0],
        hora: "09:00",
        concepto: "Compra de Suministros",
        tipoPago: "Efectivo",
        usuario: "admin",
        ingreso: 0,
        egreso: Math.round(totalVentas * 0.08),
      })
      movimientos.push({
        fecha: dates[Math.floor(dates.length / 2)] || dates[0],
        hora: "13:30",
        concepto: "Pago Servicios",
        tipoPago: "Transferencia",
        usuario: "admin",
        ingreso: 0,
        egreso: Math.round(totalVentas * 0.05),
      })
    }
  }

  return movimientos.sort((a, b) => {
    const dateComp = a.fecha.localeCompare(b.fecha)
    if (dateComp !== 0) return dateComp
    return a.hora.localeCompare(b.hora)
  })
}

// ====== Main Component ======

export function CorteCaja({ ventasHoy, allVentas, fondoInicial }: CorteCajaProps) {
  const [cortes, setCortes] = useState<CorteCajaRecord[]>(() =>
    generateDemoCortes(allVentas, fondoInicial)
  )

  // Filters
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("")
  const [filtroFechaFin, setFiltroFechaFin] = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Modals
  const [showNuevoModal, setShowNuevoModal] = useState(false)
  const [selectedCorte, setSelectedCorte] = useState<CorteCajaRecord | null>(null)
  const [showDetalleModal, setShowDetalleModal] = useState(false)

  // Effective cash in register
  const totalEfectivo = useMemo(() => {
    return ventasHoy
      .filter((v) => v.metodoPago === "efectivo")
      .reduce((sum, v) => sum + v.total, 0)
  }, [ventasHoy])
  const efectivoEnCaja = fondoInicial + totalEfectivo

  // Filtered cortes
  const cortesFiltrados = useMemo(() => {
    let filtered = [...cortes]
    if (filtroFechaInicio) {
      filtered = filtered.filter((c) => c.fechaInicio >= filtroFechaInicio)
    }
    if (filtroFechaFin) {
      filtered = filtered.filter((c) => c.fechaFin <= filtroFechaFin)
    }
    return filtered
  }, [cortes, filtroFechaInicio, filtroFechaFin])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(cortesFiltrados.length / itemsPerPage))
  const paginatedCortes = cortesFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Handlers
  const handleEliminar = useCallback(() => {
    if (!selectedCorte) return
    setCortes((prev) => prev.filter((c) => c.id !== selectedCorte.id))
    setSelectedCorte(null)
  }, [selectedCorte])

  const handleExportar = useCallback(() => {
    const headers = [
      "ID",
      "Fecha Inicio",
      "Fecha Final",
      "Ingresos",
      "Egresos",
      "Caja Inicial",
      "Caja Final",
      "Usuario",
      "Fecha Creacion",
      "Observacion",
    ]
    const rows = cortesFiltrados.map((c) => [
      c.id,
      c.fechaInicio,
      c.fechaFin,
      c.ingresos.toFixed(2),
      c.egresos.toFixed(2),
      c.cajaInicial.toFixed(2),
      c.cajaFinal.toFixed(2),
      c.usuario,
      c.fechaCreacion,
      c.observacion,
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cortes_caja_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [cortesFiltrados])

  const handleNuevoCorte = useCallback(
    (data: {
      fechaInicio: string
      fechaFin: string
      observacion: string
      ingresos: number
      egresos: number
      cajaInicial: number
      cajaFinal: number
      movimientos: Movimiento[]
    }) => {
      const newCorte: CorteCajaRecord = {
        id: `CC-${String(cortes.length + 1).padStart(4, "0")}`,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        ingresos: data.ingresos,
        egresos: data.egresos,
        cajaInicial: data.cajaInicial,
        cajaFinal: data.cajaFinal,
        usuario: "admin",
        fechaCreacion: new Date().toISOString().replace("T", " ").substring(0, 16),
        observacion: data.observacion,
        movimientos: data.movimientos,
      }
      setCortes((prev) => [newCorte, ...prev])
      setShowNuevoModal(false)
    },
    [cortes.length]
  )

  const handleBuscar = useCallback(() => {
    setCurrentPage(1)
  }, [])

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div
        className="bg-card rounded-xl p-5"
        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Receipt className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Corte de Caja
          </h3>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <button
            onClick={() => setShowNuevoModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase bg-primary text-primary-foreground glow-primary glow-primary-hover transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo
          </button>
          <button
            onClick={() => {
              if (selectedCorte) setShowDetalleModal(true)
            }}
            disabled={!selectedCorte}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase border border-accent text-accent hover:bg-accent/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Eye className="h-4 w-4" />
            Ver Detalle
          </button>
          <div className="flex-1" />
          <button
            onClick={handleEliminar}
            disabled={!selectedCorte}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
          <button
            onClick={handleExportar}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase border border-success text-success hover:bg-success/10 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar a Excel
          </button>
        </div>

        {/* Date Filters + Efectivo en Caja */}
        <div className="flex flex-wrap items-end gap-4 mb-5 pb-5 border-b border-border">
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                Fecha inicio
              </label>
              <input
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs focus:border-accent focus:ring-0 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                Fecha fin
              </label>
              <input
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs focus:border-accent focus:ring-0 focus:outline-none transition-colors"
              />
            </div>
            <button
              onClick={handleBuscar}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase bg-accent text-accent-foreground glow-accent glow-accent-hover transition-all"
            >
              <Search className="h-3.5 w-3.5" />
              Buscar
            </button>
          </div>

          <div className="flex-1" />

          {/* Efectivo en Caja */}
          <div className="flex items-center gap-3 bg-background rounded-lg px-4 py-2.5">
            <DollarSign className="h-5 w-5 text-success" />
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                Efectivo en caja
              </span>
              <span className="text-lg font-bold text-success">{formatCurrency(efectivoEnCaja)}</span>
            </div>
          </div>
        </div>

        {/* Cortes Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-8" />
                <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Fecha inicio
                </th>
                <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Fecha final
                </th>
                <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Ingresos
                </th>
                <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Egresos
                </th>
                <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Caja inicial
                </th>
                <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Caja final
                </th>
                <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Usuario
                </th>
                <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Fecha creacion
                </th>
                <th className="pb-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Observacion
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCortes.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-10 text-xs text-muted-foreground"
                  >
                    No hay cortes registrados
                  </td>
                </tr>
              ) : (
                paginatedCortes.map((corte) => {
                  const isSelected = selectedCorte?.id === corte.id
                  return (
                    <tr
                      key={corte.id}
                      onClick={() => setSelectedCorte(isSelected ? null : corte)}
                      onDoubleClick={() => {
                        setSelectedCorte(corte)
                        setShowDetalleModal(true)
                      }}
                      className={`border-b border-border/40 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-accent/10 border-accent/30"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <td className="py-3 pr-3">
                        <div
                          className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-accent bg-accent"
                              : "border-border"
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle2 className="h-3 w-3 text-accent-foreground" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-xs text-foreground">{corte.fechaInicio}</td>
                      <td className="py-3 pr-3 text-xs text-foreground">{corte.fechaFin}</td>
                      <td className="py-3 pr-3 text-xs font-semibold text-success">
                        {formatCurrency(corte.ingresos)}
                      </td>
                      <td className="py-3 pr-3 text-xs font-semibold text-destructive">
                        {formatCurrency(corte.egresos)}
                      </td>
                      <td className="py-3 pr-3 text-xs text-accent font-medium">
                        {formatCurrency(corte.cajaInicial)}
                      </td>
                      <td className="py-3 pr-3 text-xs text-accent font-medium">
                        {formatCurrency(corte.cajaFinal)}
                      </td>
                      <td className="py-3 pr-3 text-xs text-foreground">{corte.usuario}</td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">{corte.fechaCreacion}</td>
                      <td className="py-3 text-xs text-muted-foreground truncate max-w-[140px]">
                        {corte.observacion || "-"}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {cortesFiltrados.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {cortesFiltrados.length} corte{cortesFiltrados.length !== 1 ? "s" : ""} registrado{cortesFiltrados.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-foreground font-medium px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Efectivo en Caja */}
        <div
          className="bg-card rounded-xl p-4 relative overflow-hidden"
          style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "#4BB543" }} />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Efectivo en Caja</span>
            <DollarSign className="h-4 w-4 text-success" />
          </div>
          <p className="text-xl font-bold text-success">{formatCurrency(efectivoEnCaja)}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3" />
              Fondo: {formatCurrency(fondoInicial)}
            </span>
            <span className="flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-success" />
              +{formatCurrency(totalEfectivo)}
            </span>
          </div>
        </div>

        {/* Total Hoy */}
        <div
          className="bg-card rounded-xl p-4 relative overflow-hidden"
          style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Hoy</span>
            <Receipt className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(ventasHoy.reduce((s, v) => s + v.total, 0))}
          </p>
          <p className="text-[10px] text-muted-foreground mt-2">
            {ventasHoy.length} transacciones
          </p>
        </div>

        {/* Cortes Realizados */}
        <div
          className="bg-card rounded-xl p-4 relative overflow-hidden"
          style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cortes Realizados</span>
            <Calendar className="h-4 w-4 text-accent" />
          </div>
          <p className="text-xl font-bold text-accent">{cortes.length}</p>
          <p className="text-[10px] text-muted-foreground mt-2">
            Ultimo: {cortes[0]?.fechaCreacion || "N/A"}
          </p>
        </div>
      </div>

      {/* Nuevo Corte Modal */}
      {showNuevoModal && (
        <NuevoCorteModal
          allVentas={allVentas}
          fondoInicial={fondoInicial}
          onClose={() => setShowNuevoModal(false)}
          onConfirm={handleNuevoCorte}
        />
      )}

      {/* Detalle Corte Modal */}
      {showDetalleModal && selectedCorte && (
        <DetalleCorteModal
          corte={selectedCorte}
          onClose={() => setShowDetalleModal(false)}
        />
      )}
    </div>
  )
}

// ====== Nuevo Corte Modal ======

function NuevoCorteModal({
  allVentas,
  fondoInicial,
  onClose,
  onConfirm,
}: {
  allVentas: Venta[]
  fondoInicial: number
  onClose: () => void
  onConfirm: (data: {
    fechaInicio: string
    fechaFin: string
    observacion: string
    ingresos: number
    egresos: number
    cajaInicial: number
    cajaFinal: number
    movimientos: Movimiento[]
  }) => void
}) {
  const today = "2026-02-21"
  const [fechaInicio, setFechaInicio] = useState(today)
  const [fechaFin, setFechaFin] = useState(today)
  const [observacion, setObservacion] = useState("")
  const [consulted, setConsulted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [ingresos, setIngresos] = useState(0)
  const [egresos, setEgresos] = useState(0)
  const cajaFinal = fondoInicial + ingresos - egresos

  const handleConsultar = useCallback(() => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      const ventasRango = allVentas.filter(
        (v) => v.fecha >= fechaInicio && v.fecha <= fechaFin
      )
      const movs = generateMovimientos(ventasRango)
      const totalIngresos = movs.reduce((sum, m) => sum + m.ingreso, 0)
      const totalEgresos = movs.reduce((sum, m) => sum + m.egreso, 0)

      setMovimientos(movs)
      setIngresos(totalIngresos)
      setEgresos(totalEgresos)
      setConsulted(true)
      setLoading(false)
    }, 600)
  }, [allVentas, fechaInicio, fechaFin])

  const handleRealizarCorte = useCallback(() => {
    onConfirm({
      fechaInicio,
      fechaFin,
      observacion,
      ingresos,
      egresos,
      cajaInicial: fondoInicial,
      cajaFinal,
      movimientos,
    })
  }, [fechaInicio, fechaFin, observacion, ingresos, egresos, fondoInicial, cajaFinal, movimientos, onConfirm])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 px-4 pb-6 overflow-y-auto">
      <div className="fixed inset-0 bg-background/85 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-card rounded-xl w-full max-w-4xl overflow-hidden animate-slide-up"
        style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Creacion de Corte de Caja
            </h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Datos del Corte */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              Datos del Corte
            </h4>

            <div className="bg-background rounded-lg p-4 space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                    Fecha Inicial
                  </label>
                  <input
                    type="datetime-local"
                    value={`${fechaInicio}T00:00`}
                    onChange={(e) => setFechaInicio(e.target.value.split("T")[0])}
                    className="px-3 py-2.5 bg-card border border-border rounded-lg text-foreground text-xs focus:border-accent focus:ring-0 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                    Fecha Final
                  </label>
                  <input
                    type="datetime-local"
                    value={`${fechaFin}T23:59`}
                    onChange={(e) => setFechaFin(e.target.value.split("T")[0])}
                    className="px-3 py-2.5 bg-card border border-border rounded-lg text-foreground text-xs focus:border-accent focus:ring-0 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={handleConsultar}
                  disabled={loading || !fechaInicio || !fechaFin}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase bg-accent text-accent-foreground glow-accent glow-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Consultar
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                  Observacion
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    placeholder="Agregar una observacion (opcional)..."
                    className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-lg text-foreground text-xs placeholder:text-muted-foreground focus:border-accent focus:ring-0 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Informacion Section */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-accent" />
              Informacion
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Total de Ingresos
                </p>
                <p className={`text-lg font-bold ${consulted && ingresos > 0 ? "text-success" : "text-muted-foreground"}`}>
                  {formatCurrency(ingresos)}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Total de Egresos
                </p>
                <p className={`text-lg font-bold ${consulted && egresos > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {formatCurrency(egresos)}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Efectivo en caja inicial
                </p>
                <p className="text-lg font-bold text-accent">
                  {formatCurrency(fondoInicial)}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Efectivo en caja final
                </p>
                <p className={`text-lg font-bold ${consulted ? (cajaFinal >= fondoInicial ? "text-accent" : "text-warning") : "text-muted-foreground"}`}>
                  {formatCurrency(consulted ? cajaFinal : 0)}
                </p>
              </div>
            </div>

            {/* Movimientos Table */}
            <div className="bg-background rounded-lg overflow-hidden">
              {!consulted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Selecciona un rango de fechas y haz clic en{" "}
                    <span className="text-accent font-medium">Consultar</span> para ver los movimientos
                  </p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 text-accent animate-spin" />
                </div>
              ) : movimientos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No hay movimientos en el rango seleccionado</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b border-border">
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Concepto
                        </th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Tipo de pago
                        </th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                          Ingresos
                        </th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                          Egresos
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientos.map((m, idx) => (
                        <tr
                          key={`${m.fecha}-${m.hora}-${idx}`}
                          className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">
                            {m.fecha} {m.hora}
                          </td>
                          <td className="px-3 py-2 text-xs text-foreground">{m.concepto}</td>
                          <td className="px-3 py-2 text-xs text-foreground">{m.tipoPago}</td>
                          <td className="px-3 py-2 text-xs text-foreground">{m.usuario}</td>
                          <td className="px-3 py-2 text-xs font-semibold text-right">
                            <span className={m.ingreso > 0 ? "text-success" : "text-muted-foreground"}>
                              {formatCurrency(m.ingreso)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs font-semibold text-right">
                            <span className={m.egreso > 0 ? "text-destructive" : "text-muted-foreground"}>
                              {formatCurrency(m.egreso)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleRealizarCorte}
              disabled={!consulted || movimientos.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase bg-success text-foreground transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ boxShadow: consulted && movimientos.length > 0 ? "0 0 15px rgba(75, 181, 67, 0.4)" : "none" }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Realizar Corte
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ====== Detalle Corte Modal ======

function DetalleCorteModal({
  corte,
  onClose,
}: {
  corte: CorteCajaRecord
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-background/85 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-card rounded-xl w-full max-w-3xl overflow-hidden animate-slide-up"
        style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h3 className="text-lg font-bold text-accent flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Detalle del Corte {corte.id}
            </h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Fecha Inicio</p>
              <p className="text-sm font-medium text-foreground">{corte.fechaInicio}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Fecha Final</p>
              <p className="text-sm font-medium text-foreground">{corte.fechaFin}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Usuario</p>
              <p className="text-sm font-medium text-foreground">{corte.usuario}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Creado</p>
              <p className="text-sm font-medium text-foreground">{corte.fechaCreacion}</p>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Ingresos</p>
              <p className="text-lg font-bold text-success">{formatCurrency(corte.ingresos)}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Egresos</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(corte.egresos)}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Caja Inicial</p>
              <p className="text-lg font-bold text-accent">{formatCurrency(corte.cajaInicial)}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Caja Final</p>
              <p className="text-lg font-bold text-accent">{formatCurrency(corte.cajaFinal)}</p>
            </div>
          </div>

          {/* Observacion */}
          {corte.observacion && (
            <div className="bg-background rounded-lg p-3 mb-5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Observacion</p>
              <p className="text-sm text-foreground">{corte.observacion}</p>
            </div>
          )}

          {/* Movimientos */}
          <div className="bg-background rounded-lg overflow-hidden mb-5">
            <div className="px-3 py-2.5 border-b border-border">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Movimientos ({corte.movimientos.length})
              </h4>
            </div>
            {corte.movimientos.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Sin movimientos registrados</p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Concepto
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                        Ingresos
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                        Egresos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {corte.movimientos.map((m, idx) => (
                      <tr
                        key={`${m.fecha}-${m.hora}-${idx}`}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">
                          {m.fecha} {m.hora}
                        </td>
                        <td className="px-3 py-2 text-xs text-foreground">{m.concepto}</td>
                        <td className="px-3 py-2 text-xs text-foreground">{m.tipoPago}</td>
                        <td className="px-3 py-2 text-xs text-foreground">{m.usuario}</td>
                        <td className="px-3 py-2 text-xs font-semibold text-right">
                          <span className={m.ingreso > 0 ? "text-success" : "text-muted-foreground"}>
                            {formatCurrency(m.ingreso)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold text-right">
                          <span className={m.egreso > 0 ? "text-destructive" : "text-muted-foreground"}>
                            {formatCurrency(m.egreso)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Close */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
