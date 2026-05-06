// Servicios hospitalarios — Hospital Regional Concepción
// Numeración global de camas (número inicial del código, ej. "22" o "22-A"):
// UCI 1–6, UTI 7–17, MQ1 18–35, MQ2 107–137, MQ3 138–149 (sin solapar 137 entre MQ2 y MQ3).
const SERVICIOS_V2 = [
  { id: 'mq1', nombre: 'Medicina Quirúrgica 1', abrev: 'MQ-1', camas: 18, camaDesde: 18, camaHasta: 35 },
  { id: 'mq2', nombre: 'Medicina Quirúrgica 2', abrev: 'MQ-2', camas: 31, camaDesde: 107, camaHasta: 137 },
  { id: 'mq3', nombre: 'Medicina Quirúrgica 3', abrev: 'MQ-3', camas: 12, camaDesde: 138, camaHasta: 149 },
  { id: 'uti', nombre: 'Unidad de Tratamiento Intermedio', abrev: 'UTI', camas: 11, camaDesde: 7, camaHasta: 17 },
  { id: 'uci', nombre: 'Unidad de Cuidados Intensivos', abrev: 'UCI', camas: 6, camaDesde: 1, camaHasta: 6 },
];

function numeroDeCama(camaStr) {
  const m = String(camaStr ?? '').trim().match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : NaN;
}

/** true si el prefijo numérico de la cama cae en el rango del servicio elegido */
function camaEnRangoServicio(camaStr, servicioId) {
  const s = SERVICIOS_V2.find((x) => x.id === servicioId);
  if (!s || s.camaDesde == null || s.camaHasta == null) return true;
  const n = numeroDeCama(camaStr);
  if (!Number.isFinite(n)) return false;
  return n >= s.camaDesde && n <= s.camaHasta;
}

window.SERVICIOS_V2 = SERVICIOS_V2;
window.numeroDeCama = numeroDeCama;
window.camaEnRangoServicio = camaEnRangoServicio;
