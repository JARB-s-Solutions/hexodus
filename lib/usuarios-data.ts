// ================================================
// USUARIOS DATA - Types & utility functions
// ================================================

import type { UsuarioAPI, RolAPI } from './services/usuarios'

// Tipos para la UI (adaptados de la API)
export interface Rol {
  id: string
  nombre: string
  color: string | null
  icono: string | null
}

export interface Usuario {
  id: string
  nombre: string
  username: string
  email: string
  telefono: string | null
  rol: Rol
  activo: boolean
  fechaCreacion: string
  ultimoAcceso: string | null
}

// Función para transformar usuario de API a UI
export function transformarUsuarioAPI(usuarioAPI: UsuarioAPI): Usuario {
  return {
    id: usuarioAPI.id,
    nombre: usuarioAPI.nombre,
    username: usuarioAPI.username,
    email: usuarioAPI.email,
    telefono: usuarioAPI.telefono,
    rol: usuarioAPI.rol,
    activo: usuarioAPI.activo,
    fechaCreacion: usuarioAPI.fechaCreacion,
    ultimoAcceso: usuarioAPI.ultimoAcceso,
  }
}

// Información de estados para la UI
export const estadoInfo = {
  activo: { nombre: "Activo", color: "text-[#22C55E]", bg: "bg-[#22C55E]/20" },
  inactivo: { nombre: "Inactivo", color: "text-muted-foreground", bg: "bg-muted-foreground/20" },
}

// Función para formatear fecha
export function formatFechaCorta(fecha: string | null) {
  if (!fecha) return "N/A"
  const d = new Date(fecha)
  return d.toLocaleDateString("es-MX", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric" 
  })
}

// Función para formatear fecha y hora
export function formatFechaHora(fecha: string | null) {
  if (!fecha) return "N/A"
  const d = new Date(fecha)
  return d.toLocaleString("es-MX", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

