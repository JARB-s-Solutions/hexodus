// ================================================
// MOCK API - SIMULACIÓN DE BACKEND PARA DESARROLLO
// ================================================
// Este archivo simula las respuestas del backend
// Útil para desarrollo y pruebas sin backend real

import type { LoginResponse, ForgotPasswordResponse, User } from './types/auth'

// Usuarios de prueba
const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@hexodus.com',
    nombre_completo: 'Administrador General',
    rol: 'admin',
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
    last_login: new Date().toISOString(),
  },
  {
    id: '2',
    username: 'staff',
    email: 'staff@hexodus.com',
    nombre_completo: 'Personal del Gimnasio',
    rol: 'staff',
    activo: true,
    created_at: '2024-01-15T00:00:00Z',
    last_login: new Date().toISOString(),
  },
  {
    id: '3',
    username: 'usuario',
    email: 'usuario@hexodus.com',
    nombre_completo: 'Usuario de Prueba',
    rol: 'usuario',
    activo: true,
    created_at: '2024-02-01T00:00:00Z',
  },
]

// Contraseña de prueba para todos: "Admin123@"
const MOCK_PASSWORD = 'Admin123@'

/**
 * Simula delay de red
 */
function delay(ms: number = 800): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Genera un token JWT simulado
 */
function generateMockToken(userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      iat: Date.now(),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días
    })
  )
  const signature = btoa('mock-signature-' + userId)
  return `${header}.${payload}.${signature}`
}

/**
 * Mock: Login
 */
export async function mockLogin(
  username: string,
  password: string
): Promise<LoginResponse> {
  await delay()

  // Buscar usuario
  const user = MOCK_USERS.find(
    u =>
      (u.username === username || u.email === username) && u.activo
  )

  // Usuario no encontrado o inactivo
  if (!user) {
    throw {
      status: 401,
      message: 'Usuario o contraseña incorrectos',
    }
  }

  // Verificar contraseña
  if (password !== MOCK_PASSWORD) {
    throw {
      status: 401,
      message: 'Usuario o contraseña incorrectos',
    }
  }

  // Usuario inactivo
  if (!user.activo) {
    throw {
      status: 403,
      message: 'Usuario inactivo. Contacta al administrador',
    }
  }

  // Generar token
  const token = generateMockToken(user.id)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  return {
    token,
    user: {
      ...user,
      last_login: new Date().toISOString(),
    },
    expires_at: expiresAt,
  }
}

/**
 * Mock: Forgot Password
 */
export async function mockForgotPassword(
  email: string
): Promise<ForgotPasswordResponse> {
  await delay()

  // Buscar usuario por email
  const user = MOCK_USERS.find(u => u.email === email)

  if (!user) {
    throw {
      status: 404,
      message: 'No existe una cuenta con ese correo electrónico',
    }
  }

  return {
    message: 'Se ha enviado un correo con instrucciones para restablecer tu contraseña',
  }
}

/**
 * Mock: Logout
 */
export async function mockLogout(): Promise<void> {
  await delay(300)
  // En un sistema real, invalidaría el token en el servidor
  return
}

/**
 * Mock: Get Current User (verificar token)
 */
export async function mockGetMe(token: string): Promise<User> {
  await delay(300)

  try {
    // Decodificar token (simplificado)
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Token inválido')
    }

    const payload = JSON.parse(atob(parts[1]))
    const userId = payload.sub

    // Buscar usuario
    const user = MOCK_USERS.find(u => u.id === userId)
    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    return user
  } catch (error) {
    throw {
      status: 401,
      message: 'Token inválido o expirado',
    }
  }
}

// ================================================
// INSTRUCCIONES DE USO
// ================================================

/**
 * Para usar el Mock API en desarrollo:
 * 
 * 1. En lib/api.ts, importa las funciones mock:
 *    import { mockLogin, mockForgotPassword, mockLogout } from './mock-api'
 * 
 * 2. En lib/auth.ts, reemplaza las llamadas a apiPost con las funciones mock:
 *    
 *    // En lugar de:
 *    const response = await apiPost<LoginResponse>(API_ENDPOINTS.LOGIN, credentials)
 *    
 *    // Usa:
 *    const response = await mockLogin(username, password)
 * 
 * 3. Usuarios de prueba:
 *    - admin@hexodus.com / Admin123@  (Administrador)
 *    - staff@hexodus.com / Admin123@  (Personal)
 *    - usuario@hexodus.com / Admin123@ (Usuario)
 * 
 * 4. Para volver al backend real, simplemente revierte los cambios
 */
