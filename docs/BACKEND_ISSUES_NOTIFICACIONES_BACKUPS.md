# 📋 Issues Backend: Notificaciones y Backups

> **Documento técnico**: Implementación de sistema de alertas y respaldos automáticos en Supabase
> 
> **Fecha**: Marzo 2026  
> **Prioridad**: 🔥 ALTA - Core Features

---

## 📊 Resumen Ejecutivo

Este documento detalla los 2 sistemas principales que faltan en el backend para completar la funcionalidad de configuración del sistema:

1. **Sistema de Notificaciones/Alertas**: Alertas automáticas del sistema basadas en condiciones (stock bajo, vencimientos, inactividad, pagos pendientes)
2. **Sistema de Backups**: Respaldos automáticos y manuales en Supabase con restauración de datos

---

## 🎯 Issue 1: Sistema de Notificaciones/Alertas del Sistema

### **Descripción**
Implementar un sistema de alertas en tiempo real que monitoree condiciones del negocio y genere notificaciones visibles en el dashboard. Las alertas se evalúan cada hora y se almacenan para consulta histórica.

### **Prioridad**: 🔥🔥🔥 CRÍTICA

### **Casos de Uso**
1. **Vencimiento de Membresías**: Alertar cuando una membresía esté por vencer (configurable: 7 días default)
2. **Stock Bajo**: Alertar cuando un producto alcance el stock mínimo (configurable: 10 unidades default)
3. **Inactividad de Socios**: Alertar cuando un socio no haya asistido en X días (configurable: 15 días default)
4. **Pagos Pendientes**: Alertar sobre pagos atrasados o pendientes

---

### **Estructura de Base de Datos**

#### Tabla: `alertas_sistema`
```sql
CREATE TABLE alertas_sistema (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(50) NOT NULL, -- 'vencimiento_membresia', 'stock_bajo', 'inactividad_socio', 'pago_pendiente'
  estado VARCHAR(20) NOT NULL DEFAULT 'activa', -- 'activa', 'vista', 'resuelta', 'descartada'
  prioridad VARCHAR(20) NOT NULL DEFAULT 'media', -- 'baja', 'media', 'alta', 'urgente'
  
  -- Información de la alerta
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  -- Referencias a entidades
  socio_id UUID REFERENCES socios(id),
  producto_id UUID REFERENCES productos(id),
  membresia_id UUID REFERENCES membresias(id),
  movimiento_id UUID REFERENCES movimientos(id),
  
  -- Metadata
  datos_adicionales JSONB, -- Información contextual adicional
  
  -- Gestión
  vista_por_usuario_id UUID REFERENCES usuarios(id),
  fecha_vista TIMESTAMP,
  resuelta_por_usuario_id UUID REFERENCES usuarios(id),
  fecha_resolucion TIMESTAMP,
  notas_resolucion TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alertas_estado ON alertas_sistema(estado);
CREATE INDEX idx_alertas_tipo ON alertas_sistema(tipo);
CREATE INDEX idx_alertas_prioridad ON alertas_sistema(prioridad);
CREATE INDEX idx_alertas_socio ON alertas_sistema(socio_id);
CREATE INDEX idx_alertas_created ON alertas_sistema(created_at DESC);
```

