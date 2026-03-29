Descargar el Archivo

curl -X GET "{{url-local}}/api/financiero/descargar-reporte/8" \
  -H "Authorization: {{token-user}}"

response:
{
  "success": true,
  "message": "Enlace de descarga generado correctamente.",
  "data": {
    "downloadUrl": "https://gyvosoztkfitdbywhkwb.supabase.co/storage/v1/object/sign/reportes/1774794335944_reporte.xlsx?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZDkyYzA3MS1mNjU3LTQzNzgtODI5ZS1kNTBkZjRhODk3NDIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJyZXBvcnRlcy8xNzc0Nzk0MzM1OTQ0X3JlcG9ydGUueGxzeCIsImlhdCI6MTc3NDgwMzQ1NCwiZXhwIjoxNzc0ODAzNTE0fQ.-yqU_BPQbCGVI1SMuCC1xGHlEfXSPwdbfcs9QiMaWMY&download=Reporte_Cloud_Excel.xlsx"
  }
}

Verificar el Historial

curl -X GET "{{url-local}}/api/financiero/historial-reportes" \
  -H "Authorization: {{token-user}}"

response: 
{
  "message": "Historial obtenido",
  "data": {
    "reportes": [
      {
        "id": 9,
        "nombre": "Reporte Cloud Excel",
        "tipo": "Completo",
        "formato": "XLSX",
        "fecha_generacion": "2026-03-29T08:25:37.394-06:00",
        "generado_por": "Administrador General",
        "estado": "completado",
        "periodo": "2026-03-01 a 2026-04-01"
      },
      {
        "id": 8,
        "nombre": "Reporte Cloud Excel",
        "tipo": "Completo",
        "formato": "CSV",
        "fecha_generacion": "2026-03-28T12:15:54.379-06:00",
        "generado_por": "Administrador General",
        "estado": "completado",
        "periodo": "2026-03-01 a 2026-04-01"
      },
      {
        "id": 7,
        "nombre": "Reporte Cloud PDF",
        "tipo": "Completo",
        "formato": "PDF",
        "fecha_generacion": "2026-03-27T16:39:24.526-06:00",
        "generado_por": "Administrador General",
        "estado": "completado",
        "periodo": "2026-03-01 a 2026-04-01"
      },
      {
        "id": 6,
        "nombre": "Reporte Cloud Excel",
        "tipo": "Completo",
        "formato": "XLSX",
        "fecha_generacion": "2026-03-27T16:38:49.966-06:00",
        "generado_por": "Administrador General",
        "estado": "completado",
        "periodo": "2026-03-01 a 2026-04-01"
      },
      {
        "id": 5,
        "nombre": "Cierre de PDF",
        "tipo": "Completo",
        "formato": "PDF",
        "fecha_generacion": "2026-03-27T01:06:14.719-06:00",
        "generado_por": "Administrador General",
        "estado": "completado",
        "periodo": "2026-03-01 a 2026-04-01"
      },
      {
        "id": 4,
        "nombre": "Cierre de Excel",
        "tipo": "Completo",
        "formato": "XLSX",
        "fecha_generacion": "2026-03-27T01:03:26.492-06:00",
        "generado_por": "Administrador General",
        "estado": "completado",
        "periodo": "2026-03-01 a 2026-04-01"
      },
      {
        "id": 3,
        "nombre": "Cierre de Marzo 2026",
        "tipo": "Reporte Completo",
        "formato": "CSV",
        "fecha_generacion": "2026-03-27T00:41:44.148-06:00",
        "generado_por": "Administrador General",
        "estado": "completado",
        "periodo": "2026-03-01 a 2026-04-01"
      },
      {
        "id": 2,
        "nombre": "Cierre de Marzo 2026",
        "tipo": "Reporte Completo",
        "formato": "CSV",
        "fecha_generacion": "2026-03-27T00:25:11.163-06:00",
        "generado_por": "Administrador General",
        "estado": "completado",
        "periodo": "2026-03-01 a 2026-04-01"
      },
      {
        "id": 1,
        "nombre": "Cierre de Marzo 2026",
        "tipo": "Reporte Completo",
        "formato": "CSV",
        "fecha_generacion": "2026-03-26T23:48:15.149-06:00",
        "generado_por": "Administrador General",
        "estado": "completado",
        "periodo": "2026-03-01 a 2026-04-01"
      }
    ],
    "paginacion": {
      "total": 9,
      "pagina": 1,
      "limite": 10,
      "totalPaginas": 1
    }
  }
}

Generar el Reporte

tipos:

{
  "nombre": "Reporte Cloud Excel",
  "descripcion": "Generado en RAM y enviado a Supabase",
  "tipo_reporte": "Completo",
  "formato": "CSV",
  "fecha_inicio": "2026-03-01",
  "fecha_fin": "2026-03-31"
}

