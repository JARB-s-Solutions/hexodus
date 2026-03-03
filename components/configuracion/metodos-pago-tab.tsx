"use client"

import { useState, useEffect } from "react"
import { CreditCard, Plus, X, Loader2 } from "lucide-react"
import { getMetodosPago, createMetodoPago, type MetodoPago } from "@/lib/services/metodos-pago"

export function MetodosPagoTab() {
  const [metodos, setMetodos] = useState<MetodoPago[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [nuevoMetodo, setNuevoMetodo] = useState("")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Cargar métodos al montar el componente
  useEffect(() => {
    loadMetodos()
  }, [])

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const loadMetodos = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getMetodosPago()
      
      // Asegurar que siempre sea un array
      if (Array.isArray(data)) {
        setMetodos(data)
      } else {
        console.error("Respuesta no es un array:", data)
        setMetodos([])
        setError("Formato de respuesta inválido")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar métodos de pago"
      setError(errorMessage)
      setToast({ type: "error", message: errorMessage })
      setMetodos([]) // Asegurar que metodos siempre sea array
    } finally {
      setLoading(false)
    }
  }

  const handleAbrirModal = () => {
    setNuevoMetodo("")
    setShowModal(true)
  }

  const handleCerrarModal = () => {
    setShowModal(false)
    setNuevoMetodo("")
  }

  const handleGuardar = async () => {
    if (!nuevoMetodo.trim()) {
      setToast({ type: "error", message: "El nombre del método es requerido" })
      return
    }

    try {
      setSaving(true)
      const metodoCreado = await createMetodoPago(nuevoMetodo)
      
      // Asegurar que metodoCreado sea un objeto válido
      if (metodoCreado && typeof metodoCreado === "object") {
        setMetodos((prev) => Array.isArray(prev) ? [...prev, metodoCreado] : [metodoCreado])
        setToast({ type: "success", message: "Método de pago creado exitosamente" })
        handleCerrarModal()
      } else {
        throw new Error("Respuesta inválida del servidor")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear método de pago"
      setToast({ type: "error", message: errorMessage })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Métodos de Pago</h2>
        </div>
        <button
          onClick={handleAbrirModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-accent to-primary text-white hover:shadow-lg hover:shadow-accent/50 transition-all duration-300 uppercase tracking-wide"
        >
          <Plus className="h-4 w-4" />
          Agregar Método
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="ml-3 text-muted-foreground">Cargando métodos de pago...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={loadMetodos}
            className="mt-3 px-4 py-2 bg-destructive/20 hover:bg-destructive/30 rounded-lg text-sm font-medium text-destructive transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-hidden border border-border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fecha Creación
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metodos.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    No hay métodos de pago registrados
                  </td>
                </tr>
              ) : (
                metodos.map((metodo) => (
                  <tr key={metodo.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium text-foreground">{metodo.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          metodo.activo !== false
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {metodo.activo !== false ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {metodo.createdAt
                        ? new Date(metodo.createdAt).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Agregar Método */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-accent" />
                <h3 className="text-lg font-semibold text-foreground">Nuevo Método de Pago</h3>
              </div>
              <button
                onClick={handleCerrarModal}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div>
                <label htmlFor="nombre-metodo" className="block text-sm font-medium text-muted-foreground mb-2">
                  Nombre del Método
                </label>
                <input
                  id="nombre-metodo"
                  type="text"
                  value={nuevoMetodo}
                  onChange={(e) => setNuevoMetodo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !saving && handleGuardar()}
                  placeholder="Ej: Transferencia SPEI, Efectivo, Tarjeta..."
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={handleCerrarModal}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border text-muted-foreground hover:bg-muted/50 transition-all duration-300 uppercase tracking-wide disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={saving || !nuevoMetodo.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-accent to-primary text-white hover:shadow-lg hover:shadow-accent/50 transition-all duration-300 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-slide-in-right">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg border ${
              toast.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-500"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="hover:opacity-70 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
