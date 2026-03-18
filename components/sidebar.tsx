"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  CreditCard,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  FileText,
  Lock,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  ScanFace,
} from "lucide-react"
import { useAuthContext } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "@/components/theme-provider-custom"
import { Avatar, AvatarFallback } from "@/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu"

/** Cada ítem del menú mapea al módulo de permisos del backend */
const navItems = [
  { label: "Dashboard",             icon: LayoutDashboard, href: "/dashboard",    modulo: "dashboard"   },
  { label: "Gestion de Membresias", icon: CreditCard,      href: "/membresias",   modulo: "membresias"  },
  { label: "Gestion de Socios",     icon: Users,           href: "/socios",        modulo: "socios"      },
  { label: "Control de Asistencia", icon: ScanFace,        href: "/asistencia",    modulo: "asistencia"  },
  { label: "Gestion de Ventas",     icon: ShoppingCart,    href: "/ventas",        modulo: "ventas"      },
  { label: "Inventario y Productos",icon: Package,         href: "/inventario",    modulo: "inventario"  },
  { label: "Control de Movimientos",icon: TrendingUp,      href: "/movimientos",   modulo: "movimientos" },
  { label: "Reportes",              icon: FileText,        href: "/reportes",      modulo: "reportes"    },
  { label: "Gestion de Usuarios",   icon: Lock,            href: "/usuarios",      modulo: "usuarios"    },
]

interface SidebarProps {
  activePage?: string
}

export function Sidebar({ activePage = "dashboard" }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout, tienePermiso } = useAuthContext()
  const { theme } = useTheme()
  const router = useRouter()
  const { toast } = useToast()

  // Filtrar ítems del sidebar según el permiso "ver" de cada módulo.
  // El Dashboard siempre es visible para cualquier usuario autenticado.
  const visibleNavItems = navItems.filter(item =>
    item.modulo === "dashboard" ? true : tienePermiso(item.modulo, 'ver')
  )

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente',
      })
      router.push('/login')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al cerrar sesión',
      })
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-card text-accent"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border
          flex flex-col justify-between p-4
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:z-auto
        `}
        style={{ boxShadow: "2px 0 10px rgba(0,0,0,0.5)" }}
      >
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 flex items-center justify-center overflow-hidden">
              {theme.logoSistema ? (
                <img 
                  src={theme.logoSistema} 
                  alt={theme.nombreSistema} 
                  className="h-8 w-8 object-contain" 
                />
              ) : (
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ 
                    backgroundColor: `${theme.colorPrincipal}20`, 
                    color: theme.colorPrincipal 
                  }}
                >
                  {theme.nombreSistema.charAt(0)}
                </div>
              )}
            </div>
            <span 
              className="text-xl font-bold tracking-widest uppercase text-primary"
              style={{ filter: `drop-shadow(0 0 4px ${theme.colorPrincipal}80)` }}
            >
              {theme.nombreSistema}
            </span>
            {/* Mobile close */}
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto md:hidden text-muted-foreground hover:text-foreground"
              aria-label="Cerrar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {visibleNavItems.map((item) => {
              const isActive = item.modulo === activePage
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200
                    ${
                      isActive
                        ? "bg-primary/15 text-primary border-l-4 border-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }
                  `}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </a>
              )
            })}
          </nav>
        </div>

        {/* Bottom settings and user */}
        <div className="flex flex-col gap-3 pt-4 border-t border-sidebar-border">
          {tienePermiso('configuracion', 'ver') && (
            <a
              href="/configuracion"
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200
                ${
                  activePage === "configuracion"
                    ? "bg-primary/15 text-primary border-l-4 border-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }
              `}
            >
              <Settings className="h-5 w-5" />
              <span>Configuracion</span>
            </a>
          )}

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-sidebar-accent transition-colors duration-200 outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {getUserInitials(user.nombre_completo || user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.nombre_completo || user.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.rol}
                  </p>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <User className="h-4 w-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>
    </>
  )
}