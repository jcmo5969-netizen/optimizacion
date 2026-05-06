// Detección de anomalías en signos vitales — serie horaria de las últimas 24h.
// Las anomalías están marcadas a mano (h=14, h=19) para reproducibilidad del demo.
function makeVitalsTrend(vitales) {
  const series = [];
  for (let h = 0; h < 24; h++) {
    const noise = (Math.sin(h * 0.7) + Math.cos(h * 0.4)) * 4;
    series.push({
      hora: h,
      fc: Math.round(vitales.fc + noise),
      sat: Math.max(88, Math.min(100, Math.round(vitales.sat + noise * 0.3))),
      temp: Number((vitales.temp + noise * 0.05).toFixed(1)),
      anomalia: h === 14 || h === 19,
    });
  }
  return series;
}

window.makeVitalsTrend = makeVitalsTrend;
