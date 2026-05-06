// Pure functions for filtering and aggregating the patient set.
// All inputs are arguments — no globals. Keep logic out of the React layer.

function filtrarPacientes(pacientes, { servicio = 'todos', search = '' } = {}) {
  let list = pacientes;
  if (servicio !== 'todos') list = list.filter(p => p.servicio === servicio);
  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.rut.toLowerCase().includes(q) ||
      p.cama.toLowerCase().includes(q) ||
      p.diagnostico.toLowerCase().includes(q)
    );
  }
  return [...list].sort((a, b) => (b.estadia - b.losPredicho) - (a.estadia - a.losPredicho));
}

function statsPacientes(pacientes) {
  const ocupacion = pacientes.length;
  const desviados = pacientes.filter(p => p.estadia > p.losPredicho + 2).length;
  const altaProb = pacientes.filter(p => p.probAlta48 >= 70).length;
  const tareasPend = pacientes.reduce((s, p) => s + p.tareas.filter(t => t.estado === 'pendiente').length, 0);
  const losActual = pacientes.length
    ? (pacientes.reduce((s, p) => s + p.estadia, 0) / pacientes.length).toFixed(1)
    : '0';
  return { ocupacion, desviados, altaProb, tareasPend, losActual };
}

function tareasCriticasGlobal(pacientes) {
  return pacientes.reduce((s, p) => s + p.tareas.filter(t => t.critico && t.estado === 'pendiente').length, 0);
}

window.filtrarPacientes = filtrarPacientes;
window.statsPacientes = statsPacientes;
window.tareasCriticasGlobal = tareasCriticasGlobal;