#### Tabla: `configuracion_alertas`
```sql
CREATE TABLE configuracion_alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id),
  
  -- Vencimientos
  alerta_vencimientos_activa BOOLEAN DEFAULT TRUE,
  alerta_vencimientos_dias INTEGER DEFAULT 7, -- Días antes de vencer
  
  -- Stock
  alerta_stock_activa BOOLEAN DEFAULT TRUE,
  alerta_stock_minimo INTEGER DEFAULT 10, -- Unidades mínimas
  
  -- Inactividad
  alerta_inactividad_activa BOOLEAN DEFAULT TRUE,
  alerta_inactividad_dias INTEGER DEFAULT 15, -- Días sin asistir
  
  -- Pagos
  alerta_pagos_activa BOOLEAN DEFAULT TRUE,
  
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### **Endpoints API**

#### 1. **Obtener alertas activas**
```
GET /api/alertas
```

**Query Parameters:**
- `estado` (opcional): `activa`, `vista`, `resuelta`, `descartada`
- `tipo` (opcional): `vencimiento_membresia`, `stock_bajo`, `inactividad_socio`, `pago_pendiente`
- `prioridad` (opcional): `baja`, `media`, `alta`, `urgente`
- `limite` (opcional): número máximo de alertas (default: 50)
- `pagina` (opcional): página de resultados (default: 1)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tipo": "vencimiento_membresia",
      "estado": "activa",
      "prioridad": "alta",
      "titulo": "Membresía por vencer - Juan Pérez",
      "descripcion": "La membresía mensual vence en 3 días (11/03/2026)",
      "socio": {
        "id": "uuid",
        "nombre": "Juan Pérez",
        "foto": "url"
      },
      "membresia": {
        "id": "uuid",
        "tipo": "Mensual",
        "fecha_vencimiento": "2026-03-11"
      },
      "datos_adicionales": {
        "dias_restantes": 3,
        "telefono_socio": "+52 123 456 7890"
      },
      "created_at": "2026-03-08T10:00:00Z"
    },
    {
      "id": "uuid",
      "tipo": "stock_bajo",
      "estado": "activa",
      "prioridad": "media",
      "titulo": "Stock bajo - Proteína Whey",
      "descripcion": "Solo quedan 5 unidades en inventario",
      "producto": {
        "id": "uuid",
        "nombre": "Proteína Whey",
        "sku": "PROT-001"
      },
      "datos_adicionales": {
        "stock_actual": 5,
        "stock_minimo": 10,
        "categoria": "Suplementos"
      },
      "created_at": "2026-03-08T09:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "pagina": 1,
    "limite": 50,
    "total_paginas": 1
  },
  "resumen": {
    "total_activas": 25,
    "por_prioridad": {
      "urgente": 2,
      "alta": 8,
      "media": 10,
      "baja": 5
    },
    "por_tipo": {
      "vencimiento_membresia": 12,
      "stock_bajo": 8,
      "inactividad_socio": 3,
      "pago_pendiente": 2
    }
  }
}
```

---

#### 2. **Marcar alerta como vista**
```
PATCH /api/alertas/:id/vista
```

**Request Body:**
```json
{
  "usuario_id": "uuid" // Usuario que vio la alerta
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Alerta marcada como vista",
  "data": {
    "id": "uuid",
    "estado": "vista",
    "vista_por_usuario_id": "uuid",
    "fecha_vista": "2026-03-08T11:00:00Z"
  }
}
```

---

#### 3. **Resolver alerta**
```
PATCH /api/alertas/:id/resolver
```

**Request Body:**
```json
{
  "usuario_id": "uuid", // Usuario que resuelve
  "notas_resolucion": "Membresía renovada exitosamente" // Opcional
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Alerta resuelta",
  "data": {
    "id": "uuid",
    "estado": "resuelta",
    "resuelta_por_usuario_id": "uuid",
    "fecha_resolucion": "2026-03-08T11:05:00Z",
    "notas_resolucion": "Membresía renovada exitosamente"
  }
}
```

---

#### 4. **Descartar alerta**
```
PATCH /api/alertas/:id/descartar
```

**Response 200:**
```json
{
  "success": true,
  "message": "Alerta descartada"
}
```

---

#### 5. **Obtener configuración de alertas**
```
GET /api/alertas/configuracion
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "vencimientos": {
      "activa": true,
      "dias_anticipacion": 7
    },
    "stock": {
      "activa": true,
      "stock_minimo": 10
    },
    "inactividad": {
      "activa": true,
      "dias_sin_asistir": 15
    },
    "pagos": {
      "activa": true
    }
  }
}
```

---

#### 6. **Actualizar configuración de alertas**
```
PUT /api/alertas/configuracion
```

**Request Body:**
```json
{
  "vencimientos": {
    "activa": true,
    "dias_anticipacion": 10
  },
  "stock": {
    "activa": true,
    "stock_minimo": 15
  },
  "inactividad": {
    "activa": true,
    "dias_sin_asistir": 20
  },
  "pagos": {
    "activa": false
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Configuración de alertas actualizada",
  "data": {
    "vencimientos": {
      "activa": true,
      "dias_anticipacion": 10
    },
    "stock": {
      "activa": true,
      "stock_minimo": 15
    },
    "inactividad": {
      "activa": true,
      "dias_sin_asistir": 20
    },
    "pagos": {
      "activa": false
    }
  }
}
```

