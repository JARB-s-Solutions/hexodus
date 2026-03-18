# ✅ Checklist de Configuración - Sistema de Reconocimiento Facial

Este documento te guía paso a paso para configurar el sistema completo de reconocimiento facial.

---

## 🎯 ¿Primera vez aquí?

**Lee primero:** [RESUMEN_EJECUTIVO.md](./RESUMEN_EJECUTIVO.md) para entender:
- ✅ Qué funciona y qué falta
- 🔴 Por qué DEBES guardar el descriptor en BD
- 📋 Checklist de prioridades
- 🚀 Próximos pasos críticos

---

## 📋 Pre-requisitos

- [x] Face-API.js instalado (v0.22.2)
- [x] Cloudinary instalado (v2.9.0)
- [x] Modelos de Face-API descargados en `public/models/`
- [x] Cuenta de Cloudinary creada
- [x] Variables de entorno configuradas
- [x] Navegador compatible (Chrome, Edge, Safari)
- [x] Webcam conectada y funcionando

## 🔧 Paso 1: Crear Cuenta en Cloudinary

1. Ve a [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Regístrate con tu email (plan gratuito: 25GB almacenamiento)
3. Verifica tu email
4. Accede al [Dashboard de Cloudinary](https://cloudinary.com/console)

## 🔑 Paso 2: Obtener Credenciales

1. En el Dashboard de Cloudinary, ve a la sección **"Account Details"**
2. Copia los siguientes valores:
   - **Cloud Name** (ejemplo: `dxy123abc`)
   - **API Key** (ejemplo: `123456789012345`)
   - **API Secret** (clic en el ojo para revelar)

## 📝 Paso 3: Configurar Variables de Entorno

1. En la raíz del proyecto, crea el archivo `.env.local`:

```bash
# En la terminal, dentro del proyecto:
cp .env.example .env.local
```

2. Edita `.env.local` y agrega tus credenciales:

```env
# ====================================
# CONFIGURACIÓN CLOUDINARY
# ====================================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name-aqui
CLOUDINARY_API_KEY=tu-api-key-aqui
CLOUDINARY_API_SECRET=tu-api-secret-aqui

# ====================================
# CONFIGURACIÓN BASE DE DATOS
# ====================================
DATABASE_URL=tu-database-url-aqui

# ====================================
# CONFIGURACIÓN NEXT.JS
# ====================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **¡IMPORTANTE!** Nunca subas `.env.local` a Git (ya está en `.gitignore`)

## 🚀 Paso 4: Probar el Sistema

### Iniciar el Servidor de Desarrollo

```bash
pnpm dev
```

El proyecto debería iniciar en [http://localhost:3000](http://localhost:3000)

### Probar Captura Facial

1. Navega al módulo **Socios**
2. Click en **"Nuevo Socio"**
3. En la sección "Información Biométrica", click **"Capturar Rostro"**
4. El navegador solicitará permiso para la cámara → **Permitir**
5. Verás un loader: _"Cargando modelos de reconocimiento facial..."_ (primera vez: ~5-10 segundos)
6. La cámara se activará y verás tu rostro en pantalla
7. Posiciona tu rostro en el círculo
8. Después de ~1 segundo, el círculo se pondrá verde ✅
9. Click en **"Confirmar Captura"**
10. Countdown 3-2-1 y captura automática
11. Verás un toast: _"⏳ Subiendo imagen..."_
12. Si todo funciona: _"✓ Rostro capturado"_ ✅

### Verificar Upload a Cloudinary

1. Ve al [Media Library de Cloudinary](https://cloudinary.com/console/media_library)
2. Busca la carpeta `hexodus/socios/perfiles/`
3. Deberías ver la imagen capturada con transformaciones aplicadas

### Revisar Console Logs

Abre DevTools (F12) y verifica:

```
✅ Face-API.js ya está inicializado
📦 Cargando modelos de Face-API.js...
✅ Modelos de Face-API.js cargados exitosamente
✅ Cámara inicializada correctamente
✅ Rostro detectado con 128 dimensiones
📸 Imagen capturada correctamente
🧬 Descriptor facial generado: 128 dimensiones
✅ Imagen subida a Cloudinary: https://res.cloudinary.com/...
```

## 🔍 Troubleshooting

### ❌ Error: "Permiso de cámara denegado"

**Solución:**
- En Chrome: `chrome://settings/content/camera`
- Permitir acceso para `localhost`
- Recargar página

### ❌ Error: "Error al cargar los modelos"

**Solución:**
```bash
# Verificar que los modelos estén en public/models/
ls -la public/models/

# Deberías ver 7 archivos:
# - tiny_face_detector_model-weights_manifest.json
# - tiny_face_detector_model-shard1
# - face_landmark_68_model-weights_manifest.json
# - face_landmark_68_model-shard1
# - face_recognition_model-weights_manifest.json
# - face_recognition_model-shard1
# - face_recognition_model-shard2
```

### ❌ Error: "Error al subir la imagen"

**Causa:** Variables de entorno incorrectas

**Solución:**
1. Verifica que `.env.local` exista en la raíz
2. Verifica que las credenciales sean correctas (copia-pega desde Cloudinary)
3. Reinicia el servidor: `Ctrl+C` y `pnpm dev`

### ⚠️ Advertencia: "Rostro capturado (local)"

**Causa:** Upload a Cloudinary falló, pero la captura se guardó en base64

**Impacto:** Funciona, pero la imagen no está en la nube

**Solución:**
- Verifica conexión a internet
- Verifica credenciales Cloudinary
- Revisa logs del servidor para más detalles

## 📊 Verificación de Datos

### Estructura del Descriptor Facial

```typescript
console.log({
  dimensiones: faceEncoding.length,     // Debe ser 128
  tipo: typeof faceEncoding[0],         // Debe ser 'number'
  rango: [
    Math.min(...faceEncoding),          // ~-0.5 a 0
    Math.max(...faceEncoding)           // ~0 a 0.5
  ],
  ejemplo: faceEncoding.slice(0, 5)     // [0.123, -0.456, 0.789, ...]
})
```

### Verificar en Base de Datos

Cuando implementes el backend, verifica que se guarde:

```sql
SELECT 
  nombre,
  foto_perfil_url,                      -- URL de Cloudinary
  LENGTH(face_descriptor),              -- Debe ser ~3000-5000 chars (JSON)
  bio_rostro                            -- Debe ser true
FROM socios
WHERE bio_rostro = true;
```

## ⚠️ IMPORTANTE: Descriptor Facial en Base de Datos

### 🔴 Problema Detectado

Si tu endpoint actual **NO está guardando** el descriptor facial:

```json
{
  "biometrico_rostro": true,  // ✅ Flag guardado
  "foto_perfil_url": "...",   // ✅ Imagen en Cloudinary
  // ❌ FALTA: face_descriptor
}
```

**Sin el descriptor facial, NO podrás validar asistencias** porque no hay nada con qué comparar el rostro capturado.

### ✅ Solución Requerida

**DEBES agregar un campo a tu tabla `socios` para almacenar el descriptor:**

```sql
ALTER TABLE socios 
ADD COLUMN face_descriptor TEXT NULL;
```

**Y actualizar tu endpoint `POST /api/socios` para guardar:**

```javascript
{
  // ... otros campos ...
  face_descriptor: JSON.stringify(faceEncoding),  // Array de 128 números
  biometrico_rostro: true,
  foto_perfil_url: cloudinaryUrl
}
```

### 📊 ¿Por qué en Base de Datos?

| ✅ Base de Datos | ❌ LocalStorage |
|------------------|-----------------|
| Persistente | Se borra fácilmente |
| Multi-dispositivo | Solo un navegador |
| Seguro | Vulnerable |
| Con backup | Sin backup |
| GDPR compliant | Sin control |

**Tamaño del descriptor:** ~3-5 KB como JSON string (128 números flotantes)

### 📖 Documentación Completa

Lee [ASISTENCIAS_API.md](./ASISTENCIAS_API.md) para:
- ✅ Propuesta completa de almacenamiento
- ✅ 7 endpoints necesarios para asistencias
- ✅ Esquema de base de datos
- ✅ Ejemplos de implementación
- ✅ Seguridad y mejores prácticas

## 🎯 Siguientes Pasos

Una vez que todo esté funcionando:

- [ ] **🔥 CRÍTICO: Agregar campo `face_descriptor` a tabla `socios`**
- [ ] **🔥 CRÍTICO: Actualizar endpoint `POST /api/socios` para guardar descriptor**
- [ ] Crear tabla `asistencias` (ver [ASISTENCIAS_API.md](./ASISTENCIAS_API.md))
- [ ] Implementar endpoint `POST /api/asistencia/validar` para reconocimiento
- [ ] Implementar endpoint `GET /api/asistencia` para historial
- [ ] Implementar endpoint `GET /api/asistencia/hoy` para dashboard
- [ ] Implementar sistema de comparación biométrica
- [ ] Agregar logs de acceso y auditoría
- [ ] Implementar captura de huella digital (opcional)
- [ ] Agregar política de privacidad GDPR-compliant
- [ ] Crear componente kiosk de validación para entrada

## 📚 Documentación Adicional

- [FACIAL_RECOGNITION.md](./FACIAL_RECOGNITION.md) - Documentación técnica completa
- [ASISTENCIAS_API.md](./ASISTENCIAS_API.md) - **🔥 Sistema de asistencias y endpoints necesarios**
- [public/models/README.md](./public/models/README.md) - Info sobre modelos
- [.env.example](./.env.example) - Plantilla de variables de entorno

## ✅ Sistema Listo

Si todos los pasos están completos:

```
✓ Cloudinary configurado
✓ Cámara funcionando
✓ Face-API detectando rostros
✓ Imagen subiendo a Cloudinary
✓ Descriptor facial generado (128 dims)
```

**⚠️ Para que el sistema de asistencias funcione, DEBES:**
1. Agregar campo `face_descriptor` a tu tabla `socios`
2. Actualizar endpoint de registro para guardar el descriptor
3. Implementar endpoints de validación (ver [ASISTENCIAS_API.md](./ASISTENCIAS_API.md))

**¡El sistema de reconocimiento facial está completamente operativo! 🎉**

**Siguiente paso crítico:** Lee [ASISTENCIAS_API.md](./ASISTENCIAS_API.md) para implementar el sistema de validación de asistencias.

---

### Contacto

Si encuentras problemas, revisa:
1. Console logs en DevTools (F12)
2. Network tab para verificar requests
3. Terminal del servidor para errores de API
4. [Issues en GitHub](tu-repo/issues) para reportar bugs
