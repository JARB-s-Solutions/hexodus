"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

/**
 * Listener global del evento `api:forbidden`.
 * Se monta una sola vez en el RootLayout y muestra un toast
 * cada vez que el backend devuelve un 403.
 */
export function ForbiddenToast() {
  const { toast } = useToast()

  useEffect(() => {
    const handleForbidden = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail
      toast({
        variant: "destructive",
        title: "Acceso denegado",
        description:
          detail?.message ||
          "Lo sentimos, tu sesión no tiene permisos para esta acción.",
      })
    }

    window.addEventListener("api:forbidden", handleForbidden)
    return () => window.removeEventListener("api:forbidden", handleForbidden)
  }, [toast])

  return null
}
