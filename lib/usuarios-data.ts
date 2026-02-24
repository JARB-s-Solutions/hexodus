// ================================================
// USUARIOS DATA - Mock data & utility functions
// ================================================

export type Rol = "admin" | "moderador" | "empleado" | "invitado"
export type Estado = "activo" | "inactivo" | "bloqueado"
export type Departamento = "administracion" | "ventas" | "operaciones" | "marketing" | "soporte"

export interface Usuario {
  id: number
  nombre: string
  username: string
  email: string
  telefono: string
  rol: Rol
  departamento: Departamento
  estado: Estado
  fechaCreacion: string
  ultimoAcceso: string
  permisos: string[]
  sesionActiva: boolean
  activo: boolean
}

// Seeded random for SSR/CSR consistency
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function generateUsuarios(count: number = 24): Usuario[] {
  const rand = seededRandom(42)
  const nombres = [
    "Carlos Rodriguez", "Maria Gonzalez", "Juan Lopez", "Ana Martinez",
    "Luis Sanchez", "Laura Garcia", "Pedro Torres", "Carmen Ruiz",
    "Miguel Jimenez", "Elena Morales", "Roberto Hernandez", "Sofia Diaz",
  ]
  const usernames = [
    "crodriguez", "mgonzalez", "jlopez", "amartinez",
    "lsanchez", "lgarcia", "ptorres", "cruiz",
    "mjimenez", "emorales", "rhernandez", "sdiaz",
  ]
  const dominios = ["hexodus.com", "empresa.mx", "gym.com"]
  const roles: Rol[] = ["admin", "moderador", "empleado", "invitado"]
  const departamentos: Departamento[] = ["administracion", "ventas", "operaciones", "marketing", "soporte"]
  const estados: Estado[] = ["activo", "inactivo", "bloqueado"]

  const permisosPorRol: Record<Rol, string[]> = {
    admin: ["usuarios", "socios", "ventas", "inventario", "reportes", "configuracion"],
    moderador: ["socios", "ventas", "inventario", "reportes"],
    empleado: ["socios", "ventas"],
    invitado: ["socios"],
  }

  const usuarios: Usuario[] = []

  for (let i = 1; i <= count; i++) {
    const nombre = nombres[Math.floor(rand() * nombres.length)]
    const username = `${usernames[Math.floor(rand() * usernames.length)]}${i}`
    const dominio = dominios[Math.floor(rand() * dominios.length)]
    const rol: Rol = i <= 5 ? "admin" : roles[Math.floor(rand() * roles.length)]
    const departamento = departamentos[Math.floor(rand() * departamentos.length)]
    const estado: Estado = rand() > 0.15 ? "activo" : estados[Math.floor(rand() * estados.length)]

    const diasCreacion = Math.floor(rand() * 730)
    const fechaCreacion = new Date(Date.UTC(2026, 1, 22) - diasCreacion * 86400000)
    const diasAcceso = estado === "activo" ? Math.floor(rand() * 30) : Math.floor(rand() * 180)
    const ultimoAcceso = new Date(Date.UTC(2026, 1, 22) - diasAcceso * 86400000)

    const telefono = `+52 ${Math.floor(rand() * 900 + 100)} ${Math.floor(rand() * 900 + 100)} ${Math.floor(rand() * 9000 + 1000)}`

    usuarios.push({
      id: 2000 + i,
      nombre,
      username,
      email: `${username}@${dominio}`,
      telefono,
      rol,
      departamento,
      estado,
      fechaCreacion: fechaCreacion.toISOString().slice(0, 10),
      ultimoAcceso: ultimoAcceso.toISOString().slice(0, 10),
      permisos: permisosPorRol[rol],
      sesionActiva: estado === "activo" && rand() > 0.5,
      activo: true,
    })
  }

  return usuarios.sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
}

export const rolInfo: Record<Rol, { nombre: string; color: string; bg: string }> = {
  admin: { nombre: "Administrador", color: "text-[#FF3B3B]", bg: "bg-[#FF3B3B]/20" },
  moderador: { nombre: "Moderador", color: "text-[#A855F7]", bg: "bg-[#A855F7]/20" },
  empleado: { nombre: "Empleado", color: "text-accent", bg: "bg-accent/20" },
  invitado: { nombre: "Invitado", color: "text-muted-foreground", bg: "bg-muted-foreground/20" },
}

export const estadoInfo: Record<Estado, { nombre: string; color: string; bg: string }> = {
  activo: { nombre: "Activo", color: "text-[#22C55E]", bg: "bg-[#22C55E]/20" },
  inactivo: { nombre: "Inactivo", color: "text-muted-foreground", bg: "bg-muted-foreground/20" },
  bloqueado: { nombre: "Bloqueado", color: "text-[#EF4444]", bg: "bg-[#EF4444]/20" },
}

export const departamentoInfo: Record<Departamento, { nombre: string; color: string; bg: string }> = {
  administracion: { nombre: "Administracion", color: "text-[#FBB424]", bg: "bg-[#FBB424]/20" },
  ventas: { nombre: "Ventas", color: "text-[#22C55E]", bg: "bg-[#22C55E]/20" },
  operaciones: { nombre: "Operaciones", color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/20" },
  marketing: { nombre: "Marketing", color: "text-[#EC4899]", bg: "bg-[#EC4899]/20" },
  soporte: { nombre: "Soporte", color: "text-[#A855F7]", bg: "bg-[#A855F7]/20" },
}

export function formatFechaCorta(fecha: string) {
  const d = new Date(fecha + "T12:00:00Z")
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })
}
