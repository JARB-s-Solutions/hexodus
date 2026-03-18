import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera iniciales a partir de un nombre completo
 * 
 * @param nombre - Nombre completo del socio
 * @returns Iniciales en mayúsculas (máximo 2 caracteres)
 * 
 * @example
 * getIniciales("Juan") // → "JU"
 * getIniciales("Juan Pérez") // → "JP"
 * getIniciales("Juan Pérez García") // → "JP"
 * getIniciales("María") // → "MA"
 * getIniciales("") // → "SO"
 * getIniciales(null) // → "SO"
 * getIniciales(undefined) // → "SO"
 * getIniciales("   ") // → "SO"
 */
export function getIniciales(nombre?: string | null): string {
  // Valor por defecto si no hay nombre
  if (!nombre || nombre.trim() === '') {
    return 'SO'
  }

  // Limpiar y dividir el nombre
  const palabras = nombre
    .trim()
    .split(/\s+/) // Dividir por uno o más espacios
    .filter(p => p.length > 0) // Filtrar palabras vacías

  // Si no hay palabras después de limpiar
  if (palabras.length === 0) {
    return 'SO'
  }

  // Si solo hay una palabra, tomar las primeras 2 letras
  if (palabras.length === 1) {
    const palabra = palabras[0].toUpperCase()
    return palabra.length >= 2 ? palabra.slice(0, 2) : palabra
  }

  // Si hay 2 o más palabras, tomar la primera letra de las primeras 2 palabras
  return palabras
    .slice(0, 2)
    .map(palabra => palabra[0])
    .join('')
    .toUpperCase()
}
