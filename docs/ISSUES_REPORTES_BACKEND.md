# ISSUES Backend - Modulo de Reportes Financieros

Fecha: 2026-03-26
Objetivo: Alinear backend de reportes con expectativas de producto para usuarios finales (preview + exportaciones profesionales + historial funcional)

## 1) Resumen Ejecutivo

Si, hace falta implementar y ajustar varias piezas en backend para cumplir con la experiencia esperada.

Estado actual detectado:
- Hay endpoints de visualizacion: resumen, graficas, comparaciones.
- Hay endpoint para generar reporte, pero actualmente solo guarda metadatos y simula archivo CSV.
- No existen endpoints de descarga ni eliminacion en rutas de reportes.
- El contrato del historial en backend no coincide con lo que consume frontend.
- El backend no genera archivos reales en PDF/XLSX/CSV (solo URL simulada).

Impacto:
- El historial puede quedar vacio en frontend aun con datos en BD (mismatch de contrato).
- Descargar/eliminar desde historial falla por ausencia de endpoints.
- La exportacion actual no cumple expectativa de usuario final (PDF/XLSX) ni robustez operativa.

---

## 2) Evidencia Tecnica Actual

### Frontend (hexodus)
- Servicio de reportes consume:
  - GET /financiero/resumen
  - GET /financiero/graficas
  - GET /financiero/comparaciones
  - GET /financiero/historial-reportes
  - POST /financiero/generar-reporte
  - GET /financiero/descargar-reporte/:id
  - DELETE /financiero/eliminar-reporte/:id
- La descarga local en pantalla se hace en CSV desde cliente.
- El historial espera estructura data.reportes + data.paginacion.

### Backend (hexodus-backend)
- Rutas existentes:
  - GET /financiero/resumen
  - GET /financiero/graficas
  - GET /financiero/comparaciones
  - GET /financiero/historial-reportes
  - POST /financiero/generar-reporte
- No hay rutas registradas para:
  - GET /financiero/descargar-reporte/:id
  - DELETE /financiero/eliminar-reporte/:id
- Controlador de generar reporte:
  - Guarda registro y setea archivoUrl simulado con .csv.
  - No genera archivo fisico (nota en comentario del controlador).

---

## 3) ISSUES Detalladas

## ISSUE RF-001 - Contrato de historial incompatible con frontend
Prioridad: Alta

Problema:
- Backend retorna historial como:
  - data: array
  - pagination: objeto
- Frontend consume:
  - data.reportes
  - data.paginacion

Riesgo:
- El tab de historial puede mostrarse vacio aun existiendo reportes.

Implementacion requerida:
- Estandarizar respuesta a:
  - message
  - data.reportes
  - data.paginacion

Criterios de aceptacion:
- GET /financiero/historial-reportes retorna estructura estable.
- Frontend no requiere adaptadores de emergencia para arrays sueltos.
- Paginacion funcional (page, limit, total, totalPages).

---

## ISSUE RF-002 - Faltan endpoints de descarga y eliminacion de reportes
Prioridad: Critica

Problema:
- Frontend ya invoca:
  - GET /financiero/descargar-reporte/:id
  - DELETE /financiero/eliminar-reporte/:id
- Backend no expone estas rutas.

Riesgo:
- Acciones principales del historial fallan en produccion.

Implementacion requerida:
- Crear endpoint de descarga por ID.
- Crear endpoint de eliminacion por ID (ideal soft delete + auditoria).

Criterios de aceptacion:
- Descargar devuelve archivo real con headers correctos (Content-Type y Content-Disposition).
- Eliminar actualiza historial y no deja referencias huérfanas.
- Permisos aplicados por modulo reportes.

---

## ISSUE RF-003 - Generacion de reportes actualmente simulada
Prioridad: Critica

Problema:
- POST /financiero/generar-reporte solo crea metadatos y archivoUrl fake.
- No existe pipeline real de generacion de documento.

Riesgo:
- Usuario cree que genero un reporte util, pero no existe archivo real.

Implementacion requerida:
- Pipeline de generacion por formato:
  - PDF: render plantilla + export estable
  - XLSX: workbook con hojas, estilos y totales
  - CSV: opcional tecnico
- Guardar ubicacion real de archivo en almacenamiento.

Criterios de aceptacion:
- El registro creado tiene archivoUrl valido y accesible.
- Descarga del archivo funciona para cada formato.
- Estado del reporte refleja exito/error real.

---

## ISSUE RF-004 - Soporte de formatos insuficiente (solo CSV)
Prioridad: Alta

Problema:
- Expectativa de producto: PDF y XLSX como formatos principales.
- Backend registra formato texto "Excel (.csv)", pero no genera XLSX real.

Riesgo:
- Mala experiencia para usuarios finales y soporte operativo.

Implementacion requerida:
- Agregar enum/formato real en backend: PDF | XLSX | CSV.
- Validar formato en request.
- Generar archivo correspondiente.

Criterios de aceptacion:
- Un reporte con formato XLSX descarga archivo .xlsx valido.
- Un reporte con formato PDF descarga archivo .pdf imprimible.
- CSV queda disponible como opcion avanzada/tecnica.

---

## ISSUE RF-005 - Localizacion de salida no garantizada
Prioridad: Alta

