# 📋 Especificaciones Backend - Sistema de Categorías

**Fecha:** 6 de marzo de 2026  
**Proyecto:** Hexodus - Sistema de Gestión Gimnasio  
**Rama:** ux/categorias-productos  
**Estado Actual:** Backend devuelve solo `{ id, nombre }` - Frontend necesita campos adicionales

---

## 🎯 RESUMEN EJECUTIVO

El frontend está implementado completamente pero el backend solo soporta operaciones básicas. Se necesitan:

1. **Extender modelo de Categoría**: Agregar 5 campos nuevos
2. **Modificar 2 endpoints existentes**: GET y PUT
3. **Implementar 1 endpoint nuevo**: DELETE con validaciones
4. **Agregar 1 endpoint de estadísticas**: GET stats por categoría
5. **Modificar respuesta de Productos**: Incluir categoria_id en el response

---

## 📊 ESTADO ACTUAL

### Backend Actual (Lo que tenemos):

#### 1. GET `/api/categorias`
```json
{
  "message": "Categorías obtenidas",
  "data": [
    { "id": 1, "nombre": "Equipamiento" },
    { "id": 2, "nombre": "Proteinas" },
    { "id": 3, "nombre": "Suplementos" }
  ]
}
```

#### 2. POST `/api/categorias`
**Request:**
```json
{ "nombre": "Bebidas" }
```

**Response:**
```json
{
  "message": "Categoría creada.",
  "data": { "id": 4, "nombre": "Bebidas" }
}
```

#### 3. PUT `/api/categorias/:id` ❓ (No confirmado si existe)
#### 4. DELETE `/api/categorias/:id` ❓ (No confirmado si existe)

---

## 🔧 MODIFICACIONES NECESARIAS

### 📦 1. MODELO DE DATOS - Tabla `categorias`

**Agregar las siguientes columnas:**

```sql
ALTER TABLE categorias ADD COLUMN prefijo VARCHAR(6) NULL;
ALTER TABLE categorias ADD COLUMN color VARCHAR(7) DEFAULT '#6B7280';
ALTER TABLE categorias ADD COLUMN descripcion TEXT NULL;
ALTER TABLE categorias ADD COLUMN estado VARCHAR(10) DEFAULT 'activa';
ALTER TABLE categorias ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE categorias ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

**Estructura completa esperada:**

| Campo | Tipo | Constraints | Default | Descripción |
|-------|------|-------------|---------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | - | ID único |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE | - | Nombre de categoría |
| `prefijo` | VARCHAR(6) | NULL, UNIQUE (si no es NULL) | NULL | Prefijo para códigos (ej: "PROT", "CREAT") |
| `color` | VARCHAR(7) | NOT NULL | '#6B7280' | Color hex (#RRGGBB) |
| `descripcion` | TEXT | NULL | NULL | Descripción opcional |
| `estado` | ENUM('activa','inactiva') | NOT NULL | 'activa' | Estado de la categoría |
| `created_at` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Última actualización |

---

### 🔄 2. ENDPOINTS A MODIFICAR

#### 📥 GET `/api/categorias`

**ANTES (actual):**
```json
{
  "message": "Categorías obtenidas",
  "data": [
    { "id": 1, "nombre": "Equipamiento" }
  ]
}
```

**DESPUÉS (requerido):**
```json
{
  "message": "Categorías obtenidas",
  "data": [
    {
      "id": 1,
      "nombre": "Equipamiento",
      "prefijo": "EQUIP",
      "color": "#3B82F6",
      "descripcion": "Equipamiento deportivo y accesorios",
      "estado": "activa",
      "created_at": "2026-01-15T10:30:00.000Z",
      "updated_at": "2026-02-20T14:45:00.000Z",
      "total_productos": 15
    },
    {
      "id": 2,
      "nombre": "Proteinas",
      "prefijo": "PROT",
      "color": "#A855F7",
      "descripcion": null,
      "estado": "activa",
      "created_at": "2026-01-16T11:00:00.000Z",
      "updated_at": "2026-01-16T11:00:00.000Z",
      "total_productos": 8
    }
  ]
}
```

**Query SQL recomendada:**
```sql
SELECT 
  c.id,
  c.nombre,
  c.prefijo,
  c.color,
  c.descripcion,
  c.estado,
  c.created_at,
  c.updated_at,
  COUNT(p.id) as total_productos
