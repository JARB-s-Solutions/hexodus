"use client"

import { X, Package, Calendar, TrendingUp, DollarSign, Box, Copy } from "lucide-react"
import type { ProductoExtendido } from "@/lib/types/productos"
import { categoriaInfo, estadoStockInfo, formatPrecio } from "@/lib/types/productos"
import { formatFechaCorta } from "@/lib/inventario-data"
import { useToast } from "@/hooks/use-toast"

interface DetalleProductoModalProps {
  open: boolean
  onClose: () => void
  producto: ProductoExtendido | null
  loading?: boolean
}

export function DetalleProductoModal({ open, onClose, producto, loading }: DetalleProductoModalProps) {
  const { toast } = useToast()

  const handleCopiarCodigo = () => {
    if (producto) {
      navigator.clipboard.writeText(producto.codigo)
      toast({
        title: "✅ Código copiado",
        description: `Código ${producto.codigo} copiado al portapapeles`,
        duration: 2000,
      })
    }
  }

  if (!open) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full border border-border animate-fade-in-up p-8" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="ml-3 text-muted-foreground">Cargando detalle del producto...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!producto) return null

  const cat = categoriaInfo[producto.categoria] || categoriaInfo['Otros']
  const est = estadoStockInfo[producto.estadoStock]
  
  // Usar los márgenes del API si están disponibles, sino calcularlos
  const margenMonetario = producto.margenMonetario !== undefined 
    ? producto.margenMonetario 
    : producto.precioVenta - producto.precioCompra
  
  const margenPorcentaje = producto.margenPorcentaje !== undefined
    ? producto.margenPorcentaje
    : (producto.precioCompra > 0 ? ((margenMonetario / producto.precioCompra) * 100) : 0)

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full border border-border animate-fade-in-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-accent" />
            Detalle del Producto
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Name + code */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-foreground mb-1">{producto.nombre}</h4>
                <p className="text-sm text-muted-foreground">{producto.marca}</p>
              </div>
            </div>
            
            {/* Código del producto - Diseño mejorado */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 rounded-lg blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-accent/10 via-background to-primary/10 rounded-lg border-2 border-accent/30 p-4 hover:border-accent/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 border border-accent/30">
                      <Package className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Código de Producto</p>
                      <p className="text-2xl font-bold font-mono text-accent tracking-tight">{producto.codigo}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopiarCodigo}
                    className="px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-md transition-colors border border-accent/20 hover:border-accent/40 flex items-center gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${cat.bg} ${cat.color}`}>
              {cat.nombre}
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${est.bg} ${est.color}`}>
              {est.nombre}
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              producto.activo ? 'bg-[#22C55E]/15 text-[#22C55E]' : 'bg-muted text-muted-foreground'
            }`}>
              {producto.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {/* Precios */}
          <div>
            <h5 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-accent" />
              Información de Precios
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Precio de Venta</p>
                <p className="text-2xl font-bold text-primary">{formatPrecio(producto.precioVenta)}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Precio de Compra</p>
                <p className="text-2xl font-bold text-foreground">{formatPrecio(producto.precioCompra)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#22C55E]/10 to-[#22C55E]/5 rounded-lg p-4 border border-[#22C55E]/20">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Margen de Ganancia
                </p>
                <p className="text-2xl font-bold text-[#22C55E]">{formatPrecio(margenMonetario)}</p>
                <p className="text-xs text-[#22C55E] mt-1">{margenPorcentaje.toFixed(1)}% de ganancia</p>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div>
            <h5 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
              <Box className="h-4 w-4 text-accent" />
              Inventario
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Stock Actual</p>
                <p className="text-2xl font-bold text-foreground">{producto.stockActual}</p>
                <p className="text-xs text-muted-foreground mt-1">unidades disponibles</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Stock Mínimo</p>
                <p className="text-2xl font-bold text-foreground">{producto.stockMinimo}</p>
                <p className="text-xs text-muted-foreground mt-1">nivel de alerta</p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          {producto.descripcion && (
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Descripción
              </h5>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-sm text-foreground leading-relaxed">{producto.descripcion}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4 text-accent" />
              <span>Última actualización: {formatFechaCorta(producto.fechaActualizacion)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors glow-primary">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
