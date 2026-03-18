# 🎯 Propuesta: Sistema de Asistencias con Reconocimiento Facial

## 📊 Recomendación de Almacenamiento

### ✅ **RECOMENDACIÓN: Almacenar Descriptor Facial en Base de Datos**

#### ¿Por qué en Base de Datos?

| Criterio | Base de Datos | LocalStorage |
|----------|---------------|--------------|
| **Persistencia** | ✅ Permanente | ❌ Se borra fácilmente |
| **Multi-dispositivo** | ✅ Accesible desde cualquier lugar | ❌ Solo en un navegador |
| **Seguridad** | ✅ Controlada en servidor | ❌ Vulnerable |
| **Backup** | ✅ Incluido en backups BD | ❌ Sin backup |
| **GDPR** | ✅ Control total | ❌ Sin control |
| **Validación servidor** | ✅ Comparación en backend | ❌ Requiere envío completo |
| **Escalabilidad** | ✅ Miles de socios | ❌ Límite 5-10 MB total |

### 🔴 Problema Actual

Tu endpoint actual **NO está guardando** el descriptor facial:

```json
{
  "biometrico_rostro": true,  // ✅ Se guarda el flag
  "foto_perfil_url": "...",   // ✅ Se guarda la URL de Cloudinary
  // ❌ FALTA: face_descriptor
}
```

**Sin el descriptor facial, NO puedes validar asistencias** porque no hay nada con qué comparar.

### ✅ Solución: Agregar Campo a la Base de Datos

#### Opción 1: Campo JSON (PostgreSQL/MySQL 5.7+)

```sql
ALTER TABLE socios 
ADD COLUMN face_descriptor JSON NULL;

-- Ejemplo de almacenamiento:
-- face_descriptor: [0.123, -0.456, 0.789, ..., 0.321]  -- 128 valores
```

#### Opción 2: Campo TEXT (Compatibilidad Universal)

```sql
ALTER TABLE socios 
ADD COLUMN face_descriptor TEXT NULL;

-- Almacenar como JSON string:
-- face_descriptor: "[0.123,-0.456,0.789,...,0.321]"
```

### 📏 Tamaño del Descriptor

- **128 números flotantes**
- **~3-5 KB como JSON string**
- **Ejemplo**: `"[0.123456,-0.234567,0.345678,...]"` (128 valores)

### 🔒 Seguridad y Privacidad

#### GDPR y Datos Biométricos

El descriptor facial es un **dato biométrico sensible** bajo GDPR:

1. ✅ **Consentimiento explícito** requerido
2. ✅ **Derecho al olvido**: Permitir eliminar descriptor
3. ✅ **Encriptación** en tránsito (HTTPS)
4. ✅ **Encriptación** en reposo (opcional pero recomendado)
5. ✅ **Auditoría**: Registrar accesos al descriptor

#### Encriptación del Descriptor (Opcional)

```typescript
// Antes de guardar en BD
const encryptedDescriptor = encrypt(JSON.stringify(faceDescriptor), SECRET_KEY)

// Al recuperar de BD
const faceDescriptor = JSON.parse(decrypt(encryptedDescriptor, SECRET_KEY))
```

---

## 🛠️ Endpoints Necesarios para Sistema de Asistencias

### 📋 Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   FLUJO DE ASISTENCIAS                      │
└─────────────────────────────────────────────────────────────┘