FROM categorias c
LEFT JOIN productos p ON p.categoria_id = c.id AND p.status = 'activo'
GROUP BY c.id
ORDER BY c.nombre ASC;
```

---

#### ✏️ PUT `/api/categorias/:id` (Actualizar categoría)

**Request Body:**
```json
{
  "nombre": "Equipamiento Deportivo",
  "prefijo": "EQUIP",
  "color": "#22C55E",
  "descripcion": "Todo tipo de equipamiento para gimnasio",
  "estado": "activa"
}
```

**Validaciones requeridas:**
- ✅ `nombre`: Mínimo 3 caracteres, único (excepto la misma categoría)
- ✅ `prefijo`: 
  - Opcional (puede ser NULL)
  - Si se provee: 2-6 caracteres, solo letras mayúsculas y números
  - Único (excepto la misma categoría y NULL)
  - Ejemplos válidos: "PROT", "CREAT", "VIT", "G123"
- ✅ `color`: Formato hex válido (#RRGGBB)
- ✅ `descripcion`: Opcional, máximo 500 caracteres
- ✅ `estado`: Solo 'activa' o 'inactiva'

**Response esperado:**
```json
{
  "message": "Categoría actualizada exitosamente",
  "data": {
    "id": 1,
    "nombre": "Equipamiento Deportivo",
    "prefijo": "EQUIP",
    "color": "#22C55E",
    "descripcion": "Todo tipo de equipamiento para gimnasio",
    "estado": "activa",
    "created_at": "2026-01-15T10:30:00.000Z",
    "updated_at": "2026-03-06T15:20:00.000Z"
  }
}
```

**Errores posibles:**
```json
// 404 - Categoría no encontrada
{
  "error": "Categoría no encontrada",
  "status": 404
}

// 409 - Nombre duplicado
{
  "error": "Ya existe una categoría con ese nombre",
  "field": "nombre",
  "status": 409
}

// 409 - Prefijo duplicado
{
  "error": "Ya existe una categoría con ese prefijo",
  "field": "prefijo",
  "status": 409
}

// 400 - Validación fallida
{
  "error": "El prefijo solo puede contener letras mayúsculas y números (2-6 caracteres)",
  "field": "prefijo",
  "status": 400
}
```

---

#### ✨ POST `/api/categorias` (Crear categoría)

**Request Body (EXTENDIDO):**
```json
{
  "nombre": "Bebidas",
  "prefijo": "BEB",
  "color": "#06B6D4",
  "descripcion": "Bebidas energéticas e hidratantes",
  "estado": "activa"
}
```

**Validaciones:**
- ✅ `nombre`: Requerido, mínimo 3 caracteres, único
- ✅ `prefijo`: Opcional, si se provee validar formato (2-6 chars, mayúsculas/números, único)
- ✅ `color`: Opcional, default '#6B7280' (gris), validar formato hex
- ✅ `descripcion`: Opcional, máximo 500 caracteres
- ✅ `estado`: Opcional, default 'activa'

**Response esperado:**
```json
{
  "message": "Categoría creada exitosamente",
  "data": {
    "id": 5,
    "nombre": "Bebidas",
    "prefijo": "BEB",
    "color": "#06B6D4",
    "descripcion": "Bebidas energéticas e hidratantes",
    "estado": "activa",
    "created_at": "2026-03-06T15:25:00.000Z",
    "updated_at": "2026-03-06T15:25:00.000Z"
  }
}
```

---

### 🆕 3. ENDPOINTS NUEVOS

#### ❌ DELETE `/api/categorias/:id` (Eliminar categoría)

**⚠️ CRÍTICO: Validar antes de eliminar**

**Regla de negocio:**
- **NO se puede eliminar** una categoría que tiene productos asociados
- Validar contando productos: `SELECT COUNT(*) FROM productos WHERE categoria_id = :id`

**Casos:**

**✅ CASO 1: Categoría sin productos**
```http
DELETE /api/categorias/5
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Categoría eliminada exitosamente"
}
```

**❌ CASO 2: Categoría con productos**
```http
DELETE /api/categorias/2
Authorization: Bearer {token}
```

**Response (409):**
```json
{
  "error": "No se puede eliminar la categoría porque tiene 8 productos asociados",
  "status": 409,
  "total_productos": 8,
  "suggestion": "Mueve los productos a otra categoría antes de eliminar"
}
```

**Query SQL recomendada:**
```sql
-- 1. Verificar productos asociados
SELECT COUNT(*) as total FROM productos WHERE categoria_id = :id;

-- 2. Si total = 0, eliminar
DELETE FROM categorias WHERE id = :id;

