# 🔒 Validación de Estado de Pago - Documentación Crítica

## 📋 Resumen del Problema

**Riesgo identificado:** Dependencia fuerte del `estado_pago` que envía el frontend en operaciones de cambio de plan de membresías.

**Impacto:** Si el frontend envía un `estado_pago` incorrecto (o lo omite), el backend puede:
- ✅ Devolver el monto de la membresía anterior
- ❌ **NO cobrar** la nueva membresía (queda marcada como `sin_pagar`)

Esto genera un **riesgo financiero**: pérdida de ingresos por membresías no cobradas.

---

## 🛡️ Mitigaciones Implementadas en Frontend

### 1. Función Helper de Validación

```typescript
// components/socios/socio-modal.tsx (línea 18)
function validarEstadoPago(
  estadoPago: string | undefined | null,
  contexto: string
): 'pagado' | 'sin_pagar' {
  const estadosValidos = ['pagado', 'sin_pagar']
  
  if (!estadoPago) {
    console.warn(`⚠️ [${contexto}] Estado de pago undefined/null → Usando default: sin_pagar`)
    return 'sin_pagar'
  }
  
  if (!estadosValidos.includes(estadoPago)) {
    console.error(`❌ [${contexto}] Estado de pago inválido: "${estadoPago}"`)
    console.error(`   Estados válidos: ${estadosValidos.join(', ')}`)
    console.error(`   → Usando default seguro: sin_pagar`)
    return 'sin_pagar'
  }
  
  console.log(`✅ [${contexto}] Estado de pago válido: ${estadoPago}`)
  return estadoPago as 'pagado' | 'sin_pagar'
}
```

**Decisión de diseño:** Default a `sin_pagar` (más seguro que defaultear a `pagado`).

### 2. Validación Específica en Actualizaciones de Socio

```typescript
// Cuando se actualiza un socio y se cambia su membresía
const estadoPagoSeguro = validarEstadoPago(
  socio.estadoPago,
  'Actualización de Socio'
)

// Detectar cambios de plan
const esCambioDePlan = socio.planId !== membresiaId
if (esCambioDePlan) {
  console.warn('🔄 CAMBIO DE PLAN DETECTADO')
  console.warn('   ⚠️ CRÍTICO: Backend DEBE validar cobro/devolución')
}
```

### 3. Logs Exhaustivos en Operaciones Críticas

**Confirmación de pago:**
```typescript
console.log('💳 Confirmando pago para nuevo socio')
console.log('   estado_pago:', 'pagado')
console.log('   metodo_pago_id:', metodoPagoId)
```

**Inscripción sin pago:**
```typescript
console.warn('⚠️ Inscribiendo socio SIN PAGO')
console.log('   estado_pago:', 'sin_pagar')
console.warn('   💵 El cobro quedará PENDIENTE')
```

---

## 🎯 Recomendaciones para Backend

### 🔴 CRÍTICO: Validaciones que DEBE implementar el backend

#### 1. Nunca confiar ciegamente en `estado_pago` del frontend

```python
# ❌ MAL - Confiar directamente
if request_data.get('estado_pago') == 'pagado':
    procesar_cobro()

# ✅ BIEN - Validar contexto completo
def validar_cobro_membresia(socio_id, nuevo_plan_id, estado_pago_frontend):
    # Obtener membresía actual del socio
    membresia_actual = obtener_membresia_actual(socio_id)
    
    # Si es cambio de plan
    if membresia_actual and membresia_actual.plan_id != nuevo_plan_id:
        # REGLA 1: Si había membresía pagada anterior, hacer devolución
        if membresia_actual.estado_pago == 'pagado':
            calcular_devolucion(membresia_actual)
        
        # REGLA 2: Solo cobrar si estado_pago_frontend == 'pagado'
        if estado_pago_frontend == 'pagado':
            cobrar_nueva_membresia(nuevo_plan_id)
            return 'pagado'
        else:
            # Si frontend dice sin_pagar, respetar
            return 'sin_pagar'
    
    # Si es nueva inscripción, respetar estado_pago_frontend
    return estado_pago_frontend
```

#### 2. Validar que `metodo_pago_id` esté presente cuando `estado_pago='pagado'`

```python
# Validación en endpoint de actualización
if request_data.get('estado_pago') == 'pagado':
    if not request_data.get('metodo_pago_id'):
        raise ValidationError(
            "metodo_pago_id es obligatorio cuando estado_pago='pagado'"
        )
```

#### 3. Registrar auditoría de cambios de plan

```python
# Guardar en tabla de auditoría
AuditoriaCambioPlan.create({
    'socio_id': socio.id,
    'plan_anterior_id': membresia_actual.plan_id,
    'plan_nuevo_id': nuevo_plan_id,
    'monto_devuelto': devolucion_calculada,
    'monto_cobrado': cobro_nuevo_plan,
    'estado_pago_recibido': estado_pago_frontend,
    'estado_pago_final': estado_pago_validado,
    'fecha_cambio': datetime.now(),
    'usuario_responsable': current_user.id,
})
```

