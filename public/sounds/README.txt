# Sonidos para Sistema de Asistencias

## Archivos Actuales

✅ success.wav - Sonido de éxito cuando se reconoce la huella y el acceso es permitido

## Archivos Faltantes (NECESARIOS)

❌ warning.wav - Sonido de advertencia cuando la membresía está por vencer
   → Crear con tono medio, dos beeps cortos (0.7-1 seg)

❌ error.wav - Sonido de error cuando el acceso es denegado
   → Crear con tono grave descendente (0.8-1.2 seg)

❌ beep-start.wav - Beep corto cuando se detecta el dedo en el sensor
   → Crear con beep agudo breve (0.2-0.3 seg)

## Solución Temporal

Para evitar errores 404 durante desarrollo, puedes:

1. Duplicar success.wav y renombrar como warning.wav, error.wav, beep-start.wav
2. O seguir la guía completa en: /docs/AUDIO_ASISTENCIAS_HUELLA.md

## Comando rápido (Windows PowerShell)

cd public/sounds
Copy-Item success.wav warning.wav
Copy-Item success.wav error.wav  
Copy-Item success.wav beep-start.wav

Nota: Esto es solo temporal para desarrollo. Debes reemplazarlos con sonidos apropiados.
