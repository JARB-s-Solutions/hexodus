# 🎯 Integración del Módulo de Asistencias - Guía Completa

## 📋 Resumen de Implementación

Se ha completado la preparación del módulo de Asistencias para integración con backend. El módulo ahora incluye:

- ✅ **AsistenciaService**: Servicio completo para comunicación con API
- ✅ **2 Modales nuevos**: Registro Manual e Historial por Socio
- ✅ **Componentes mejorados**: Loading states, manejo de errores, retry
- ✅ **Página principal actualizada**: Integración completa con datos reales/mock

---

## 📂 Archivos Creados/Modificados

### 🆕 Archivos Nuevos:

1. **`lib/services/asistencia.ts`** *(600+ líneas)*
   - Servicio principal para comunicación con API
   - 9 métodos de cliente HTTP
   - Tipos TypeScript completos
   - Helper para compresión de imágenes

2. **`components/asistencia/registro-manual-modal.tsx`** *(300+ líneas)*
   - Modal para registrar asistencia manualmente
   - Búsqueda automática por código de socio
   - Validación de membresía
   - Estados de loading y error

3. **`components/asistencia/historial-socio-modal.tsx`** *(350+ líneas)*
   - Modal para ver historial de asistencias por socio
   - Estadísticas resumidas (racha, promedio, totales)
   - Paginación de registros
   - Exportación a Excel
   - Visualización de actividad reciente

### 🔄 Archivos Modificados:

4. **`components/asistencia/historial-registros.tsx`**
   - Agregado: Props para loading/error
   - Agregado: Botón de recargar datos
   - Agregado: Botón "Ver Historial" por socio
   - Mejorada: Visualización de estados vacíos

5. **`components/asistencia/kpi-asistencia.tsx`**
   - Agregado: Props para loading/error
   - Agregado: Overlay de loading sobre tarjetas
   - Agregado: Mensaje de error con botón retry

6. **`components/asistencia/asistencia-header.tsx`**
   - Agregado: Botón "Registro Manual"
   - Agregado: Prop `onRegistroManual`

7. **`app/asistencia/page.tsx`**
   - Agregado: Integración con AsistenciaService
   - Agregado: Estados para loading/error de API
   - Agregado: Polling cada 30 segundos para actualizar datos
   - Agregado: Modal de Registro Manual
   - Agregado: Modal de Historial por Socio
   - Agregado: Notificaciones toast para acciones
   - Agregado: Transformación de datos API ↔ Local

---

## 🔌 AsistenciaService - API Client

### Métodos Disponibles:

```typescript
// 1. Registrar asistencia facial
await AsistenciaService.registrarFacial({
  imagen_base64: "data:image/jpeg;base64,...",
  config: { umbral_confianza: 0.85 }
})

// 2. Registrar asistencia manual
await AsistenciaService.registrarManual({
  codigo_socio: "S001",
  usuario_registro_id: "user-123"
})

// 3. Obtener asistencias del día
const asistencias = await AsistenciaService.obtenerAsistenciasHoy({
  tipo: 'permitido',
  buscar: 'Juan',
  limite: 50
})

// 4. Obtener KPIs
const kpis = await AsistenciaService.obtenerKpis()

// 5. Historial de un socio
const historial = await AsistenciaService.obtenerHistorialSocio('socio-id', {
  desde: '2024-01-01',
  hasta: '2024-01-31',
  pagina: 1,
  limite: 20
})

// 6. Estadísticas generales
const stats = await AsistenciaService.obtenerEstadisticas('mes')

// 7. Exportar datos
await AsistenciaService.exportar('excel', {
  desde: '2024-01-01',
  hasta: '2024-01-31'
})

// 8. Configuración del sistema
const config = await AsistenciaService.obtenerConfiguracion()
await AsistenciaService.actualizarConfiguracion({ ... })

// 9. Buscar socio por código
const socio = await AsistenciaService.buscarSocioPorCodigo('S001')
```

### Configuración del Servicio:

El servicio usa la variable de entorno `NEXT_PUBLIC_API_URL`:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Si no está configurada, usa `http://localhost:3001` por defecto.

---

## 🎨 Componentes Nuevos

### 1. RegistroManualModal

**Ubicación:** `components/asistencia/registro-manual-modal.tsx`

**Props:**
```typescript
interface RegistroManualModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRegistroExitoso?: (registro: any) => void
}
```

