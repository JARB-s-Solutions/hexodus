"use client"

import { useState, useMemo } from "react"
import {
  Eye, Pencil, Trash2, ListChecks, ChevronsLeft, ChevronLeft,
  ChevronRight, ChevronsRight, ChevronsUpDown, DollarSign,
} from "lucide-react"
import type { Socio } from "@/lib/socios-data"
import { useAuthContext } from "@/lib/contexts/auth-context"
import {
  getVigenciaMembresia, getEstadoContrato,
  membresiaLabels,
  type EstadoContrato,
} from "@/lib/socios-data"
import { getIniciales } from "@/lib/utils"

interface SociosTableProps {
  socios: Socio[]
  onVerDetalle: (s: Socio) => void
  onEditar: (s: Socio) => void
  onEliminar: (s: Socio) => void
  onCobrar?: (s: Socio) => void
}

type SortKey = "id" | "nombre" | "vencimiento"
type SortDir = "asc" | "desc"

export function SociosTable({ socios, onVerDetalle, onEditar, onEliminar, onCobrar }: SociosTableProps) {
  const { tienePermiso } = useAuthContext()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [sortKey, setSortKey] = useState<SortKey>("id")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  // Helper para acceder a campos de forma uniforme (API vs Mock)
  const getSocioField = (s: any, field: string): any => {
    // Detectar si es del tipo API (tiene fechaVencimientoMembresia)
    const isAPIType = 'fechaVencimientoMembresia' in s
    
    if (isAPIType) {
      switch (field) {
        case 'nombre': return s.nombre // Ya está mapeado en camelCase
        case 'correo': return s.correo
        case 'telefono': return s.telefono
        case 'membresia': return s.nombrePlan || 'N/A'
        case 'fechaFin': return s.fechaVencimientoMembresia
        case 'fechaInicio': return s.fechaInicioMembresia
        case 'genero': {
          // Convertir género de API ("Masculino"/"Femenino"/"Otro") a formato Mock ("M"/"F"/"O")
          if (s.genero === 'Masculino') return 'M'
          if (s.genero === 'Femenino') return 'F'
          return 'O'
        }
        case 'firmoContrato': return s.firmoContrato
        case 'estadoSocio': return s.estadoSocio
        case 'contratoInicio': return s.inicioContrato
        case 'contratoFin': return s.finContrato
        case 'bioRostro': return !!s.faceEncoding
        case 'bioHuella': return !!s.fingerprintTemplate
        case 'estadoPago': return s.estadoPago || 'sin_pagar'
        default: return s[field]
      }
    } else {
      // Es del tipo Mock, acceso directo
      return s[field]
    }
  }

  const toTime = (value: unknown): number | null => {
    if (!value) return null
    const time = new Date(String(value)).getTime()
    return Number.isNaN(time) ? null : time
  }

  const sorted = useMemo(() => {
    return [...socios].sort((a, b) => {
      let cmp = 0
      if (sortKey === "id") {
        const fechaRegistroA = getSocioField(a, 'createdAt') || getSocioField(a, 'fechaRegistro')
        const fechaRegistroB = getSocioField(b, 'createdAt') || getSocioField(b, 'fechaRegistro')
        const timeA = toTime(fechaRegistroA)
        const timeB = toTime(fechaRegistroB)

        // Si hay fecha de registro en ambos, priorizar orden cronológico real.
        if (timeA !== null && timeB !== null && timeA !== timeB) {
          cmp = timeA - timeB
        } else if (timeA !== null && timeB === null) {
          cmp = 1
        } else if (timeA === null && timeB !== null) {
          cmp = -1
        } else {
          // Fallback por id (normalmente incremental)
          cmp = a.id - b.id
        }
      }
      else if (sortKey === "nombre") {
        const nombreA = getSocioField(a, 'nombre') || ''
        const nombreB = getSocioField(b, 'nombre') || ''
        cmp = nombreA.localeCompare(nombreB)
      }
      else if (sortKey === "vencimiento") {
        const fechaA = getSocioField(a, 'fechaFin')
        const fechaB = getSocioField(b, 'fechaFin')
        cmp = new Date(fechaA || 0).getTime() - new Date(fechaB || 0).getTime()
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [socios, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const start = (page - 1) * perPage
  const paginated = sorted.slice(start, start + perPage)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setPage(1)
  }

  const vigenciaColors = {
    vigente: "bg-[#22C55E]/15 text-[#22C55E]",
    por_vencer: "bg-[#FFD700]/15 text-[#FFD700]",
    vencida: "bg-primary/15 text-primary",
  }

  const contratoColors = {
    activo: "bg-[#22C55E]/15 text-[#22C55E]",
    por_vencer: "bg-[#FF8C00]/15 text-[#FF8C00]",
    vencido: "bg-primary/15 text-primary",
    sin_contrato: "bg-muted text-muted-foreground",
  }

  const contratoLabels = {
    activo: "Firmado",
    por_vencer: "Por vencer",
    vencido: "Vencido",
    sin_contrato: "Pendiente",
  }

  const vigenciaLabels = {
    vigente: "Vigente",
    por_vencer: "Por vencer",
    vencida: "Vencido",
  }

  const generoColors = {
    M: "bg-accent/15 text-accent",
    F: "bg-primary/15 text-primary",
    O: "bg-muted text-muted-foreground",
  }

  const estadoPagoColors = {
    pagado: "bg-[#22C55E]/15 text-[#22C55E]",
    sin_pagar: "bg-amber-500/15 text-amber-500",
    pendiente: "bg-[#FFD700]/15 text-[#FFD700]",
  }

  const estadoPagoLabels = {
    pagado: "Pagado",
    sin_pagar: "Sin pagar",
    pendiente: "Pendiente",
  }

  // Pagination range
  const maxButtons = 5
  let pStart = Math.max(1, page - Math.floor(maxButtons / 2))
  let pEnd = Math.min(totalPages, pStart + maxButtons - 1)
  if (pEnd - pStart < maxButtons - 1) pStart = Math.max(1, pEnd - maxButtons + 1)
  const pageNumbers = Array.from({ length: pEnd - pStart + 1 }, (_, i) => pStart + i)

  return (
    <div
      className="bg-card rounded-xl overflow-hidden"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <ListChecks className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Lista de Socios</h2>
          <span className="ml-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-accent/15 text-accent">
            {socios.length} socios
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Mostrar:</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
            className="px-2 py-1 bg-muted border border-border rounded text-foreground text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>por pagina</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{ maxHeight: "calc(100vh - 460px)" }}>
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted/70 transition"
                onClick={() => toggleSort("id")}
              >
                <span className="flex items-center gap-1">
                  Clave <ChevronsUpDown className="h-3 w-3" />
                </span>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted/70 transition"
                onClick={() => toggleSort("nombre")}
              >
                <span className="flex items-center gap-1">
                  Nombre <ChevronsUpDown className="h-3 w-3" />
                </span>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Genero
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Contacto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Membresia
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted/70 transition"
                onClick={() => toggleSort("vencimiento")}
              >
                <span className="flex items-center gap-1">
                  Vencimiento <ChevronsUpDown className="h-3 w-3" />
                </span>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Vigencia
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estado Contrato
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                  <p className="text-base">No se encontraron socios</p>
                  <p className="text-xs mt-1">Intenta ajustar los filtros de busqueda</p>
                </td>
              </tr>
            ) : (
              paginated.map((s) => {
                const nombre = getSocioField(s, 'nombre') || ''
                const correo = getSocioField(s, 'correo') || ''
                const telefono = getSocioField(s, 'telefono') || ''
                const genero = getSocioField(s, 'genero') || 'M'
                const membresia = getSocioField(s, 'membresia') || ''
                const fechaFin = getSocioField(s, 'fechaFin') || ''
                const fechaInicio = getSocioField(s, 'fechaInicio') || ''
                const firmoContrato = getSocioField(s, 'firmoContrato')
                const bioRostro = getSocioField(s, 'bioRostro') || false
                const bioHuella = getSocioField(s, 'bioHuella') || false
                const estadoSocio = getSocioField(s, 'estadoSocio') || 'activo'
                const estadoPago = getSocioField(s, 'estadoPago') || 'sin_pagar'
                
                const iniciales = getIniciales(nombre)
                const vigencia = getVigenciaMembresia(fechaFin)
                
                // Para el estado del contrato, usar valor directo de firmoContrato
                // true = "activo" (Firmado), false = "sin_contrato" (Pendiente)
                let contrato: EstadoContrato
                if (firmoContrato === true) {
                  contrato = "activo" // Firmado
                } else if (firmoContrato === false) {
                  contrato = "sin_contrato" // Pendiente
                } else {
                  // Si viene del sistema antiguo con fechas de contrato, usar la lógica completa
                  const socioForCheck: any = {
                    ...s,
                    firmoContrato: firmoContrato || false,
                    contratoInicio: getSocioField(s, 'contratoInicio'),
                    contratoFin: getSocioField(s, 'contratoFin'),
                  }
                  contrato = getEstadoContrato(socioForCheck)
                }
                
                const fechaVenc = new Date(fechaFin)
                const diffDias = Math.ceil((fechaVenc.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

                return (
                  <tr
                    key={s.id}
                    className="hover:bg-muted/30 transition-colors duration-150 animate-fade-in-up"
                  >
                    {/* Clave */}
                    <td className="px-4 py-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          vigencia === "vigente"
                            ? "bg-[#22C55E]/15 text-[#22C55E]"
                            : vigencia === "por_vencer"
                            ? "bg-[#FFD700]/15 text-[#FFD700]"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        {iniciales}
                      </div>
                    </td>
                    {/* Nombre */}
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-foreground">{nombre}</div>
                      <div className="text-xs text-muted-foreground">{correo}</div>
                    </td>
                    {/* Genero */}
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${generoColors[genero as 'M' | 'F' | 'O'] || generoColors['O']}`}>
                        {genero === "M" ? "Masculino" : genero === "F" ? "Femenino" : "Otro"}
                      </span>
                    </td>
                    {/* Contacto */}
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div>{telefono}</div>
                    </td>
                    {/* Membresia */}
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-foreground">
                        {typeof membresia === 'string' && membresiaLabels[membresia as keyof typeof membresiaLabels] 
                          ? membresiaLabels[membresia as keyof typeof membresiaLabels]
                          : membresia || 'N/A'}
                      </div>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${estadoPagoColors[estadoPago as keyof typeof estadoPagoColors] || estadoPagoColors['pagado']}`}>
                        {estadoPagoLabels[estadoPago as keyof typeof estadoPagoLabels] || estadoPago}
                      </span>
                    </td>
                    {/* Vencimiento */}
                    <td className="px-4 py-3">
                      <div className={`text-sm font-semibold ${vigencia === "vigente" ? "text-[#22C55E]" : vigencia === "por_vencer" ? "text-[#FFD700]" : "text-primary"}`}>
                        {fechaVenc.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </div>
                      <div className={`text-xs ${diffDias < 0 ? "text-primary" : diffDias <= 7 ? "text-[#FFD700]" : "text-muted-foreground"}`}>
                        {diffDias < 0
                          ? `Vencido hace ${Math.abs(diffDias)} dias`
                          : diffDias === 0
                          ? "Vence hoy"
                          : `En ${diffDias} dias`}
                      </div>
                    </td>
                    {/* Vigencia */}
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${vigenciaColors[vigencia]}`}>
                        {vigenciaLabels[vigencia]}
                      </span>
                    </td>
                    {/* Estado Contrato */}
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${contratoColors[contrato]}`}>
                        {contratoLabels[contrato]}
                      </span>
                    </td>
                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Cobrar: solo si sin pagar y tiene permiso de ventas */}
                        {estadoPago === 'sin_pagar' && onCobrar && tienePermiso('ventas', 'crear') && (
                          <button
                            onClick={() => onCobrar(s)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                            title="Cobrar membresía"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onVerDetalle(s)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {tienePermiso('socios', 'editar') && (
                          <button
                            onClick={() => onEditar(s)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {tienePermiso('socios', 'eliminar') && (
                          <button
                            onClick={() => onEliminar(s)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-border">
        <span className="text-sm text-muted-foreground mb-2 sm:mb-0">
          Mostrando {sorted.length > 0 ? start + 1 : 0} a {Math.min(start + perPage, sorted.length)} de {sorted.length} socios
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-2.5 py-1.5 text-sm rounded-l-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-2.5 py-1.5 text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`px-3 py-1.5 text-sm border border-border transition ${
                n === page
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 text-sm rounded-r-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
