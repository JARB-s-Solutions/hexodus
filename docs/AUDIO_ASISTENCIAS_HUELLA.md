# 🔊 Guía de Archivos de Sonido para Sistema de Asistencias

## 📋 Resumen

El sistema de asistencia con huella dactilar utiliza feedback auditivo para mejorar la experiencia del usuario. Esta guía detalla los archivos de sonido necesarios y sus especificaciones.

## 📂 Ubicación

Todos los archivos de sonido deben estar en: `/public/sounds/`

## 🎵 Archivos Requeridos

### 1. ✅ `success.wav` (Ya existe)
- **Uso**: Cuando la huella es reconocida y el acceso es permitido (membresía vigente)
- **Características**: 
  - Tono agradable, ascendente
  - Duración: 0.5-1 segundo
  - Formato recomendado: WAV, 44.1kHz, mono o estéreo
- **Estado**: ✅ **YA IMPLEMENTADO**

### 2. ⚠️ `warning.wav` (Necesario crear)
- **Uso**: Cuando el acceso es permitido pero la membresía está próxima a vencer (≤3 días)
- **Características**:
  - Tono medio, dos beeps cortos
  - Duración: 0.7-1 segundo
  - No debe ser alarmante, pero sí llamar la atención
  - Sugerencia: Dos tonos (do-mi) o similar
- **Estado**: ❌ **PENDIENTE**

### 3. ❌ `error.wav` (Necesario crear)
- **Uso**: Cuando el acceso es denegado (huella no reconocida, membresía vencida, etc.)
- **Características**:
  - Tono grave, descendente
  - Duración: 0.8-1.2 segundos
  - Debe ser claramente distinguible de success
  - Sugerencia: Dos tonos bajos (mi-do) con fade out
- **Estado**: ❌ **PENDIENTE**

### 4. 🔔 `beep-start.wav` (Necesario crear)
- **Uso**: Cuando el sensor detecta un dedo y comienza la captura
- **Características**:
  - Beep corto y agudo
  - Duración: 0.2-0.3 segundos
  - Confirma que el sistema detectó el dedo
  - Sugerencia: Tono único agudo (la o si)
- **Estado**: ❌ **PENDIENTE**

### 5. 📊 `scan-progress.wav` (Opcional)
- **Uso**: Durante la captura de la huella (loop continuo)
- **Características**:
  - Sonido sutil tipo "escaneo"
  - Duración: 0.5 segundos (diseñado para loop)
  - Volumen muy bajo para no molestar
- **Estado**: ⭕ **OPCIONAL**

## 🎛️ Configuración en el Código

Los sonidos se precargan al montar el componente:

```typescript
audioSuccessRef.current = new Audio('/sounds/success.wav')     // ✅ Existe
audioWarningRef.current = new Audio('/sounds/warning.wav')     // ❌ Pendiente
audioErrorRef.current = new Audio('/sounds/error.wav')         // ❌ Pendiente
audioBeepRef.current = new Audio('/sounds/beep-start.wav')     // ❌ Pendiente

// Configuración común
audio.volume = 0.7           // 70% volumen (ajustable)
audio.preload = 'auto'       // Precarga automática
```

## 🛠️ Cómo Crear los Sonidos

### Opción 1: Generadores en Línea (Rápido)