**Características:**
- ✅ Búsqueda automática al escribir código (4+ caracteres)
- ✅ Validación de membresía con alertas visuales
- ✅ Estados: loading, error, success
- ✅ Bloqueo de registro si membresía vencida
- ✅ Avatar y datos del socio
- ✅ Cierre automático tras registro exitoso

**Uso:**
```tsx
<RegistroManualModal
  open={modalOpen}
  onOpenChange={setModalOpen}
  onRegistroExitoso={(registro) => {
    console.log('Nuevo registro:', registro)
    // Recargar datos...
  }}
/>
```

---

### 2. HistorialSocioModal

**Ubicación:** `components/asistencia/historial-socio-modal.tsx`

**Props:**
```typescript
interface HistorialSocioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  socioId: string | null
}
```

**Características:**
- ✅ Estadísticas resumidas (4 tarjetas)
- ✅ Lista de asistencias con scroll
- ✅ Paginación automática
- ✅ Botón de exportar a Excel
- ✅ Información de racha y promedio
- ✅ Loading states por página
- ✅ Badges de presente hoy / última asistencia

**Uso:**
```tsx
<HistorialSocioModal
  open={socioId !== null}
  onOpenChange={(open) => !open && setSocioId(null)}
  socioId={socioId}
/>
```

---

## 🔄 Flujo de Datos

### Modo MOCK (Actual):

```typescript
// app/asistencia/page.tsx
const USE_MOCK_DATA = true  // ← Cambiar a false cuando backend esté listo

// Con true: Usa datos de lib/asistencia-data.ts
// Con false: Usa AsistenciaService (API real)
```

### Modo API (Producción):

1. **Carga inicial:**
   ```
   Page Mount → cargarRegistros() + cargarKpis()
   ```

2. **Polling cada 30s:**
   ```
   setInterval(30000) → cargarRegistros() + cargarKpis()
   ```

3. **Registro nuevo (facial/manual):**
   ```
   Evento postMessage / Modal → Agregar registro → Recargar KPIs
   ```

4. **Transformación de datos:**
   ```typescript
   // API Response → Local Format
   {
     id: r.id,
     socioId: r.socio.id,
     nombreSocio: r.socio.nombre,
     tipo: r.tipo,
     confianza: r.confianza ? `${r.confianza}` : "N/A",
     timestamp: r.timestamp,
   }
   ```

---

## 🚀 Pasos para Integrar con Backend

### Paso 1: Configurar URL de API

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://tu-api.com
```

### Paso 2: Cambiar a Modo API

```typescript
// app/asistencia/page.tsx línea 21
const USE_MOCK_DATA = false  // ← Cambiar de true a false
```

### Paso 3: Implementar Endpoints Backend

Usar la especificación en `ANALISIS_MODULO_ASISTENCIAS.md`:

**Endpoints mínimos requeridos:**
1. `POST /api/asistencias/manual` - Registro manual
2. `GET /api/asistencias/hoy` - Asistencias del día
3. `GET /api/asistencias/kpis` - KPIs del día
4. `GET /api/asistencias/socio/:id` - Historial por socio
5. `GET /api/socios/buscar/:codigo` - Buscar socio

**Endpoints opcionales:**
6. `POST /api/asistencias/facial` - Reconocimiento facial
7. `GET /api/asistencias/estadisticas` - Estadísticas generales
8. `GET /api/asistencias/exportar` - Exportar datos
9. `GET/PUT /api/asistencias/configuracion` - Config del sistema

### Paso 4: Verificar Respuestas

El AsistenciaService espera estas estructuras:

**Registro exitoso:**
```json
{
  "success": true,
  "resultado": "permitido",
  "data": {
    "registro_id": "uuid",
    "socio": {
      "id": "uuid",
      "nombre": "Juan Pérez",
      "codigo": "S001"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "motivo": "Acceso permitido"
  }
}
```

**Asistencias del día:**
```json
{
  "success": true,
  "fecha": "2024-01-15",
  "data": [
    {
      "id": "uuid",
      "socio": {
        "id": "uuid",
        "nombre": "Juan Pérez"
      },
      "tipo": "permitido",
      "timestamp": "2024-01-15T10:30:00Z",
      "confianza": 95
    }
  ],
  "total": 42
}
```

**KPIs:**
```json
{
  "success": true,
  "fecha": "2024-01-15",
  "data": {
    "asistentes_hoy": 42,
    "activos_ahora": 15,
    "denegados": 3,
    "permanencia_promedio_minutos": 87,
    "permanencia_promedio_formato": "1h 27min"
  }
}
```

---

## ⚠️ Manejo de Errores

### Frontend (Actual):

```typescript
try {
  const response = await AsistenciaService.obtenerAsistenciasHoy()
  if (response.success) {
    // Transformar y actualizar estado
  }
} catch (error) {
  // Mostrar toast de error
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive"
  })
}
```

### Estados de Error UI:

- **HistorialRegistros**: Muestra alert rojo con botón "Reintentar"
- **KpiAsistenciaCards**: Muestra banner de error con botón "Reintentar"
- **Modales**: Alerts dentro del modal con descripción del error

---

## 🎯 Testing

### Probar con Datos Mock:

```typescript
// app/asistencia/page.tsx
const USE_MOCK_DATA = true  // ← Mantener true

