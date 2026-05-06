// Realistic Chilean hospital patient data for "Pizarra Digital"
// RUT format: NN.NNN.NNN-X, dates in Spanish

const SERVICIOS = [
  { id: 'mq1', nombre: 'Medicina Quirúrgica 1', abrev: 'MQ-1', camas: 24 },
  { id: 'mq2', nombre: 'Medicina Quirúrgica 2', abrev: 'MQ-2', camas: 22 },
  { id: 'mq3', nombre: 'Medicina Quirúrgica 3', abrev: 'MQ-3', camas: 20 },
];

const PACIENTES = [
  {
    id: 1, servicio: 'mq1', cama: '101-A',
    nombre: 'Rosa María Quintanilla Vergara', rut: '12.847.392-K', edad: 67, sexo: 'F',
    diagnostico: 'Colecistectomía laparoscópica + colangitis',
    medico: 'Dr. Andrés Reyes', ingreso: '2026-04-13', estadia: 14,
    vitales: { fc: 88, fr: 18, pa: '128/82', sat: 96, temp: 36.8 },
    alertas: ['hemoglobina baja'],
    examenes: [
      { tipo: 'Hemograma', estado: 'pendiente', solicitado: '2026-04-26' },
      { tipo: 'PCR', estado: 'listo', valor: '42 mg/L', flag: 'alto' },
      { tipo: 'Función hepática', estado: 'pendiente', solicitado: '2026-04-27' },
    ],
    interconsultas: [
      { especialidad: 'Gastroenterología', estado: 'pendiente', dias: 4 },
    ],
    tareas: [
      { texto: 'Retiro de drenaje Kehr', estado: 'pendiente', critico: true },
      { texto: 'Confirmar colangiografía', estado: 'pendiente', critico: true },
      { texto: 'Receta antibióticos al alta', estado: 'pendiente' },
      { texto: 'Educación cuidados herida', estado: 'completo' },
    ],
    probAlta: 34, tendencia: 'estable',
  },
  {
    id: 2, servicio: 'mq1', cama: '102-A',
    nombre: 'Eduardo Patricio Salinas Bórquez', rut: '8.923.456-7', edad: 74, sexo: 'M',
    diagnostico: 'Hernia inguinal complicada — postoperado día 3',
    medico: 'Dra. Carmen Lobos', ingreso: '2026-04-22', estadia: 5,
    vitales: { fc: 76, fr: 16, pa: '134/78', sat: 98, temp: 36.5 },
    alertas: [],
    examenes: [
      { tipo: 'Hemograma control', estado: 'listo', valor: 'normal' },
    ],
    interconsultas: [],
    tareas: [
      { texto: 'Tolerancia oral progresiva', estado: 'completo' },
      { texto: 'Indicaciones al alta', estado: 'pendiente' },
      { texto: 'Coordinar transporte', estado: 'pendiente' },
    ],
    probAlta: 84, tendencia: 'subiendo',
  },
  {
    id: 3, servicio: 'mq1', cama: '103-B',
    nombre: 'Isidora Antonia Lefimán Cariqueo', rut: '20.118.473-2', edad: 28, sexo: 'F',
    diagnostico: 'Apendicectomía — postoperado día 1',
    medico: 'Dr. Andrés Reyes', ingreso: '2026-04-25', estadia: 2,
    vitales: { fc: 82, fr: 17, pa: '118/72', sat: 99, temp: 37.1 },
    alertas: [],
    examenes: [
      { tipo: 'PCR control', estado: 'pendiente', solicitado: '2026-04-27' },
    ],
    interconsultas: [],
    tareas: [
      { texto: 'Retiro vía venosa', estado: 'pendiente' },
      { texto: 'Confirmar deambulación', estado: 'completo' },
    ],
    probAlta: 67, tendencia: 'subiendo',
  },
  {
    id: 4, servicio: 'mq1', cama: '104-A',
    nombre: 'Hernán Octavio Pizarro Maldonado', rut: '7.234.891-5', edad: 81, sexo: 'M',
    diagnostico: 'Obstrucción intestinal — manejo conservador',
    medico: 'Dra. Carmen Lobos', ingreso: '2026-04-09', estadia: 18,
    vitales: { fc: 102, fr: 22, pa: '142/88', sat: 93, temp: 37.8 },
    alertas: ['taquicardia', 'fiebre', 'sat baja'],
    examenes: [
      { tipo: 'TAC abdomen', estado: 'pendiente', solicitado: '2026-04-25' },
      { tipo: 'Hemocultivos x2', estado: 'pendiente', solicitado: '2026-04-26' },
      { tipo: 'Lactato', estado: 'listo', valor: '3.2 mmol/L', flag: 'alto' },
    ],
    interconsultas: [
      { especialidad: 'Cirugía General', estado: 'pendiente', dias: 6 },
      { especialidad: 'Geriatría', estado: 'pendiente', dias: 3 },
    ],
    tareas: [
      { texto: 'Re-evaluar quirúrgico', estado: 'pendiente', critico: true },
      { texto: 'Revisar tratamiento ATB', estado: 'pendiente', critico: true },
      { texto: 'SNG control débito', estado: 'completo' },
    ],
    probAlta: 12, tendencia: 'bajando',
  },
  {
    id: 5, servicio: 'mq1', cama: '105-A',
    nombre: 'Constanza Belén Mardones Espinoza', rut: '19.482.117-K', edad: 32, sexo: 'F',
    diagnostico: 'Colelitiasis — pre-quirúrgica',
    medico: 'Dr. Andrés Reyes', ingreso: '2026-04-26', estadia: 1,
    vitales: { fc: 74, fr: 16, pa: '116/70', sat: 99, temp: 36.6 },
    alertas: [],
    examenes: [
      { tipo: 'Pre-anestesia', estado: 'pendiente', solicitado: '2026-04-26' },
    ],
    interconsultas: [],
    tareas: [
      { texto: 'Firma consentimiento', estado: 'completo' },
      { texto: 'Pabellón programado', estado: 'pendiente' },
    ],
    probAlta: 22, tendencia: 'estable',
  },
  {
    id: 6, servicio: 'mq2', cama: '201-A',
    nombre: 'Jorge Sebastián Henríquez Ovalle', rut: '11.567.234-8', edad: 58, sexo: 'M',
    diagnostico: 'Resección colon sigmoides — postoperado día 8',
    medico: 'Dr. Felipe Cárcamo', ingreso: '2026-04-15', estadia: 12,
    vitales: { fc: 86, fr: 18, pa: '138/84', sat: 97, temp: 36.9 },
    alertas: [],
    examenes: [
      { tipo: 'Tránsito intestinal', estado: 'pendiente', solicitado: '2026-04-26' },
      { tipo: 'Hemograma', estado: 'listo', valor: 'Hb 10.2', flag: 'bajo' },
    ],
    interconsultas: [
      { especialidad: 'Nutrición', estado: 'completo', dias: 0 },
    ],
    tareas: [
      { texto: 'Confirmar tránsito intestinal', estado: 'pendiente', critico: true },
      { texto: 'Anatomía patológica', estado: 'pendiente', critico: true },
      { texto: 'Coordinar oncología', estado: 'pendiente' },
    ],
    probAlta: 41, tendencia: 'estable',
  },
  {
    id: 7, servicio: 'mq2', cama: '202-A',
    nombre: 'Margarita Leonor Bahamondes Fritz', rut: '6.812.349-1', edad: 79, sexo: 'F',
    diagnostico: 'Colecistitis aguda — manejo médico',
    medico: 'Dra. Paula Sandoval', ingreso: '2026-04-11', estadia: 16,
    vitales: { fc: 94, fr: 20, pa: '152/92', sat: 95, temp: 37.4 },
    alertas: ['HTA', 'fiebre baja'],
    examenes: [
      { tipo: 'Eco abdominal control', estado: 'pendiente', solicitado: '2026-04-24' },
      { tipo: 'PCR', estado: 'listo', valor: '88 mg/L', flag: 'alto' },
    ],
    interconsultas: [
      { especialidad: 'Cardiología', estado: 'pendiente', dias: 5 },
    ],
    tareas: [
      { texto: 'Decisión quirúrgica', estado: 'pendiente', critico: true },
      { texto: 'Ajustar antihipertensivo', estado: 'pendiente' },
    ],
    probAlta: 18, tendencia: 'bajando',
  },
  {
    id: 8, servicio: 'mq2', cama: '203-A',
    nombre: 'Diego Ignacio Chamorro Vilches', rut: '17.892.456-4', edad: 41, sexo: 'M',
    diagnostico: 'Hernia umbilical — postoperado día 2',
    medico: 'Dr. Felipe Cárcamo', ingreso: '2026-04-23', estadia: 4,
    vitales: { fc: 78, fr: 16, pa: '124/76', sat: 98, temp: 36.7 },
    alertas: [],
    examenes: [],
    interconsultas: [],
    tareas: [
      { texto: 'Indicaciones al alta', estado: 'completo' },
      { texto: 'Receta médica', estado: 'completo' },
      { texto: 'Confirmar acompañante', estado: 'pendiente' },
    ],
    probAlta: 92, tendencia: 'subiendo',
  },
  {
    id: 9, servicio: 'mq2', cama: '204-B',
    nombre: 'Luz Albertina Painequeo Coñoman', rut: '9.345.678-2', edad: 71, sexo: 'F',
    diagnostico: 'Diverticulitis complicada — drenaje percutáneo',
    medico: 'Dra. Paula Sandoval', ingreso: '2026-04-08', estadia: 19,
    vitales: { fc: 96, fr: 19, pa: '128/80', sat: 96, temp: 37.2 },
    alertas: ['estadía prolongada'],
    examenes: [
      { tipo: 'TAC control', estado: 'pendiente', solicitado: '2026-04-25' },
      { tipo: 'PCR', estado: 'listo', valor: '24 mg/L', flag: 'normal' },
    ],
    interconsultas: [
      { especialidad: 'Radiología int.', estado: 'pendiente', dias: 2 },
    ],
    tareas: [
      { texto: 'Retiro drenaje percutáneo', estado: 'pendiente', critico: true },
      { texto: 'Plan ambulatorio ATB', estado: 'pendiente' },
    ],
    probAlta: 38, tendencia: 'subiendo',
  },
  {
    id: 10, servicio: 'mq2', cama: '205-A',
    nombre: 'Rodrigo Alejandro Vásquez Carmona', rut: '14.234.891-K', edad: 49, sexo: 'M',
    diagnostico: 'Apendicectomía complicada — peritonitis',
    medico: 'Dr. Felipe Cárcamo', ingreso: '2026-04-14', estadia: 13,
    vitales: { fc: 92, fr: 20, pa: '130/82', sat: 96, temp: 37.6 },
    alertas: ['fiebre baja'],
    examenes: [
      { tipo: 'Hemograma', estado: 'pendiente', solicitado: '2026-04-27' },
      { tipo: 'Cultivo herida', estado: 'pendiente', solicitado: '2026-04-26' },
    ],
    interconsultas: [
      { especialidad: 'Infectología', estado: 'pendiente', dias: 3 },
    ],
    tareas: [
      { texto: 'Curaciones diarias', estado: 'completo' },
      { texto: 'Resultado cultivo', estado: 'pendiente', critico: true },
      { texto: 'Plan ATB ambulatorio', estado: 'pendiente' },
    ],
    probAlta: 29, tendencia: 'estable',
  },
  {
    id: 11, servicio: 'mq3', cama: '301-A',
    nombre: 'Catalina Francisca Urzúa Pinochet', rut: '18.456.123-5', edad: 36, sexo: 'F',
    diagnostico: 'Mastectomía parcial — postoperado día 4',
    medico: 'Dr. Manuel Tapia', ingreso: '2026-04-22', estadia: 5,
    vitales: { fc: 80, fr: 16, pa: '120/74', sat: 98, temp: 36.6 },
    alertas: [],
    examenes: [
      { tipo: 'Anatomía patológica', estado: 'pendiente', solicitado: '2026-04-22' },
    ],
    interconsultas: [
      { especialidad: 'Oncología', estado: 'completo', dias: 0 },
      { especialidad: 'Psicología', estado: 'pendiente', dias: 1 },
    ],
    tareas: [
      { texto: 'Retiro drenaje', estado: 'pendiente', critico: true },
      { texto: 'Educación linfedema', estado: 'pendiente' },
      { texto: 'Coordinar oncología amb.', estado: 'pendiente' },
    ],
    probAlta: 58, tendencia: 'subiendo',
  },
  {
    id: 12, servicio: 'mq3', cama: '302-A',
    nombre: 'Bernardo Eliseo Ramírez Concha', rut: '5.678.234-9', edad: 84, sexo: 'M',
    diagnostico: 'Fractura cadera operada — rehabilitación',
    medico: 'Dra. Sofía Aravena', ingreso: '2026-04-04', estadia: 23,
    vitales: { fc: 88, fr: 18, pa: '146/86', sat: 95, temp: 36.5 },
    alertas: ['estadía crítica', 'HTA'],
    examenes: [
      { tipo: 'RX cadera control', estado: 'listo', valor: 'consolidación' },
    ],
    interconsultas: [
      { especialidad: 'Geriatría', estado: 'completo', dias: 0 },
      { especialidad: 'Asistente social', estado: 'pendiente', dias: 8 },
    ],
    tareas: [
      { texto: 'Confirmar centro de rehab', estado: 'pendiente', critico: true },
      { texto: 'Evaluación social', estado: 'pendiente', critico: true },
      { texto: 'Coordinar transporte', estado: 'pendiente', critico: true },
    ],
    probAlta: 22, tendencia: 'estable',
  },
  {
    id: 13, servicio: 'mq3', cama: '303-A',
    nombre: 'Valentina Andrea Soto Mella', rut: '21.234.567-3', edad: 24, sexo: 'F',
    diagnostico: 'Quiste ovárico complicado — postoperado día 1',
    medico: 'Dr. Manuel Tapia', ingreso: '2026-04-25', estadia: 2,
    vitales: { fc: 84, fr: 17, pa: '114/68', sat: 99, temp: 36.9 },
    alertas: [],
    examenes: [
      { tipo: 'Hemograma', estado: 'listo', valor: 'normal' },
    ],
    interconsultas: [],
    tareas: [
      { texto: 'Tolerancia oral', estado: 'completo' },
      { texto: 'Control ginecológico amb.', estado: 'pendiente' },
    ],
    probAlta: 78, tendencia: 'subiendo',
  },
  {
    id: 14, servicio: 'mq3', cama: '304-B',
    nombre: 'Fernando Joaquín Acevedo Riffo', rut: '10.123.456-K', edad: 63, sexo: 'M',
    diagnostico: 'Resección gástrica — postoperado día 6',
    medico: 'Dra. Sofía Aravena', ingreso: '2026-04-15', estadia: 12,
    vitales: { fc: 82, fr: 18, pa: '132/80', sat: 97, temp: 36.8 },
    alertas: [],
    examenes: [
      { tipo: 'Tránsito esófago-gástrico', estado: 'pendiente', solicitado: '2026-04-26' },
      { tipo: 'Albúmina', estado: 'listo', valor: '2.8 g/dL', flag: 'bajo' },
    ],
    interconsultas: [
      { especialidad: 'Nutrición', estado: 'completo', dias: 0 },
    ],
    tareas: [
      { texto: 'Confirmar tránsito', estado: 'pendiente', critico: true },
      { texto: 'Plan nutricional alta', estado: 'pendiente' },
      { texto: 'Anatomía patológica', estado: 'pendiente', critico: true },
    ],
    probAlta: 45, tendencia: 'subiendo',
  },
  {
    id: 15, servicio: 'mq3', cama: '305-A',
    nombre: 'Ana Cristina Velásquez Bravo', rut: '13.789.456-2', edad: 52, sexo: 'F',
    diagnostico: 'Tiroidectomía total — postoperado día 2',
    medico: 'Dr. Manuel Tapia', ingreso: '2026-04-24', estadia: 3,
    vitales: { fc: 72, fr: 16, pa: '118/72', sat: 99, temp: 36.5 },
    alertas: [],
    examenes: [
      { tipo: 'Calcio', estado: 'listo', valor: '8.4 mg/dL', flag: 'normal' },
      { tipo: 'TSH', estado: 'pendiente', solicitado: '2026-04-26' },
    ],
    interconsultas: [
      { especialidad: 'Endocrinología', estado: 'completo', dias: 0 },
    ],
    tareas: [
      { texto: 'Receta levotiroxina', estado: 'completo' },
      { texto: 'Control endocrino amb.', estado: 'pendiente' },
      { texto: 'Indicaciones', estado: 'pendiente' },
    ],
    probAlta: 81, tendencia: 'subiendo',
  },
];

window.SERVICIOS = SERVICIOS;
window.PACIENTES = PACIENTES;
