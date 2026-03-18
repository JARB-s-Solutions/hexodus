# Modelos de Face-API.js

Esta carpeta contiene los modelos de redes neuronales necesarios para el reconocimiento facial.

## Modelos Incluidos

### 1. TinyFaceDetector
- **Archivos:**
  - `tiny_face_detector_model-weights_manifest.json`
  - `tiny_face_detector_model-shard1`
- **Tamaño:** ~189 KB
- **Propósito:** Detección de rostros en imágenes/video
- **Características:** Ligero y rápido, ideal para aplicaciones en tiempo real

### 2. FaceLandmark68Net
- **Archivos:**
  - `face_landmark_68_model-weights_manifest.json`
  - `face_landmark_68_model-shard1`
- **Tamaño:** ~348 KB
- **Propósito:** Detección de 68 puntos faciales (landmarks)
- **Características:** Identifica ojos, nariz, boca, contorno facial

### 3. FaceRecognitionNet
- **Archivos:**
  - `face_recognition_model-weights_manifest.json`
  - `face_recognition_model-shard1`
  - `face_recognition_model-shard2`
- **Tamaño:** ~6.3 MB
- **Propósito:** Generación de descriptores faciales únicos (128 dimensiones)
- **Características:** Permite comparación y reconocimiento de rostros

## Uso

Los modelos se cargan automáticamente cuando se inicializa Face-API.js:

```typescript
import { initializeFaceAPI } from '@/lib/faceapi-config'

await initializeFaceAPI()
```

## Origen

Los modelos provienen del repositorio oficial de Face-API.js:
https://github.com/justadudewhohacks/face-api.js

## Licencia

Los modelos están bajo la licencia MIT, al igual que Face-API.js.

## Notas

- Los modelos se sirven desde la carpeta `public/models/`
- Se cargan bajo demanda cuando se abre el modal de captura facial
- El tamaño total es de aproximadamente 7 MB
- Se recomienda mantener estos archivos en el control de versiones para deployment

## Alternativa: CDN

Si prefieres no incluir los modelos en tu repositorio, puedes cargarlos desde un CDN:

```typescript
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
```

Sin embargo, esto requiere conexión a internet y puede ser más lento en la primera carga.
