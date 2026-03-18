import { Avatar, AvatarImage, AvatarFallback } from "@/ui/avatar"
import { getIniciales } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface SocioAvatarProps {
  nombre: string
  fotoPerfil?: string | null
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "success" | "warning" | "danger"
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-2xl",
}

const variantClasses = {
  default: "bg-accent/10 text-accent",
  success: "bg-green-500/15 text-green-400",
  warning: "bg-yellow-500/15 text-yellow-400",
  danger: "bg-red-500/15 text-red-400",
}

/**
 * Avatar inteligente para socios que muestra:
 * - Foto de perfil si está disponible
 * - Iniciales del nombre si no hay foto
 * - Soporte para nombres simples, compuestos y vacíos
 */
export function SocioAvatar({
  nombre,
  fotoPerfil,
  className,
  size = "md",
  variant = "default",
}: SocioAvatarProps) {
  const iniciales = getIniciales(nombre)

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {fotoPerfil && (
        <AvatarImage 
          src={fotoPerfil} 
          alt={nombre}
          className="object-cover"
        />
      )}
      <AvatarFallback 
        className={cn(
          "font-bold",
          variantClasses[variant]
        )}
      >
        {iniciales}
      </AvatarFallback>
    </Avatar>
  )
}
