// LOS forecast — serie diaria con bandas de confianza al 95%.
// Devuelve [{dia, real, predicho, low, high}].
function makeLos(estadia, losBase) {
  const arr = [];
  for (let d = 0; d <= estadia + 4; d++) {
    const real = d <= estadia ? Math.min(d, estadia) : null;
    const predicho = Math.min(d, losBase);
    const banda = 1.5 + d * 0.15;
    arr.push({ dia: d, real, predicho, low: predicho - banda, high: predicho + banda });
  }
  return arr;
}

window.makeLos = makeLos;
