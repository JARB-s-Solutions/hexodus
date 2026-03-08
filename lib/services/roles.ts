/**
 * Servicio de Gestión de Roles y Permisos
 * Maneja la lógica de roles, permisos y asignaciones
 */

import type { Rol, AsignacionRol, ConjuntoPermisos, Modulo } from '@/lib/types/permissions'
import { ROLES_PREDEFINIDOS, esRolDeSistema } from '@/lib/roles/roles-predefinidos'

// ============================================================================
// CONSTANTES
// ============================================================================

const STORAGE_KEY_ROLES = 'hexodus_roles'
const STORAGE_KEY_ASIGNACIONES = 'hexodus_asignaciones_roles'

// ============================================================================
// SERVICIO DE ROLES
// ============================================================================

export class RolesService {
  /**
   * Obtener todos los roles (predefinidos + personalizados)
   */
  static async obtenerRoles(): Promise<Rol[]> {
    try {
      const rolesCustom = this.obtenerRolesCustomizados()
      return [...ROLES_PREDEFINIDOS, ...rolesCustom]
    } catch (error) {
      console.error('Error obteniendo roles:', error)
      return ROLES_PREDEFINIDOS
    }
  }

  /**
   * Obtener un rol por ID
   */
  static async obtenerRol(rolId: string): Promise<Rol | null> {
    const roles = await this.obtenerRoles()
    return roles.find(rol => rol.id === rolId) || null
  }

  /**
   * Crear un nuevo rol personalizado
   */
  static async crearRol(rolData: Omit<Rol, 'id' | 'fechaCreacion' | 'esSistema'>): Promise<Rol> {
    const roles = this.obtenerRolesCustomizados()
    
    const nuevoRol: Rol = {
      ...rolData,
      id: `custom_${Date.now()}`,
      esSistema: false,
      fechaCreacion: new Date().toISOString()
    }
    
    roles.push(nuevoRol)
    this.guardarRolesCustomizados(roles)
    
    console.log('✅ Rol creado:', nuevoRol.nombre)
    return nuevoRol
  }

  /**
   * Actualizar un rol existente (solo personalizados)
   */
  static async actualizarRol(rolId: string, cambios: Partial<Rol>): Promise<Rol> {
    if (esRolDeSistema(rolId)) {
      throw new Error('No se pueden modificar los roles del sistema')
    }

    const roles = this.obtenerRolesCustomizados()
    const index = roles.findIndex(r => r.id === rolId)
    
    if (index === -1) {
      throw new Error('Rol no encontrado')
    }

    roles[index] = {
      ...roles[index],
      ...cambios,
      id: rolId, // Mantener el ID original
      fechaModificacion: new Date().toISOString()
    }
    
    this.guardarRolesCustomizados(roles)
    
    console.log('✅ Rol actualizado:', roles[index].nombre)
    return roles[index]
  }

  /**
   * Eliminar un rol personalizado
   */
  static async eliminarRol(rolId: string): Promise<void> {
    if (esRolDeSistema(rolId)) {
      throw new Error('No se pueden eliminar los roles del sistema')
    }

    // Verificar que no haya usuarios con este rol
    const asignaciones = this.obtenerAsignaciones()
    const tieneUsuarios = asignaciones.some(a => a.rolId === rolId)
    
    if (tieneUsuarios) {
      throw new Error('No se puede eliminar un rol que tiene usuarios asignados')
    }

    const roles = this.obtenerRolesCustomizados()
    const rolesFiltrados = roles.filter(r => r.id !== rolId)
    
    this.guardarRolesCustomizados(rolesFiltrados)
    console.log('✅ Rol eliminado')
  }

  /**
   * Asignar un rol a un usuario
   */
  static async asignarRol(usuarioId: string, rolId: string, asignadoPor: string): Promise<AsignacionRol> {
    const rol = await this.obtenerRol(rolId)
    
    if (!rol) {
      throw new Error('Rol no encontrado')
    }

    const asignaciones = this.obtenerAsignaciones()
    
    // Remover asignación anterior si existe
    const asignacionesFiltradas = asignaciones.filter(a => a.usuarioId !== usuarioId)
    
    const nuevaAsignacion: AsignacionRol = {
      usuarioId,
      rolId,
      asignadoPor,
      fechaAsignacion: new Date().toISOString()
    }
    
    asignacionesFiltradas.push(nuevaAsignacion)
    this.guardarAsignaciones(asignacionesFiltradas)
    
    console.log(`✅ Rol "${rol.nombre}" asignado al usuario ${usuarioId}`)
    return nuevaAsignacion
  }

  /**
   * Obtener el rol de un usuario
   */
  static async obtenerRolDeUsuario(usuarioId: string): Promise<Rol | null> {
    const asignaciones = this.obtenerAsignaciones()
    const asignacion = asignaciones.find(a => a.usuarioId === usuarioId)
    
    if (!asignacion) {
      return null
    }
    
    return await this.obtenerRol(asignacion.rolId)
  }

  /**
   * Verificar si un usuario tiene un permiso específico
   */
  static async tienePermiso(
    usuarioId: string, 
    modulo: Modulo, 
    accion: string
  ): Promise<boolean> {
    const rol = await this.obtenerRolDeUsuario(usuarioId)
    
    if (!rol) {
      return false
    }

    // Administradores tienen acceso a todo
    if (rol.esAdministrador) {
      return true
    }

    const permisosModulo = rol.permisos[modulo] as any
    
    if (!permisosModulo) {
      return false
    }

    return permisosModulo[accion] === true
  }

  /**
   * Obtener todos los permisos de un usuario
   */
  static async obtenerPermisos(usuarioId: string): Promise<ConjuntoPermisos | null> {
    const rol = await this.obtenerRolDeUsuario(usuarioId)
    return rol ? rol.permisos : null
  }

  // ============================================================================
  // MÉTODOS PRIVADOS - localStorage
  // ============================================================================

  private static obtenerRolesCustomizados(): Rol[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ROLES)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error leyendo roles:', error)
      return []
    }
  }

  private static guardarRolesCustomizados(roles: Rol[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles))
    } catch (error) {
      console.error('Error guardando roles:', error)
      throw new Error('No se pudieron guardar los roles')
    }
  }

  private static obtenerAsignaciones(): AsignacionRol[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ASIGNACIONES)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error leyendo asignaciones:', error)
      return []
    }
  }

  private static guardarAsignaciones(asignaciones: AsignacionRol[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ASIGNACIONES, JSON.stringify(asignaciones))
    } catch (error) {
      console.error('Error guardando asignaciones:', error)
      throw new Error('No se pudieron guardar las asignaciones')
    }
  }
}

// ============================================================================
// FUNCIONES HELPER PARA USAR EN COMPONENTES
// ============================================================================

/**
 * Verificar si el usuario actual tiene acceso a un módulo
 */
export async function puedeAccederModulo(usuarioId: string, modulo: Modulo): Promise<boolean> {
  return await RolesService.tienePermiso(usuarioId, modulo, 'ver')
}

/**
 * Verificar si el usuario puede realizar una acción
 */
export async function puedeRealizarAccion(
  usuarioId: string, 
  modulo: Modulo, 
  accion: string
): Promise<boolean> {
  return await RolesService.tienePermiso(usuarioId, modulo, accion)
}