---

### **Lógica de Generación de Alertas (Cron Job)**

#### **Ejecutar cada hora** (puede ser con Supabase Functions + pg_cron)

```typescript
// Pseudo-código del cron job

async function generarAlertas() {
  const config = await obtenerConfiguracionAlertas()
  
  // 1. Vencimientos de membresías
  if (config.vencimientos.activa) {
    const membresiasProximasVencer = await db
      .select('*')
      .from('membresias')
      .where('estado', 'activa')
      .where('fecha_vencimiento', '<=', addDays(now(), config.vencimientos.dias_anticipacion))
      .where('fecha_vencimiento', '>=', now())
    
    for (const membresia of membresiasProximasVencer) {
      // Verificar si ya existe una alerta activa para esta membresía
      const alertaExistente = await db
        .select('*')
        .from('alertas_sistema')
        .where('tipo', 'vencimiento_membresia')
        .where('membresia_id', membresia.id)
        .where('estado', 'activa')
        .first()
      
      if (!alertaExistente) {
        await crearAlerta({
          tipo: 'vencimiento_membresia',
          prioridad: calcularPrioridad(membresia.fecha_vencimiento),
          titulo: `Membresía por vencer - ${membresia.socio.nombre}`,
          descripcion: `La membresía ${membresia.tipo} vence en ${diasRestantes} días`,
          socio_id: membresia.socio_id,
          membresia_id: membresia.id,
          datos_adicionales: {
            dias_restantes: diasRestantes,
            telefono_socio: membresia.socio.telefono
          }
        })
      }
    }
  }
  
  // 2. Stock bajo
  if (config.stock.activa) {
    const productosStockBajo = await db
      .select('*')
      .from('productos')
      .where('stock', '<=', config.stock.stock_minimo)
      .where('activo', true)
    
    for (const producto of productosStockBajo) {
      const alertaExistente = await db
        .select('*')
        .from('alertas_sistema')
        .where('tipo', 'stock_bajo')
        .where('producto_id', producto.id)
        .where('estado', 'activa')
        .first()
      
      if (!alertaExistente) {
        await crearAlerta({
          tipo: 'stock_bajo',
          prioridad: producto.stock === 0 ? 'urgente' : 'media',
          titulo: `Stock bajo - ${producto.nombre}`,
          descripcion: `Solo quedan ${producto.stock} unidades en inventario`,
          producto_id: producto.id,
          datos_adicionales: {
            stock_actual: producto.stock,
            stock_minimo: config.stock.stock_minimo,
            categoria: producto.categoria
          }
        })
      }
    }
  }
  
  // 3. Inactividad de socios
  if (config.inactividad.activa) {
    const sociosInactivos = await db
      .select('socios.*, MAX(asistencias.fecha) as ultima_asistencia')
      .from('socios')
      .leftJoin('asistencias', 'socios.id', 'asistencias.socio_id')
      .where('socios.estado', 'activo')
      .groupBy('socios.id')
      .having('MAX(asistencias.fecha)', '<=', subtractDays(now(), config.inactividad.dias_sin_asistir))
    
    for (const socio of sociosInactivos) {
      const alertaExistente = await db
        .select('*')
        .from('alertas_sistema')
        .where('tipo', 'inactividad_socio')
        .where('socio_id', socio.id)
        .where('estado', 'activa')
        .first()
      
      if (!alertaExistente) {
        await crearAlerta({
          tipo: 'inactividad_socio',
          prioridad: 'baja',
          titulo: `Socio inactivo - ${socio.nombre}`,
          descripcion: `No ha asistido en ${diasInactivo} días`,
          socio_id: socio.id,
          datos_adicionales: {
            dias_inactivo: diasInactivo,
            ultima_asistencia: socio.ultima_asistencia,
            telefono: socio.telefono
          }
        })
      }
    }
  }
  
  // 4. Pagos pendientes
  if (config.pagos.activa) {
    const pagosPendientes = await db
      .select('*')
      .from('movimientos')
      .where('tipo_movimiento', 'venta')
      .where('estado_pago', 'pendiente')
      .where('fecha_limite_pago', '<', now())
    
    for (const pago of pagosPendientes) {
      const alertaExistente = await db
        .select('*')
        .from('alertas_sistema')
        .where('tipo', 'pago_pendiente')
        .where('movimiento_id', pago.id)
        .where('estado', 'activa')
        .first()
      
      if (!alertaExistente) {
        await crearAlerta({
          tipo: 'pago_pendiente',
          prioridad: 'alta',
          titulo: `Pago pendiente - ${pago.socio.nombre}`,
          descripcion: `Pago atrasado de $${pago.monto}`,
          socio_id: pago.socio_id,
          movimiento_id: pago.id,
          datos_adicionales: {
            monto: pago.monto,
            dias_atraso: diasAtraso,
            concepto: pago.concepto
          }
        })
      }
    }
  }
}

function calcularPrioridad(fechaVencimiento: Date): string {
  const dias = differenceInDays(fechaVencimiento, now())
  if (dias <= 1) return 'urgente'
  if (dias <= 3) return 'alta'
  if (dias <= 7) return 'media'
  return 'baja'
}
```