Problema:
- Se requiere formato Mexico:
  - Fecha DD/MM/YYYY
  - Moneda MXN
- Actualmente no hay contrato claro de localizacion en generacion de archivos backend.

Riesgo:
- Inconsistencias visuales y errores de interpretacion del cliente.

Implementacion requerida:
- Definir locale y timezone estandar en motor de reportes.
- Aplicar formateo en celdas/plantillas.

Criterios de aceptacion:
- PDF y XLSX muestran fechas y moneda con formato MX.
- Totales coinciden con datos base sin redondeos incorrectos.

---

## ISSUE RF-006 - CSV no preparado para Excel en entorno es-MX como producto principal
Prioridad: Media

Problema:
- CSV como formato unico no es amigable para usuario final.
- Si se mantiene CSV, debe tener robustez para Excel (encoding, delimitador configurable).

Riesgo:
- Acentos rotos y columnas mal separadas en algunos entornos.

Implementacion requerida:
- Mantener CSV como secundario.
- Forzar UTF-8 con BOM y evaluar delimitador por locale/parametro.

Criterios de aceptacion:
- Archivo abre correctamente en Excel de Windows en español.
- Caracteres especiales se visualizan correctamente.

---

## ISSUE RF-007 - Falta estado de procesamiento para reportes pesados
Prioridad: Media

Problema:
- Generacion de reportes grandes puede tardar.
- Actualmente no hay flujo formal de "procesando" -> "exitoso" -> "error".

Riesgo:
- Timeouts y mala UX en frontend.

Implementacion requerida:
- Estado en BD: procesando, exitoso, error.
- Endpoint de polling de estado por reporte.
- Opcional: cola asyncrona para generar reportes.

Criterios de aceptacion:
- Frontend puede mostrar "Generando reporte..." con estado real.
- Reportes grandes no bloquean request principal.

---

## ISSUE RF-008 - Seguridad de archivos y autorizacion por propietario/rol
Prioridad: Alta

Problema:
- Al agregar descarga real, se debe validar acceso por usuario/rol.
- archivoUrl no debe exponer path directo inseguro.

Riesgo:
- Exposicion de reportes de otros usuarios.

Implementacion requerida:
- Verificar permiso reportes + propiedad o alcance por rol.
- Usar URLs firmadas o streaming controlado.

Criterios de aceptacion:
- Usuario sin permiso recibe 403.
- Usuario autorizado descarga solo reportes permitidos.

---

## ISSUE RF-009 - Auditoria incompleta de operaciones de reportes
Prioridad: Media

Problema:
- No hay evidencia completa de quien genero, descargo o elimino reportes.

Riesgo:
- Dificultad para trazabilidad y cumplimiento interno.

Implementacion requerida:
- Registrar eventos:
  - generar
  - descargar
  - eliminar
  - error de generacion

Criterios de aceptacion:
- Cada accion deja registro con usuario, timestamp, tipo y metadata minima.

---

## ISSUE RF-010 - Contrato de permisos de reportes no alineado 100% con frontend
Prioridad: Media

Problema:
- Frontend usa acciones granulares (verHistorial, exportar, eliminar, generar).
- Backend mezcla validar verReporteFinanciero y crear en rutas actuales.

Riesgo:
- Desalineacion entre UI habilitada y API autorizada.

Implementacion requerida:
- Normalizar matriz de permisos para reportes:
  - ver
  - generar
  - descargar
  - eliminar
  - verHistorial
- Aplicar en cada endpoint.

Criterios de aceptacion:
- Cada endpoint valida permiso correcto.
- Roles en frontend y backend se comportan consistente.

---

## 4) Propuesta de Endpoints Objetivo (Backend)

1. GET /api/financiero/resumen
2. GET /api/financiero/graficas
3. GET /api/financiero/comparaciones
4. GET /api/financiero/historial-reportes?page=1&limit=10
5. POST /api/financiero/generar-reporte
- body:
  - nombre
  - descripcion
  - tipo_reporte
  - formato: PDF | XLSX | CSV
  - fecha_inicio
  - fecha_fin
  - incluir_graficos
  - incluir_detalles
6. GET /api/financiero/descargar-reporte/:id
7. DELETE /api/financiero/eliminar-reporte/:id
8. GET /api/financiero/estado-reporte/:id (opcional, recomendado)

---

## 5) Plan de Implementacion Recomendado

Fase 1 (Critico - romper menos):
- RF-001 contrato historial
- RF-002 endpoints descargar/eliminar
- RF-003 generacion real basica de archivo

Fase 2 (Calidad producto):
- RF-004 formatos PDF/XLSX/CSV
- RF-005 localizacion MX
- RF-008 seguridad descarga

Fase 3 (Escalabilidad y operacion):
- RF-007 procesamiento asyncrono
- RF-009 auditoria detallada
- RF-010 matriz de permisos final

---

## 6) Definicion de Exito

El modulo de reportes se considera alineado a expectativa cuando:
- El usuario puede previsualizar en frontend y exportar en PDF o XLSX sin friccion.
- El historial muestra reportes reales generados y permite descargar/eliminar.
- CSV queda como opcion tecnica, no principal.
- Formatos de fecha/moneda son consistentes para MX.
- Hay seguridad y auditoria en todas las acciones de reportes.
