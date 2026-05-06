// Acciones recomendadas por el copiloto IA, rankeadas por impacto en LOS y disponibilidad de camas.
const AI_RECOMENDACIONES = [
  { id: 1, pacienteId: 4,  accion: 'Re-evaluación quirúrgica urgente',         impacto: 'Liberaría cama 104-A en ~3 días',                       confianza: 0.84, prioridad: 'alta'  },
  { id: 2, pacienteId: 12, accion: 'Coordinar centro de rehabilitación',        impacto: 'Bloqueador #1 — cama 302-A llevará 23 días',            confianza: 0.91, prioridad: 'alta'  },
  { id: 3, pacienteId: 1,  accion: 'Acelerar interconsulta Gastroenterología', impacto: 'Espera de 4 días excede protocolo',                      confianza: 0.76, prioridad: 'media' },
  { id: 4, pacienteId: 7,  accion: 'Definir vía quirúrgica vs médica',         impacto: 'LOS aumenta 0.8 d/día sin definición',                   confianza: 0.68, prioridad: 'media' },
  { id: 5, pacienteId: 6,  accion: 'Confirmar tránsito intestinal hoy',         impacto: 'Habilita alta en 24-48h',                                confianza: 0.79, prioridad: 'media' },
];

window.AI_RECOMENDACIONES = AI_RECOMENDACIONES;
