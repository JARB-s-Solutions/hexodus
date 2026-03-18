# Sistema de Reconocimiento Facial

Sistema completo de captura y reconocimiento facial integrado con Face-API.js y Cloudinary.

## 📋 Índice

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Configuración](#configuración)
- [Uso](#uso)
- [API](#api)
- [Flujo de Datos](#flujo-de-datos)
- [Troubleshooting](#troubleshooting)

## ✨ Características

### Captura Facial
- ✅ Acceso a webcam con WebRTC
- ✅ Detección de rostro en tiempo real (Face-API.js)
- ✅ Generación de descriptores faciales (128 dimensiones)
- ✅ Vista previa con overlay visual
- ✅ Countdown antes de captura
- ✅ Manejo robusto de errores

### Almacenamiento
- ✅ Upload automático a Cloudinary
- ✅ Transformaciones de imagen automáticas
- ✅ Compresión y optimización
- ✅ Foto de perfil integrada

### Reconocimiento
- ✅ Comparación biométrica con distancia euclidiana
- ✅ Umbral de confianza configurable (60%)
- ✅ Múltiples socios soportados
- ✅ Validación de membresía

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE REGISTRO                        │
└─────────────────────────────────────────────────────────────┘

1. Usuario → Modal Captura Facial
2. Face-API.js → Detecta rostro + Genera descriptor (128 dims)
3. Canvas → Captura frame (base64 JPEG)
4. API Route → Upload a Cloudinary
5. Cloudinary → Retorna URL + public_id
6. Backend → Guarda:
   - fotoPerfilUrl (Cloudinary URL)
   - faceDescriptor (JSON array 128 números)
   - bioRostro (boolean)

┌─────────────────────────────────────────────────────────────┐
│                   FLUJO DE VALIDACIÓN                       │
└─────────────────────────────────────────────────────────────┘

1. Usuario → Presenta rostro a cámara
2. Face-API.js → Genera descriptor actual
3. Backend → Compara con todos los socios:
   - distance = euclideanDistance(current, saved)
   - if distance < 0.6: Match encontrado
4. Validación → Verifica membresía activa
5. Registro → Guarda timestamp de asistencia
```

## ⚙️ Configuración

### 1. Variables de Entorno

Copia `.env.example` a `.env.local` y configura:

```bash
# Cloudinary (obtén en https://cloudinary.com/console)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# Base de datos
DATABASE_URL=tu-database-url

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Modelos de Face-API.js

Los modelos ya están incluidos en `public/models/`:
- `tiny_face_detector_model-*` (189 KB)
- `face_landmark_68_model-*` (348 KB)
- `face_recognition_model-*` (6.3 MB)

Se cargan automáticamente al abrir el modal de captura.

### 3. Instalación

```bash
# Dependencias ya instaladas:
# - face-api.js@0.22.2
# - cloudinary@2.9.0

pnpm install
```

## 🚀 Uso

### Registro de Socio con Captura Facial

```tsx
import { SocioModal } from '@/components/socios/socio-modal'

function MiComponente() {
  return (
    <SocioModal
      open={true}
      onClose={() => {}}
      onSuccess={(nuevoSocio) => {
        // nuevoSocio incluye:
        // - fotoPerfilUrl: URL de Cloudinary
        // - faceDescriptor: Array<number> (128 dims)
        // - bioRostro: boolean
      }}
    />
  )
}
```

### Uso del Modal de Captura Directamente

```tsx
import { CapturaFacialModal } from '@/components/socios/captura-facial-modal'

function MiComponente() {
  const handleCaptura = async (imageData: string, faceEncoding?: number[]) => {
    // imageData: base64 JPEG
    // faceEncoding: Array de 128 números (descriptor facial)
    
    // Subir a Cloudinary
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData, type: 'profile' })
    })
    
    const { imageUrl, publicId } = await response.json()
    
    // Guardar en tu sistema
    console.log('Imagen:', imageUrl)
    console.log('Descriptor:', faceEncoding)
  }

  return (
    <CapturaFacialModal
      open={true}
      onClose={() => {}}
      onCapture={handleCaptura}
    />
  )
}
```

### Validación de Asistencia (Próximamente)

```tsx
import { compareFaceDescriptors, findBestMatch } from '@/lib/faceapi-config'

async function validarAsistencia(descriptorActual: number[]) {
  // 1. Obtener socios activos del backend
  const sociosActivos = await fetch('/api/socios?activos=true').then(r => r.json())
  
  // 2. Preparar descriptores guardados
  const savedDescriptors = sociosActivos.map((socio: any) => ({
    id: socio.id,
    name: socio.nombre,
    descriptor: JSON.parse(socio.faceDescriptor)
  }))
  
  // 3. Buscar mejor match
  const match = findBestMatch(descriptorActual, savedDescriptors, 0.6)
  
  if (match) {
    console.log(`✅ Acceso concedido: ${match.name}`)
    console.log(`Confianza: ${match.confidence}%`)
    
    // 4. Registrar asistencia
    await fetch('/api/asistencia', {
      method: 'POST',
      body: JSON.stringify({
        socioId: match.id,
        timestamp: new Date(),
        confidence: match.confidence
      })
    })
    
    return { success: true, socio: match }
  } else {
    console.log('❌ Rostro no reconocido')
    return { success: false }
  }
}
```

## 📡 API

### POST /api/upload-image

Sube una imagen a Cloudinary.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "type": "profile" | "biometric"
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://res.cloudinary.com/...",
  "publicId": "hexodus/socios/perfiles/abc123"
}
```

**Opciones de Transformación:**

- **profile**: 500x500, crop fill, gravity face, quality auto:good
- **biometric**: 800x800, crop limit, quality auto:best

### Utilidades de Face-API

```typescript
import {
  initializeFaceAPI,
  detectFaceDescriptor,
  compareFaceDescriptors,
  isSamePerson,
  getMatchConfidence,
  findBestMatch
} from '@/lib/faceapi-config'

// Inicializar modelos
await initializeFaceAPI()

// Detectar rostro y generar descriptor
const descriptor = await detectFaceDescriptor(videoElement)
// → Array<number> | null

// Comparar dos descriptores
const distance = compareFaceDescriptors(descriptor1, descriptor2)
// → number (0-1, menor = más similar)

// Verificar si son la misma persona
const match = isSamePerson(descriptor1, descriptor2, 0.6)
// → boolean

// Obtener porcentaje de confianza
const confidence = getMatchConfidence(descriptor1, descriptor2)
// → number (0-100)

// Encontrar mejor match en array
const bestMatch = findBestMatch(descriptorActual, savedDescriptors, 0.6)
// → { id, name, confidence, distance } | null
```

## 📊 Flujo de Datos

### Modelo de Datos - Socio

```typescript
interface Socio {
  // Datos básicos
  id: number
  nombre: string
  correo: string
  telefono: string
  
  // Biometría
  fotoPerfilUrl: string          // URL de Cloudinary
  faceDescriptor: string         // JSON string de Array<number>
  bioRostro: boolean
  bioHuella: boolean
  fingerprintTemplate?: string
  
  // Membresía
  membresiaId: number
  fechaInicio: string
  fechaFin: string
  activo: boolean
}
```

### Almacenamiento del Descriptor

```typescript
// Guardar en BD
await prisma.socio.create({
  data: {
    nombre: "Juan Pérez",
    faceDescriptor: JSON.stringify(descriptorArray), // [0.123, 0.456, ...]
    fotoPerfilUrl: "https://res.cloudinary.com/..."
  }
})

// Recuperar de BD
const socio = await prisma.socio.findUnique({ where: { id: 1 } })
const descriptor = JSON.parse(socio.faceDescriptor) // Array<number>
```

## 🔍 Troubleshooting

### Error: "No se pudieron cargar los modelos"

**Causa:** Los modelos de Face-API.js no están en `public/models/`

**Solución:**
```bash
cd public/models
ls -la  # Verificar archivos

# Deberías ver:
# - tiny_face_detector_model-*
# - face_landmark_68_model-*
# - face_recognition_model-*
```

### Error: "Permiso de cámara denegado"

**Causa:** El usuario no concedió permisos de cámara

**Solución:**
1. Chrome: Configuración → Privacidad → Configuración de sitio → Cámara
2. Safari: Preferencias → Sitios web → Cámara
3. Permitir acceso para `localhost` o tu dominio

### Error: "Error al subir la imagen"

**Causa:** Variables de entorno de Cloudinary no configuradas

**Solución:**
```bash
# Verificar .env.local
cat .env.local

# Debe contener:
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### La detección facial no funciona

**Problema:** El círculo nunca se pone verde

**Soluciones:**
1. **Iluminación:** Asegúrate de tener buena luz
2. **Posición:** Centra tu rostro en el círculo
3. **Calidad cámara:** Verifica que la webcam funcione correctamente
4. **Console logs:** Abre DevTools y verifica errores en consola

### El descriptor tiene valores incorrectos

**Problema:** El array no tiene 128 dimensiones

**Verificación:**
```typescript
console.log('Dimensiones:', faceEncoding?.length) // Debe ser 128
console.log('Tipo:', typeof faceEncoding?.[0])    // Debe ser 'number'
console.log('Rango:', Math.min(...faceEncoding), Math.max(...faceEncoding))
```

## 🎯 Mejores Prácticas

### Captura Facial
- ✅ Asegurar buena iluminación frontal
- ✅ Rostro centrado y completo en frame
- ✅ Expresión neutral
- ✅ Sin lentes de sol ni máscaras
- ✅ Cámara a nivel de ojos

### Almacenamiento
- ✅ Guardar descriptor como JSON string
- ✅ Usar Cloudinary para imágenes (no base64 en BD)
- ✅ Mantener backup de descriptores críticos
- ✅ Indexar por bioRostro=true para búsquedas rápidas

### Validación
- ✅ Umbral 0.6 para asistencia (60% confianza)
- ✅ Umbral 0.4 para registro (más estricto)
- ✅ Validar membresía activa antes de permitir acceso
- ✅ Registrar timestamp y confianza en logs

### Seguridad
- ✅ No exponer descriptores faciales en respuestas API públicas
- ✅ Encriptar faceDescriptor en BD (opcional pero recomendado)
- ✅ Rate limiting en endpoints de validación
- ✅ Logs de intentos de acceso
- ✅ GDPR: Obtener consentimiento para datos biométricos

## 📚 Referencias

- [Face-API.js Documentation](https://github.com/justadudewhohacks/face-api.js)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [WebRTC getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Distancia Euclidiana](https://es.wikipedia.org/wiki/Distancia_euclidiana)

## 🔒 Privacidad y GDPR

⚠️ **Importante:** Los datos biométricos (descriptores faciales) están clasificados como **datos sensibles** bajo GDPR.

### Requisitos:
1. **Consentimiento explícito:** Mostrar aviso claro antes de captura
2. **Derecho al olvido:** Permitir eliminar datos biométricos
3. **Portabilidad:** Exportar descriptores bajo solicitud
4. **Seguridad:** Encriptar en tránsito y en reposo
5. **Transparencia:** Documentar qué datos se almacenan y por qué

### Implementación Sugerida:

```tsx
// Checkbox de consentimiento en formulario
<Checkbox
  checked={consentsToFacialData}
  onCheckedChange={setConsentsToFacialData}
>
  Acepto que se almacenen y procesen mis datos biométricos
  faciales para control de acceso al gimnasio. Entiendo que
  puedo revocar este consentimiento en cualquier momento.
</Checkbox>
```

## 🎨 Personalización

### Cambiar Umbral de Confianza

```typescript
// lib/faceapi-config.ts
export const ATTENDANCE_THRESHOLD = 0.6 // Default
export const REGISTRATION_THRESHOLD = 0.4 // Más estricto
```

### Personalizar Transformaciones Cloudinary

```typescript
// lib/cloudinary.ts
export const PROFILE_IMAGE_OPTIONS = {
  folder: 'hexodus/socios/perfiles',
  transformation: [
    {
      width: 800,  // Aumentar resolución
      height: 800,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto:best', // Mejor calidad
      effect: 'sharpen:100' // Nitidez
    }
  ],
  format: 'png' // Cambiar formato
}
```

### Ajustar Frecuencia de Detección

```typescript
// components/socios/captura-facial-modal.tsx
const startFaceDetection = () => {
  detectionIntervalRef.current = setInterval(async () => {
    // Tu código de detección
  }, 300) // Cambiar de 500ms a 300ms para más frecuencia
}
```

---

## 🎉 ¡Listo!

El sistema de reconocimiento facial está completamente configurado y listo para usar.

**Próximos pasos sugeridos:**
1. Configurar variables de entorno de Cloudinary
2. Probar captura facial en navegador
3. Implementar endpoint de validación de asistencia
4. Agregar captura de huella digital (opcional)
5. Implementar sistema de logs de acceso