1. **sfxr** (http://www.drpetter.se/project_sfxr.html)
   - Software gratuito para crear efectos de sonido
   - Presets para success, error, beep
   - Exporta directamente a WAV

2. **Audacity** (https://www.audacityteam.org/)
   - Generar → Tono...
   - Ajustar frecuencia y duración
   - Exportar como WAV

3. **Online Tone Generator** (https://onlinetonegenerator.com/)
   - Generar tonos específicos
   - Descargar como archivo de audio

### Opción 2: Bibliotecas de Efectos (Profesional)

1. **Freesound** (https://freesound.org/)
   - Buscar: "success beep", "error buzz", "warning tone"
   - Filtrar por licencia Creative Commons
   - Descargar y editar según necesidad

2. **Zapsplat** (https://www.zapsplat.com/)
   - Sección de UI Sounds
   - Tonos y beeps prediseñados

### Opción 3: Especificaciones Técnicas por Tono

Si tienes un sintetizador o software de audio:

| Sonido | Frecuencia | Duración | Patrón |
|--------|-----------|----------|---------|
| **success.wav** | 523 Hz (C5) → 659 Hz (E5) | 0.5s | Ascendente suave |
| **warning.wav** | 440 Hz (A4) → 550 Hz (C#5) | 0.7s | Dos pulsos cortos |
| **error.wav** | 330 Hz (E4) → 261 Hz (C4) | 1.0s | Descendente con fade |
| **beep-start.wav** | 880 Hz (A5) | 0.2s | Pulso único |

## 📦 Archivos Temporales (Para Testing)

Si necesitas probar el sistema mientras consigues los sonidos definitivos, puedes:

1. **Usar sonidos del sistema operativo**
   - Copiar beeps básicos de Windows/Mac
   - Renombrar según necesidad

2. **Crear placeholders silenciosos**
   ```bash
   # Generar archivo WAV silencioso (requiere ffmpeg)
   ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.5 -q:a 9 -acodec pcm_s16le warning.wav
   ```

3. **Duplicar success.wav**
   - Copiar `success.wav` → `warning.wav`
   - Copiar `success.wav` → `error.wav`
   - Copiar `success.wav` → `beep-start.wav`
   - (Solo para evitar errores 404 durante desarrollo)

## 🧪 Testing

Para probar los sonidos en el navegador:

```javascript
// Abrir consola en /asistencia/huella
const audio = new Audio('/sounds/warning.wav')
audio.volume = 0.7
audio.play()
```

## 📊 Tamaño de Archivos Recomendado

| Archivo | Tamaño ideal | Tamaño máximo |
|---------|--------------|---------------|
| success.wav | 20-50 KB | 100 KB |
| warning.wav | 20-50 KB | 100 KB |
| error.wav | 30-60 KB | 120 KB |
| beep-start.wav | 10-20 KB | 50 KB |

## ⚙️ Configuración Avanzada

### Volumen Personalizado por Usuario

En futuras versiones, se puede permitir ajustar el volumen:

```typescript
// En configuración de usuario
const userConfig = {
  soundEnabled: true,
  soundVolume: 0.7  // 0.0 a 1.0
}

audioSuccessRef.current.volume = userConfig.soundVolume
```

### Deshabilitar Sonidos

Para deshabilitar sonidos temporalmente:

```typescript
// En el componente
const [soundEnabled, setSoundEnabled] = useState(true)

// Al reproducir
if (soundEnabled) {
  audioSuccessRef.current?.play()
}
```

## 🎯 Prioridad de Implementación

1. **Alta**: `error.wav` - Fundamental para feedback de acceso denegado
2. **Alta**: `warning.wav` - Importante para alertar vencimiento
3. **Media**: `beep-start.wav` - Mejora UX confirmando detección
4. **Baja**: `scan-progress.wav` - Opcional, más cosmético

## 📝 Notas Adicionales

- Los sonidos deben ser **consistentes** con la identidad del gimnasio
- Evitar sonidos **demasiado fuertes** que puedan alarmar
- Considerar **accesibilidad**: los sonidos complementan las señales visuales
- Probar en **diferentes navegadores** (Chrome, Firefox, Safari)
- Verificar que funcionen en **modo de pantalla completa** (kiosk mode)

## 🔗 Referencias

- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- HTML Audio Element: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
- Diseño de Sonido UI: https://www.nngroup.com/articles/audio-feedback/

---

**Última actualización**: 9 de marzo de 2026
**Mantenedor**: Equipo de Desarrollo Hexodus
