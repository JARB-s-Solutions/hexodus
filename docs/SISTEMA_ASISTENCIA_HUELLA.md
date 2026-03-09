# 🖐️ Sistema de Asistencia con Huella Dactilar - Guía de Implementación

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Frontend](#componentes-frontend)
4. [API Backend (Pendiente)](#api-backend-pendiente)
5. [Flujo de Usuario](#flujo-de-usuario)
6. [Estados del Sistema](#estados-del-sistema)
7. [Testing](#testing)
8. [Despliegue](#despliegue)

---

## 🎯 Resumen Ejecutivo

Se ha implementado un **sistema completo de registro de asistencias mediante huella dactilar** para el gimnasio Hexodus, que incluye:

### ✅ Implementado (Frontend)

- ✅ Interfaz de kiosko fullscreen con diseño moderno
- ✅ Integración con lector Digital Persona U.are.U 4500
- ✅ 7 estados visuales distintos (idle, scanning, success, warning, error, etc.)
- ✅ Animaciones CSS personalizadas
- ✅ Feedback auditivo para cada acción
- ✅ Auto-reset para operación continua
- ✅ Manejo robusto de errores
- ✅ Diseño responsive y accesible
- ✅ Indicadores de tiempo real (reloj, countdown)
- ✅ Información detallada del socio post-validación

### ❌ Pendiente (Backend)

- ❌ Endpoint `/api/asistencia/validar-huella` (POST)
- ❌ Algoritmo de comparación de huellas dactilares
- ❌ Almacenamiento de templates en base de datos
- ❌ Sistema de scoring y threshold de confianza

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                   FLUJO COMPLETO                         │
└─────────────────────────────────────────────────────────┘

1. Usuario llega al kiosk
2. Navegador carga: /asistencia/huella
3. Componente React inicializa lector Digital Persona
4. Sistema espera dedo en sensor (estado: idle)
5. Dedo detectado → Captura huella (estado: scanning)
6. Template generado → Envía a backend (estado: validating)
7. Backend compara con BD → Responde con resultado
8. Frontend muestra resultado:
   ├─ success: Acceso permitido (membresía vigente)
   ├─ warning: Acceso permitido (membresía por vencer)
   └─ error: Acceso denegado (huella no reconocida / vencida)
9. Auto-reset en 5-7 segundos → Vuelve a estado idle
```

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js 16 + React 19 + TypeScript |
| **UI Components** | Radix UI + Tailwind CSS |
| **Hardware SDK** | @digitalpersona/devices |
| **Backend** | Node.js + Express (Hexodus API) |
| **Base de Datos** | PostgreSQL (campo: fingerprint_template) |
| **Deployment** | Render (backend), Vercel/Netlify (frontend) |

---

## 🎨 Componentes Frontend

### Archivo Principal

**Ubicación**: `/app/asistencia/huella/page.tsx`

**Tamaño**: ~800 líneas de código

**Componentes internos**:
- `AsistenciaHuellaPage` (Componente principal)
- `PantallaIdle` - Estado de espera
- `PantallaNoDevice` - Lector no conectado
- `PantallaScanning` - Capturando huella
- `PantallaSuccess` - Acceso permitido
- `PantallaWarning` - Advertencia de vencimiento
- `PantallaError` - Acceso denegado

### CSS Personalizado

**Ubicación**: `/app/globals.css`

**Animaciones agregadas**:
```css
.animate-pulse-slow      /* Pulso suave para ícono en reposo */
.animate-scan            /* Línea de escaneo que se mueve */
.animate-bounce-once     /* Rebote único al mostrar éxito */
.animate-shake           /* Sacudida al mostrar error */
.animate-fade-in         /* Transición suave de entrada */
```

### Sonidos

**Ubicación**: `/public/sounds/`

| Archivo | Estado | Uso |
|---------|--------|-----|
| `success.wav` | ✅ Existe | Huella reconocida, acceso permitido |
| `warning.wav` | ❌ Crear | Membresía próxima a vencer |
| `error.wav` | ❌ Crear | Acceso denegado |
| `beep-start.wav` | ❌ Crear | Dedo detectado en sensor |

Ver guía completa: `/docs/AUDIO_ASISTENCIAS_HUELLA.md`

---

## 🔌 API Backend (PENDIENTE)

### Endpoint Requerido

```typescript
POST /api/asistencia/validar-huella
```

### Request Body

```json
{
  "fingerprintSample": "base64_encoded_template_from_digitalpersona",
  "tipo": "IN",              // "IN" o "OUT"
  "kioskId": "KIOSK-01"      // ID del dispositivo de entrada
}
```

### Response - Éxito (Huella Reconocida)

```json
{
  "success": true,
  "message": "¡Bienvenido, Brayan!",
  "data": {
    "socio": {
      "id": 123,
      "codigo_socio": "SOC-245595",
      "nombre_completo": "Brayan Chan Pacheco",
      "foto_perfil_url": "https://res.cloudinary.com/...",
      "membresia": "Anual Gold",
      "fecha_fin_membresia": "2027-02-26T00:00:00.000Z"
    },
    "asistencia": {
      "id": 4567,
      "timestamp": "2026-03-09T18:30:45.123Z",
      "tipo": "IN",
      "match_score": 85.5     // Porcentaje de similitud (0-100)
    },
    "estadisticas": {
      "asistencias_mes": 18,
      "racha_dias": 12,       // Días consecutivos con asistencia
      "ultima_asistencia": "2026-03-08T09:15:30.000Z"
    }
  }
}
```

### Response - Error (Huella No Reconocida)

```json
{
  "success": false,
  "message": "Huella no reconocida. Por favor, intenta nuevamente.",
  "error": "NO_MATCH"
}
```

### Response - Error (Membresía Vencida)

```json
{
  "success": false,
  "message": "Membresía vencida. Por favor, acude a recepción.",
  "error": "MEMBERSHIP_EXPIRED",
  "data": {
    "socio": {
      "id": 123,
      "codigo_socio": "SOC-245595",
      "nombre_completo": "Brayan Chan Pacheco",
      "fecha_fin_membresia": "2026-02-15T00:00:00.000Z"
    }
  }
}
```

### Lógica del Backend

```typescript
// Pseudocódigo del endpoint

async function validarHuella(req, res) {
  const { fingerprintSample, tipo, kioskId } = req.body
  
  // 1. Obtener todos los socios activos con huella registrada
  const socios = await db.query(`
    SELECT id, codigo_socio, nombre_completo, foto_perfil_url,
           membresia, fecha_fin_membresia, fingerprint_template
    FROM socios
    WHERE fingerprint_template IS NOT NULL
      AND activo = true
  `)
  
  // 2. Comparar huella recibida con cada template en BD
  let mejorMatch = null
  let mejorScore = 0
  
  for (const socio of socios) {
    const score = await compararHuellas(
      fingerprintSample, 
      socio.fingerprint_template
    )
    
    if (score > mejorScore) {
      mejorScore = score
      mejorMatch = socio
    }
  }
  
  // 3. Validar threshold mínimo (ej: 80%)
  const THRESHOLD_MINIMO = 80
  
  if (mejorScore < THRESHOLD_MINIMO) {
    return res.status(404).json({
      success: false,
      message: "Huella no reconocida. Por favor, intenta nuevamente.",
      error: "NO_MATCH"
    })
  }
  
  // 4. Verificar estado de membresía
  const hoy = new Date()
  const fechaFin = new Date(mejorMatch.fecha_fin_membresia)
  const diasRestantes = Math.ceil(
    (fechaFin - hoy) / (1000 * 60 * 60 * 24)
  )
  
  if (diasRestantes < 0) {
    return res.status(403).json({
      success: false,
      message: "Membresía vencida. Por favor, acude a recepción.",
      error: "MEMBERSHIP_EXPIRED",
      data: { socio: mejorMatch }
    })
  }
  
  // 5. Registrar asistencia en BD
  const asistencia = await db.insert('asistencias', {
    socio_id: mejorMatch.id,
    tipo,
    timestamp: new Date(),
    metodo: 'dactilar',
    match_score: mejorScore,
    kiosk_id: kioskId
  })
  
  // 6. Calcular estadísticas
  const estadisticas = await calcularEstadisticas(mejorMatch.id)
  
  // 7. Retornar respuesta exitosa
  return res.json({
    success: true,
    message: `¡Bienvenido, ${mejorMatch.nombre_completo.split(' ')[0]}!`,
    data: {
      socio: mejorMatch,
      asistencia,
      estadisticas
    }
  })
}

// Función de comparación (usar librería de Digital Persona)
async function compararHuellas(sample, template) {
  // Esta función debe usar el SDK de Digital Persona
  // o una librería de comparación biométrica
  
  // Ejemplo conceptual:
  const similarity = await FingerprintMatching.compare(sample, template)
  return similarity // Retorna 0-100
}
```

### Base de Datos - Campo Requerido

El campo `fingerprint_template` ya debe existir en la tabla `socios`:

```sql
-- Verificar si existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'socios' 
  AND column_name = 'fingerprint_template';

-- Si no existe, agregar:
ALTER TABLE socios 
ADD COLUMN fingerprint_template TEXT NULL;

-- Agregar índice para búsquedas más rápidas (opcional)
CREATE INDEX idx_socios_fingerprint 
ON socios(fingerprint_template) 
WHERE fingerprint_template IS NOT NULL;
```

---

## 👤 Flujo de Usuario

### Flujo Exitoso (Happy Path)

```
1. Usuario llega al kiosk
   └─ Pantalla: "Coloca tu dedo en el sensor"
   
2. Usuario coloca dedo
   └─ Sonido: beep-start.wav (corto)
   └─ Pantalla: "Capturando huella..." con barra de progreso
   
3. Huella capturada (1-2 segundos)
   └─ Pantalla: "Validando identidad..." con animación
   
4. Backend responde: Éxito
   └─ Sonido: success.wav
   └─ Pantalla: Card verde con:
      - Foto de perfil
      - Nombre completo
      - Código de socio
      - Info de membresía
      - Hora de entrada
      - Match score (ej: 94%)
      - Racha de días (si aplica)
   
5. Auto-cierre en 5 segundos
   └─ Countdown visible: "Auto-cierre en 5s..."
   
6. Vuelve a estado inicial
   └─ Pantalla: "Coloca tu dedo en el sensor"
```

### Flujo con Advertencia (Warning)

```
1-3. [Mismo proceso de captura]

4. Backend responde: Éxito con membresía próxima a vencer
   └─ Sonido: warning.wav (dos beeps)
   └─ Pantalla: Card amarillo/naranja con:
      - ⚠️ "Acceso Permitido"
      - "Tu membresía está próxima a vencer"
      - Foto y datos del socio
      - Alerta destacada: "Vence en 3 días"
      - Fecha de vencimiento
      - CTA: "Renueva pronto para no perder acceso"
   
5. Auto-cierre en 5 segundos

6. Vuelve a estado inicial
```

### Flujo con Error (Error Path)

```
1-3. [Mismo proceso de captura]

4. Backend responde: Error (huella no reconocida)
   └─ Sonido: error.wav (grave, descendente)
   └─ Pantalla: Card rojo con:
      - ❌ "Acceso Denegado"
      - Motivo: "Huella no reconocida"
      - Instrucción: "Limpia tu dedo e intenta nuevamente"
      - Mensaje motivacional (si no es socio)
   
5. Auto-cierre en 5 segundos

6. Vuelve a estado inicial

--- O ---

4. Backend responde: Error (membresía vencida)
   └─ Sonido: error.wav
   └─ Pantalla: Card rojo con:
      - ⏰ "Membresía Vencida"
      - Nombre y código del socio
      - Instrucción: "Acude a recepción para renovar"
      - CTA: "¡Renueva hoy y obtén 10% de descuento!"
   
5-6. [Mismo proceso de auto-cierre]
```

### Flujo de Error Técnico

```
Caso 1: Lector no conectado
└─ Pantalla: "Dispositivo No Conectado"
   └─ Icono: WifiOff (rojo)
   └─ Mensaje: "No se detectó ningún lector de huellas"
   └─ Instrucciones de troubleshooting
   └─ Botón: "Intentar Nuevamente"

Caso 2: Error del sensor
└─ Similar a Caso 1, con botón de retry

Caso 3: Error de red (backend no responde)
└─ Pantalla: "Error de Conexión"
   └─ Mensaje: "Error de conexión con el servidor"
   └─ Instrucción: "Intenta nuevamente o contacta a recepción"
   └─ Auto-retry en 5 segundos
```

---

## 📊 Estados del Sistema

El componente maneja 7 estados distintos:

| Estado | Descripción | Duración | Siguiente Estado |
|--------|-------------|----------|------------------|
| `connecting` | Inicializando lector | 1-3s | `idle` o `no-device` |
| `idle` | Esperando dedo | Indefinido | `scanning` |
| `no-device` | Lector no conectado | Hasta retry | `connecting` |
| `scanning` | Capturando huella | 1-2s | `validating` |
| `validating` | Comparando con BD | 0.5-2s | `success` / `warning` / `error` |
| `success` | Acceso permitido | 5s (auto-reset) | `idle` |
| `warning` | Acceso + advertencia | 5s (auto-reset) | `idle` |
| `error` | Acceso denegado | 5-7s (auto-reset) | `idle` |

### Diagrama de Estados

```
                    [INICIO]
                       │
                       ▼
                 ┌──────────┐
           ┌─────│connecting│─────┐
           │     └──────────┘     │
           │                      │
    [lector OK]            [sin lector]
           │                      │
           ▼                      ▼
      ┌────────┐           ┌──────────┐
      │  idle  │◄──────────│no-device │
      └────────┘  [retry]  └──────────┘
           │
     [dedo detectado]
           │
           ▼
      ┌─────────┐
      │scanning │
      └─────────┘
           │
      [captura OK]
           │
           ▼
      ┌───────────┐
      │validating │
      └───────────┘
           │
      ┌────┴────┬────────┐
      │         │        │
 [permitido] [warning] [denegado]
      │         │        │
      ▼         ▼        ▼
  ┌───────┐ ┌───────┐ ┌──────┐
  │success│ │warning│ │error │
  └───────┘ └───────┘ └──────┘
      │         │        │
      └─────────┴────────┘
              │
        [countdown = 0]
              │
              ▼
          ┌────────┐
          │  idle  │
          └────────┘
```

---

## 🧪 Testing

### Testing Manual (Desarrollo)

1. **Verificar carga inicial**
   ```bash
   npm run dev
   # Navegar a: http://localhost:3000/asistencia/huella
   ```

2. **Casos de prueba**:
   - [ ] Lector conectado → Debe mostrar "Coloca tu dedo"
   - [ ] Lector desconectado → Debe mostrar error con botón retry
   - [ ] Colocar dedo → Debe capturar y mostrar progreso
   - [ ] Huella válida → Debe llamar al endpoint (verificar Network tab)
   - [ ] Sonidos → success.wav debe reproducirse
   - [ ] Countdown → Debe regresar a idle tras 5 segundos
   - [ ] Responsive → Probar en pantallas pequeñas
   - [ ] Animaciones → Verificar que no haya glitches

3. **Mock del backend** (para testing sin endpoint):
   
   Agregar en el componente (temporal):
   ```typescript
   // MOCK TEMPORAL - Eliminar cuando backend esté listo
   const validarHuella = async (sample: string) => {
     setEstado("validating")
     
     await new Promise(r => setTimeout(r, 1500)) // Simular latencia
     
     // Simular respuesta exitosa
     const mockData = {
       success: true,
       data: {
         socio: {
           id: 123,
           codigo_socio: "SOC-999999",
           nombre_completo: "Usuario de Prueba",
           foto_perfil_url: null,
           membresia: "Mensual Básico",
           fecha_fin_membresia: new Date(Date.now() + 30*24*60*60*1000).toISOString()
         },
         asistencia: {
           id: 1,
           timestamp: new Date().toISOString(),
           tipo: 'IN',
           match_score: 92.5
         },
         estadisticas: {
           asistencias_mes: 15,
           racha_dias: 7,
           ultima_asistencia: new Date(Date.now() - 24*60*60*1000).toISOString()
         }
       }
     }
     
     setSocioData(mockData.data)
     setEstado("success")
     audioSuccessRef.current?.play()
     iniciarCountdown(5)
   }
   ```

### Testing Automatizado (Futuro)

```typescript
// tests/asistencia-huella.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import AsistenciaHuellaPage from '@/app/asistencia/huella/page'

describe('AsistenciaHuellaPage', () => {
  it('debe mostrar pantalla inicial', () => {
    render(<AsistenciaHuellaPage />)
    expect(screen.getByText(/coloca tu dedo/i)).toBeInTheDocument()
  })
  
  it('debe mostrar error si el lector no está conectado', async () => {
    // Mock de Digital Persona SDK
    jest.mock('@digitalpersona/devices', () => ({
      FingerprintReader: jest.fn().mockImplementation(() => ({
        enumerateDevices: jest.fn().mockResolvedValue([])
      }))
    }))
    
    render(<AsistenciaHuellaPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/dispositivo no conectado/i)).toBeInTheDocument()
    })
  })
  
  // ... más tests
})
```

---

## 🚀 Despliegue

### Checklist Pre-Despliegue

- [ ] Verificar que existan todos los sonidos en `/public/sounds/`
- [ ] Confirmar que el lector Digital Persona funcione en producción
- [ ] Configurar CORS en el backend para aceptar requests del frontend
- [ ] Verificar URLs de API (`NEXT_PUBLIC_API_URL`)
- [ ] Probar en navegador de producción (Chrome/Edge en kiosk mode)
- [ ] Configurar auto-inicio del navegador en el PC del kiosk
- [ ] Instalar drivers de Digital Persona en PC del kiosk
- [ ] Configurar pantalla completa (F11) o kiosk mode
- [ ] Deshabilitar sleep/screensaver en PC del kiosk

### Configuración del Kiosk

```bash
# Windows - Crear acceso directo con modo kiosk
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --no-first-run --disable-pinch --overscroll-history-navigation=0 https://hexodus.app/asistencia/huella

# Alternativamente, usar extensión de Chrome:
# "Kiosk Mode" o "Fully Kiosk Browser"
```

### Variables de Entorno

```env
# .env.local (Frontend)
NEXT_PUBLIC_API_URL=https://hexodusapi.vercel.app/api
NEXT_PUBLIC_KIOSK_ID=KIOSK-01

# .env (Backend)
DATABASE_URL=postgresql://user:pass@host:5432/hexodus
JWT_SECRET=tu_secret_key
FINGERPRINT_MATCH_THRESHOLD=80  # Porcentaje mínimo para match
```

### Monitoreo

#### Logs a Revisar

- Errores de conexión con el lector
- Falsos positivos/negativos (match incorrecto)
- Latencia de respuesta del backend
- Caídas del sistema

#### Métricas Clave

- **Tiempo promedio de validación**: < 3 segundos
- **Tasa de éxito de captura**: > 95%
- **Tasa de match correcto**: > 98%
- **Tiempo de actividad (uptime)**: > 99%

---

## 📝 Próximos Pasos

### Prioridad Alta

1. **Implementar endpoint backend** (`/api/asistencia/validar-huella`)
   - Implementar comparación biométrica
   - Configurar threshold de confianza
   - Agregar logging de intentos

2. **Crear archivos de sonido faltantes**
   - warning.wav
   - error.wav
   - beep-start.wav

3. **Testing con usuario real**
   - Registrar huellas de 5-10 socios
   - Probar reconocimiento en diferentes condiciones
   - Ajustar threshold según resultados

### Prioridad Media

4. **Panel de administración**
   - Ver historial de asistencias por huella
   - Estadísticas de uso del sistema
   - Gestión de dispositivos (kiosks)

5. **Mejoras UX**
   - Agregar tutorial en primera apertura
   - Modo noche/día automático
   - Soporte multiidioma

6. **Seguridad**
   - Encriptación de templates en BD
   - Rate limiting en el endpoint
   - Auditoría de accesos

### Prioridad Baja

7. **Optimizaciones**
   - Caché de socios frecuentes
   - Compresión de templates
   - Lazy loading de componentes

8. **Funcionalidades Extra**
   - Registro de salida automático
   - Integración con control de acceso físico
   - Notificaciones push (renovación)

---

## 🤝 Contribución

Para hacer cambios al sistema:

1. Crear rama: `git checkout -b feature/huella-mejoras`
2. Hacer commits: `git commit -m "feat: agregar X funcionalidad"`
3. Push: `git push origin feature/huella-mejoras`
4. Crear Pull Request

### Convenciones

- **Archivos**: kebab-case (ej: `pantalla-success.tsx`)
- **Componentes**: PascalCase (ej: `PantallaSuccess`)
- **Funciones**: camelCase (ej: `validarHuella`)
- **Constantes**: UPPER_SNAKE_CASE (ej: `THRESHOLD_MINIMO`)

---

## 📚 Referencias

- Digital Persona SDK: https://www.digitalpersona.com/
- Documentación UX/UI: `/docs/UX_UI_ASISTENCIAS_HUELLA.md` (tu propuesta original)
- Guía de Audio: `/docs/AUDIO_ASISTENCIAS_HUELLA.md`
- API Specs: `/docs/ASISTENCIAS_API.md`

---

**Última actualización**: 9 de marzo de 2026  
**Autor**: Equipo de Desarrollo Hexodus  
**Estado**: Frontend completo, Backend pendiente