{
  "nombre": "Reporte Cloud Excel",
  "descripcion": "Generado en RAM y enviado a Supabase",
  "tipo_reporte": "Completo",
  "formato": "XLSX",
  "fecha_inicio": "2026-03-01",
  "fecha_fin": "2026-03-31"
}

{
  "nombre": "Reporte Cloud PDF",
  "descripcion": "Documento corporativo en la nube",
  "tipo_reporte": "Completo",
  "formato": "PDF",
  "fecha_inicio": "2026-03-01",
  "fecha_fin": "2026-03-31"
}

curl -X POST "{{url-local}}/api/financiero/generar-reporte" \
  -H "Authorization: {{token-user}}" \
  -d '{
  "nombre": "Reporte Cloud PDF",
  "descripcion": "Documento corporativo en la nube",
  "tipo_reporte": "Completo",
  "formato": "PDF",
  "fecha_inicio": "2026-03-01",
  "fecha_fin": "2026-03-31"
}'

response: 

{
  "success": true,
  "message": "Reporte generado",
  "data": {
    "id": 10
  }
}


Obtener Comparaciones e Insights

curl -X GET "{{url-local}}/api/financiero/comparaciones" \
  -H "Authorization: {{token-user}}"

Query Params (Opcionales):

periodo: “hoy”, “esta semana”, “este mes”, “este trimestre”, “este semestre”, “este ano”, “personalizado”. (Default: “este mes”).

tipo_reporte: “reporte completo”, “ventas”, “gastos”, “utilidad”, “membresias”.

fecha_inicio, fecha_fin: Formato YYYY-MM-DD (Solo requeridos si el periodo es “personalizado”).

response: 
{
  "message": "Datos de comparaciones generados",
  "filtros_aplicados": {
    "periodo": "Este Mes",
    "tab_seleccionada": "Periodo Seleccionado"
  },
  "data": {
    "titulo_grafica": "Este Mes vs Periodo Anterior",
    "comparaciones": {
      "ventas": {
        "actual": 11246.82,
        "anterior": 0,
        "diferencia": 11246.82,
        "porcentaje": 100,
        "es_positivo": true
      },
      "gastos": {
        "actual": 2700,
        "anterior": 0,
        "diferencia": 2700,
        "porcentaje": 100,
        "es_positivo": false
      },
      "utilidad": {
        "actual": 96051.82,
        "anterior": 0,
        "diferencia": 96051.82,
        "porcentaje": 100,
        "es_positivo": true
      },
      "membresias": {
        "actual": 87505,
        "anterior": 0,
        "diferencia": 87505,
        "porcentaje": 100,
        "es_positivo": true
      }
    },
    "resumen_indicadores": {
      "positivos": 3,
      "negativos": 1
    },
    "insights": [
      {
        "tipo": "positivo",
        "texto": "Las ventas aumentaron un 100% respecto al periodo anterior. ¡Excelente ritmo!"
      },
      {
        "tipo": "negativo",
        "texto": "Atención: Los gastos se incrementaron un 100%."
      },
      {
        "tipo": "neutral",
        "texto": "El plan más popular es \"Mensualidad\" con 83 suscripciones nuevas. Total de socios adquiridos: 285."
      }
    ]
  }
}


Obtener Datos para Gráficas
curl -X GET "{{url-local}}/api/financiero/graficas" \
  -H "Authorization: {{token-user}}"
Query Params (Opcionales):

periodo: “hoy”, “esta semana”, “este mes”, “este trimestre”, “este semestre”, “este ano”, “personalizado”. (Default: “este mes”).

tipo_reporte: “reporte completo”, “ventas”, “gastos”, “utilidad”, “membresias”.

fecha_inicio, fecha_fin: Formato YYYY-MM-DD (Solo requeridos si el periodo es “personalizado”).

