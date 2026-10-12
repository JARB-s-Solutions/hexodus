# Entrega frontend biométrica — 12 de octubre de 2026

## Alcance

Esta entrega actualiza el frontend para usar el motor local HEXODUS BioSync mediante SSE, con sesiones biométricas autorizadas, comprobantes firmados y reintentos idempotentes. La captura de huella, el alta de socios y los cambios de estado notifican al kiosco para que actualice su caché sin esperar un polling periódico.

También se corrigieron los avisos de TypeScript en inventario, ventas y usuarios, se añadió el `DialogTitle` requerido al modal de ticket y se centralizó la recuperación del audio del kiosco.

## Flujo biométrico actual

1. El frontend solicita al backend una sesión temporal para el kiosco.
2. El motor local recibe esa capacidad y mantiene la conexión SSE en `localhost:4000`.
3. El motor entrega eventos firmados; el frontend los envía al backend una sola vez por evento y espera el comprobante de persistencia antes de avanzar el cursor.
4. Si se corta la red, se reintenta el mismo comprobante; el backend evita duplicar la asistencia.
5. La captura de enrolamiento se valida como XML UTF-8, se liga al socio y conserva su prueba de captura.
6. La sincronización se confirma con el motor antes de mostrar que la huella está disponible.

El callback HTTP y el polling heredados permanecen desactivados por defecto. Solo se habilitan si se define explícitamente `HUELLA_LEGACY_CLOUD_ENABLED=true` en un despliegue compatible.

## Configuración sin secretos

Copia `.env.biometric.example` a la configuración del entorno:

```env
NEXT_PUBLIC_MOTOR_URL=http://localhost:4000
NEXT_PUBLIC_KIOSK_ID=KIOSKO-HUELLA-01
NEXT_PUBLIC_BIOMETRIC_LEGACY=false
NEXT_PUBLIC_MOTOR_TRANSPORT=sse
HUELLA_LEGACY_CLOUD_ENABLED=false
```

Nunca coloques claves del dispositivo en variables `NEXT_PUBLIC_*`.

## Base de datos

El frontend no contiene Prisma, migraciones ni esquema de base de datos. Esta entrega no modifica Supabase: solo consume los endpoints existentes del backend. No se incluyeron `.env` reales ni credenciales.

## Validación

- `npm test`: **19 aprobadas, 0 fallos**.
- `npm run build`: compilación de producción completada con TypeScript estricto (`ignoreBuildErrors: false`).
- Las pruebas usan transportes, audio y respuestas sintéticas; no conectan con Supabase, el backend real ni el lector USB.
- `npm run lint` no se pudo ejecutar porque el repositorio no tiene el paquete `eslint` instalado; no es un fallo introducido por esta entrega.