-- 3. Si total > 0, retornar error 409
```

---

#### 📊 GET `/api/categorias/:id/stats` (Estadísticas de categoría)

**Request:**
```http
GET /api/categorias/2/stats
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Estadísticas obtenidas",
  "data": {
    "categoria_id": 2,
    "categoria_nombre": "Proteinas",
    "total_productos": 8,
    "productos_activos": 7,
    "productos_inactivos": 1,
    "productos_bajo_stock": 2,
    "valor_total_inventario": 15670.50,
    "producto_mas_vendido": {
      "id": 45,
      "nombre": "Whey Protein Gold Standard",
      "total_ventas": 125
    }
  }
}
```

**Query SQL recomendada:**
```sql
SELECT 
  COUNT(*) as total_productos,
  SUM(CASE WHEN status = 'activo' THEN 1 ELSE 0 END) as productos_activos,
  SUM(CASE WHEN status = 'inactivo' THEN 1 ELSE 0 END) as productos_inactivos,
  SUM(CASE WHEN alerta_stock = true THEN 1 ELSE 0 END) as productos_bajo_stock,
  SUM(stock_actual * precio_venta) as valor_total_inventario
FROM productos
WHERE categoria_id = :id;
```

---

### 🔗 4. MODIFICACIÓN EN PRODUCTOS

#### 📥 GET `/api/productos` y GET `/api/productos/:id`

**⚠️ IMPORTANTE: Incluir `categoria_id` en el response**

**ANTES (actual):**
```json
{
  "id": 123,
  "codigo": "PROT-456",
  "nombre": "Whey Protein",
  "categoria": "Proteinas",  // ← Solo nombre
  "precio_venta": 850.00
}
```

**DESPUÉS (requerido):**
```json
{
  "id": 123,
  "codigo": "PROT-456",
  "nombre": "Whey Protein",
  "categoria": "Proteinas",      // ← Mantener nombre
  "categoria_id": 2,              // ← AGREGAR ID
  "precio_venta": 850.00
}
```

**Razón:** El frontend necesita `categoria_id` para:
- Editar productos y preservar la categoría correcta
- Validar relaciones antes de eliminar categorías
- Filtrar productos por categoría

---

## 🔐 VALIDACIONES Y REGLAS DE NEGOCIO

### 1. Validación de Prefijo

```javascript
// Regex para validar prefijo
const PREFIJO_REGEX = /^[A-Z0-9]{2,6}$/;

function validarPrefijo(prefijo) {
  if (!prefijo) return { valido: true }; // Opcional
  
  if (prefijo.length < 2 || prefijo.length > 6) {
    return { 
      valido: false, 
      error: "El prefijo debe tener entre 2 y 6 caracteres" 
    };
  }
  
  if (!PREFIJO_REGEX.test(prefijo)) {
    return { 
      valido: false, 
      error: "El prefijo solo puede contener letras mayúsculas y números" 
    };
  }
  
  return { valido: true };
}
```

### 2. Validación de Color

```javascript
// Regex para validar color hex
const COLOR_REGEX = /^#[0-9A-F]{6}$/i;

function validarColor(color) {
  if (!color) return { valido: true, colorFinal: '#6B7280' };
  
  if (!COLOR_REGEX.test(color)) {
    return { 
      valido: false, 
      error: "El color debe estar en formato hexadecimal (#RRGGBB)" 
    };
  }
  
  return { valido: true, colorFinal: color.toUpperCase() };
}
```

### 3. Validación de Estado

```javascript
const ESTADOS_VALIDOS = ['activa', 'inactiva'];

function validarEstado(estado) {
  if (!estado) return { valido: true, estadoFinal: 'activa' };
  
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return { 
      valido: false, 
      error: "El estado debe ser 'activa' o 'inactiva'" 
    };
  }
  
  return { valido: true, estadoFinal: estado };
}
```

### 4. Evitar Eliminación con Productos

```sql
-- Procedimiento recomendado para DELETE
BEGIN TRANSACTION;

-- 1. Contar productos
SELECT COUNT(*) as total_productos 
FROM productos 
WHERE categoria_id = :id
INTO @count;

-- 2. Si hay productos, retornar error
IF @count > 0 THEN
  ROLLBACK;
  RETURN ERROR 409: 'Categoría tiene productos asociados';
END IF;

-- 3. Si no hay, eliminar
DELETE FROM categorias WHERE id = :id;

COMMIT;
```

---

## 📝 NOTAS DE IMPLEMENTACIÓN

### Valores por Defecto

| Campo | Default | Notas |
|-------|---------|-------|
| `prefijo` | `NULL` | Opcional, el frontend puede generar uno |
| `color` | `#6B7280` | Gris neutral |
| `descripcion` | `NULL` | Totalmente opcional |
| `estado` | `activa` | Nueva categoría siempre activa |

### Índices Recomendados