response: {
  "message": "Datos de gráficas financieras generados",
  "filtros_aplicados": {
    "periodo": "Este Mes",
    "tipo_reporte": "Reporte Completo"
  },
  "data": {
    "tendencia_financiera": [
      {
        "fecha": "2026-03-01",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-02",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-03",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-04",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-05",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-06",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-07",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-08",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-09",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-10",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-11",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-12",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-13",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-14",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-15",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-16",
        "ventas": 839.97,
        "gastos": 0,
        "utilidad": 9520.97,
        "membresias": 8681
      },
      {
        "fecha": "2026-03-17",
        "ventas": 1507,
        "gastos": 0,
        "utilidad": 14658,
        "membresias": 13151
      },
      {
        "fecha": "2026-03-18",
        "ventas": 1007,
        "gastos": 1400,
        "utilidad": 10808,
        "membresias": 11201
      },
      {
        "fecha": "2026-03-19",
        "ventas": 1070,
        "gastos": 0,
        "utilidad": 7271,
        "membresias": 6201
      },
      {
        "fecha": "2026-03-20",
        "ventas": 1061.94,
        "gastos": 0,
        "utilidad": 2462.94,
        "membresias": 1401
      },
      {
        "fecha": "2026-03-21",
        "ventas": 167,
        "gastos": 0,
        "utilidad": 867,
        "membresias": 700
      },
      {
        "fecha": "2026-03-22",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-23",
        "ventas": 1143.91,
        "gastos": 600,
        "utilidad": 22763.91,
        "membresias": 22220
      },
      {
        "fecha": "2026-03-24",
        "ventas": 979,
        "gastos": 0,
        "utilidad": 9479,
        "membresias": 8500
      },
      {
        "fecha": "2026-03-25",
        "ventas": 761,
        "gastos": 700,
        "utilidad": 9261,
        "membresias": 9200
      },
      {
        "fecha": "2026-03-26",
        "ventas": 1316,
        "gastos": 0,
        "utilidad": 5766,
        "membresias": 4450
      },
      {
        "fecha": "2026-03-27",
        "ventas": 847,
        "gastos": 0,
        "utilidad": 847,
        "membresias": 0
      },
      {
        "fecha": "2026-03-28",
        "ventas": 547,
        "gastos": 0,
        "utilidad": 2347,
        "membresias": 1800
      },
      {
        "fecha": "2026-03-29",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      },
      {
        "fecha": "2026-03-30",
        "ventas": 0,
        "gastos": 0,
        "utilidad": 0,
        "membresias": 0
      }
    ],
    "gastos_por_categoria": {
      "mostrar": true,
      "datos": [
        {
          "categoria": "Devolución de Membresía",
          "monto": 2700
        }
      ]
    },
    "membresias_por_plan": {
      "mostrar": true,
      "datos": [
        {
          "plan": "Mensualidad",
          "cantidad": 83,
          "ingresos_generados": 58100
        },
        {
          "plan": "Pareja1",
          "cantidad": 69,
          "ingresos_generados": 41300
        },
        {
          "plan": "Pareja 2",
          "cantidad": 65,
          "ingresos_generados": 38900
        },
        {
          "plan": "Estudiante Mensualidad",
          "cantidad": 36,
          "ingresos_generados": 21600
        },
        {
          "plan": "Promo Walter",
          "cantidad": 6,
          "ingresos_generados": 3600
        },
        {
          "plan": "Cortesía",
          "cantidad": 6,
          "ingresos_generados": 6
        },
        {
          "plan": "Visita",
          "cantidad": 5,
          "ingresos_generados": 600
        },
        {
          "plan": "Semana",
          "cantidad": 4,
          "ingresos_generados": 1200
        },
        {
          "plan": "Quincena",
          "cantidad": 3,
          "ingresos_generados": 1350
        },
        {
          "plan": "Promoción Adrián",
          "cantidad": 3,
          "ingresos_generados": 1500
        },
        {
          "plan": "Checador Empleado",
          "cantidad": 3,
          "ingresos_generados": 0
        },
        {
          "plan": "Promo Medellin",
          "cantidad": 2,
          "ingresos_generados": 1200
        }
      ]
    },
    "ventas_vs_gastos": {
      "mostrar": true,
      "datos": [
        {
          "fecha": "2026-03-01",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-02",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-03",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-04",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-05",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-06",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-07",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-08",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-09",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-10",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-11",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-12",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-13",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-14",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-15",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-16",
          "ventas": 839.97,
          "gastos": 0
        },
        {
          "fecha": "2026-03-17",
          "ventas": 1507,
          "gastos": 0
        },
        {
          "fecha": "2026-03-18",
          "ventas": 1007,
          "gastos": 1400
        },
        {
          "fecha": "2026-03-19",
          "ventas": 1070,
          "gastos": 0
        },
        {
          "fecha": "2026-03-20",
          "ventas": 1061.94,
          "gastos": 0
        },
        {
          "fecha": "2026-03-21",
          "ventas": 167,
          "gastos": 0
        },
        {
          "fecha": "2026-03-22",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-23",
          "ventas": 1143.91,
          "gastos": 600
        },
        {
          "fecha": "2026-03-24",
          "ventas": 979,
          "gastos": 0
        },
        {
          "fecha": "2026-03-25",
          "ventas": 761,
          "gastos": 700
        },
        {
          "fecha": "2026-03-26",
          "ventas": 1316,
          "gastos": 0
        },
        {
          "fecha": "2026-03-27",
          "ventas": 847,
          "gastos": 0
        },
        {
          "fecha": "2026-03-28",
          "ventas": 547,
          "gastos": 0
        },
        {
          "fecha": "2026-03-29",
          "ventas": 0,
          "gastos": 0
        },
        {
          "fecha": "2026-03-30",
          "ventas": 0,
          "gastos": 0
        }
      ]
    }
  }
}