---

### **Tecnologías Sugeridas**
- **Supabase Functions**: Para el cron job de generación de alertas
- **pg_cron**: Para programar ejecución automática cada hora
- **Supabase Realtime**: Para notificar al frontend cuando hay nuevas alertas

---

## 🗄️ Issue 2: Sistema de Backups Automáticos en Supabase

### **Descripción**
Implementar un sistema completo de respaldos que permita crear backups automáticos programados, backups manuales on-demand, y restauración de datos desde backups previos. Los backups incluyen todas las tablas del sistema excepto logs y auditoría.

### **Prioridad**: 🔥🔥🔥 CRÍTICA

### **Casos de Uso**
1. **Backup Automático Programado**: Ejecutar backups según frecuencia configurada (diario, semanal, mensual)
2. **Backup Manual**: Permitir crear backup en cualquier momento
3. **Restauración de Backup**: Restaurar datos desde un backup específico
4. **Gestión de Retención**: Eliminar backups antiguos según política de retención
5. **Descarga de Backup**: Descargar archivo de backup en formato SQL o JSON

---

### **Estructura de Base de Datos**

#### Tabla: `backups`
```sql
CREATE TABLE backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(20) NOT NULL, -- 'automatico', 'manual'
  estado VARCHAR(20) NOT NULL DEFAULT 'en_progreso', -- 'en_progreso', 'completado', 'fallido'
  
  -- Información del backup
  nombre VARCHAR(255), -- Nombre descriptivo opcional
  descripcion TEXT,
  archivo_url TEXT, -- URL en Supabase Storage donde se guardó el backup
  tamano_bytes BIGINT, -- Tamaño en bytes
  formato VARCHAR(10) DEFAULT 'sql', -- 'sql', 'json', 'csv'
  
  -- Tablas incluidas
  tablas_incluidas TEXT[], -- Array de nombres de tablas
  numero_registros INTEGER, -- Total de registros respaldados
  
  -- Metadata
  version_sistema VARCHAR(20), -- Versión del sistema al crear backup
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id),
  
  -- Gestión
  creado_por_usuario_id UUID REFERENCES usuarios(id), -- NULL si es automático
  fecha_expiracion DATE, -- Fecha en que se eliminará automáticamente
  
  -- Resultado
  error_mensaje TEXT, -- Si falló, descripción del error
  duracion_segundos INTEGER, -- Tiempo que tomó crear el backup
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_backups_estado ON backups(estado);
CREATE INDEX idx_backups_tipo ON backups(tipo);
CREATE INDEX idx_backups_gimnasio ON backups(gimnasio_id);
CREATE INDEX idx_backups_created ON backups(created_at DESC);
```

