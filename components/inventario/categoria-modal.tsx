"use client"

import { useState, useEffect } from "react"
import { X, Save, Tag, Hash, Palette, FileText, Sparkles } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Categoria, CategoriaFormData } from "@/lib/types/categorias"
import { 
  COLORES_CATEGORIA, 
  generarPrefijoAutomatico, 
  validarPrefijo 
} from "@/lib/types/categorias"
import { CategoriasService } from "@/lib/services/categorias"

interface CategoriaModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (categoria: Categoria) => void
  categoria?: Categoria | null
  inline?: boolean // Si es true, es un modal más pequeño para crear rápido
}

export function CategoriaModal({ 
  open, 
  onClose, 
  onSuccess, 
  categoria, 
  inline = false 
}: CategoriaModalProps) {
  const isEdit = !!categoria
  
  // Estados del formulario
  const [nombre, setNombre] = useState("")
  const [prefijo, setPrefijo] = useState("")
  const [prefijoEditado, setPrefijoEditado] = useState(false) // Track si usuario editó manualmente
  const [color, setColor] = useState<string>(COLORES_CATEGORIA[0].valor)
  const [descripcion, setDescripcion] = useState("")
  const [estado, setEstado] = useState<"activa" | "inactiva">("activa")
  const [loading, setLoading] = useState(false)
  
  // Validaciones en tiempo real
  const [errorNombre, setErrorNombre] = useState("")
  const [errorPrefijo, setErrorPrefijo] = useState("")

  // Resetear formulario cuando cambia la categoría o se abre
  useEffect(() => {
    if (categoria) {
      setNombre(categoria.nombre)
      setPrefijo(categoria.prefijo)
      setPrefijoEditado(true)
      setColor(categoria.color)
      setDescripcion(categoria.descripcion || "")
      setEstado(categoria.estado)
    } else {
      setNombre("")
      setPrefijo("")
      setPrefijoEditado(false)
      setColor(COLORES_CATEGORIA[0].valor)
      setDescripcion("")
      setEstado("activa")
    }
    setErrorNombre("")
    setErrorPrefijo("")
  }, [categoria, open])

  // Auto-generar prefijo cuando el usuario escribe el nombre
  useEffect(() => {
    if (!prefijoEditado && nombre && !isEdit) {
      const nuevoP = generarPrefijoAutomatico(nombre)
      setPrefijo(nuevoP)
    }
  }, [nombre, prefijoEditado, isEdit])

  // Validar nombre en tiempo real
  useEffect(() => {
    if (nombre.trim().length < 3 && nombre.length > 0) {
      setErrorNombre("El nombre debe tener al menos 3 caracteres")
    } else {
      setErrorNombre("")
    }
  }, [nombre])

  // Validar prefijo en tiempo real
  useEffect(() => {
    if (prefijo) {
      const validacion = validarPrefijo(prefijo)
      if (!validacion.valido) {
        setErrorPrefijo(validacion.error || "Prefijo inválido")
      } else {
        setErrorPrefijo("")
      }
    }
  }, [prefijo])

  if (!open) return null

  const handleGenerarPrefijo = () => {
    if (nombre) {
      const nuevoP = generarPrefijoAutomatico(nombre)
      setPrefijo(nuevoP)
      setPrefijoEditado(true)
      toast({
        title: "Prefijo generado",
        description: `Se generó el prefijo: ${nuevoP}`,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones
    if (!nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive",
      })
      return
    }

    if (!prefijo.trim()) {
      toast({
        title: "Error",
        description: "El prefijo es obligatorio",
        variant: "destructive",
      })
      return
    }

    if (errorNombre || errorPrefijo) {
      toast({
        title: "Errores en el formulario",
        description: "Por favor corrige los errores antes de continuar",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Validar unicidad de nombre
      const nombreDisponible = await CategoriasService.validarNombre(
        nombre, 
        isEdit ? categoria?.id : undefined
      )
      if (!nombreDisponible) {
        toast({
          title: "Nombre duplicado",
          description: "Ya existe una categoría con ese nombre",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Validar unicidad de prefijo
      const prefijoDisponible = await CategoriasService.validarPrefijo(
        prefijo, 
        isEdit ? categoria?.id : undefined
      )
      if (!prefijoDisponible) {
        toast({
          title: "Prefijo duplicado",
          description: "Ya existe una categoría con ese prefijo",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const data: CategoriaFormData = {
        nombre: nombre.trim(),
        prefijo: prefijo.trim().toUpperCase(),
        color,
        descripcion: descripcion.trim(),
        estado,
      }

      let result: Categoria
      if (isEdit && categoria) {
        result = await CategoriasService.update(categoria.id, data)
        toast({
          title: "Categoría actualizada",
          description: `La categoría "${result.nombre}" se actualizó correctamente`,
        })
      } else {
        result = await CategoriasService.create(data)
        toast({
          title: "Categoría creada",
          description: `La categoría "${result.nombre}" se creó con el prefijo ${result.prefijo}`,
        })
      }

      onSuccess(result)
      onClose()
    } catch (error: any) {
      console.error("Error al guardar categoría:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la categoría",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <div
        className={`bg-card rounded-xl shadow-2xl border border-border animate-fade-in-up ${
          inline ? 'max-w-lg' : 'max-w-2xl'
        } w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 border border-accent/20">
                <Tag className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {isEdit ? "Editar Categoría" : inline ? "Nueva Categoría Rápida" : "Nueva Categoría"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isEdit 
                    ? "Actualiza la información de la categoría" 
                    : inline
                    ? "Crea una categoría rápidamente sin salir del flujo"
                    : "Crea una nueva categoría para organizar tus productos"}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nombre */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Tag className="h-4 w-4 text-accent" />
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Proteínas, Creatinas, Accesorios..."
              className={inputClass}
              required
            />
            {errorNombre && (
              <p className="text-xs text-destructive mt-1">{errorNombre}</p>
            )}
          </div>

          {/* Prefijo */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Hash className="h-4 w-4 text-accent" />
              Prefijo para Códigos *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prefijo}
                onChange={(e) => {
                  setPrefijo(e.target.value.toUpperCase())
                  setPrefijoEditado(true)
                }}
                placeholder="PROT"
                maxLength={6}
                className={`${inputClass} flex-1`}
                required
              />
              {!isEdit && (
                <button
                  type="button"
                  onClick={handleGenerarPrefijo}
                  disabled={!nombre}
                  className="px-4 py-2.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-accent/20"
                >
                  <Sparkles className="h-4 w-4" />
                  Auto
                </button>
              )}
            </div>
            {errorPrefijo ? (
              <p className="text-xs text-destructive mt-1">{errorPrefijo}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                💡 Este prefijo se usará en los códigos: {prefijo || 'PROT'}-001, {prefijo || 'PROT'}-002...
              </p>
            )}
          </div>

          {/* Selector de Color */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <Palette className="h-4 w-4 text-accent" />
              Color Identificador
            </label>
            <div className="grid grid-cols-9 gap-3">
              {COLORES_CATEGORIA.map((c) => (
                <button
                  key={c.valor}
                  type="button"
                  onClick={() => setColor(c.valor)}
                  className={`h-10 w-10 rounded-lg transition-all border-2 ${
                    color === c.valor 
                      ? 'border-accent scale-110 shadow-lg' 
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.valor }}
                  title={c.nombre}
                />
              ))}
            </div>
          </div>

          {!inline && (
            <>
              {/* Descripción */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <FileText className="h-4 w-4 text-accent" />
                  Descripción (opcional)
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe brevemente esta categoría..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Estado (solo en edición) */}
              {isEdit && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Estado
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEstado("activa")}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        estado === "activa"
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-muted-foreground hover:border-accent/50'
                      }`}
                    >
                      <div className="font-medium">Activa</div>
                      <div className="text-xs mt-1">Visible en selección</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEstado("inactiva")}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        estado === "inactiva"
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-muted-foreground hover:border-accent/50'
                      }`}
                    >
                      <div className="font-medium">Inactiva</div>
                      <div className="text-xs mt-1">Oculta pero preservada</div>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Vista previa */}
          <div className="p-4 bg-background rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
            <div className="flex items-center gap-3">
              <div 
                className="px-3 py-1.5 rounded-lg font-medium text-sm flex items-center gap-2"
                style={{ 
                  backgroundColor: `${color}20`,
                  color: color 
                }}
              >
                <div 
                  className="h-2 w-2 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                {nombre || "Nombre de categoría"}
              </div>
              <span className="text-xs text-muted-foreground">
                Código: {prefijo || 'PREF'}-001
              </span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!errorNombre || !!errorPrefijo || !nombre || !prefijo}
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-accent text-accent-foreground hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEdit ? 'Actualizar' : 'Crear Categoría'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
