// Métricas agregadas del modelo LOS-Predict v2.4 sobre los últimos 30 días.
const ANALYTICS = {
  precision_modelo: 0.847,
  altas_predichas_correctas: 312,
  altas_totales_30d: 368,
  los_promedio_actual: 9.4,
  los_promedio_predicho: 8.1,
  cuellos_botella: [
    { tipo: 'Interconsulta no respondida',    frecuencia: 38, dias_extra: 2.4 },
    { tipo: 'Anatomía patológica pendiente',  frecuencia: 24, dias_extra: 3.1 },
    { tipo: 'Coordinación social/rehab',      frecuencia: 18, dias_extra: 4.8 },
    { tipo: 'Imágenes de control',            frecuencia: 22, dias_extra: 1.6 },
    { tipo: 'Cultivos pendientes',            frecuencia: 16, dias_extra: 2.0 },
  ],
};

window.ANALYTICS = ANALYTICS;
