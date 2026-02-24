// ================================================
// HOOK DE AUTENTICACIÓN
// ================================================

"use client"

import { useState, useEffect, useCallback } from 'react'
import { AuthService } from '@/lib/auth'
import type { User } from '@/lib/types/auth'
import { ApiError } from '@/lib/api'

interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
}

/**
 * Hook personalizado para manejar la autenticación
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar usuario al montar el componente
  useEffect(() => {
    const loadUser = () => {
      if (AuthService.isAuthenticated()) {
        const currentUser = AuthService.getUser()
        setUser(currentUser)
      }
      setIsLoading(false)
    }

    loadUser()
  }, [])

  /**
   * Iniciar sesión
   */
  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await AuthService.login(username, password)
      setUser(response.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Cerrar sesión
   */
  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await AuthService.logout()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Solicitar recuperación de contraseña
   */
  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true)
    try {
      await AuthService.forgotPassword(email)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    user,
    isAuthenticated: !!user && AuthService.isAuthenticated(),
    isLoading,
    login,
    logout,
    forgotPassword,
  }
}