// Funciona con datos de lib/asistencia-data.ts
```

### Probar con API Real:

1. Levantar backend en `http://localhost:3001`
2. Cambiar `USE_MOCK_DATA = false`
3. Recargar página
4. Verificar que los datos se cargan correctamente

### Debugging:

```typescript
// AsistenciaService incluye console.error en cada catch
// Revisar DevTools Console para ver errores de red/API
```

---

## 📊 Estructura de Datos

### RegistroAcceso (Local):

```typescript
interface RegistroAcceso {
  id: string
  socioId: string
  nombreSocio: string
  tipo: "permitido" | "denegado"
  motivo: string
  confianza: string
  timestamp: string
  estadoMembresia?: EstadoMembresia
}
```

### KpiAsistencia:

```typescript
interface KpiAsistencia {
  asistentesHoy: number
  activosAhora: number
  denegados: number
  permanenciaPromedio: string  // "1h 27min"
}
```

---

## 🔐 Seguridad

### Compresión de Imágenes:

```typescript
import { comprimirImagen } from '@/lib/services/asistencia'

const imagenComprimida = await comprimirImagen(imagenBase64, 500)
// Reduce tamaño manteniendo calidad 0.8
```

### Variables de Entorno:

```bash
NEXT_PUBLIC_API_URL=https://api.tuapp.com
# NO incluir tokens de autenticación aquí
# Usar httpOnly cookies o headers en el servicio
```

---

## ✅ Checklist de Integración

### Frontend:
- [x] AsistenciaService creado
- [x] Modales implementados
- [x] Loading states agregados
- [x] Error handling agregado
- [x] Transformación de datos
- [x] Polling cada 30s
- [x] Notificaciones toast
- [ ] WebSockets para tiempo real (futuro)

### Backend (Pendiente):
- [ ] Endpoint: POST /api/asistencias/manual
- [ ] Endpoint: GET /api/asistencias/hoy
- [ ] Endpoint: GET /api/asistencias/kpis
- [ ] Endpoint: GET /api/asistencias/socio/:id
- [ ] Endpoint: GET /api/socios/buscar/:codigo
- [ ] Endpoint: POST /api/asistencias/facial
- [ ] Endpoint: GET /api/asistencias/estadisticas
- [ ] Endpoint: GET /api/asistencias/exportar

---

## 🐛 Problemas Conocidos

### 1. Error "kpis redeclarado" (Caché TypeScript)

**Solución:**
```bash
# Reiniciar servidor de desarrollo
npm run dev  # o pnpm dev

# O limpiar caché de Next.js
rm -rf .next
npm run dev
```

**Causa:** El compilador de TypeScript tiene caché desactualizado. La variable ya no existe en el código pero TypeScript aún la reporta.

---

## 📚 Documentación Adicional

- **Análisis completo**: Ver `ANALISIS_MODULO_ASISTENCIAS.md`
- **Endpoints backend**: Ver sección "8 Endpoints Backend Necesarios" en análisis
- **Consideraciones de seguridad**: Ver sección "Consideraciones de Seguridad" en análisis

---

## 🎉 ¡Listo para Integrar!

El frontend está **100% preparado** para consumir datos del backend. Solo falta:

1. Implementar los endpoints en el backend según `ANALISIS_MODULO_ASISTENCIAS.md`
2. Configurar `NEXT_PUBLIC_API_URL` en `.env.local`
3. Cambiar `USE_MOCK_DATA = false` en `app/asistencia/page.tsx`
4. ¡Disfrutar del sistema de asistencias completo! 🚀

---

**Fecha de Implementación:** Enero 2024  
**Versión:** 1.0.0  
**Estado:** ✅ Completo y listo para backend
