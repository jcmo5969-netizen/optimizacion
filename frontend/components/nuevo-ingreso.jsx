// Manual patient admission form — used when there's no digital HIS.
function NuevoIngresoForm({ servicios, pacientesExistentes, onClose, onCreate }) {
  const today = new Date().toISOString().slice(0, 10);

  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    nombre: '',
    rut: '',
    edad: '',
    sexo: 'M',
    servicio: servicios[0]?.id || 'mq1',
    cama: '',
    cie10Codigo: '',
    medico: '',
    ingreso: today,
    estadia: 0,
    vitales: { fc: '', fr: '', pa: '', sat: '', temp: '' },
    tareasIniciales: [],
    nuevaTarea: '',
    nuevaTareaCrit: false,
  });
  const [errors, setErrors] = React.useState({});
  const [icdReady, setIcdReady] = React.useState(false);
  const [icdErr, setIcdErr] = React.useState(null);
  const [cie10Busqueda, setCie10Busqueda] = React.useState('');
  const [cie10Open, setCie10Open] = React.useState(false);
  const [cie10Resultados, setCie10Resultados] = React.useState([]);

  React.useEffect(() => {
    if (!window.ICD10_CM || typeof window.ICD10_CM.ensureLoaded !== 'function') {
      setIcdErr('No se cargó icd10cm-loader.js');
      return;
    }
    window.ICD10_CM.ensureLoaded()
      .then(() => { setIcdReady(true); setIcdErr(null); })
      .catch((e) => { setIcdErr(e.message || 'No se pudo cargar el archivo ICD-10-CM'); });
  }, []);

  React.useEffect(() => {
    if (!icdReady || !cie10Open) return;
    const q = cie10Busqueda.trim();
    if (q.length < 2) {
      setCie10Resultados([]);
      return;
    }
    const t = window.setTimeout(() => {
      setCie10Resultados(window.ICD10_CM.search(q, 100));
    }, 180);
    return () => window.clearTimeout(t);
  }, [cie10Busqueda, icdReady, cie10Open]);

  const set = (key, value) => setData(d => ({ ...d, [key]: value }));
  const setVital = (key, value) => setData(d => ({ ...d, vitales: { ...d.vitales, [key]: value } }));

  const validateStep1 = () => {
    const errs = {};
    if (!data.nombre.trim() || data.nombre.trim().split(' ').length < 2) errs.nombre = 'Ingresa nombre y apellido completo';
    if (!data.rut.trim()) errs.rut = 'RUT requerido';
    else if (!/^\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]$/.test(data.rut.trim())) errs.rut = 'Formato esperado: 12.345.678-9';
    const edad = +data.edad;
    if (!edad || edad < 0 || edad > 120) errs.edad = 'Edad entre 0 y 120';
    if (pacientesExistentes.some(p => p.rut.replace(/\./g, '').toLowerCase() === data.rut.replace(/\./g, '').toLowerCase())) {
      errs.rut = 'Ya existe un paciente con este RUT';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!data.cama.trim()) errs.cama = 'Cama requerida';
    else if (pacientesExistentes.some(p => p.cama.toLowerCase() === data.cama.trim().toLowerCase())) {
      errs.cama = `Cama ${data.cama} ya está ocupada`;
    } else {
      const svc = servicios.find(s => s.id === data.servicio);
      if (svc && svc.camaDesde != null && typeof window.camaEnRangoServicio === 'function' && !window.camaEnRangoServicio(data.cama, data.servicio)) {
        errs.cama = `En ${svc.abrev} use numeración ${svc.camaDesde}–${svc.camaHasta} (ej. ${svc.camaDesde} o ${svc.camaDesde}-A)`;
      }
    }
    if (!icdReady) errs.cie10Codigo = 'Cargando listado CIE-10, espere un momento';
    else if (!data.cie10Codigo) errs.cie10Codigo = 'Busque y elija un diagnóstico CIE-10';
    else if (typeof window.lookupCie10 === 'function' && !window.lookupCie10(data.cie10Codigo)) {
      errs.cie10Codigo = 'Código CIE-10 no válido';
    }
    if (!data.medico.trim()) errs.medico = 'Médico tratante requerido';
    if (!data.ingreso) errs.ingreso = 'Fecha de ingreso requerida';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2) {
      if (icdErr) return;
      if (!validateStep2()) return;
    }
    setStep(s => s + 1);
  };

  const back = () => setStep(s => s - 1);

  const addTarea = () => {
    const txt = data.nuevaTarea.trim();
    if (!txt) return;
    setData(d => ({
      ...d,
      tareasIniciales: [...d.tareasIniciales, { texto: txt, estado: 'pendiente', critico: d.nuevaTareaCrit }],
      nuevaTarea: '',
      nuevaTareaCrit: false,
    }));
  };

  const removeTarea = (idx) => {
    setData(d => ({ ...d, tareasIniciales: d.tareasIniciales.filter((_, i) => i !== idx) }));
  };

  const calcularEstadia = (fechaIngreso) => {
    const ms = Date.now() - new Date(fechaIngreso).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  };

  const handleSubmit = () => {
    const cie = typeof window.lookupCie10 === 'function' ? window.lookupCie10(data.cie10Codigo) : null;
    if (!cie) return;
    const losPredicho = cie.losPredichoTipico;
    const estadia = calcularEstadia(data.ingreso);
    const probAlta = Math.max(5, Math.min(85, Math.round(80 - (estadia / Math.max(losPredicho, 1)) * 30)));
    const riskReadmision = Math.min(48, 8 + Math.round(losPredicho * 0.9) + (cie.riskBonus || 0));

    const raw = {
      servicio: data.servicio,
      cama: data.cama.trim().toUpperCase(),
      nombre: data.nombre.trim(),
      rut: data.rut.trim(),
      edad: +data.edad,
      sexo: data.sexo,
      diagnostico: `${cie.codigo} · ${cie.descripcion}`,
      diagnosticoCie10: cie.codigo,
      medico: data.medico.trim(),
      ingreso: data.ingreso,
      estadia,
      vitales: {
        fc: +data.vitales.fc || 80,
        fr: +data.vitales.fr || 16,
        pa: data.vitales.pa.trim() || '120/80',
        sat: +data.vitales.sat || 97,
        temp: +data.vitales.temp || 36.5,
      },
      examenes: [],
      interconsultas: [],
      tareas: data.tareasIniciales,
      probAlta,
      probAlta48: Math.min(95, probAlta + 15),
      probAlta72: Math.min(98, probAlta + 25),
      tendencia: 'estable',
      losPredicho,
      riskReadmision,
      cohortDias: Number((losPredicho * 1.1).toFixed(1)),
      cohortN: 100 + (cie.codigo.length * 7 + cie.losPredichoTipico) % 400,
    };
    onCreate(raw);
  };

  const servicio = servicios.find(s => s.id === data.servicio);
  const cieSeleccion = typeof window.lookupCie10 === 'function' && data.cie10Codigo
    ? window.lookupCie10(data.cie10Codigo)
    : undefined;
  const estadiaPreview = calcularEstadia(data.ingreso);
  const probPreview = cieSeleccion
    ? Math.max(5, Math.min(85, Math.round(80 - (estadiaPreview / Math.max(cieSeleccion.losPredichoTipico, 1)) * 30)))
    : null;

  return (
    <div className="v2-modal-overlay" onClick={onClose}>
      <div className="v2-modal v2-form-modal" onClick={e => e.stopPropagation()}>
        <div className="v2-modal-header">
          <div>
            <h2 className="v2-modal-name">Nuevo ingreso</h2>
            <div className="v2-modal-meta">Registro manual de paciente · paso {step} de 4</div>
          </div>
          <button className="v2-modal-close" onClick={onClose} title="Cerrar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="v2-stepper">
          {['Identificación', 'Hospitalización', 'Signos vitales', 'Tareas iniciales'].map((label, i) => (
            <div key={i} className={`v2-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
              <div className="v2-step-num">{step > i + 1 ? '✓' : i + 1}</div>
              <div className="v2-step-label">{label}</div>
            </div>
          ))}
        </div>

        <div className="v2-modal-body">
          {step === 1 && (
            <div className="v2-form-grid">
              <div className="v2-field v2-field-full">
                <label>Nombre completo <span className="v2-req">*</span></label>
                <input
                  type="text"
                  placeholder="Ej: María Elena Rojas Soto"
                  value={data.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  className={errors.nombre ? 'err' : ''}
                  autoFocus
                />
                {errors.nombre && <div className="v2-field-err">{errors.nombre}</div>}
              </div>

              <div className="v2-field">
                <label>RUT <span className="v2-req">*</span></label>
                <input
                  type="text"
                  placeholder="12.345.678-9"
                  value={data.rut}
                  onChange={e => set('rut', e.target.value)}
                  className={errors.rut ? 'err' : ''}
                />
                {errors.rut && <div className="v2-field-err">{errors.rut}</div>}
              </div>

              <div className="v2-field">
                <label>Edad <span className="v2-req">*</span></label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  placeholder="años"
                  value={data.edad}
                  onChange={e => set('edad', e.target.value)}
                  className={errors.edad ? 'err' : ''}
                />
                {errors.edad && <div className="v2-field-err">{errors.edad}</div>}
              </div>

              <div className="v2-field">
                <label>Sexo</label>
                <div className="v2-radio-group">
                  {['M', 'F', 'Otro'].map(s => (
                    <label key={s} className={`v2-radio ${data.sexo === s ? 'active' : ''}`}>
                      <input type="radio" name="sexo" checked={data.sexo === s} onChange={() => set('sexo', s)} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="v2-form-grid">
              <div className="v2-field">
                <label>Servicio <span className="v2-req">*</span></label>
                <select value={data.servicio} onChange={e => set('servicio', e.target.value)}>
                  {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <div className="v2-field-help">
                  {servicio?.camas} camas totales
                  {servicio?.camaDesde != null && (
                    <span className="mono"> · numeración {servicio.camaDesde}–{servicio.camaHasta}</span>
                  )}
                </div>
              </div>

              <div className="v2-field">
                <label>Cama <span className="v2-req">*</span></label>
                <input
                  type="text"
                  placeholder={
                    servicio?.camaDesde != null
                      ? `Ej: ${servicio.camaDesde} o ${servicio.camaDesde}-A`
                      : 'Ej: 105-A'
                  }
                  value={data.cama}
                  onChange={e => set('cama', e.target.value)}
                  className={errors.cama ? 'err' : ''}
                />
                {errors.cama && <div className="v2-field-err">{errors.cama}</div>}
              </div>

              {icdErr && (
                <div className="v2-field v2-field-full" style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(185,28,28,0.35)', background: 'rgba(254,242,242,0.9)', color: '#991b1b', fontSize: 13 }}>
                  <strong>No se pudo cargar el ICD-10-CM.</strong> {icdErr}
                  {' '}Si abriste el archivo como <code className="mono">file://</code>, usa un servidor local (por ejemplo Live Server) para que el navegador pueda leer <span className="mono">backend/data/icd10cm_raw.json</span>.
                </div>
              )}
              {!icdErr && !icdReady && (
                <div className="v2-field v2-field-full" style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--text-2)', fontSize: 13 }}>
                  Cargando ICD-10-CM completo (~7 MB en disco). Primera vez puede tardar unos segundos…
                </div>
              )}

              <div className="v2-field v2-field-full" style={{ position: 'relative' }}>
                <label htmlFor="nuevo-cie10-buscar">Diagnóstico principal (CIE-10 / ICD-10-CM) <span className="v2-req">*</span></label>
                <input
                  id="nuevo-cie10-buscar"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={icdReady ? 'Buscar por código o texto (ej. K56, intestinal)…' : 'Cargando índice…'}
                  disabled={!icdReady || !!icdErr}
                  value={cie10Busqueda}
                  onChange={e => {
                    const v = e.target.value;
                    setCie10Busqueda(v);
                    set('cie10Codigo', '');
                    setCie10Open(true);
                  }}
                  onFocus={() => icdReady && !icdErr && setCie10Open(true)}
                  className={errors.cie10Codigo ? 'err' : ''}
                />
                {cie10Open && cie10Resultados.length > 0 && (
                  <ul className="v2-cie10-suggest" role="listbox">
                    {cie10Resultados.map(row => (
                      <li
                        key={row.raw}
                        role="option"
                        className="v2-cie10-suggest-item"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          set('cie10Codigo', row.raw);
                          const short = row.descripcion.length > 90 ? row.descripcion.slice(0, 90) + '…' : row.descripcion;
                          setCie10Busqueda(`${row.codigo} · ${short}`);
                          setCie10Open(false);
                          setCie10Resultados([]);
                        }}
                      >
                        <span className="v2-cie10-code mono">{row.codigo}</span>
                        <span className="v2-cie10-desc">{row.descripcion}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {errors.cie10Codigo && <div className="v2-field-err">{errors.cie10Codigo}</div>}
                <div className="v2-field-help">
                  Listado completo <strong>ICD-10-CM</strong> (EE. UU. / CMS, 2022). Descripciones en inglés; códigos alineados con CIE-10 MMS. Escriba al menos 2 caracteres y elija una fila de la lista.
                </div>
              </div>

              <div className="v2-field">
                <label>Médico tratante <span className="v2-req">*</span></label>
                <input
                  type="text"
                  placeholder="Ej: Dra. Carmen Lobos"
                  value={data.medico}
                  onChange={e => set('medico', e.target.value)}
                  className={errors.medico ? 'err' : ''}
                />
                {errors.medico && <div className="v2-field-err">{errors.medico}</div>}
              </div>

              <div className="v2-field">
                <label>Fecha de ingreso <span className="v2-req">*</span></label>
                <input
                  type="date"
                  value={data.ingreso}
                  max={today}
                  onChange={e => set('ingreso', e.target.value)}
                  className={errors.ingreso ? 'err' : ''}
                />
              </div>

              <div className="v2-field v2-field-full">
                <label>LOS estimado (automático)</label>
                <div
                  className="mono"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: cieSeleccion ? 'var(--text-1)' : 'var(--text-3)',
                  }}
                >
                  {cieSeleccion
                    ? `${cieSeleccion.losPredichoTipico} días (según CIE-10 ${cieSeleccion.codigo})`
                    : '— Se calcula al elegir el diagnóstico'}
                </div>
                <div className="v2-field-help">
                  Se deriva del código CIE-10 elegido. Puede ajustarse después en la ficha del paciente si el equipo clínico lo requiere.
                </div>
              </div>

              {cieSeleccion && (
                <div className="v2-field v2-field-full">
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface-solid)',
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Vista previa al registrar (demostración)</div>
                    <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                      Estadía desde ingreso: <b className="mono">{estadiaPreview}</b> d · Prob. alta hoy: <b className="mono">{probPreview}%</b>
                      {' · '}
                      Riesgo reingreso 30d (heurístico): <b className="mono">{Math.min(48, 8 + Math.round(cieSeleccion.losPredichoTipico * 0.9) + (cieSeleccion.riskBonus || 0))}%</b>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="v2-form-intro">Registra los signos vitales actuales. Si no tienes el dato, déjalo en blanco y se usará un valor por defecto.</p>
              <div className="v2-form-grid">
                <div className="v2-field">
                  <label>Frecuencia cardíaca <span className="v2-field-unit">lpm</span></label>
                  <input type="number" min="20" max="220" placeholder="80" value={data.vitales.fc} onChange={e => setVital('fc', e.target.value)} />
                  <div className="v2-field-help">Normal: 60–100 lpm</div>
                </div>
                <div className="v2-field">
                  <label>Frecuencia respiratoria <span className="v2-field-unit">rpm</span></label>
                  <input type="number" min="6" max="60" placeholder="16" value={data.vitales.fr} onChange={e => setVital('fr', e.target.value)} />
                  <div className="v2-field-help">Normal: 12–20 rpm</div>
                </div>
                <div className="v2-field">
                  <label>Presión arterial <span className="v2-field-unit">mmHg</span></label>
                  <input type="text" placeholder="120/80" value={data.vitales.pa} onChange={e => setVital('pa', e.target.value)} />
                  <div className="v2-field-help">Sistólica/Diastólica</div>
                </div>
                <div className="v2-field">
                  <label>Saturación O₂ <span className="v2-field-unit">%</span></label>
                  <input type="number" min="50" max="100" placeholder="97" value={data.vitales.sat} onChange={e => setVital('sat', e.target.value)} />
                  <div className="v2-field-help">Normal: ≥94%</div>
                </div>
                <div className="v2-field">
                  <label>Temperatura <span className="v2-field-unit">°C</span></label>
                  <input type="number" min="33" max="43" step="0.1" placeholder="36.5" value={data.vitales.temp} onChange={e => setVital('temp', e.target.value)} />
                  <div className="v2-field-help">Febril: ≥37.5°C</div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="v2-form-intro">Agrega las tareas que se deben completar antes del alta. Puedes hacerlo ahora o más tarde desde la ficha del paciente.</p>

              <div className="v2-list">
                {data.tareasIniciales.length === 0 && <div className="v2-empty">Sin tareas agregadas todavía. Agrega abajo o continúa sin tareas.</div>}
                {data.tareasIniciales.map((t, i) => (
                  <div key={i} className={`v2-task-row pendiente ${t.critico ? 'crit' : ''}`}>
                    <span className="v2-task-check pendiente" />
                    <span className="v2-task-text">{t.texto}</span>
                    {t.critico && <span className="v2-pill-crit-sm">CRÍT</span>}
                    <button className="v2-task-del" onClick={() => removeTarea(i)} title="Quitar">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="v2-task-add" style={{ marginTop: 12 }}>
                <input
                  type="text"
                  placeholder="Ej: Educación cuidados herida"
                  value={data.nuevaTarea}
                  onChange={e => set('nuevaTarea', e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTarea(); }}
                />
                <label className="v2-checkbox-label">
                  <input type="checkbox" checked={data.nuevaTareaCrit} onChange={e => set('nuevaTareaCrit', e.target.checked)} />
                  Crítica
                </label>
                <button className="v2-mini-btn primary" onClick={addTarea} disabled={!data.nuevaTarea.trim()}>Agregar</button>
              </div>

              <div className="v2-form-summary">
                <h4>Resumen</h4>
                <div><b>{data.nombre}</b> · {data.edad}a · {data.sexo} · RUT {data.rut}</div>
                <div>{servicio?.nombre} · cama {data.cama} · ingreso {data.ingreso}</div>
                <div style={{ color: 'var(--text-2)', marginTop: 4 }}>
                  {cieSeleccion ? `${cieSeleccion.codigo} · ${cieSeleccion.descripcion}` : '—'}
                </div>
                {cieSeleccion && (
                  <div style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 4 }}>
                    LOS estimado {cieSeleccion.losPredichoTipico} d · prob. alta modelo ~{probPreview}%
                  </div>
                )}
                <div style={{ color: 'var(--text-3)', fontSize: 11.5, marginTop: 4 }}>
                  Médico: {data.medico} · {data.tareasIniciales.length} tarea(s) inicial(es)
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="v2-modal-footer">
          <button className="v2-btn v2-btn-secondary" onClick={step === 1 ? onClose : back}>
            {step === 1 ? 'Cancelar' : '← Atrás'}
          </button>
          {step < 4 ? (
            <button
              className="v2-btn v2-btn-primary"
              onClick={next}
              disabled={step === 2 && (!icdReady || !!icdErr)}
            >
              Siguiente →
            </button>
          ) : (
            <button className="v2-btn v2-btn-primary" onClick={handleSubmit}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12l5 5L20 7"/></svg>
              Registrar ingreso
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

window.NuevoIngresoForm = NuevoIngresoForm;
