# Issues Backend: Configuracion de Apariencia y Datos del Ticket

Fecha: Marzo 2026
Prioridad: Alta
Objetivo: Persistir en BD la configuracion para que todas las computadoras compartan la misma apariencia y datos del ticket.

---

## Alcance real del sistema

Este documento SOLO contempla campos que ya existen en los formularios actuales:

### Apariencia y tema
- colorPrincipal
- colorSecundario
- modoTema (dark, light, auto)
- nombreSistema
- logoSistema

### Datos del ticket
- gimnasioNombre
- gimnasioDomicilio
- gimnasioTelefono
- gimnasioRFC
- gimnasioLogo
- ticketFooter
- ticketMensajeAgradecimiento

Regla obligatoria para logos:
- logoSistema y gimnasioLogo deben guardarse en base64 (Data URL), por ejemplo: data:image/png;base64,iVBORw0...
- No se deben guardar ni devolver links HTTP/HTTPS para logos, porque la impresora termica no admite links de imagen.

---

## Modelo de datos

Tabla sugerida: configuracion_sistema

Campos:
- id: UUID PK
- color_principal: VARCHAR(7) NOT NULL
- color_secundario: VARCHAR(7) NOT NULL
- modo_tema: VARCHAR(10) NOT NULL
- nombre_sistema: VARCHAR(80) NOT NULL
- logo_sistema: TEXT NULL
- gimnasio_nombre: VARCHAR(120) NOT NULL
- gimnasio_domicilio: VARCHAR(255) NOT NULL
- gimnasio_telefono: VARCHAR(30) NOT NULL
- gimnasio_rfc: VARCHAR(13) NOT NULL
- gimnasio_logo: TEXT NULL
- ticket_footer: VARCHAR(100) NOT NULL
- ticket_mensaje_agradecimiento: VARCHAR(200) NOT NULL
- updated_at: TIMESTAMP NOT NULL DEFAULT NOW()
- updated_by: UUID NULL

Notas:
- logo_sistema y gimnasio_logo deben guardar base64 (Data URL).
- Debe existir una sola configuracion activa para todo el sistema.

---

## Seguridad y headers (aplica a todos los endpoints)

Headers requeridos:
- Authorization: Bearer <token>
- Content-Type: application/json

Permisos sugeridos:
- Lectura: configuracion.ver
- Edicion: configuracion.editar o configuracion.gestionarSistema

Errores estandar:
- 400: body invalido
- 401: token faltante/invalido
- 403: sin permisos
- 404: configuracion no encontrada
- 409: conflicto de version (si se usa control de concurrencia)
- 500: error interno

Formato de error:
```json
{
  "success": false,
  "message": "Descripcion corta del error",
  "errors": [
    {
      "field": "ticketFooter",
      "code": "MAX_LENGTH",
      "detail": "Debe tener maximo 100 caracteres"
    }
  ]
}
```

---

## ISSUE 1: GET configuracion unificada

### Endpoint
`GET /api/configuracion/sistema`

### Descripcion
Devuelve toda la configuracion usada por Apariencia y Datos del Ticket.

### Response 200
```json
{
  "success": true,
  "message": "Configuracion obtenida",
  "data": {
    "colorPrincipal": "#FF3B3B",
    "colorSecundario": "#00BFFF",
    "modoTema": "dark",
    "nombreSistema": "HEXODUS",
    "logoSistema": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "gimnasioNombre": "GYM FITNESS",
    "gimnasioDomicilio": "Av. Principal #123, Col. Centro, CP 12345",
    "gimnasioTelefono": "+52 123 456 7890",
    "gimnasioRFC": "GYM123456ABC",
    "gimnasioLogo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "ticketFooter": "Gracias por tu visita",
    "ticketMensajeAgradecimiento": "Te esperamos pronto",
    "updatedAt": "2026-03-23T14:10:22.000Z"
  }
}
```

### Criterios de aceptacion
- Si no existe registro, crear default en primer acceso y responder 200.
- No devolver campos fuera de alcance.

---

## ISSUE 2: PUT configuracion unificada

### Endpoint
`PUT /api/configuracion/sistema`

### Descripcion
Actualiza en una sola operacion todos los campos de apariencia y ticket.

### Request body
```json
{
  "colorPrincipal": "#FF3B3B",
  "colorSecundario": "#00BFFF",
  "modoTema": "dark",
  "nombreSistema": "HEXODUS",
  "logoSistema": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "gimnasioNombre": "GYM FITNESS",
  "gimnasioDomicilio": "Av. Principal #123, Col. Centro, CP 12345",
  "gimnasioTelefono": "+52 123 456 7890",
  "gimnasioRFC": "GYM123456ABC",
  "gimnasioLogo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "ticketFooter": "Gracias por tu visita",
  "ticketMensajeAgradecimiento": "Te esperamos pronto"
}
```

### Validaciones obligatorias
- colorPrincipal y colorSecundario: regex ^#[0-9A-Fa-f]{6}$
- modoTema: dark | light | auto
- nombreSistema: 1..80
- gimnasioNombre: 1..120
- gimnasioDomicilio: 1..255
- gimnasioTelefono: 1..30
- gimnasioRFC: 12..13 (guardar uppercase)
- ticketFooter: max 100
- ticketMensajeAgradecimiento: max 200
- logoSistema y gimnasioLogo:
  - Formato obligatorio: Data URL base64 (regex sugerido: ^data:image\/(png|jpeg|jpg|gif);base64,)
  - Tamano maximo recomendado: 2MB por imagen (tamano binario decodificado)

