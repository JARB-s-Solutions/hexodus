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
  MoreHorizontal,
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

const mobilePrimaryModules = ["dashboard", "socios", "ventas", "asistencia"]

const mobileShortLabels: Record<string, string> = {
  dashboard: "Inicio",
  socios: "Socios",
  ventas: "Ventas",
  asistencia: "Asistencia",
  inventario: "Inventario",
  movimientos: "Movs.",
  reportes: "Reportes",
  usuarios: "Usuarios",
  membresias: "Planes",
}

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

  const configuracionItem = tienePermiso('configuracion', 'ver')
    ? { label: "Configuracion", icon: Settings, href: "/configuracion", modulo: "configuracion" }
    : null

  const activeItem = [...visibleNavItems, ...(configuracionItem ? [configuracionItem] : [])]
    .find(item => item.modulo === activePage)

  const mobilePrimaryItems = [
    ...visibleNavItems.filter(item => mobilePrimaryModules.includes(item.modulo)),
    ...visibleNavItems.filter(item => !mobilePrimaryModules.includes(item.modulo)),
  ].slice(0, 4)
  const mobileNavColumns = mobilePrimaryItems.length + 1

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
      {/* Mobile top app bar */}
      <div className="hexodus-mobile-shell md:hidden fixed inset-x-0 top-0 z-40 border-b border-border bg-background/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] shadow-lg backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-accent transition-colors hover:bg-muted"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {theme.nombreSistema}
            </p>
            <p className="truncate text-base font-semibold text-foreground">
              {activeItem?.label ?? "Panel principal"}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
            {theme.logoSistema ? (
              <img
                src={theme.logoSistema}
                alt={theme.nombreSistema}
                className="h-7 w-7 object-contain"
              />
            ) : (
              <span className="text-sm font-bold text-primary">
                {theme.nombreSistema.charAt(0)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-[60] w-[min(22rem,calc(100vw-2rem))] bg-sidebar border-r border-sidebar-border
          flex flex-col justify-between p-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:w-64 md:translate-x-0 md:static md:z-auto md:pt-4 md:pb-4
        `}
        style={{ boxShadow: "2px 0 10px rgba(0,0,0,0.5)" }}
      >
        <div className="flex min-h-0 flex-col gap-6">
          {/* Logo */}
          <div className="mb-2 flex items-center gap-3">
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
          <nav className="custom-scrollbar flex min-h-0 flex-col gap-1 overflow-y-auto pr-1">
            {visibleNavItems.map((item) => {
              const isActive = item.modulo === activePage
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
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
          {configuracionItem && (
            <a
              href={configuracionItem.href}
              onClick={() => setMobileOpen(false)}
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
              <span>{configuracionItem.label}</span>
            </a>
          )}

          {/* User menu */}
          {user && (
            <>
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
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 md:hidden"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="hexodus-mobile-bottom-nav md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${mobileNavColumns}, minmax(0, 1fr))` }}
        >
          {mobilePrimaryItems.map((item) => {
            const isActive = item.modulo === activePage
            const Icon = item.icon

            return (
              <a
                key={item.modulo}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`
                  flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition-colors
                  ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{mobileShortLabels[item.modulo] ?? item.label}</span>
              </a>
            )
          })}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={`
              flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition-colors
              ${
                mobilePrimaryItems.some(item => item.modulo === activePage)
                  ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                  : "bg-primary/15 text-primary"
              }
            `}
            aria-label="Abrir menu completo"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>Más</span>
          </button>
        </div>
      </nav>
    </>
  )
}