1. Socio llega al gimnasio
2. Se coloca frente a cámara de entrada
3. Sistema captura rostro y genera descriptor
4. POST /api/asistencia/validar → Compara con BD
5. Si match: Registra entrada + muestra bienvenida
6. Si no match: Muestra error + notifica personal
```

---

## 📡 1. Validar Asistencia (Principal)

### `POST /api/asistencia/validar`

Valida el rostro capturado contra todos los socios registrados.

#### Request

```json
{
  "faceDescriptor": [0.123, -0.456, 0.789, ..., 0.321],  // 128 números
  "tipo": "entrada" | "salida",                          // Opcional
  "kioskId": "KIOSK-001"                                 // Opcional (ID del dispositivo)
}
```

#### Response - Success (Match Encontrado)

```json
{
  "success": true,
  "message": "¡Bienvenido, Brayan!",
  "data": {
    "socio": {
      "id": 123,
      "codigo_socio": "SOC-245595",
      "nombre_completo": "Brayan Chan Pacheco",
      "foto_perfil_url": "https://...",
      "membresia": "Anual Gold",
      "vigencia_membresia": "Vigente",
      "fecha_fin_membresia": "2027-02-26T00:00:00.000Z"
    },
    "asistencia": {
      "id": 4567,
      "timestamp": "2026-03-02T18:30:45.123Z",
      "tipo": "entrada",
      "confidence": 85.5,
      "match_distance": 0.42
    },
    "estadisticas": {
      "asistencias_mes": 18,
      "ultima_asistencia": "2026-03-01T09:15:30.000Z"
    }
  }
}
```

#### Response - Error (No Match)

```json
{
  "success": false,
  "message": "Rostro no reconocido",
  "data": {
    "intentos_recientes": 1,
    "sugerencia": "Por favor, contacta al personal de recepción"
  }
}
```

#### Response - Error (Membresía Vencida)

```json
{
  "success": false,
  "message": "Membresía vencida",
  "data": {
    "socio": {
      "nombre_completo": "Brayan Chan Pacheco",
      "fecha_fin_membresia": "2026-02-20T00:00:00.000Z"
    },
    "dias_vencidos": 10,
    "sugerencia": "Por favor, renueva tu membresía en recepción"
  }
}
```

#### Lógica del Endpoint

```javascript
POST /api/asistencia/validar
│
├─ 1. Validar request (faceDescriptor válido, 128 dimensiones)
│
├─ 2. Obtener socios activos con biometría
│    SELECT id, nombre_completo, face_descriptor, fecha_fin_membresia
│    FROM socios
│    WHERE biometrico_rostro = true
│    AND fecha_fin_membresia >= CURRENT_DATE
│
├─ 3. Comparar descriptor con cada socio
│    FOR EACH socio:
│      distance = euclideanDistance(descriptorCapturado, socio.face_descriptor)
│      IF distance < best_distance:
│        best_match = socio
│        best_distance = distance
│
├─ 4. Validar umbral de confianza
│    IF best_distance < 0.6:  // 60% similitud mínima
│      ├─ Match encontrado
│      ├─ Validar membresía vigente
│      └─ Registrar asistencia
│    ELSE:
│      └─ No match, rechazar
│
└─ 5. Retornar respuesta
```

---

## 📡 2. Historial de Asistencias

### `GET /api/asistencia`

Obtiene el historial completo de asistencias con filtros.

#### Query Parameters

```
?fecha_inicio=2026-03-01
&fecha_fin=2026-03-02
&socio_id=123
&tipo=entrada
&page=1
&limit=50
```

#### Response

```json
{
  "success": true,
  "data": {
    "asistencias": [
      {
        "id": 4567,
        "socio_id": 123,
        "socio_nombre": "Brayan Chan Pacheco",
        "codigo_socio": "SOC-245595",
        "foto_perfil_url": "https://...",
        "timestamp": "2026-03-02T18:30:45.123Z",
        "tipo": "entrada",
        "confidence": 85.5,
        "kiosk_id": "KIOSK-001"
      },
      // ... más asistencias
    ],
    "pagination": {
      "total": 245,
      "page": 1,
      "limit": 50,
      "total_pages": 5
    },
    "estadisticas": {
      "total_entradas": 123,
      "total_salidas": 122,
      "promedio_confidence": 87.3
    }
  }
}
```

---

## 📡 3. Asistencias del Día

### `GET /api/asistencia/hoy`

Obtiene las asistencias del día actual (útil para dashboard).

#### Query Parameters

```
?tipo=entrada  // Opcional: filtrar solo entradas o salidas
```

#### Response

```json
{
  "success": true,
  "data": {
    "fecha": "2026-03-02",
    "asistencias": [
      {
        "id": 4567,
        "socio_nombre": "Brayan Chan Pacheco",
        "codigo_socio": "SOC-245595",
        "foto_perfil_url": "https://...",
        "hora": "18:30:45",
        "tipo": "entrada",
        "confidence": 85.5
      },
      // ... más asistencias de hoy
    ],
    "resumen": {
      "total_asistencias": 87,
      "entradas": 45,
      "salidas": 42,
      "socios_activos_ahora": 3,  // Entradas - Salidas
      "hora_pico": "18:00-19:00",
      "promedio_confidence": 86.8
    }
  }
}
```

---

## 📡 4. Asistencias por Socio

### `GET /api/asistencia/socio/:id`

Obtiene el historial de asistencias de un socio específico.

#### Route Parameter

```
/api/asistencia/socio/123
```

#### Query Parameters

```
?fecha_inicio=2026-02-01
&fecha_fin=2026-03-02
&limit=30
```

#### Response

```json
{
  "success": true,
  "data": {
    "socio": {
      "id": 123,
      "codigo_socio": "SOC-245595",
      "nombre_completo": "Brayan Chan Pacheco",
      "foto_perfil_url": "https://..."
    },
    "asistencias": [
      {
        "id": 4567,
        "timestamp": "2026-03-02T18:30:45.123Z",
        "tipo": "entrada",
        "confidence": 85.5
      },
      // ... más asistencias
    ],
    "estadisticas": {
      "total_asistencias": 18,
      "dias_asistidos": 14,
      "promedio_asistencias_semana": 3.5,
      "racha_actual": 5,  // Días consecutivos
      "ultima_asistencia": "2026-03-02T18:30:45.123Z",
      "promedio_confidence": 87.2
    }
  }
}
```

---

## 📡 5. Estadísticas de Asistencias

### `GET /api/asistencia/estadisticas`

Obtiene estadísticas generales del sistema.

#### Query Parameters

```
?periodo=dia | semana | mes | año
&fecha_inicio=2026-03-01
&fecha_fin=2026-03-02
```

#### Response

```json
{
  "success": true,
  "data": {
    "periodo": "mes",
    "fecha_inicio": "2026-03-01",
    "fecha_fin": "2026-03-31",
    "resumen": {
      "total_asistencias": 2345,
      "socios_unicos": 189,
      "promedio_diario": 75.6,
      "promedio_confidence": 86.5
    },
    "por_dia": [
      {
        "fecha": "2026-03-01",
        "total": 87,
        "socios_unicos": 45
      },
      // ... más días
    ],
    "horas_pico": [
      { "hora": "18:00-19:00", "asistencias": 234 },
      { "hora": "07:00-08:00", "asistencias": 198 },
      { "hora": "19:00-20:00", "asistencias": 176 }
    ],
    "top_socios": [
      {
        "socio_id": 123,
        "nombre": "Brayan Chan Pacheco",
        "asistencias": 28
      },
      // ... más socios
    ]
  }
}
```

---

## 📡 6. Verificar Acceso Rápido

### `GET /api/asistencia/verificar/:codigoSocio`

Verifica si un socio puede acceder (sin biometría, por código/tarjeta).

#### Route Parameter

```
/api/asistencia/verificar/SOC-245595
```

#### Response - Acceso Permitido

```json
{
  "success": true,
  "message": "Acceso permitido",
  "data": {
    "socio": {
      "id": 123,
      "codigo_socio": "SOC-245595",
      "nombre_completo": "Brayan Chan Pacheco",
      "foto_perfil_url": "https://...",
      "membresia": "Anual Gold",
      "fecha_fin_membresia": "2027-02-26T00:00:00.000Z"
    },
    "puede_acceder": true,
    "razon": "Membresía vigente"
  }
}
```

#### Response - Acceso Denegado

```json
{
  "success": false,
  "message": "Acceso denegado",
  "data": {
    "socio": {
      "codigo_socio": "SOC-245595",
      "nombre_completo": "Brayan Chan Pacheco"
    },
    "puede_acceder": false,
    "razon": "Membresía vencida",
    "fecha_fin_membresia": "2026-02-20T00:00:00.000Z",
    "dias_vencidos": 10
  }
}
```

---

## 📡 7. Registrar Asistencia Manual

### `POST /api/asistencia/manual`

Registra una asistencia manualmente (sin biometría).

#### Request

```json
{
  "socio_id": 123,
  "tipo": "entrada" | "salida",
  "notas": "Ingresado por recepción - problema con biometría"
}
```

#### Response

```json
{
  "success": true,
  "message": "Asistencia registrada",
  "data": {
    "id": 4568,
    "socio_id": 123,
    "timestamp": "2026-03-02T18:45:00.000Z",
    "tipo": "entrada",
    "metodo": "manual",
    "notas": "Ingresado por recepción - problema con biometría"
  }
}
```

---

## 🗄️ Esquema de Base de Datos

### Tabla: `socios` (Actualizar)

```sql
ALTER TABLE socios ADD COLUMN face_descriptor TEXT NULL;
ALTER TABLE socios ADD COLUMN fingerprint_template TEXT NULL;