### Response 200
```json
{
  "success": true,
  "message": "Configuracion actualizada",
  "data": {
    "colorPrincipal": "#FF3B3B",
    "colorSecundario": "#00BFFF",
    "modoTema": "dark",
    "nombreSistema": "HEXODUS",
    "logoSistema": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "gimnasioNombre": "GYM FITNESS",
    "gimnasioDomicilio": "Av. Principal #123, Col. Centro, CP 12345",
    "gimnasioTelefono": "+52 123 456 7890",
    "gimnasioRFC": "GYM123456ABC",
    "gimnasioLogo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "ticketFooter": "Gracias por tu visita",
    "ticketMensajeAgradecimiento": "Te esperamos pronto",
    "updatedAt": "2026-03-23T14:25:10.000Z"
  }
}
```

---

## ISSUE 3: PATCH solo apariencia

### Endpoint
`PATCH /api/configuracion/sistema/apariencia`

### Descripcion
Actualiza unicamente campos de apariencia. Ideal para cambios rapidos de tema.

### Request body (parcial)
```json
{
  "colorPrincipal": "#F44336",
  "colorSecundario": "#00BFFF",
  "modoTema": "dark",
  "nombreSistema": "HEXODUS",
  "logoSistema": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

### Response 200
```json
{
  "success": true,
  "message": "Apariencia actualizada",
  "data": {
    "colorPrincipal": "#F44336",
    "colorSecundario": "#00BFFF",
    "modoTema": "dark",
    "nombreSistema": "HEXODUS",
    "logoSistema": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "updatedAt": "2026-03-23T14:30:00.000Z"
  }
}
```

---

## ISSUE 4: PATCH solo ticket/gimnasio

### Endpoint
`PATCH /api/configuracion/sistema/ticket`

### Descripcion
Actualiza unicamente campos usados para impresion del ticket y encabezado del gimnasio.

### Request body (parcial)
```json
{
  "gimnasioNombre": "GYM FITNESS",
  "gimnasioDomicilio": "Av. Principal #123, Col. Centro, CP 12345",
  "gimnasioTelefono": "+52 123 456 7890",
  "gimnasioRFC": "GYM123456ABC",
  "gimnasioLogo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "ticketFooter": "Gracias por tu visita",
  "ticketMensajeAgradecimiento": "Te esperamos pronto"
}
```

### Response 200
```json
{
  "success": true,
  "message": "Datos del ticket actualizados",
  "data": {
    "gimnasioNombre": "GYM FITNESS",
    "gimnasioDomicilio": "Av. Principal #123, Col. Centro, CP 12345",
    "gimnasioTelefono": "+52 123 456 7890",
    "gimnasioRFC": "GYM123456ABC",
    "gimnasioLogo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "ticketFooter": "Gracias por tu visita",
    "ticketMensajeAgradecimiento": "Te esperamos pronto",
    "updatedAt": "2026-03-23T14:35:00.000Z"
  }
}
```

---

## ISSUE 5: Validacion estricta de logos base64

Descripcion:
- Asegurar que el backend rechace links de imagen en logoSistema y gimnasioLogo.
- Solo aceptar Data URL base64 con mime image/png, image/jpeg o image/gif.

Reglas:
- Si logoSistema o gimnasioLogo inicia con http:// o https:// => responder 400.
- Si no cumple formato Data URL base64 => responder 400.
- Si excede 2MB decodificado => responder 400.

Ejemplo error 400:
```json
{
  "success": false,
  "message": "Logo invalido",
  "errors": [
    {
      "field": "gimnasioLogo",
      "code": "INVALID_BASE64_IMAGE",
      "detail": "Se requiere Data URL base64. No se permiten links de imagen."
    }
  ]
}
```

---

## ISSUE 6: Eliminar logos

### Endpoints
`DELETE /api/configuracion/sistema/logo-apariencia`
`DELETE /api/configuracion/sistema/logo-ticket`

### Response 200
```json
{
  "success": true,
  "message": "Logo eliminado"
}
```

Comportamiento esperado:
- Al eliminar, guardar null o cadena vacia en logoSistema/gimnasioLogo.
- Mantener compatibilidad con el contrato JSON actual del frontend.

---

## Contrato JSON final esperado por frontend

El frontend debe poder consumir y enviar este shape (mismo contrato en GET/PUT/PATCH):

```json
{
  "colorPrincipal": "#FF3B3B",
  "colorSecundario": "#00BFFF",
  "modoTema": "dark",
  "nombreSistema": "HEXODUS",
  "logoSistema": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "gimnasioNombre": "GYM FITNESS",
  "gimnasioDomicilio": "Av. Principal #123, Col. Centro, CP 12345",
  "gimnasioTelefono": "+52 123 456 7890",
  "gimnasioRFC": "GYM123456ABC",
  "gimnasioLogo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "ticketFooter": "Gracias por tu visita",
  "ticketMensajeAgradecimiento": "Te esperamos pronto"
}
```

---

## Orden recomendado de implementacion (issues en backlog)

1. Issue 1 (GET /configuracion/sistema)
2. Issue 2 (PUT /configuracion/sistema)
3. Issue 4 (PATCH /configuracion/sistema/ticket)
4. Issue 3 (PATCH /configuracion/sistema/apariencia)
5. Issue 5 y 6 (validacion base64/eliminacion de logos)

Con los issues 1+2 ya se logra sincronizacion completa entre computadoras.
