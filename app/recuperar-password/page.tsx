"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { AuthService } from '@/lib/auth'
import { ApiError } from '@/lib/api'

export default function RecuperarPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'Por favor ingresa tu correo electrónico',
      })
      return
    }

    if (!validateEmail(email)) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'Por favor ingresa un correo electrónico válido',
      })
      return
    }

    setIsLoading(true)

    try {
      await AuthService.forgotPassword(email)

      setIsEmailSent(true)

      toast({
        variant: 'success',
        title: '¡Correo enviado!',
        description: 'Revisa tu bandeja de entrada para recuperar tu contraseña',
      })
    } catch (error) {
      let errorMessage = 'No se pudo enviar el correo. Intenta nuevamente.'

      if (error instanceof ApiError) {
        if (error.status === 404) {
          errorMessage = 'No existe una cuenta asociada a este correo electrónico'
        } else if (error.status === 0) {
          errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión'
        } else if (error.message) {
          errorMessage = error.message
        }
      }

      toast({
        variant: 'destructive',
        title: 'Error al enviar correo',
        description: errorMessage,
      })
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
      {/* Tarjeta */}
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
        <h1 className="text-3xl font-extrabold text-center mb-4 tracking-wider text-white">
          RECUPERAR CONTRASEÑA
        </h1>

        {!isEmailSent ? (
          <>
            <p className="text-center text-gray-400 mb-8 text-sm">
              Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña
            </p>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Campo de Email */}
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-400">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-0 input-neon"
                  style={{
                    outline: 'none'
                  }}
                />
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
                  <span>Enviando...</span>
                ) : (
                  <span>ENVIAR INSTRUCCIONES</span>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            {/* Ícono de éxito */}
            <div className="flex justify-center mb-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(0, 191, 255, 0.1)',
                  border: '2px solid #00BFFF'
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#00BFFF" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
              ¡Correo enviado!
            </h2>
            
            <p className="text-gray-400 text-sm mb-6">
              Hemos enviado las instrucciones para recuperar tu contraseña a <strong className="text-white">{email}</strong>
            </p>

            <p className="text-gray-500 text-xs mb-6">
              Si no recibes el correo en unos minutos, revisa tu carpeta de spam o correo no deseado.
            </p>
          </div>
        )}

        {/* Enlace de volver */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-medium transition duration-300 hover:underline inline-flex items-center gap-2"
            style={{
              color: '#00BFFF'
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
