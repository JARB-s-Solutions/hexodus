"use client"

import { useMemo } from "react"
import {
  Bell,
  CalendarClock,
  CheckCheck,
  ChevronRight,
  CreditCard,
  Package,
  Settings,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type NotificationType = "pago" | "asistencia" | "inventario" | "sistema"
type NotificationPriority = "alta" | "media" | "baja"

export interface HeaderNotification {
  id: string
  title: string
  description: string
  createdAt: string
  read: boolean
  type: NotificationType
  priority: NotificationPriority
}

interface NotificationCenterButtonProps {
  notifications?: HeaderNotification[]
  loading?: boolean
  onOpenChange?: (open: boolean) => void
  onMarkAllAsRead?: () => void
  onNotificationClick?: (notification: HeaderNotification) => void
  onViewAll?: () => void
  className?: string
}

const typeConfig: Record<
  NotificationType,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    iconWrapClass: string
  }
> = {
  pago: {
    label: "Pagos",
    icon: CreditCard,
    iconWrapClass: "bg-emerald-500/15 text-emerald-400",
  },
  asistencia: {
    label: "Asistencia",
    icon: CalendarClock,
    iconWrapClass: "bg-sky-500/15 text-sky-400",
  },
  inventario: {
    label: "Inventario",
    icon: Package,
    iconWrapClass: "bg-amber-500/15 text-amber-400",
  },
  sistema: {
    label: "Sistema",
    icon: Settings,
    iconWrapClass: "bg-violet-500/15 text-violet-400",
  },
}

const priorityLabel: Record<NotificationPriority, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
}

function formatRelativeTime(dateValue: string) {
  const timestamp = new Date(dateValue).getTime()
  if (Number.isNaN(timestamp)) return "Ahora"

  const diffMs = Date.now() - timestamp
  if (diffMs <= 0) return "Ahora"

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "Ahora"
  if (minutes < 60) return `Hace ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`

  const days = Math.floor(hours / 24)
  return `Hace ${days} d`
}

export function NotificationCenterButton({
  notifications = [],
  loading = false,
  onOpenChange,
  onMarkAllAsRead,
  onNotificationClick,
  onViewAll,
  className,
}: NotificationCenterButtonProps) {
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Notificaciones"
          className={cn(
            "group relative grid h-10 w-10 place-items-center rounded-xl border border-border/60",
            "bg-gradient-to-b from-card to-card/70",
            "transition-all duration-200 hover:border-accent/70 hover:shadow-[0_10px_28px_rgba(14,165,233,0.18)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
            className,
          )}
        >
          <Bell className="h-5 w-5 text-accent transition-transform duration-200 group-hover:-translate-y-[1px]" />

          {unreadCount > 0 ? (
            <>
              <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground shadow-[0_0_0_2px_hsl(var(--background))]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
            </>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[380px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border/70 bg-card/95 p-0 shadow-2xl backdrop-blur"
      >
        <div className="border-b border-border/60 bg-gradient-to-r from-accent/10 via-transparent to-primary/10 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Notificaciones</p>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} sin leer` : "Todo al día"}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={onMarkAllAsRead}
              disabled={loading || unreadCount === 0}
              className="h-8 px-2 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todo
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[360px]">
          <div className="py-1">
            {loading ? (
              <div className="space-y-2 px-3 py-3">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-muted">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Sin notificaciones nuevas</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cuando integremos el backend, aparecerán aquí en tiempo real.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = typeConfig[notification.type]
                const Icon = config.icon

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => onNotificationClick?.(notification)}
                    className={cn(
                      "group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                      "hover:bg-muted/60",
                      notification.read ? "bg-transparent" : "bg-accent/8",
                    )}
                  >
                    <div className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", config.iconWrapClass)}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("truncate text-sm", notification.read ? "font-medium" : "font-semibold")}>{notification.title}</p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.description}</p>

                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          variant={notification.priority === "alta" ? "destructive" : notification.priority === "media" ? "secondary" : "outline"}
                          className="text-[10px]"
                        >
                          {priorityLabel[notification.priority]}
                        </Badge>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/90">{config.label}</span>
                      </div>
                    </div>

                    {!notification.read ? (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="h-9 w-full justify-between rounded-lg text-xs"
          >
            Ver centro de notificaciones
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