#### Tabla: `configuracion_backups`
```sql
CREATE TABLE configuracion_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id),
  
  backup_automatico_activo BOOLEAN DEFAULT TRUE,
  frecuencia VARCHAR(20) DEFAULT 'diario', -- 'diario', 'semanal', 'mensual'
  hora_ejecucion TIME DEFAULT '00:00:00', -- Hora del día para ejecutar
  
  -- Retención
  dias_retencion INTEGER DEFAULT 30, -- Días que se mantienen los backups
  
  -- Configuración avanzada
  incluir_logs BOOLEAN DEFAULT FALSE,
  incluir_auditoria BOOLEAN DEFAULT FALSE,
  formato_backup VARCHAR(10) DEFAULT 'sql', -- 'sql', 'json'
  compresion BOOLEAN DEFAULT TRUE,
  
  -- Notificaciones
  notificar_exito BOOLEAN DEFAULT FALSE,
  notificar_error BOOLEAN DEFAULT TRUE,
  emails_notificacion TEXT[],
  
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: `restauraciones`
```sql
CREATE TABLE restauraciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_id UUID NOT NULL REFERENCES backups(id),
  estado VARCHAR(20) NOT NULL DEFAULT 'en_progreso', -- 'en_progreso', 'completado', 'fallido'
  
  -- Configuración
  restaurar_todo BOOLEAN DEFAULT TRUE,
  tablas_seleccionadas TEXT[], -- Si no restaura todo, qué tablas restaurar
  
  -- Metadata
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id),
  iniciado_por_usuario_id UUID NOT NULL REFERENCES usuarios(id),
  
  -- Resultado
  registros_restaurados INTEGER,
  error_mensaje TEXT,
  duracion_segundos INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

---

### **Endpoints API**

#### 1. **Crear backup manual**
```
POST /api/backups
```

**Request Body:**
```json
{
  "nombre": "Backup pre-migración", // Opcional
  "descripcion": "Respaldo antes de actualizar el sistema", // Opcional
  "usuario_id": "uuid",
  "formato": "sql", // 'sql' o 'json'
  "incluir_logs": false,
  "incluir_auditoria": false
}
```

**Response 202 (Accepted):**
```json
{
  "success": true,
  "message": "Backup iniciado",
  "data": {
    "id": "uuid",
    "tipo": "manual",
    "estado": "en_progreso",
    "created_at": "2026-03-08T11:00:00Z"
  }
}
```

---

#### 2. **Obtener lista de backups**
```
GET /api/backups
```

