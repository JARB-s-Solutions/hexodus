"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { AuthService } from "@/lib/auth"
import type { User, PermisosBackend } from "@/lib/types/auth"

// ============================================================
// TIPOS DEL CONTEXTO
// ============================================================

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  /** Devuelve true si el usuario puede ejecutar la acción en el módulo */
  tienePermiso: (modulo: string, accion: string) => boolean
  /** Devuelve true si el usuario es administrador con acceso total */
  esAdmin: boolean
}

// ============================================================
// CONTEXTO
// ============================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================
// PROVEEDOR
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar usuario al montar
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      setUser(AuthService.getUser())
    }
    setIsLoading(false)
  }, [])

  // Sincronizar con eventos del AuthService (multi-tab / auth:login / auth:logout)
  useEffect(() => {
    const handleLogin = (e: Event) => {
      const detail = (e as CustomEvent<{ user: User }>).detail
      setUser(detail.user)
    }
    const handleLogout = () => setUser(null)

    window.addEventListener("auth:login", handleLogin)
    window.addEventListener("auth:logout", handleLogout)

    // Refrescar permisos cuando la pestaña gana foco
    const handleFocus = () => {
      if (AuthService.isAuthenticated()) {
        setUser(AuthService.getUser())
      } else {
        setUser(null)
      }
    }
    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("auth:login", handleLogin)
      window.removeEventListener("auth:logout", handleLogout)
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  // ── Login ──────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await AuthService.login(username, password)
      setUser(response.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Logout ─────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await AuthService.logout()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── ForgotPassword ─────────────────────────────────────────
  const forgotPassword = useCallback(async (email: string) => {
    await AuthService.forgotPassword(email)
  }, [])

  // ── esAdmin ────────────────────────────────────────────────
  const esAdmin = Boolean(
    user?.esAdministrador ||
      (user?.permisos as PermisosBackend | undefined)?.todo === "absoluto"
  )

  // ── tienePermiso ───────────────────────────────────────────
  const tienePermiso = useCallback(
    (modulo: string, accion: string): boolean => {
      if (!user) return false

      // Administrador: acceso total
      if (
        user.esAdministrador ||
        (user.permisos as PermisosBackend | undefined)?.todo === "absoluto"
      ) {
        return true
      }

      const permisosModulo = user.permisos?.[modulo]
      if (!permisosModulo || typeof permisosModulo !== "object") return false

      return (permisosModulo as Record<string, boolean | undefined>)[accion] === true
    },
    [user]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && AuthService.isAuthenticated(),
        isLoading,
        login,
        logout,
        forgotPassword,
        tienePermiso,
        esAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================
// HOOK DE ACCESO AL CONTEXTO
// ============================================================

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuthContext debe usarse dentro de <AuthProvider>")
  }
  return ctx
}