Obtener Resumen Financiero (Tarjetas KPI)

curl -X GET "{{url-local}}/api/financiero/resumen" \
  -H "Authorization: {{token-user}}"

Query Params (Opcionales):

periodo: “hoy”, “esta semana”, “este mes”, “este trimestre”, “este semestre”, “este ano”, “personalizado”. (Default: “este mes”).

tipo_reporte: “reporte completo”, “ventas”, “gastos”, “utilidad”, “membresias”.

fecha_inicio, fecha_fin: Formato YYYY-MM-DD (Solo requeridos si el periodo es “personalizado”).

response: 
{
  "message": "Reporte Financiero generado",
  "filtros_aplicados": {
    "periodo": "Este Mes",
    "tipo_reporte": "Reporte Completo"
  },
  "data": {
    "kpis_superiores": {
      "ingresos": {
        "total": 135621.82,
        "porcentaje": 100
      },
      "gastos": {
        "total": 2700,
        "porcentaje": 100
      },
      "utilidad_neta": {
        "total": 132921.82,
        "porcentaje": 100
      },
      "membresias": {
        "total": 87505,
        "porcentaje": 100,
        "socios_activos": 280
      }
    },
    "desglose_ingresos": {
      "mostrar": true,
      "total_ingresos": 135621.82,
      "saldo_neto": 132921.82,
      "grafica": {
        "ventas": {
          "total": 11246.82,
          "porcentaje_grafica": 8.3,
          "porcentaje_vs_anterior": 100
        },
        "membresias": {
          "total": 87505,
          "porcentaje_grafica": 64.5,
          "porcentaje_vs_anterior": 100
        }
      }
    },
    "tarjetas_detalle": {
      "ventas": {
        "mostrar": true,
        "total": 11246.82,
        "transacciones": 235,
        "porcentaje_vs_anterior": 100,
        "anterior_texto": "$0"
      },
      "gastos": {
        "mostrar": true,
        "total": 2700,
        "movimientos": 4,
        "porcentaje_vs_anterior": 100,
        "anterior_texto": "$0"
      },
      "utilidad": {
        "mostrar": true,
        "total": 132921.82,
        "margen": 98,
        "porcentaje_vs_anterior": 100,
        "anterior_texto": "$0"
      },
      "membresias": {
        "mostrar": true,
        "total": 87505,
        "socios_activos": 280,
        "porcentaje_vs_anterior": 100,
        "anterior_texto": "$0"
      }
    },
    "top_gastos": [
      {
        "categoria": "Devolución de Membresía",
        "monto": 2700
      }
    ],
    "rendimiento_planes": [
      {
        "plan": "Mensualidad",
        "cantidad": 83
      },
      {
        "plan": "Pareja1",
        "cantidad": 69
      },
      {
        "plan": "Pareja 2",
        "cantidad": 65
      },
      {
        "plan": "Estudiante Mensualidad",
        "cantidad": 36
      },
      {
        "plan": "Promo Walter",
        "cantidad": 6
      },
      {
        "plan": "Cortesía",
        "cantidad": 6
      },
      {
        "plan": "Visita",
        "cantidad": 5
      },
      {
        "plan": "Semana",
        "cantidad": 4
      },
      {
        "plan": "Quincena",
        "cantidad": 3
      },
      {
        "plan": "Promoción Adrián",
        "cantidad": 3
      },
      {
        "plan": "Checador Empleado",
        "cantidad": 3
      },
      {
        "plan": "Promo Medellin",
        "cantidad": 2
      }
    ],
    "insights": [
      {
        "tipo": "positivo",
        "texto": "El margen de utilidad neta se mantiene saludable en un 98.0%."
      },
      {
        "tipo": "positivo",
        "texto": "Tus ingresos globales crecieron un 100% respecto al periodo anterior."
      },
      {
        "tipo": "neutral",
        "texto": "Tu mayor gasto fue en la categoría 'Devolución de Membresía' con $2,700."
      },
      {
        "tipo": "neutral",
        "texto": "Tu plan más popular fue 'Mensualidad' con 83 ventas nuevas."
      }
    ],
    "barra_inferior": {
      "periodo_texto": "Este Mes",
      "rango_fechas": "2026-03-01 a 2026-03-30",
      "ingresos_totales": 135621.82,
      "utilidad_neta": 132921.82
    }
  }
}