#### 4. Validar estados de pago permitidos

```python
ESTADOS_PAGO_VALIDOS = ['pagado', 'sin_pagar']

def validar_estado_pago(estado_pago):
    if estado_pago not in ESTADOS_PAGO_VALIDOS:
        raise ValidationError(
            f"Estado de pago inválido: {estado_pago}. "
            f"Valores permitidos: {', '.join(ESTADOS_PAGO_VALIDOS)}"
        )
    return estado_pago
```

---

## 🧪 Casos de Prueba Críticos

### Caso 1: Cambio de plan de $500 a $1000 (upgrade)

**Scenario A: Con pago inmediato**
```json
{
  "membresia": {
    "plan_id": 2,
    "estado_pago": "pagado",
    "metodo_pago_id": 1
  }
}
```

**Resultado esperado:**
- ✅ Devolver $250 (proporcional de plan anterior)
- ✅ Cobrar $1000 (nuevo plan)
- ✅ Registrar estado: `pagado`
- ✅ Net: Usuario paga $750

**Scenario B: Sin pago inmediato**
```json
{
  "membresia": {
    "plan_id": 2,
    "estado_pago": "sin_pagar"
  }
}
```

**Resultado esperado:**
- ✅ Devolver $250 (proporcional de plan anterior)
- ❌ **NO cobrar** nuevo plan
- ✅ Registrar estado: `sin_pagar`
- ✅ Net: Usuario recibe reembolso de $250, debe $1000

### Caso 2: Cambio de plan de $1000 a $500 (downgrade)

**Scenario A: Con pago inmediato**
```json
{
  "membresia": {
    "plan_id": 1,
    "estado_pago": "pagado",
    "metodo_pago_id": 1
  }
}
```

**Resultado esperado:**
- ✅ Devolver $500 (proporcional de plan anterior)
- ✅ Cobrar $500 (nuevo plan)
- ✅ Registrar estado: `pagado`
- ✅ Net: Usuario paga $0 (se netean)

### Caso 3: Estado de pago inválido enviado

**Request malformado:**
```json
{
  "membresia": {
    "plan_id": 2,
    "estado_pago": "pendiente" // ❌ NO VÁLIDO
  }
}
```

**Comportamiento esperado del backend:**
```python
# Opción 1: Rechazar request
raise ValidationError("Estado de pago inválido: 'pendiente'")

# Opción 2: Default seguro
estado_pago = validar_estado_pago(request_data.get('estado_pago'))
# Si es inválido, usar 'sin_pagar' y loggear warning
```

---

## 📊 Métricas de Monitoreo Recomendadas

### Alertas a implementar:

1. **Cambios de plan sin cobro:**
   ```
   Alerta: Cambio de plan detectado con estado_pago='sin_pagar'
   Socio ID: {socio_id}
   Plan anterior: {plan_anterior}
   Plan nuevo: {plan_nuevo}  
   Monto pendiente: ${monto}
   ```

2. **Estado de pago inválido recibido:**
   ```
   Error: Estado de pago inválido recibido desde frontend
   Valor recibido: {estado_pago_invalido}
   Socio ID: {socio_id}
   Acción tomada: Usar default 'sin_pagar'
   ```

3. **Cobro sin método de pago:**
   ```
   Error: Request con estado_pago='pagado' sin metodo_pago_id
   Socio ID: {socio_id}
   Request rechazado: true
   ```

---

## 🚀 Mejoras Futuras (Frontend)

### 1. Modal de Confirmación en Cambios de Plan

```typescript
// Cuando se detecta cambio de plan, mostrar:
"¿Desea cobrar la nueva membresía ahora?"
[Sí, cobrar ahora (pagado)] [No, cobrar después (sin_pagar)]
```

### 2. Vista de Membresías Pendientes de Pago

```typescript
// Dashboard con alertas:
"⚠️ 5 socios con membresías SIN PAGAR"
[Ver detalles] → Lista de socios con monto pendiente
```

### 3. Confirmación Visual Before Submit

```typescript
// Antes de enviar actualización:
if (esCambioDePlan) {
  mostrarModalConfirmacion({
    planAnterior: socio.planNombre,
    planNuevo: membresiaNueva.nombre,
    montoDevolucion: calcularDevolucion(),
    montoNuevo: membresiaNueva.precio,
    estadoPago: estadoPagoSeleccionado, // Usuario elige explícitamente
  })
}
```

---

## 📞 Contacto

**Implementado por:** Frontend Team  
**Fecha:** 7 de marzo de 2026  
**Archivos modificados:**
- `/components/socios/socio-modal.tsx` (líneas 18-45, 430-470, 500-520, 555-575)

**Para más información o dudas:**
- Revisar logs de consola con emoji 🔄 (cambio de plan)
- Revisar logs de consola con emoji ⚠️ (advertencias críticas)
