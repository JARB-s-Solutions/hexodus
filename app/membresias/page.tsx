"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { MembresiasHeader } from "@/components/membresias/membresias-header"
import { KpiMembresias } from "@/components/membresias/kpi-membresias"
import { MembresiasToolbar } from "@/components/membresias/membresias-toolbar"
import { MembresiasGrid } from "@/components/membresias/membresias-grid"
import { MembresiaModal } from "@/components/membresias/membresia-modal"
import { DetalleMembresiaMoal } from "@/components/membresias/detalle-membresia-modal"
import { EliminarMembresiaMdal } from "@/components/membresias/eliminar-membresia-modal"
import { MembresiasService } from "@/lib/services/membresias"
import { toast } from "@/hooks/use-toast"
import type { Membresia } from "@/lib/types/membresias"
import type { MembresiaFormData } from "@/lib/membresias-data"

export default function MembresiasPage() {
  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [busqueda, setBusqueda] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos")
  const [estadoFiltro, setEstadoFiltro] = useState("todos")
  const [precioMin, setPrecioMin] = useState("")
  const [precioMax, setPrecioMax] = useState("")

  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [editandoMembresia, setEditandoMembresia] = useState<Membresia | null>(null)
  const [detalleMembresia, setDetalleMembresia] = useState<Membresia | null>(null)
  const [membresiaAEliminar, setMembresiaAEliminar] = useState<Membresia | null>(null)

  // Cargar membresías al montar el componente
  useEffect(() => {
    loadMembresias()
  }, [])

  const loadMembresias = async () => {
    try {
      setLoading(true)
      console.log('Cargando membresías...')
      const data = await MembresiasService.getAll()
      console.log('Membresías cargadas:', data)
      setMembresias(data)
    } catch (error) {
      console.error('Error al cargar membresías:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las membresías',
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtered data
  const membresiasFiltradas = useMemo(() => {
    let filtered = membresias

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.nombre.toLowerCase().includes(q) || m.descripcion.toLowerCase().includes(q)
      )
    }

    if (estadoFiltro !== "todos") {
      filtered = filtered.filter((m) => m.estado === estadoFiltro)
    }

    const min = parseFloat(precioMin) || 0
    const max = parseFloat(precioMax) || Infinity
    filtered = filtered.filter((m) => m.precioBase >= min && m.precioBase <= max)

    return filtered
  }, [membresias, busqueda, estadoFiltro, precioMin, precioMax])

  // Handlers
  const handleLimpiar = useCallback(() => {
    setBusqueda("")
    setTipoFiltro("todos")
    setEstadoFiltro("todos")
    setPrecioMin("")
    setPrecioMax("")
  }, [])

  const handleNuevaMembresia = useCallback(() => {
    setEditandoMembresia(null)
    setModalOpen(true)
  }, [])

  const handleEditar = useCallback((m: Membresia) => {
    setEditandoMembresia(m)
    setModalOpen(true)
  }, [])

  const handleGuardar = useCallback(
    async (data: MembresiaFormData) => {
      try {
        console.log('📝 Datos del formulario:', data)
        
        // Construir payload con camelCase como espera el backend
        const payload: any = {
          nombre: data.nombre.trim(),
          precioBase: data.precio,
          duracionCantidad: data.duracion.cantidad,
          duracionUnidad: data.duracion.unidad,
        }
        
        // Agregar descripción si existe (opcional)
        if (data.descripcion && data.descripcion.trim()) {
          payload.descripcion = data.descripcion.trim()
        }
        
        // Agregar campos de oferta si aplica
        if (data.esOferta && data.precioOriginal) {
          payload.esOferta = true
          payload.precioOferta = data.precioOriginal
          if (data.fechaVencimientoOferta) {
            payload.fechaFinOferta = data.fechaVencimientoOferta
          }
        } else {
          payload.esOferta = false
        }
        
        console.log('📤 Payload a enviar:', payload)
        
        if (editandoMembresia) {
          // Actualizar membresía existente
          await MembresiasService.update(editandoMembresia.id, payload)
          
          toast({
            variant: 'success',
            title: '¡Actualizado!',
            description: 'La membresía se actualizó correctamente',
          })
        } else {
          // Crear nueva membresía
          await MembresiasService.create(payload)
          
          toast({
            variant: 'success',
            title: '¡Creada!',
            description: 'La membresía se creó correctamente',
          })
        }
        
        // Recargar lista de membresías
        await loadMembresias()
        setModalOpen(false)
        setEditandoMembresia(null)
      } catch (error) {
        console.error('Error al guardar membresía:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'No se pudo guardar la membresía',
        })
      }
    },
    [editandoMembresia]
  )

  const handleToggleEstado = useCallback(async (m: Membresia) => {
    try {
      console.log('Toggle estado para membresía:', m)
      const nuevoEstado = m.estado === 'activo' ? 'inactivo' : 'activo'
      await MembresiasService.updateStatus(m.id, nuevoEstado)
      
      // Actualizar localmente
      setMembresias((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, estado: nuevoEstado } : item))
      )
      
      toast({
        variant: 'success',
        title: 'Estado actualizado',
        description: `La membresía ahora está ${nuevoEstado === 'activo' ? 'activa' : 'inactiva'}`,
      })
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cambiar el estado de la membresía',
      })
    }
  }, [])

  const handleEliminar = useCallback((m: Membresia) => {
    setMembresiaAEliminar(m)
  }, [])

  const confirmarEliminar = useCallback(async () => {
    if (!membresiaAEliminar) return

    try {
      await MembresiasService.delete(membresiaAEliminar.id)
      
      // Actualizar localmente
      setMembresias((prev) => prev.filter((item) => item.id !== membresiaAEliminar.id))
      
      toast({
        variant: 'success',
        title: 'Eliminada',
        description: 'La membresía se eliminó correctamente',
      })
    } catch (error) {
      console.error('Error al eliminar membresía:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la membresía',
      })
    }
  }, [membresiaAEliminar])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="membresias" />

      <main className="flex-1 flex flex-col min-h-0">
        <MembresiasHeader />

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-5">
          <KpiMembresias membresias={membresias} />

          <MembresiasToolbar
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            tipoFiltro={tipoFiltro}
            onTipoChange={setTipoFiltro}
            estadoFiltro={estadoFiltro}
            onEstadoChange={setEstadoFiltro}
            precioMin={precioMin}
            onPrecioMinChange={setPrecioMin}
            precioMax={precioMax}
            onPrecioMaxChange={setPrecioMax}
            onLimpiar={handleLimpiar}
            onNuevaMembresia={handleNuevaMembresia}
            totalFiltrados={membresiasFiltradas.length}
            totalMembresias={membresias.length}
          />

          <MembresiasGrid
            membresias={membresiasFiltradas}
            onVerDetalle={setDetalleMembresia}
            onEditar={handleEditar}
            onToggleEstado={handleToggleEstado}
            onEliminar={handleEliminar}
          />
        </div>
      </main>

      {/* Modals */}
      <MembresiaModal
        key={editandoMembresia?.id ?? "new"}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditandoMembresia(null)
        }}
        onGuardar={handleGuardar}
        membresia={editandoMembresia}
      />

      <DetalleMembresiaMoal
        open={!!detalleMembresia}
        onClose={() => setDetalleMembresia(null)}
        membresia={detalleMembresia}
        onEditar={handleEditar}
      />

      <EliminarMembresiaMdal
        open={!!membresiaAEliminar}
        onClose={() => setMembresiaAEliminar(null)}
        membresia={membresiaAEliminar}
        onConfirmar={confirmarEliminar}
      />
    </div>
  )
}
