// Adjunta los outputs de los modelos ML a cada paciente al cargar el bundle.
// Debe correr DESPUÉS de pacientes.js, shap.js, los-forecast.js, vitals-anomaly.js.
(function enrichPacientes() {
  const { PACIENTES_V2, makeShap, makeLos, makeVitalsTrend } = window;
  PACIENTES_V2.forEach(p => {
    const examPend = p.examenes.filter(e => e.estado === 'pendiente').length;
    const tareasPend = p.tareas.filter(t => t.estado === 'pendiente').length;
    p.shap = makeShap(p.probAlta, p.estadia, p.losPredicho, p.vitales, tareasPend, examPend);
    p.losTrend = makeLos(p.estadia, p.losPredicho);
    p.vitalsTrend = makeVitalsTrend(p.vitales);
  });
})();
