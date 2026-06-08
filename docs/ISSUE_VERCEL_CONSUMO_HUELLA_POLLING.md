# ISSUE: Consumo excesivo en Vercel por polling de eventos de huella

**Área:** Frontend Next.js / Asistencia por huella / Vercel  
**Prioridad:** Crítica  
**Estado:** Pendiente de rediseño  
**Fecha de análisis:** 2026-05-23

## Resumen

El consumo del plan gratuito de Vercel es consistente con el polling agresivo de la pantalla de huella. La vista `app/asistencia/huella/page.tsx` consulta `/api/asistencia/huella/eventos` cada 750 ms mientras la pantalla está abierta.

Esa ruta es una API Route dinámica de Next.js desplegada en Vercel, por lo que cada tick del polling se convierte en una invocación serverless. En una pantalla de recepción/kiosco abierta durante horas, aun con pocos usuarios reales, el sistema puede generar cientos de miles o millones de requests mensuales.

## Evidencia en código

### Polling de eventos

Archivo: `app/asistencia/huella/page.tsx`

- `EVENT_POLL_INTERVAL_MS = 750`
- `consultarEventosMotor()` hace `fetch('/api/asistencia/huella/eventos?after=...')`
- En `finally` vuelve a programar `programarPollingEventos()`

Impacto aproximado por una sola pantalla abierta:

- 60 / 0.75 = 80 requests por minuto
- 4,800 requests por hora
- 38,400 requests en una jornada de 8 horas
- 1,152,000 requests en 30 días laborales continuos equivalentes

Con solo una pantalla de huella abierta de forma permanente, el límite gratuito de 1,000,000 Edge Requests puede agotarse.

### Endpoint serverless intermedio

Archivo: `app/api/asistencia/huella/eventos/route.ts`

- `dynamic = "force-dynamic"`
- `runtime = "nodejs"`
- `Cache-Control: no-store`
- No valida sesión/token/secret en GET

Esto confirma que cada consulta del polling invoca una función y no puede ser cacheada.

### Callback abierto si falta secret

Archivo: `app/api/asistencia/huella/callback/route.ts`

La validación actual permite el callback si `HUELLA_MOTOR_CALLBACK_SECRET` no está configurado:

```ts
if (!expectedSecret) return true
```

En producción esto debe ser fail-closed. Si falta el secret, el endpoint debería rechazar la petición.

### Estado en memoria efímera

Archivo: `lib/asistencia-huella-events.ts`

Los eventos se almacenan en `globalThis`. En Vercel esto no es una cola persistente ni un mecanismo confiable de eventos. Puede funcionar como parche temporal, pero no como arquitectura estable para un kiosco.

## Diagnóstico

El análisis de los administradores es correcto en el punto principal: el exceso de consumo probablemente viene del patrón:

1. pantalla de huella abierta por largos periodos,
2. polling cada 750 ms,
3. endpoint serverless dinámico en Vercel,
4. respuestas pequeñas pero muchísimas invocaciones,
5. endpoint GET sin autenticación explícita.

La captura de logs mostrando `/api/asistencia/huella/eventos` casi cada segundo coincide exactamente con este comportamiento.

## Solución recomendada

### Opción ideal: canal push fuera de serverless

Usar WebSocket o SSE en un servicio persistente, no en una API Route serverless de Vercel.

Opciones posibles:

- El frontend de kiosco se conecta directamente al motor local `NEXT_PUBLIC_MOTOR_URL`.
- El motor local expone WebSocket/SSE para eventos de huella.
- Si se necesita nube, usar un servicio persistente especializado como Supabase Realtime, Pusher, Ably, Upstash Redis pub/sub o un backend Node persistente fuera de Vercel Functions.

Importante: Vercel Serverless Functions no son el mejor lugar para WebSockets persistentes.

### Opción intermedia: long polling con menos invocaciones

Si no se puede implementar push real de inmediato:

- subir polling a 5-15 segundos,
- pausar polling con `document.hidden`,
- aplicar backoff cuando no haya eventos,
- consultar con jitter para evitar sincronización entre pestañas,
- detener polling si el motor no está disponible,
- exigir autenticación en `/api/asistencia/huella/eventos`,
- exigir secret obligatorio en callback.

Esto no elimina el problema de raíz, pero puede reducir 70-95% del consumo.

### Opción mínima urgente

Para reducir consumo de inmediato sin rediseñar todo:

1. Cambiar `EVENT_POLL_INTERVAL_MS` de `750` a mínimo `5000`.
2. Cambiar `MOTOR_HEALTHCHECK_INTERVAL_MS` de `3000` a `15000` o más.
3. Pausar ambos ciclos si `document.hidden === true`.
4. No programar nuevo polling cuando `estado === "no-device"` o motor no disponible.
5. Proteger `GET /api/asistencia/huella/eventos`.
6. Hacer obligatorio `HUELLA_MOTOR_CALLBACK_SECRET` en producción.

## Criterios de aceptación

- La pantalla de huella no debe generar más de 6-12 requests por minuto en modo polling temporal.
- En modo WebSocket/SSE, la pantalla debe mantener una conexión persistente y no hacer polling continuo.
- `/api/asistencia/huella/eventos` debe rechazar tráfico no autenticado o no autorizado.
- `/api/asistencia/huella/callback` debe rechazar peticiones en producción si falta `HUELLA_MOTOR_CALLBACK_SECRET`.
- La pestaña en segundo plano debe pausar polling o reducirlo drásticamente.
- Los logs de Vercel ya no deben mostrar requests constantes a `/api/asistencia/huella/eventos` cada segundo.

## Notas adicionales

También existen otros pollings que suman consumo, aunque no son la causa principal:

- `app/asistencia/page.tsx`: refresco cada 30s.
- `components/dashboard/visitantes-card.tsx`: refresco cada 30s.
- `lib/contexts/caja-context.tsx`: refresco global de caja cada 30s.

Estos deberían optimizarse después del flujo de huella, especialmente pausándolos cuando la pestaña no está visible.

## Recomendación de arquitectura

Para este caso de uso, la arquitectura más saludable es:

1. El motor local de huella detecta eventos.
2. El kiosco se suscribe por WebSocket/SSE al motor local.
3. Cuando hay match, el kiosco registra la asistencia contra el backend real.
4. Vercel solo recibe operaciones de negocio reales, no latidos constantes de polling.

Así Vercel deja de pagar el costo de "escuchar" al lector y solo procesa eventos útiles.
