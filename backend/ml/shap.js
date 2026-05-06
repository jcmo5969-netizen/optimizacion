// SHAP — contribuciones ilustrativas hacia la decisión de alta (demo educativa).
// Valor positivo = empuja hacia alta; negativo = mantiene hospitalizado.

function parseSystolic(pa) {
  if (pa == null) return null;
  const s = String(pa).trim();
  const m = s.match(/^(\d+)/);
  return m ? Number(m[1]) : null;
}

/** Tendencia de signos vitales: reacciona a FC, FR, sat, T° y PA (sistólica). */
function vitalsShap(v) {
  if (!v || typeof v !== 'object') {
    return { value: 0, abs: 0 };
  }
  let raw = 0;
  const fc = Number(v.fc);
  const fr = Number(v.fr);
  const sat = Number(v.sat);
  const temp = Number(v.temp);
  if (Number.isFinite(fc)) {
    if (fc >= 70 && fc <= 95) raw += 0.05;
    else if (fc >= 60 && fc <= 105) raw += 0.02;
    else raw -= 0.05;
  }
  if (Number.isFinite(sat)) {
    if (sat >= 96) raw += 0.05;
    else if (sat >= 92) raw += 0.01;
    else raw -= 0.07;
  }
  if (Number.isFinite(fr)) {
    if (fr >= 12 && fr <= 22) raw += 0.04;
    else if (fr <= 28) raw -= 0.01;
    else raw -= 0.05;
  }
  if (Number.isFinite(temp)) {
    if (temp < 37.5 && temp >= 36) raw += 0.04;
    else if (temp >= 38) raw -= 0.08;
    else if (temp >= 37.5) raw -= 0.02;
  }
  const sys = parseSystolic(v.pa);
  if (Number.isFinite(sys)) {
    if (sys >= 90 && sys <= 139) raw += 0.02;
    else raw -= 0.03;
  }
  const value = Math.max(-0.22, Math.min(0.22, raw));
  return { value, abs: Math.abs(value) };
}

/** Comparación estadía real vs LOS predicho (no solo un umbral fijo en días). */
function estadiaVsLosShap(estadia, losPredicho) {
  const los = Math.max(1, Number(losPredicho) || 1);
  const e = Number(estadia) || 0;
  const ratio = e / los;
  let value;
  if (ratio <= 0.85) value = 0.16;
  else if (ratio <= 1) value = 0.1;
  else if (ratio <= 1.15) value = -0.08;
  else value = -0.2;
  return { value, abs: Math.abs(value) };
}

function makeShap(_probAlta, estadia, losPredicho, vitales, tareasPend, examPend) {
  const vit = vitalsShap(vitales);
  const los = estadiaVsLosShap(estadia, losPredicho);
  return [
    { feature: 'Tendencia signos vitales', value: vit.value, abs: vit.abs },
    { feature: 'Tareas pendientes alta', value: -0.04 * tareasPend, abs: 0.04 * tareasPend },
    { feature: 'Estadía vs LOS predicho', value: los.value, abs: los.abs },
    { feature: 'Exámenes pendientes', value: -0.03 * examPend, abs: 0.03 * examPend },
    { feature: 'Edad y comorbilidades', value: -0.08, abs: 0.08 },
    { feature: 'Tipo de cirugía', value: 0.06, abs: 0.06 },
    { feature: 'Drenajes / vías activas', value: -0.05, abs: 0.05 },
    { feature: 'Tolerancia oral', value: 0.09, abs: 0.09 },
  ].sort((a, b) => b.abs - a.abs);
}

window.makeShap = makeShap;