```sql
-- Índice único para nombre
CREATE UNIQUE INDEX idx_categoria_nombre ON categorias(nombre);

-- Índice único para prefijo (excluyendo NULL)
CREATE UNIQUE INDEX idx_categoria_prefijo ON categorias(prefijo) WHERE prefijo IS NOT NULL;

-- Índice para búsquedas por estado
CREATE INDEX idx_categoria_estado ON categorias(estado);
```

### Cascadas y Restricciones

```sql
-- NO usar ON DELETE CASCADE en productos
-- El frontend valida antes y el backend debe rechazar la eliminación

ALTER TABLE productos 
ADD CONSTRAINT fk_productos_categoria 
FOREIGN KEY (categoria_id) 
REFERENCES categorias(id)
ON DELETE RESTRICT  -- ← Evita eliminación accidental
ON UPDATE CASCADE;
```

---

## 🧪 CASOS DE PRUEBA

### Test 1: Crear categoría completa
```bash
curl -X POST https://hexodusapi.vercel.app/api/categorias \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Vitaminas",
    "prefijo": "VIT",
    "color": "#22C55E",
    "descripcion": "Suplementos vitamínicos",
    "estado": "activa"
  }'
```

**Esperado:** Status 201, categoría creada con todos los campos

### Test 2: Crear categoría mínima (solo nombre)
```bash
curl -X POST https://hexodusapi.vercel.app/api/categorias \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{ "nombre": "Accesorios" }'
```

**Esperado:** Status 201, campos opcionales con valores default

### Test 3: Prefijo inválido
```bash
curl -X POST https://hexodusapi.vercel.app/api/categorias \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test",
    "prefijo": "abc"
  }'
```

**Esperado:** Status 400, error "prefijo debe ser mayúsculas"

### Test 4: Eliminar categoría con productos
```bash
curl -X DELETE https://hexodusapi.vercel.app/api/categorias/2 \
  -H "Authorization: Bearer {token}"
```

**Esperado:** Status 409, error con total de productos y sugerencia

### Test 5: Actualizar solo algunos campos
```bash
curl -X PUT https://hexodusapi.vercel.app/api/categorias/5 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "color": "#EF4444",
    "estado": "inactiva"
  }'
```

**Esperado:** Status 200, solo color y estado actualizados

---

## 🚀 PRIORIDAD DE IMPLEMENTACIÓN

### Fase 1 (Crítico - Bloqueante)
1. ✅ Modificar modelo: Agregar 6 columnas a tabla `categorias`
2. ✅ Modificar GET `/api/categorias`: Incluir todos los campos + `total_productos`
3. ✅ Modificar GET `/api/productos`: Agregar `categoria_id` al response

### Fase 2 (Alto - Necesario para CRUD)
4. ✅ Implementar/Modificar POST `/api/categorias`: Aceptar campos adicionales
5. ✅ Implementar/Modificar PUT `/api/categorias/:id`: Update completo
6. ✅ Implementar DELETE `/api/categorias/:id`: Con validación de productos

---

## 📞 CONTACTO Y DUDAS

**Frontend Lead:** Brayan Chan  
**Branch:** `ux/categorias-productos`  
**Archivos clave:**
- `lib/types/categorias.ts` - Tipos TypeScript (referencia de estructura)
- `lib/services/categorias.ts` - Llamadas HTTP esperadas
- `components/inventario/categorias-tab.tsx` - UI que consume los datos

**Preguntas frecuentes:**

**Q: ¿Por qué `prefijo` es opcional?**  
A: El frontend puede auto-generarlo ("Proteínas" → "PROT"), pero el backend debe almacenarlo.

**Q: ¿Los 9 colores son fijos?**  
A: El frontend sugiere 9 colores, pero el backend debe aceptar cualquier hex válido.

**Q: ¿Qué pasa si elimino una categoría?**  
A: El backend debe rechazar (409) si tiene productos. El frontend validará antes.

---

## 📄 ANEXO: Estructura JSON Completa

```typescript
// Categoría completa (TypeScript)
interface Categoria {
  id: number
  nombre: string              // Requerido, único
  prefijo: string | null      // Opcional, único si no NULL, 2-6 chars mayúsculas
  color: string               // Default '#6B7280', formato #RRGGBB
  descripcion: string | null  // Opcional, max 500 chars
  estado: 'activa' | 'inactiva' // Default 'activa'
  created_at: string          // ISO 8601
  updated_at: string          // ISO 8601
  total_productos?: number    // Calculado (solo en GET list)
}
```

---

**Documento generado el:** 6 de marzo de 2026  
**Versión:** 1.0  
**Estado:** Listo para implementación backend