-- Índices para optimizar búsquedas
CREATE INDEX idx_socios_biometria ON socios(biometrico_rostro, fecha_fin_membresia);
CREATE INDEX idx_socios_codigo ON socios(codigo_socio);
```

### Tabla: `asistencias` (Crear)

```sql
CREATE TABLE asistencias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  socio_id INT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  tipo ENUM('entrada', 'salida') NOT NULL,
  metodo ENUM('facial', 'huella', 'tarjeta', 'manual') DEFAULT 'facial',
  confidence DECIMAL(5,2) NULL,  -- 0.00 - 100.00 (solo para biometría)
  match_distance DECIMAL(5,3) NULL,  -- Distancia euclidiana (solo facial)
  kiosk_id VARCHAR(50) NULL,  -- ID del dispositivo/kiosk
  notas TEXT NULL,
  
  FOREIGN KEY (socio_id) REFERENCES socios(id) ON DELETE CASCADE,
  INDEX idx_socio_timestamp (socio_id, timestamp DESC),
  INDEX idx_timestamp (timestamp DESC),
  INDEX idx_tipo (tipo)
);
```

### Tabla: `intentos_acceso_fallidos` (Crear - Seguridad)

```sql
CREATE TABLE intentos_acceso_fallidos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  face_descriptor TEXT NULL,  -- Captura del intento fallido
  imagen_captura TEXT NULL,   -- URL de Cloudinary (evidencia)
  match_distance_minimo DECIMAL(5,3),  -- Distancia del mejor match
  kiosk_id VARCHAR(50) NULL,
  ip_address VARCHAR(45) NULL,
  
  INDEX idx_timestamp (timestamp DESC)
);
```

---

## 🔐 Seguridad y Mejores Prácticas

### 1. Rate Limiting

```typescript
// Límite de intentos de validación
// Máximo 5 intentos por minuto por IP/kiosk
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5,
  message: 'Demasiados intentos, espera un momento'
})
```

### 2. Logging de Auditoría

```typescript
// Registrar todos los intentos de acceso
await prisma.auditLog.create({
  data: {
    action: 'VALIDAR_ASISTENCIA',
    user: 'SYSTEM',
    details: {
      resultado: 'success',
      socioId: match.id,
      confidence: match.confidence,
      kioskId: request.kioskId
    },
    timestamp: new Date()
  }
})
```

### 3. Alertas Automáticas

```typescript
// Alertar sobre intentos fallidos consecutivos
if (intentosFallidosConsecutivos >= 3) {
  await notificarPersonalSeguridad({
    tipo: 'INTENTOS_ACCESO_SOSPECHOSOS',
    kioskId: request.kioskId,
    cantidad: intentosFallidosConsecutivos,
    timestamp: new Date()
  })
}
```

### 4. Encriptación del Descriptor

```typescript
// Opcional pero recomendado para alta seguridad
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.FACE_DESCRIPTOR_KEY

