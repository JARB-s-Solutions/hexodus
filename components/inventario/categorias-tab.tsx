"use client"

import { useState, useMemo } from "react"
import { Plus, Search, Tag, Package, TrendingUp, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Categoria } from "@/lib/types/categorias"
import { CategoriasService } from "@/lib/services/categorias"
import { CategoriaModal } from "./categoria-modal"
import { CategoriasTable } from "./categorias-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/alert-dialog"

interface CategoriasTabProps {
  categorias: Categoria[]
  onRefresh: () => Promise<void>
  onVerProductos: (categoria: Categoria) => void // Callback para filtrar productos por categoría
}

export function CategoriasTab({ 
  categorias, 
  onRefresh,
  onVerProductos 
}: CategoriasTabProps) {
  // Estados
  const [busqueda, setBusqueda] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editCategoria, setEditCategoria] = useState<Categoria | null>(null)
  const [loading, setLoading] = useState(false)
  const [categoriaToDelete, setCategoriaToDelete] = useState<Categoria | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Filtrar categorías
  const categoriasFiltradas = useMemo(() => {
    if (!busqueda) return categorias

    const search = busqueda.toLowerCase()
    return categorias.filter(
      (c) =>
        c.nombre.toLowerCase().includes(search) ||
        c.prefijo.toLowerCase().includes(search) ||
        c.descripcion?.toLowerCase().includes(search)
    )
  }, [categorias, busqueda])

  // Stats calculadas
  const stats = useMemo(() => {
    const activas = categorias.filter(c => c.estado === "activa").length
    const conProductos = categorias.filter(c => (c.totalProductos || 0) > 0).length
    const totalProductos = categorias.reduce((sum, c) => sum + (c.totalProductos || 0), 0)

    return {
      total: categorias.length,
      activas,
      conProductos,
      totalProductos,
    }
  }, [categorias])

  // Handlers
  const handleNuevaCategoria = () => {
    setEditCategoria(null)
    setModalOpen(true)
  }

  const handleEditarCategoria = (categoria: Categoria) => {
    setEditCategoria(categoria)
    setModalOpen(true)
  }

  const handleEliminarCategoria = async (categoria: Categoria) => {
    // Verificar si tiene productos
    if ((categoria.totalProductos || 0) > 0) {
      toast({
        title: "No se puede eliminar",
        description: `La categoría "${categoria.nombre}" tiene ${categoria.totalProductos} productos asociados. Mueve los productos primero.`,
        variant: "destructive",
      })
      return
    }

    // Abrir modal de confirmación
    setCategoriaToDelete(categoria)
    setDeleteDialogOpen(true)
  }

  const confirmarEliminacion = async () => {
    if (!categoriaToDelete) return

    setLoading(true)
    try {
      await CategoriasService.delete(categoriaToDelete.id)
      toast({
        title: "Categoría eliminada",
        description: `La categoría "${categoriaToDelete.nombre}" se eliminó correctamente`,
      })
      await onRefresh()
    } catch (error: any) {
      console.error("Error al eliminar categoría:", error)
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar la categoría",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setCategoriaToDelete(null)
    }
  }

  const handleSuccess = async () => {
    await onRefresh()
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Categorías */}
        <div className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Tag className="h-5 w-5 text-accent" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {stats.total}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            Total Categorías
          </div>
        </div>

        {/* Activas */}
        <div className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {stats.activas}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            Categorías Activas
          </div>
        </div>

        {/* Con Productos */}
        <div className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {stats.conProductos}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            Con Stock
          </div>
        </div>

        {/* Total Productos */}
        <div className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {stats.totalProductos}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            Productos Totales
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar categorías..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
          />
        </div>

        {/* Botón Nueva Categoría */}
        <button
          onClick={handleNuevaCategoria}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-accent-foreground hover:brightness-110 transition-all font-medium text-sm shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </button>
      </div>

      {/* Info */}
      {busqueda && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>
            Mostrando {categoriasFiltradas.length} de {categorias.length} categorías
          </span>
        </div>
      )}

      {/* Tabla */}
      <CategoriasTable
        categorias={categoriasFiltradas}
        onEditar={handleEditarCategoria}
        onEliminar={handleEliminarCategoria}
        onVerProductos={onVerProductos}
      />

      {/* Modal */}
      <CategoriaModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditCategoria(null)
        }}
        onSuccess={handleSuccess}
        categoria={editCategoria}
      />

      {/* Modal de Confirmación de Eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar la categoría "{categoriaToDelete?.nombre}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La categoría será eliminada permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarEliminacion}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Eliminando..." : "Aceptar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