**Query Parameters:**
- `tipo` (opcional): `automatico`, `manual`
- `estado` (opcional): `en_progreso`, `completado`, `fallido`
- `limite` (opcional): número máximo de backups (default: 20)
- `pagina` (opcional): página de resultados (default: 1)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tipo": "automatico",
      "estado": "completado",
      "nombre": null,
      "archivo_url": "https://supabase.co/storage/backups/2026-03-08.sql",
      "tamano_bytes": 25690000,
      "tamano_legible": "24.5 MB",
      "formato": "sql",
      "tablas_incluidas": ["socios", "membresias", "productos", "movimientos"],
      "numero_registros": 15420,
      "version_sistema": "2.1.3",
      "creado_por": null,
      "fecha_expiracion": "2026-04-07",
      "duracion_segundos": 45,
      "created_at": "2026-03-08T00:00:00Z",
      "completed_at": "2026-03-08T00:00:45Z"
    },
    {
      "id": "uuid",
      "tipo": "manual",
      "estado": "completado",
      "nombre": "Backup quincenal",
      "archivo_url": "https://supabase.co/storage/backups/manual-2026-03-06.sql",
      "tamano_bytes": 24200000,
      "tamano_legible": "24.2 MB",
      "formato": "sql",
      "numero_registros": 15320,
      "creado_por": {
        "id": "uuid",
        "nombre": "Admin Principal"
      },
      "created_at": "2026-03-06T15:30:00Z",
      "completed_at": "2026-03-06T15:30:42Z"
    }
  ],
  "pagination": {
    "total": 10,
    "pagina": 1,
    "limite": 20,
    "total_paginas": 1
  },
  "estadisticas": {
    "ultimo_backup": "2026-03-08T00:00:00Z",
    "espacio_total_usado": "245.3 MB",
    "total_backups": 10,
    "backups_automaticos": 8,
    "backups_manuales": 2
  }
}
```

---

#### 3. **Obtener detalle de un backup**
```
GET /api/backups/:id
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tipo": "automatico",
    "estado": "completado",
    "archivo_url": "https://supabase.co/storage/backups/2026-03-08.sql",
    "tamano_bytes": 25690000,
    "tamano_legible": "24.5 MB",
    "formato": "sql",
    "tablas_incluidas": ["socios", "membresias", "productos", "movimientos", "usuarios", "asistencias"],
    "numero_registros": 15420,
    "detalles_tablas": {
      "socios": 450,
      "membresias": 380,
      "productos": 120,
      "movimientos": 8900,
      "usuarios": 15,
      "asistencias": 5555
    },
    "version_sistema": "2.1.3",
    "fecha_expiracion": "2026-04-07",
    "duracion_segundos": 45,
    "created_at": "2026-03-08T00:00:00Z",
    "completed_at": "2026-03-08T00:00:45Z"
  }
}
```

---

#### 4. **Descargar backup**
```
GET /api/backups/:id/download
```

**Response 200:**
- Content-Type: `application/sql` o `application/json`
- Content-Disposition: `attachment; filename="backup-2026-03-08.sql"`
- Body: Archivo del backup

---

#### 5. **Restaurar desde backup**
```
POST /api/backups/:id/restore
```

**Request Body:**
```json
{
  "usuario_id": "uuid",
  "restaurar_todo": true,
  "tablas_seleccionadas": [], // Si restaurar_todo es false, especificar tablas
  "confirmar": true // Bandera de confirmación (seguridad)
}
```

**Response 202 (Accepted):**
```json
{
  "success": true,
  "message": "Restauración iniciada. Este proceso puede tardar varios minutos.",
  "data": {
    "restauracion_id": "uuid",
    "backup_id": "uuid",
    "estado": "en_progreso",
    "created_at": "2026-03-08T11:30:00Z"
  },
  "advertencia": "La restauración sobrescribirá todos los datos actuales. Esta acción no se puede deshacer."
}
```

---

#### 6. **Ver estado de restauración**
```
GET /api/restauraciones/:id
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "backup_id": "uuid",
    "estado": "completado",
    "restaurar_todo": true,
    "registros_restaurados": 15420,
    "duracion_segundos": 120,
    "iniciado_por": {
      "id": "uuid",
      "nombre": "Admin Principal"
    },
    "created_at": "2026-03-08T11:30:00Z",
    "completed_at": "2026-03-08T11:32:00Z"
  }
}
```

---

#### 7. **Eliminar backup**
```
DELETE /api/backups/:id
```

**Response 200:**
```json
{
  "success": true,
  "message": "Backup eliminado exitosamente"
}
```

---

#### 8. **Obtener configuración de backups**
```
GET /api/backups/configuracion
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "backup_automatico_activo": true,
    "frecuencia": "diario",
    "hora_ejecucion": "00:00:00",
    "dias_retencion": 30,
    "incluir_logs": false,
    "incluir_auditoria": false,
    "formato_backup": "sql",
    "compresion": true,
    "notificaciones": {
      "notificar_exito": false,
      "notificar_error": true,
      "emails_notificacion": ["admin@gimnasio.com"]
    },
    "proximo_backup_programado": "2026-03-09T00:00:00Z"
  }
}
```

---

#### 9. **Actualizar configuración de backups**
```
PUT /api/backups/configuracion
```

**Request Body:**
```json
{
  "backup_automatico_activo": true,
  "frecuencia": "semanal",
  "hora_ejecucion": "02:00:00",
  "dias_retencion": 60,
  "incluir_logs": false,
  "incluir_auditoria": false,
  "formato_backup": "sql",
  "compresion": true,
  "notificaciones": {
    "notificar_exito": true,
    "notificar_error": true,
    "emails_notificacion": ["admin@gimnasio.com", "soporte@gimnasio.com"]
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Configuración de backups actualizada",
  "data": {
    "backup_automatico_activo": true,
    "frecuencia": "semanal",
    "hora_ejecucion": "02:00:00",
    "dias_retencion": 60,
    "proximo_backup_programado": "2026-03-10T02:00:00Z"
  }
}
```

---

### **Lógica de Backup Automático (Supabase Function)**

```typescript
// backupAutomaticoFunction.ts

import { createClient } from '@supabase/supabase-js'

export async function crearBackupAutomatico() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  
  // 1. Obtener configuración
  const { data: config } = await supabase
    .from('configuracion_backups')
    .select('*')
    .single()
  
  if (!config.backup_automatico_activo) {
    return { success: false, message: 'Backups automáticos desactivados' }
  }
  
  // 2. Crear registro de backup
  const { data: backup, error } = await supabase
    .from('backups')
    .insert({
      tipo: 'automatico',
      estado: 'en_progreso',
      formato: config.formato_backup,
      gimnasio_id: config.gimnasio_id,
      fecha_expiracion: new Date(Date.now() + config.dias_retencion * 24 * 60 * 60 * 1000)
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creando registro de backup:', error)
    return { success: false, error }
  }
  
  const startTime = Date.now()
  
  try {
    // 3. Exportar datos de todas las tablas
    const tablas = ['socios', 'membresias', 'productos', 'movimientos', 'usuarios', 'asistencias', 'ventas']
    const backupData: any = {}
    let totalRegistros = 0
    
    for (const tabla of tablas) {
      const { data, error } = await supabase
        .from(tabla)
        .select('*')
      
      if (error) throw error
      
      backupData[tabla] = data
      totalRegistros += data.length
    }
    
    // 4. Generar archivo SQL o JSON
    let contenidoBackup: string
    let nombreArchivo: string
    
    if (config.formato_backup === 'json') {
      contenidoBackup = JSON.stringify(backupData, null, 2)
      nombreArchivo = `backup-${new Date().toISOString().split('T')[0]}.json`
    } else {
      // Generar SQL
      contenidoBackup = generarSQL(backupData)
      nombreArchivo = `backup-${new Date().toISOString().split('T')[0]}.sql`
    }
    
    // 5. Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('backups')
      .upload(nombreArchivo, contenidoBackup, {
        contentType: config.formato_backup === 'json' ? 'application/json' : 'application/sql',
        upsert: false
      })
    
    if (uploadError) throw uploadError
    
    // 6. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('backups')
      .getPublicUrl(nombreArchivo)
    
    // 7. Actualizar registro de backup
    const duracion = Math.floor((Date.now() - startTime) / 1000)
    const tamano = new Blob([contenidoBackup]).size
    
    await supabase
      .from('backups')
      .update({
        estado: 'completado',
        archivo_url: publicUrl,
        tamano_bytes: tamano,
        tablas_incluidas: tablas,
        numero_registros: totalRegistros,
        duracion_segundos: duracion,
        completed_at: new Date().toISOString()
      })
      .eq('id', backup.id)
    
    // 8. Enviar notificación si está configurado
    if (config.notificar_exito && config.emails_notificacion) {
      await enviarNotificacion({
        emails: config.emails_notificacion,
        asunto: '✅ Backup automático completado',
        mensaje: `Backup creado exitosamente. Tamaño: ${(tamano / 1024 / 1024).toFixed(2)} MB`
      })
    }
    
    return { success: true, backup }
    
  } catch (error) {
    // Marcar como fallido
    await supabase
      .from('backups')
      .update({
        estado: 'fallido',
        error_mensaje: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', backup.id)
    
    // Notificar error
    if (config.notificar_error && config.emails_notificacion) {
      await enviarNotificacion({
        emails: config.emails_notificacion,
        asunto: '❌ Error en backup automático',
        mensaje: `El backup falló: ${error.message}`
      })
    }
    
    return { success: false, error }
  }
}

function generarSQL(data: any): string {
  let sql = '-- Backup generado automáticamente\n'
  sql += `-- Fecha: ${new Date().toISOString()}\n\n`
  
  for (const [tabla, registros] of Object.entries(data)) {
    sql += `-- Tabla: ${tabla}\n`
    sql += `TRUNCATE TABLE ${tabla} CASCADE;\n`
    
    for (const registro of registros as any[]) {
      const columnas = Object.keys(registro).join(', ')
      const valores = Object.values(registro).map(v => 
        typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v
      ).join(', ')
      
      sql += `INSERT INTO ${tabla} (${columnas}) VALUES (${valores});\n`
    }
    
    sql += '\n'
  }
  
  return sql
}
```

---

### **Política de Retención y Limpieza**

```typescript
// Ejecutar diariamente con pg_cron o Supabase Function

export async function limpiarBackupsAntiguos() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  
  // Obtener backups expirados
  const { data: backupsExpirados } = await supabase
    .from('backups')
    .select('*')
    .lt('fecha_expiracion', new Date().toISOString())
  
  for (const backup of backupsExpirados || []) {
    // Eliminar archivo de storage
    const nombreArchivo = backup.archivo_url.split('/').pop()
    await supabase.storage
      .from('backups')
      .remove([nombreArchivo])
    
    // Eliminar registro de BD
    await supabase
      .from('backups')
      .delete()
      .eq('id', backup.id)
  }
  
  return { success: true, eliminados: backupsExpirados?.length || 0 }
}
```

---

### **Tecnologías Sugeridas**
- **Supabase Functions**: Para crear y restaurar backups
- **Supabase Storage**: Para almacenar archivos de backup
- **pg_cron** o **Supabase Edge Functions con cron**: Para programar backups automáticos
- **pg_dump** (PostgreSQL): Para exportar datos en formato SQL
- **Compresión gzip**: Para reducir tamaño de archivos

---

## 📊 Prioridad de Implementación

### **Fase 1: Core Features (Semana 1-2)** 🔥🔥🔥
1. Sistema de alertas básico
   - Tabla `alertas_sistema` y `configuracion_alertas`
   - Endpoint GET `/api/alertas`
   - Endpoint PUT `/api/alertas/configuracion`
   - Cron job para generar alertas de vencimientos y stock bajo

2. Sistema de backups básico
   - Tabla `backups` y `configuracion_backups`
   - Endpoint POST `/api/backups` (manual)
   - Endpoint GET `/api/backups`
   - Función de creación de backup

### **Fase 2: Gestión Completa (Semana 3)** 🔥🔥
1. Gestión de alertas
   - Endpoints PATCH para marcar vistas/resueltas/descartadas
   - Alertas de inactividad y pagos pendientes
   - Prioridades automáticas

2. Backups avanzados
   - Endpoint POST `/api/backups/:id/restore`
   - Tabla `restauraciones`
   - Endpoint DELETE `/api/backups/:id`
   - Configuración completa de retención

### **Fase 3: Optimizaciones (Semana 4)** 🔥
1. Notificaciones en tiempo real (Supabase Realtime)
2. Compresión de backups
3. Política de limpieza automática
4. Notificaciones por email

---

## 🎯 Notas de Implementación

### **Alertas**
- Las alertas se deben mostrar en el dashboard con badge de contador
- Usar colores según prioridad: urgente (rojo), alta (naranja), media (amarillo), baja (azul)
- Implementar sonido opcional cuando aparezca una alerta urgente
- Permitir filtrar y buscar alertas

### **Backups**
- **IMPORTANTE**: Siempre crear un backup antes de hacer actualizaciones importantes
- Los backups deben ser incrementales para ahorrar espacio (opcional en fase 3)
- Implementar progreso en tiempo real durante creación y restauración
- Validar integridad del backup antes de restaurar

---

## ✅ Checklist de Frontend

- [ ] Componente `AlertaCard` para mostrar alertas en dashboard
- [ ] Modal de configuración de alertas
- [ ] Tab de backups con historial
- [ ] Botón "Crear Backup Ahora" con barra de progreso
- [ ] Modal de confirmación para restaurar backup (doble confirmación)
- [ ] Visualización de espacio usado por backups
- [ ] Notificación toast cuando se completa un backup
- [ ] Indicador de próximo backup programado

---

## 🔐 Seguridad

- **Alertas**: Solo usuarios con permiso `configuracion.editar` pueden modificar configuración
- **Backups**: Solo usuarios con rol Admin pueden crear/restaurar/eliminar backups
- **Restauración**: Requiere doble confirmación y validación de usuario Admin
- **Storage**: Los archivos de backup deben estar en bucket privado (solo accesible con auth)

---

## 📝 Documentación Adicional

- Ver `BACKEND_ISSUES.md` para endpoints generales del sistema
- Ver documentación de Supabase Functions para deployment
- Ver documentación de pg_cron para configurar cron jobs

---

**Fin del documento** 📋