function encryptDescriptor(descriptor: number[]): string {
  const text = JSON.stringify(descriptor)
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

function decryptDescriptor(encrypted: string): number[] {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return JSON.parse(decrypted)
}
```

---

## 📊 Dashboard de Asistencias (Frontend)

### Componentes Sugeridos

```
/app/asistencias/
  page.tsx                    // Dashboard principal
  validar/page.tsx            // Vista de kiosk para validar
  historial/page.tsx          // Historial completo
  estadisticas/page.tsx       // Gráficas y análisis

/components/asistencias/
  validacion-kiosk.tsx        // Componente de validación en tiempo real
  historial-table.tsx         // Tabla de historial
  estadisticas-charts.tsx     // Gráficas de asistencias
  asistencia-card.tsx         // Tarjeta individual de asistencia
```

---

## 🎯 Flujo Completo de Implementación

### Fase 1: Base de Datos ✅

1. Agregar campo `face_descriptor TEXT` a tabla `socios`
2. Crear tabla `asistencias`
3. Crear tabla `intentos_acceso_fallidos`
4. Crear índices

### Fase 2: Backend API

1. Actualizar endpoint `POST /api/socios` para guardar `face_descriptor`
2. Implementar `POST /api/asistencia/validar` (principal)
3. Implementar `GET /api/asistencia` (historial)
4. Implementar `GET /api/asistencia/hoy`
5. Implementar `GET /api/asistencia/socio/:id`
6. Implementar `POST /api/asistencia/manual`

### Fase 3: Frontend - Kiosk de Validación

1. Crear componente `ValidacionKiosk`
2. Integrar con cámara (usar `CapturaFacialModal` adaptado)
3. Mostrar resultado en pantalla grande
4. Sonidos de feedback (✓ acceso / ✗ denegado)
5. Timeout automático (volver a idle después de 10s)

### Fase 4: Frontend - Dashboard

1. Crear vista de historial de asistencias
2. Gráficas de asistencias por día/semana/mes
3. Lista de socios actualmente en gimnasio
4. Alertas de membresías próximas a vencer

### Fase 5: Testing

1. Probar con múltiples socios registrados
2. Medir tiempo de validación (debe ser < 2 segundos)
3. Ajustar umbral de confianza según tasa de falsos positivos
4. Probar bajo diferentes condiciones de luz

---

## 📈 Métricas de Éxito

### KPIs a Monitorear

- **Tiempo de validación**: < 2 segundos
- **Tasa de aciertos**: > 95%
- **Falsos positivos**: < 1%
- **Falsos negativos**: < 3%
- **Disponibilidad del sistema**: > 99%
- **Satisfacción de socios**: Encuestas post-implementación

---

## 🚀 Conclusión

### Resumen de Recomendaciones

1. ✅ **Guardar descriptor facial en Base de Datos** (campo TEXT/JSON)
2. ✅ **Crear tabla `asistencias`** con campos detallados
3. ✅ **Implementar 7 endpoints** según especificación arriba
4. ✅ **Encriptar descriptores** para máxima seguridad (opcional)
5. ✅ **Rate limiting** y auditoría de accesos
6. ✅ **Dashboard en tiempo real** para personal