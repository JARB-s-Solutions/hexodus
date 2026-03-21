"use client"

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AuthService } from '@/lib/auth'
import { ApiError } from '@/lib/api'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tokenExpired, setTokenExpired] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null)

  // Obtener el token de la URL
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    if (!tokenFromUrl) {
      setTokenExpired(true)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No hay token de recuperación en la URL. Por favor solicita un nuevo correo.',
      })
    } else {
      setToken(tokenFromUrl)
    }
  }, [searchParams, toast])

  // Evaluar fuerza de contraseña
  const evaluatePasswordStrength = (pwd: string): void => {
    if (!pwd) {
      setPasswordStrength(null)
      return
    }

    const hasUpperCase = /[A-Z]/.test(pwd)
    const hasLowerCase = /[a-z]/.test(pwd)
    const hasNumbers = /\d/.test(pwd)
    const hasSpecialChar = /[@$!%*?&#]/.test(pwd)
    const isLongEnough = pwd.length >= 8

    const strength =
      [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar, isLongEnough].filter(Boolean).length

    if (strength <= 2) setPasswordStrength('weak')
    else if (strength <= 3) setPasswordStrength('medium')
    else setPasswordStrength('strong')
  }

  const validatePasswords = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!password.trim()) {
      errors.push('La contraseña no puede estar vacía')
    }

    if (!confirmPassword.trim()) {
      errors.push('Debes confirmar tu contraseña')
    }

    if (password !== confirmPassword) {
      errors.push('Las contraseñas no coinciden')
    }

    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una mayúscula')
    }

    if (!/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número')
    }

    if (!/[@$!%*?&#]/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial (@$!%*?&#)')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Token de recuperación no válido',
      })
      return
    }

    const validation = validatePasswords()
    if (!validation.valid) {
      validation.errors.forEach((error) => {
        toast({
          variant: 'destructive',
          title: 'Error de validación',
          description: error,
        })
      })
      return
    }

    setIsLoading(true)

    try {
      console.log('🔐 Enviando solicitud de reestablecimiento de contraseña...')
      await AuthService.resetPassword(token, password)

      toast({
        title: '¡Éxito!',
        description: 'Tu contraseña ha sido reestablecida exitosamente. Será redirigido al login.',
      })

      // Redirigir al login después de 1.5 segundos
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (error) {
      console.error('Error al reestablecer contraseña:', error)
      let errorMessage = 'No se pudo reestablecer tu contraseña. Intenta nuevamente.'

      if (error instanceof ApiError) {
        if (error.status === 404) {
          errorMessage = 'El token de recuperación no es válido o ha expirado. Por favor solicita uno nuevo.'
          setTokenExpired(true)
        } else if (error.status === 400) {
          errorMessage = error.message || 'La contraseña no cumple con los requisitos.'
        } else if (error.status === 0) {
          errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.'
        } else if (error.message) {
          errorMessage = error.message
        }
      }

      toast({
        variant: 'destructive',
        title: 'Error al reestablecer contraseña',
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenExpired) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-white"
        style={{
          backgroundColor: '#121826',
          backgroundImage: 'radial-gradient(#2c2c30 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      >
        <div
          className="w-full max-w-md p-8 sm:p-10 rounded-2xl transform transition-all duration-300"
          style={{
            backgroundColor: '#1F2B36',
            border: '1px solid transparent',
            boxShadow: '0 0 20px rgba(0, 191, 255, 0.2)',
          }}
        >
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-center mb-4 tracking-wider text-white">
            ENLACE EXPIRADO
          </h1>

          <p className="text-center text-gray-400 mb-8 text-sm">
            El enlace de recuperación ha expirado o no es válido. Por favor solicita uno nuevo.
          </p>

          <div className="space-y-3">
            <Link
              href="/recuperar-password"
              className="block w-full py-3 font-bold text-lg rounded-lg text-white uppercase tracking-widest transition duration-300 text-center btn-primary"
              style={{
                backgroundColor: '#00BFFF',
                boxShadow: '0 0 15px rgba(0, 191, 255, 0.7)',
              }}
            >
              Solicitar Nuevo Enlace
            </Link>

            <Link
              href="/login"
              className="block w-full py-3 font-bold text-lg rounded-lg text-white uppercase tracking-widest transition duration-300 text-center border border-gray-600 hover:border-gray-500"
            >
              Volver al Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 text-white"
      style={{
        backgroundColor: '#121826',
        backgroundImage: 'radial-gradient(#2c2c30 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }}
    >
      {/* Tarjeta */}
      <div
        className="w-full max-w-md p-8 sm:p-10 rounded-2xl transform transition-all duration-300"
        style={{
          backgroundColor: '#1F2B36',
          border: '1px solid transparent',
          boxShadow: '0 0 20px rgba(0, 191, 255, 0.2)',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="assets/images/icon.png" alt="Logo del Sistema" className="h-16 w-16" />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-extrabold text-center mb-4 tracking-wider text-white">
          REESTABLECER CONTRASEÑA
        </h1>

        <p className="text-center text-gray-400 mb-8 text-sm">
          Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres, incluir mayúsculas, números y caracteres especiales.
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo de Nueva Contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-400">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  evaluatePasswordStrength(e.target.value)
                }}
                disabled={isLoading}
                autoComplete="new-password"
                autoFocus
                required
                className="w-full px-4 py-3 pr-10 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-0 input-neon"
                style={{
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Indicador de fuerza */}
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      passwordStrength === 'weak'
                        ? 'w-1/3 bg-red-500'
                        : passwordStrength === 'medium'
                          ? 'w-2/3 bg-yellow-500'
                          : 'w-full bg-green-500'
                    }`}
                  />
                </div>
                <span
                  className="text-xs font-medium"
                  style={{
                    color:
                      passwordStrength === 'weak'
                        ? '#ef4444'
                        : passwordStrength === 'medium'
                          ? '#eab308'
                          : '#22c55e',
                  }}
                >
                  {passwordStrength === 'weak' ? 'Débil' : passwordStrength === 'medium' ? 'Media' : 'Fuerte'}
                </span>
              </div>
            )}
          </div>

          {/* Campo de Confirmación */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-gray-400">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 pr-10 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-0 input-neon"
                style={{
                  outline: 'none',
                  borderColor:
                    confirmPassword && password !== confirmPassword
                      ? '#ef4444'
                      : confirmPassword && password === confirmPassword
                        ? '#22c55e'
                        : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Feedback de coincidencia */}
            {confirmPassword && (
              <p
                className="text-xs mt-1 font-medium"
                style={{
                  color: password === confirmPassword ? '#22c55e' : '#ef4444',
                }}
              >
                {password === confirmPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
              </p>
            )}
          </div>

          {/* Botón de submit */}
          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full py-3 font-bold text-lg rounded-lg text-white uppercase tracking-widest transition duration-300 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#00BFFF',
              boxShadow: '0 0 15px rgba(0, 191, 255, 0.7)',
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Reestableciendo...
              </span>
            ) : (
              'Reestablecer Contraseña'
            )}
          </button>

          {/* División */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-xs text-gray-500">O</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          {/* Link de volver */}
          <p className="text-center text-sm text-gray-400">
            ¿Recuerdas tu contraseña?{' '}
            <Link href="/login" className="text-[#00BFFF] hover:text-[#00DFFF] font-semibold transition-colors">
              Inicia sesión aquí
            </Link>
          </p>
        </form>

        {/* Requisitos de contraseña */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xs font-semibold text-gray-400 mb-3">REQUISITOS DE CONTRASEÑA:</p>
          <ul className="space-y-2 text-xs text-gray-500">
            <li className={password.length >= 8 ? 'text-green-500' : ''}>
              ✓ Mínimo 8 caracteres
            </li>
            <li className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>
              ✓ Al menos una letra mayúscula
            </li>
            <li className={/\d/.test(password) ? 'text-green-500' : ''}>
              ✓ Al menos un número
            </li>
            <li className={/[@$!%*?&#]/.test(password) ? 'text-green-500' : ''}>
              ✓ Al menos un carácter especial (@$!%*?&#)
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
