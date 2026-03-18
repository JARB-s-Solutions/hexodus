"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { AuthService } from '@/lib/auth'
import { ApiError } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    captcha: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Validaciones
  const validateForm = () => {
    if (!formData.username || !formData.password) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'Por favor completa todos los campos',
      })
      return false
    }

    if (formData.username.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'El usuario debe tener al menos 3 caracteres',
      })
      return false
    }

    if (formData.password.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'La contraseña debe tener al menos 8 caracteres',
      })
      return false
    }

    if (!formData.captcha) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'Por favor verifica que no eres un robot',
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await AuthService.login(
        formData.username,
        formData.password
      )

      const nombreUsuario = response.user.nombre_completo || response.user.username

      toast({
        variant: 'success',
        title: '¡Bienvenido!',
        description: `Hola ${nombreUsuario}, has iniciado sesión correctamente`,
      })

      // Redirigir al dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión. Intenta nuevamente.'

      if (error instanceof ApiError) {
        if (error.status === 401) {
          errorMessage = 'Usuario o contraseña incorrectos'
        } else if (error.status === 403) {
          errorMessage = 'Usuario inactivo. Contacta al administrador'
        } else if (error.status === 0) {
          errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión'
        } else if (error.message) {
          errorMessage = error.message
        }
      }

      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: errorMessage,
      })

      setFormData(prev => ({ ...prev, password: '' }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 text-white"
      style={{
        backgroundColor: '#121826',
        backgroundImage: 'radial-gradient(#2c2c30 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}
    >
      {/* Tarjeta de login */}
      <div 
        className="w-full max-w-md p-8 sm:p-10 rounded-2xl transform transition-all duration-300"
        style={{
          backgroundColor: '#1F2B36',
          border: '1px solid transparent',
          boxShadow: '0 0 20px rgba(0, 191, 255, 0.2)'
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="assets/images/icon.png" 
            alt="Logo del Sistema" 
            className="h-16 w-16" 
          />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-extrabold text-center mb-8 tracking-wider text-white">
          INICIAR SESIÓN
        </h1>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo de Usuario */}
          <div className="mb-5">
            <label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-400">
              Usuario o Correo Electrónico
            </label>
            <input
              id="username"
              type="text"
              placeholder="Ingresa tu usuario o correo"
              value={formData.username}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, username: e.target.value }))
              }
              disabled={isLoading}
              autoComplete="username"
              autoFocus
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-0 input-neon"
              style={{
                outline: 'none'
              }}
            />
          </div>

          {/* Campo de Contraseña */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-400">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, password: e.target.value }))
                }
                disabled={isLoading}
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 pr-12 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-0 input-neon"
                style={{
                  outline: 'none'
                }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-200 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Mínimo 8 caracteres, mayúscula, número y símbolo.
            </p>
          </div>

          {/* Captcha */}
          <div className="mb-6 flex items-center justify-start py-2">
            <div className="flex items-center space-x-3 bg-gray-900 p-3 rounded-lg border border-gray-700">
              <input
                type="checkbox"
                id="captcha"
                checked={formData.captcha}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, captcha: e.target.checked }))
                }
                disabled={isLoading}
                required
                className="h-5 w-5 rounded border-gray-600 bg-gray-800 cursor-pointer"
                style={{
                  accentColor: '#00BFFF'
                }}
              />
              <label htmlFor="captcha" className="text-sm font-medium text-gray-400 select-none cursor-pointer">
                No soy un robot
              </label>
            </div>
          </div>

          {/* Botón de submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 font-bold text-lg rounded-lg text-white uppercase tracking-widest transition duration-300 btn-primary"
            style={{
              backgroundColor: '#FF3B3B',
              boxShadow: '0 0 15px rgba(255, 59, 59, 0.7)'
            }}
          >
            {isLoading ? (
              <span>Cargando...</span>
            ) : (
              <span>INICIAR SESIÓN</span>
            )}
          </button>
        </form>

        {/* Enlace de recuperación */}
        <div className="mt-6 text-center">
          <Link
            href="/recuperar-password"
            className="text-sm font-medium transition duration-300 hover:underline"
            style={{
              color: '#00BFFF'
            }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  )
}
