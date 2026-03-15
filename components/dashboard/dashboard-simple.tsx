"use client"

import { useRouter } from "next/navigation"
import {
  CreditCard,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  FileText,
  Lock,
  ScanFace,
  ArrowRight,
} from "lucide-react"
import { useAuthContext } from "@/lib/contexts/auth-context"
import { AuthService } from "@/lib/auth"
import { Card, CardContent } from "@/ui/card"

const MODULOS = [
  {
    label: "Gestión de Membresías",
    descripcion: "Administra planes y membresías de socios",
    icon: CreditCard,
    href: "/membresias",
    modulo: "membresias",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    label: "Gestión de Socios",
    descripcion: "Consulta y gestiona el registro de socios",
    icon: Users,
    href: "/socios",
    modulo: "socios",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    label: "Control de Asistencia",
    descripcion: "Registra entradas y salidas del gimnasio",
    icon: ScanFace,
    href: "/asistencia",
    modulo: "asistencia",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    label: "Gestión de Ventas",
    descripcion: "Realiza ventas y consulta el historial",
    icon: ShoppingCart,
    href: "/ventas",
    modulo: "ventas",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    label: "Inventario y Productos",
    descripcion: "Gestiona el stock y catálogo de productos",
    icon: Package,
    href: "/inventario",
    modulo: "inventario",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    label: "Control de Movimientos",
    descripcion: "Registra ingresos y egresos financieros",
    icon: TrendingUp,
    href: "/movimientos",
    modulo: "movimientos",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    label: "Reportes",
    descripcion: "Genera y exporta reportes del sistema",
    icon: FileText,
    href: "/reportes",
    modulo: "reportes",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    label: "Gestión de Usuarios",
    descripcion: "Administra usuarios y roles del sistema",
    icon: Lock,
    href: "/usuarios",
    modulo: "usuarios",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
]

export function DashboardSimple() {
  const router = useRouter()
  const { tienePermiso } = useAuthContext()
  const user = AuthService.getUser()

  const modulosPermitidos = MODULOS.filter((m) => tienePermiso(m.modulo, "ver"))

  const nombreUsuario = user?.nombre_completo || user?.username || "Usuario"

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8 space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenido, {nombreUsuario}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Selecciona un módulo para comenzar a trabajar
        </p>
      </div>

      {/* Grid de accesos directos */}
      {modulosPermitidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Package className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">Sin módulos disponibles</p>
          <p className="text-sm">Contacta al administrador para obtener acceso.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modulosPermitidos.map((modulo) => {
            const Icon = modulo.icon
            return (
              <Card
                key={modulo.modulo}
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-border/60"
                onClick={() => router.push(modulo.href)}
              >
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-lg ${modulo.bg}`}>
                      <Icon className={`h-5 w-5 ${modulo.color}`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground leading-tight">
                      {modulo.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {modulo.descripcion}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
