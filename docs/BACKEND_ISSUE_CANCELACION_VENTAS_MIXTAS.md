# ISSUE: Cancelación de ventas mixtas con reversión incorrecta en caja

**Área:** Backend - Ventas / Caja / Inventario
**Prioridad:** 🔥 CRÍTICA
**Estado:** Pendiente de corrección en backend

## Resumen
Al cancelar una venta que fue pagada con más de un método de pago, el sistema genera la reversión de caja de forma incorrecta. En lugar de respetar el desglose original de la venta, la reversión termina tratándose como si todo hubiese sido pagado en efectivo, lo que altera el efectivo físico del corte y puede provocar caja negativa o reportes contables inconsistentes.

## Contexto funcional
El sistema ya soporta ventas con múltiples métodos de pago. Por ejemplo, una venta puede quedar registrada con:

- 50% en efectivo
- 50% en tarjeta

Cuando esa venta se cancela, el backend debe revertir exactamente los mismos montos y métodos usados originalmente. La reversión debe respetar el destino contable correcto:

- **Efectivo**: afecta caja física
- **Tarjeta / Transferencia / otros métodos no físicos**: no deben restarse como efectivo físico, pero sí deben quedar reversados en el desglose contable del método correspondiente

## Comportamiento actual
Al cancelar ventas mixtas:

1. Se generan movimientos de reversión.
2. La reversión termina clasificada como efectivo en lugar de respetar el método real de pago.
3. El corte de caja puede mostrar un egreso físico indebido.
4. El efectivo final puede quedar artificialmente bajo o negativo.

## Impacto
Este problema afecta directamente:

- Corte de caja
- Cálculo de efectivo físico
- Reportes de ingresos/egresos por método de pago
- Trazabilidad financiera de ventas canceladas

## Causa raíz probable
El sistema de caja está clasificando los movimientos por el contenido textual de la nota del movimiento, en vez de usar un dato estructurado del método de pago.

Hoy la lógica de caja interpreta el método usando patrones de texto en la nota, por ejemplo algo equivalente a:

```js
/\[Pago: ID (\d+)\]/
```

Sin embargo, en la cancelación de ventas mixtas, la nota de reversión no siempre conserva exactamente ese formato o no contiene suficiente información estructurada para distinguir el método real. Como resultado, el sistema cae en un comportamiento por defecto que termina clasificando la reversa como efectivo.

## Requerimiento técnico
Se requiere que el backend haga una de estas dos correcciones, preferentemente la opción 1:

### Opción 1 - Solución robusta recomendada
Persistir el método de pago de cada movimiento de caja con un campo estructurado, por ejemplo:

- `metodoPagoId`
- o una referencia directa al método de pago asociado

Con esto, la clasificación de ingresos y egresos ya no dependerá de la nota textual.

### Opción 2 - Solución mínima compatible
Si no se puede modificar el esquema de inmediato, la cancelación debe registrar los movimientos de reversión usando exactamente el mismo patrón que ya entiende el clasificador actual de caja, para que el sistema identifique sin ambigüedad el método original.

## Regla de negocio esperada
La reversión de una venta cancelada debe cumplir estas reglas:

1. Debe revertir el inventario de todos los productos vendidos.
2. Debe revertir la caja respetando el desglose original de pagos.
3. Solo el efectivo físico debe impactar el efectivo real del corte.
4. Tarjeta, transferencia u otros métodos no físicos no deben restarse como efectivo físico.
5. El movimiento cancelado debe quedar trazable por método de pago y por venta original.

## Criterio de aceptación
Se considera resuelto cuando los siguientes casos funcionen correctamente:

### Caso 1: Venta 100% efectivo
- Cancelar la venta revierte el monto total como egreso de efectivo físico.
- El corte de caja refleja correctamente la salida de efectivo.

### Caso 2: Venta 100% tarjeta
- Cancelar la venta genera reversa contable del método tarjeta.
- No reduce indebidamente el efectivo físico del corte.

### Caso 3: Venta mixta efectivo + tarjeta
- Cancelar la venta genera dos reversas separadas.
- La parte en efectivo afecta caja física.
- La parte en tarjeta no se contabiliza como efectivo físico.
- Los reportes muestran el desglose correcto por método.

### Caso 4: Venta mixta con transferencia y efectivo
- El mismo comportamiento anterior debe aplicarse.
- Cada método debe quedar identificado de forma exacta.

## Observaciones importantes
- No es un problema de frontend.
- La UI ya puede mostrar ventas canceladas, pero la clasificación contable debe resolverse en backend.
- Si el detalle de venta necesita mostrar el desglose real de pagos, el backend debería devolver también esa información de forma estructurada para no depender solo de un método único.

## Recomendación de implementación
Antes de tocar la lógica de cancelación, revisar y unificar el contrato de estos puntos:

- `VentaPago`
- `CajaMovimiento`
- clasificación de ingresos/egresos en corte de caja
- lectura del método de pago desde datos estructurados, no desde texto libre

## Resultado esperado
Después de la corrección, al cancelar ventas con pagos múltiples:

- no debe generarse caja negativa por clasificación errónea,
- no debe tratarse toda la reversión como efectivo,
- y el corte debe reflejar correctamente el destino financiero de cada método de pago.
