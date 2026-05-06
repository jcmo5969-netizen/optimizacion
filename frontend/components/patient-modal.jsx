// Patient detail modal — vista tipo lectura + Editar por sección (clínica, vitales, probabilidades).
function InfoTip({ text }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span
      className="v2-info"
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
    >
      <span className="v2-info-icon" aria-label="Más información">i</span>
      {open && <span className="v2-info-bubble">{text}</span>}
    </span>
  );
}

const EXAMEN_NOMBRE_PRESETS = [
  'Hemograma', 'PCR', 'Función hepática', 'Glicemia', 'Urea y creatinina', 'Electrolitos',
  'Gasometría arterial', 'Rx tórax', 'TAC abdomen', 'Ecografía abdominal', 'Urocultivo',
  'Hemocultivo', 'Perfil lipídico', 'Hemoglobina glicosilada', 'Perfil tiroideo', 'TP / INR',
  'TTPA', 'Lactato', 'Función renal', 'Coprocultivo', 'Pre-anestesia', 'Frotis de garganta',
];

const EXAMEN_VALOR_PRESETS = [
  'normal', 'dentro de rangos', 'negativo', 'positivo', 'en curso', 'pendiente de informe',
];

function PatientModal({ patient, onClose, onUpdate, onDischarge, perms, currentUser }) {
  const canEdit = perms ? perms.edit !== false : true;
  const canDischarge = perms ? perms.discharge !== false : true;
  const [tab, setTab] = React.useState('resumen');
  const [confirming, setConfirming] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [newTaskText, setNewTaskText] = React.useState('');
  const [newTaskCrit, setNewTaskCrit] = React.useState(false);
  const [clinicalDraft, setClinicalDraft] = React.useState(null);
  const [editVitals, setEditVitals] = React.useState(false);
  const [vitalsDraft, setVitalsDraft] = React.useState(() => patient?.vitales);
  const [editProb, setEditProb] = React.useState(false);
  const [probDraft, setProbDraft] = React.useState({ p24: '', p48: '', p72: '' });

  const emptyExamenDraft = () => ({
    tipo: '',
    estado: 'pendiente',
    solicitado: '',
    valor: '',
    flag: '',
  });
  const [examenFormOpen, setExamenFormOpen] = React.useState(false);
  const [examenEditIdx, setExamenEditIdx] = React.useState(null);
  const [examenDraft, setExamenDraft] = React.useState(emptyExamenDraft);

  React.useEffect(() => {
    setClinicalDraft(null);
    setEditVitals(false);
    setEditProb(false);
    setVitalsDraft(patient ? { ...patient.vitales } : null);
    setExamenFormOpen(false);
    setExamenEditIdx(null);
    setExamenDraft(emptyExamenDraft());
  }, [patient?.id]);

  if (!patient) return null;

  const clampPct = (n) => Math.max(0, Math.min(100, Math.round(Number(n)) || 0));

  const critico = patient.estadia > 10;
  const tareasCompletas = patient.tareas.filter(t => t.estado === 'completo').length;
  const tareasPendientes = patient.tareas.length - tareasCompletas;
  const tareasCriticas = patient.tareas.filter(t => t.critico && t.estado === 'pendiente');
  const desviacion = patient.estadia - patient.losPredicho;

  const probLabel =
    patient.probAlta >= 70 ? { tag: 'Alta probable', tone: 'pos' } :
    patient.probAlta >= 40 ? { tag: 'Requiere gestión', tone: 'mid' } :
    { tag: 'Improbable a corto plazo', tone: 'neg' };

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2400);
  };

  const toggleTask = (idx) => {
    onUpdate(p => ({
      ...p,
      tareas: p.tareas.map((t, i) =>
        i === idx ? { ...t, estado: t.estado === 'completo' ? 'pendiente' : 'completo' } : t
      ),
    }));
  };

  const removeTask = (idx) => {
    onUpdate(p => ({ ...p, tareas: p.tareas.filter((_, i) => i !== idx) }));
  };

  const addTask = () => {
    const txt = newTaskText.trim();
    if (!txt) return;
    onUpdate(p => ({
      ...p,
      tareas: [...p.tareas, { texto: txt, estado: 'pendiente', critico: newTaskCrit }],
    }));
    setNewTaskText('');
    setNewTaskCrit(false);
  };

  const handleConfirmAlta = () => {
    if (tareasCriticas.length > 0) {
      showToast(`Faltan ${tareasCriticas.length} tarea(s) crítica(s).`);
      return;
    }
    setConfirming(true);
  };

  const openNewExamen = () => {
    setExamenEditIdx(null);
    setExamenDraft(emptyExamenDraft());
    setExamenFormOpen(true);
  };

  const startEditExamen = (i) => {
    const list = patient.examenes || [];
    const e = list[i];
    if (!e) return;
    setExamenEditIdx(i);
    setExamenDraft({
      tipo: e.tipo || '',
      estado: e.estado === 'listo' ? 'listo' : 'pendiente',
      solicitado: e.solicitado || '',
      valor: e.valor || '',
      flag: e.flag || '',
    });
    setExamenFormOpen(true);
  };

  const cancelExamenForm = () => {
    setExamenFormOpen(false);
    setExamenEditIdx(null);
    setExamenDraft(emptyExamenDraft());
  };

  const buildExamenPayload = () => {
    const tipo = examenDraft.tipo.trim();
    if (!tipo) return null;
    const estado = examenDraft.estado === 'listo' ? 'listo' : 'pendiente';
    if (estado === 'pendiente') {
      const o = { tipo, estado: 'pendiente' };
      const s = String(examenDraft.solicitado || '').trim();
      if (s) o.solicitado = s;
      return o;
    }
    const o = { tipo, estado: 'listo' };
    const v = String(examenDraft.valor || '').trim();
    if (v) o.valor = v;
    const f = examenDraft.flag;
    if (f === 'alto' || f === 'bajo') o.flag = f;
    return o;
  };

  const saveExamen = () => {
    const item = buildExamenPayload();
    if (!item) {
      showToast('Indique el nombre del examen.');
      return;
    }
    if (examenEditIdx != null) {
      onUpdate(p => {
        const ex = [...(p.examenes || [])];
        ex[examenEditIdx] = item;
        return { ...p, examenes: ex };
      });
      showToast('Examen actualizado.');
    } else {
      onUpdate(p => ({
        ...p,
        examenes: [...(p.examenes || []), item],
      }));
      showToast('Examen agregado.');
    }
    cancelExamenForm();
  };

  const removeExamen = (i) => {
    onUpdate(p => ({
      ...p,
      examenes: (p.examenes || []).filter((_, j) => j !== i),
    }));
    showToast('Examen eliminado.');
    if (examenEditIdx === i) cancelExamenForm();
    else if (examenEditIdx != null && i < examenEditIdx) setExamenEditIdx(examenEditIdx - 1);
  };

  const startEditClinical = () => {
    setClinicalDraft({
      nombre: patient.nombre,
      rut: patient.rut,
      edad: String(patient.edad),
      sexo: patient.sexo,
      cama: patient.cama,
      ingreso: patient.ingreso || '',
      diagnostico: patient.diagnostico,
      medico: patient.medico,
      estadia: String(patient.estadia),
      losPredicho: String(patient.losPredicho),
    });
  };

  const saveClinical = () => {
    if (!clinicalDraft) return;
    const trim = (s) => String(s ?? '').trim();
    const parseIntField = (v, { ifEmpty, ifInvalid }) => {
      const t = String(v ?? '').trim();
      if (t === '') return ifEmpty;
      const x = parseInt(t, 10);
      return Number.isFinite(x) ? x : ifInvalid;
    };
    onUpdate(p => ({
      ...p,
      nombre: trim(clinicalDraft.nombre),
      rut: trim(clinicalDraft.rut),
      edad: Math.max(0, Math.min(130, parseIntField(clinicalDraft.edad, { ifEmpty: 0, ifInvalid: p.edad }))),
      sexo: trim(clinicalDraft.sexo).slice(0, 8),
      cama: trim(clinicalDraft.cama),
      ingreso: trim(clinicalDraft.ingreso),
      diagnostico: trim(clinicalDraft.diagnostico),
      medico: trim(clinicalDraft.medico),
      estadia: Math.max(0, parseIntField(clinicalDraft.estadia, { ifEmpty: 0, ifInvalid: p.estadia })),
      losPredicho: Math.max(1, parseIntField(clinicalDraft.losPredicho, { ifEmpty: 1, ifInvalid: p.losPredicho })),
    }));
    setClinicalDraft(null);
    showToast('Información clínica guardada.');
  };

  const startEditVitals = () => {
    const v = patient.vitales;
    setVitalsDraft({
      fc: String(v.fc ?? ''),
      fr: String(v.fr ?? ''),
      pa: String(v.pa ?? ''),
      sat: String(v.sat ?? ''),
      temp: String(v.temp ?? ''),
    });
    setEditVitals(true);
  };

  const saveVitals = () => {
    if (!vitalsDraft) return;
    const parseNum = (raw, prev) => {
      const t = String(raw ?? '').trim();
      if (t === '') return prev;
      const n = parseFloat(t);
      return Number.isFinite(n) ? n : prev;
    };
    onUpdate(p => ({
      ...p,
      vitales: {
        fc: parseNum(vitalsDraft.fc, p.vitales.fc),
        fr: parseNum(vitalsDraft.fr, p.vitales.fr),
        pa: String(vitalsDraft.pa ?? '').trim(),
        sat: parseNum(vitalsDraft.sat, p.vitales.sat),
        temp: parseNum(vitalsDraft.temp, p.vitales.temp),
      },
    }));
    setEditVitals(false);
    showToast('Signos vitales guardados.');
  };

  const startEditProb = () => {
    setProbDraft({
      p24: String(patient.probAlta),
      p48: String(patient.probAlta48),
      p72: String(patient.probAlta72),
    });
    setEditProb(true);
  };

  const saveProb = () => {
    onUpdate(p => ({
      ...p,
      probAlta: clampPct(probDraft.p24),
      probAlta48: clampPct(probDraft.p48),
      probAlta72: clampPct(probDraft.p72),
    }));
    setEditProb(false);
    showToast('Probabilidades actualizadas.');
  };

  return (
    <div className="v2-modal-overlay" onClick={onClose}>
      <div className="v2-modal" onClick={e => e.stopPropagation()}>
        <div className="v2-modal-header">
          <div className="v2-modal-header-left">
            <div className={`v2-modal-avatar ${critico ? 'crit' : ''}`}>
              {(() => {
                const parts = String(patient.nombre || '').trim().split(/\s+/).filter(Boolean);
                if (parts.length === 0) return '?';
                return parts.slice(0, 2).map(n => n[0]).join('');
              })()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 className="v2-modal-name">{patient.nombre}</h2>
                {desviacion > 0 && (
                  <span className="v2-pill-crit" title={`Lleva ${desviacion} día(s) más de lo que el modelo predijo (${patient.losPredicho}d esperados, ${patient.estadia}d reales).`}>
                    +{desviacion}d sobre LOS
                  </span>
                )}
              </div>
              <div className="v2-modal-meta mono">
                RUT {patient.rut} · {patient.edad}a · {patient.sexo} · Cama {patient.cama} · Ingreso {patient.ingreso}
              </div>
              {!canEdit && (
                <div className="v2-readonly-banner" title={`Sesión iniciada como ${currentUser?.nombre || ''}`}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Modo solo lectura · tu rol no permite modificar fichas
                </div>
              )}
            </div>
          </div>
          <button type="button" className="v2-modal-close" onClick={onClose} title="Cerrar (Esc)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="v2-modal-tabs">
          {[
            { id: 'resumen', label: 'Resumen' },
            { id: 'clinico', label: 'Clínico' },
            { id: 'gestion', label: `Gestión${tareasPendientes > 0 ? ` · ${tareasPendientes}` : ''}` },
            { id: 'ia', label: 'IA · Predicción', icon: true },
          ].map(t => (
            <button type="button" key={t.id} className={`v2-modal-tab ${tab === t.id ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setTab(t.id); }}>
              {t.icon && <span className="v2-tab-ai-dot" />}
              {t.label}
            </button>
          ))}
        </div>

        <div className="v2-modal-body">
          {tab === 'resumen' && (
            <div className="v2-stack">
              <div className={`v2-tldr ${probLabel.tone}`}>
                <div className="v2-tldr-icon">
                  {probLabel.tone === 'pos'
                    ? <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6 9 17l-5-5"/></svg>
                    : <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>}
                </div>
                <div>
                  <div className="v2-tldr-title">{probLabel.tag} en las próximas 24h</div>
                  <div className="v2-tldr-sub">
                    {patient.diagnostico} · {tareasPendientes} tarea(s) pendiente(s){tareasCriticas.length > 0 ? ` (${tareasCriticas.length} crítica${tareasCriticas.length > 1 ? 's' : ''})` : ''} · estadía {patient.estadia}d {desviacion > 0 ? `(${desviacion}d sobre lo esperado)` : '(dentro de lo esperado)'}.
                  </div>
                </div>
              </div>

              <div className="v2-grid-2">
                <section className="v2-section">
                  <div className="v2-section-head" style={{ marginBottom: 10 }}>
                    <h3 className="v2-section-title" style={{ margin: 0 }}>Información clínica</h3>
                    {clinicalDraft == null
                      ? (canEdit && <button type="button" className="v2-mini-btn" onClick={startEditClinical}>Editar</button>)
                      : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="v2-mini-btn" onClick={() => setClinicalDraft(null)}>Cancelar</button>
                          <button type="button" className="v2-mini-btn primary" onClick={saveClinical}>Guardar</button>
                        </div>
                      )}
                  </div>
                  {clinicalDraft == null ? (
                    <>
                      <p className="v2-dx-text">{patient.diagnostico}</p>
                      <div className="v2-meta-grid">
                        <div><span className="v2-meta-lbl">Médico tratante</span><span className="v2-meta-val">{patient.medico}</span></div>
                        <div><span className="v2-meta-lbl">Estadía actual</span><span className="v2-meta-val mono">{patient.estadia} días</span></div>
                        <div>
                          <span className="v2-meta-lbl">
                            LOS predicho <InfoTip text="LOS = Length of Stay (estadía). Días que el modelo XGBoost estima para este paciente según su diagnóstico, edad y comorbilidades." />
                          </span>
                          <span className="v2-meta-val mono">{patient.losPredicho} días</span>
                        </div>
                        <div>
                          <span className="v2-meta-lbl">
                            Desviación <InfoTip text="Diferencia entre la estadía real y la predicha. Valores positivos indican que el paciente lleva más días hospitalizado de lo esperado." />
                          </span>
                          <span className={`v2-meta-val mono ${desviacion > 0 ? 'neg' : 'pos'}`}>{desviacion > 0 ? '+' : ''}{desviacion}d</span>
                        </div>
                      </div>
                      <p className="v2-section-sub" style={{ margin: '14px 0 0', fontSize: 11 }}>Sin HIS: use <b>Editar</b> para cargar o corregir diagnóstico, médico y estadía.</p>
                    </>
                  ) : (
                    <div className="v2-clinical-form">
                      <div className="v2-clinical-field">
                        <label htmlFor="clin-nombre">Nombre completo</label>
                        <input id="clin-nombre" type="text" value={clinicalDraft.nombre} onChange={e => setClinicalDraft(d => ({ ...d, nombre: e.target.value }))} autoComplete="off" />
                      </div>
                      <div className="v2-clinical-row2">
                        <div className="v2-clinical-field">
                          <label htmlFor="clin-rut">RUT</label>
                          <input id="clin-rut" className="mono" type="text" value={clinicalDraft.rut} onChange={e => setClinicalDraft(d => ({ ...d, rut: e.target.value }))} autoComplete="off" />
                        </div>
                        <div className="v2-clinical-field">
                          <label htmlFor="clin-ingreso">Fecha ingreso</label>
                          <input id="clin-ingreso" className="mono" type="date" value={clinicalDraft.ingreso} onChange={e => setClinicalDraft(d => ({ ...d, ingreso: e.target.value }))} />
                        </div>
                      </div>
                      <div className="v2-clinical-row2">
                        <div className="v2-clinical-field">
                          <label htmlFor="clin-edad">Edad (años)</label>
                          <input id="clin-edad" className="mono" type="number" min="0" max="130" value={clinicalDraft.edad} onChange={e => setClinicalDraft(d => ({ ...d, edad: e.target.value }))} />
                        </div>
                        <div className="v2-clinical-field">
                          <label htmlFor="clin-sexo">Sexo</label>
                          <input id="clin-sexo" className="mono" type="text" maxLength={8} value={clinicalDraft.sexo} onChange={e => setClinicalDraft(d => ({ ...d, sexo: e.target.value }))} placeholder="M / F" />
                        </div>
                      </div>
                      <div className="v2-clinical-field">
                        <label htmlFor="clin-cama">Cama</label>
                        <input id="clin-cama" className="mono" type="text" value={clinicalDraft.cama} onChange={e => setClinicalDraft(d => ({ ...d, cama: e.target.value }))} autoComplete="off" />
                      </div>
                      <div className="v2-clinical-field">
                        <label htmlFor="clin-dx">Diagnóstico</label>
                        <textarea id="clin-dx" value={clinicalDraft.diagnostico} onChange={e => setClinicalDraft(d => ({ ...d, diagnostico: e.target.value }))} rows={3} />
                      </div>
                      <div className="v2-clinical-field">
                        <label htmlFor="clin-medico">Médico tratante</label>
                        <input id="clin-medico" type="text" value={clinicalDraft.medico} onChange={e => setClinicalDraft(d => ({ ...d, medico: e.target.value }))} autoComplete="off" />
                      </div>
                      <div className="v2-clinical-row2">
                        <div className="v2-clinical-field">
                          <label htmlFor="clin-estadia">Estadía actual (días)</label>
                          <input id="clin-estadia" className="mono" type="number" min="0" value={clinicalDraft.estadia} onChange={e => setClinicalDraft(d => ({ ...d, estadia: e.target.value }))} />
                        </div>
                        <div className="v2-clinical-field">
                          <label htmlFor="clin-los">LOS predicho (días)</label>
                          <input id="clin-los" className="mono" type="number" min="1" value={clinicalDraft.losPredicho} onChange={e => setClinicalDraft(d => ({ ...d, losPredicho: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                <section className="v2-section">
                  <div className="v2-section-head" style={{ marginBottom: 10 }}>
                    <h3 className="v2-section-title" style={{ margin: 0 }}>Signos vitales</h3>
                    {!editVitals
                      ? (canEdit && <button type="button" className="v2-mini-btn" onClick={startEditVitals}>Editar</button>)
                      : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="v2-mini-btn" onClick={() => setEditVitals(false)}>Cancelar</button>
                          <button type="button" className="v2-mini-btn primary" onClick={saveVitals}>Guardar</button>
                        </div>
                      )}
                  </div>
                  {!editVitals ? (
                    <div className="v2-vitals-grid">
                      <div className="v2-vital-block" title="Frecuencia cardíaca · normal 60–100 lpm"><div className="v2-vb-label">FC</div><div className="v2-vb-value mono">{patient.vitales.fc}</div><div className="v2-vb-unit">lpm</div></div>
                      <div className="v2-vital-block" title="Frecuencia respiratoria · normal 12–20 rpm"><div className="v2-vb-label">FR</div><div className="v2-vb-value mono">{patient.vitales.fr}</div><div className="v2-vb-unit">rpm</div></div>
                      <div className="v2-vital-block" title="Presión arterial sistólica/diastólica"><div className="v2-vb-label">PA</div><div className="v2-vb-value mono" style={{ fontSize: 18 }}>{patient.vitales.pa}</div><div className="v2-vb-unit">mmHg</div></div>
                      <div className={`v2-vital-block ${patient.vitales.sat < 94 ? 'alert' : ''}`} title="Saturación de oxígeno · normal ≥94%"><div className="v2-vb-label">SatO₂</div><div className="v2-vb-value mono">{patient.vitales.sat}</div><div className="v2-vb-unit">%</div></div>
                      <div className={`v2-vital-block ${patient.vitales.temp >= 37.5 ? 'alert' : ''}`} title="Temperatura · febril ≥37.5°C"><div className="v2-vb-label">T°</div><div className="v2-vb-value mono">{patient.vitales.temp.toFixed(1)}</div><div className="v2-vb-unit">°C</div></div>
                    </div>
                  ) : (
                    <div className="v2-vitals-grid">
                      <div className="v2-vital-edit"><label>FC</label><input type="text" inputMode="numeric" placeholder="lpm" autoComplete="off" value={vitalsDraft.fc} onChange={e => setVitalsDraft(v => ({ ...v, fc: e.target.value }))} /><span>lpm</span></div>
                      <div className="v2-vital-edit"><label>FR</label><input type="text" inputMode="numeric" placeholder="rpm" autoComplete="off" value={vitalsDraft.fr} onChange={e => setVitalsDraft(v => ({ ...v, fr: e.target.value }))} /><span>rpm</span></div>
                      <div className="v2-vital-edit"><label>PA</label><input type="text" placeholder="120/80" autoComplete="off" value={vitalsDraft.pa} onChange={e => setVitalsDraft(v => ({ ...v, pa: e.target.value }))} /><span>mmHg</span></div>
                      <div className="v2-vital-edit"><label>SatO₂</label><input type="text" inputMode="decimal" placeholder="%" autoComplete="off" value={vitalsDraft.sat} onChange={e => setVitalsDraft(v => ({ ...v, sat: e.target.value }))} /><span>%</span></div>
                      <div className="v2-vital-edit"><label>T°</label><input type="text" inputMode="decimal" placeholder="°C" autoComplete="off" value={vitalsDraft.temp} onChange={e => setVitalsDraft(v => ({ ...v, temp: e.target.value }))} /><span>°C</span></div>
                    </div>
                  )}
                </section>
              </div>

              <section className="v2-section">
                <div className="v2-section-head">
                  <div>
                    <h3 className="v2-section-title">Probabilidad de alta médica</h3>
                    <p className="v2-section-sub">Estimación del modelo en distintos horizontes. Una probabilidad alta significa que el paciente cumpliría las condiciones clínicas para egresar dentro de ese plazo.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0 }}>
                    <span className={`v2-prob-badge ${probLabel.tone}`}>{probLabel.tag}</span>
                    {!editProb
                      ? (canEdit && <button type="button" className="v2-mini-btn" onClick={startEditProb}>Editar</button>)
                      : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="v2-mini-btn" onClick={() => setEditProb(false)}>Cancelar</button>
                          <button type="button" className="v2-mini-btn primary" onClick={saveProb}>Guardar</button>
                        </div>
                      )}
                  </div>
                </div>
                <div className="v2-prob-summary">
                  <div className="v2-prob-horizons">
                    <div className="v2-horizon">
                      <div className="v2-h-label">Próximas 24h</div>
                      <div className="v2-h-value">
                        {editProb ? (
                          <>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="v2-h-pct-input"
                              aria-label="Probabilidad alta 24 horas"
                              value={probDraft.p24}
                              onChange={e => setProbDraft(d => ({ ...d, p24: e.target.value }))}
                              onClick={e => e.stopPropagation()}
                            />
                            <span>%</span>
                          </>
                        ) : (
                          <>{patient.probAlta}<span>%</span></>
                        )}
                      </div>
                      <div className="v2-h-bar"><div className="v2-h-fill" style={{ width: `${editProb ? (Number(probDraft.p24) || 0) : patient.probAlta}%` }} /></div>
                    </div>
                    <div className="v2-horizon">
                      <div className="v2-h-label">48h</div>
                      <div className="v2-h-value">
                        {editProb ? (
                          <>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="v2-h-pct-input"
                              aria-label="Probabilidad alta 48 horas"
                              value={probDraft.p48}
                              onChange={e => setProbDraft(d => ({ ...d, p48: e.target.value }))}
                              onClick={e => e.stopPropagation()}
                            />
                            <span>%</span>
                          </>
                        ) : (
                          <>{patient.probAlta48}<span>%</span></>
                        )}
                      </div>
                      <div className="v2-h-bar"><div className="v2-h-fill" style={{ width: `${editProb ? (Number(probDraft.p48) || 0) : patient.probAlta48}%` }} /></div>
                    </div>
                    <div className="v2-horizon">
                      <div className="v2-h-label">72h</div>
                      <div className="v2-h-value">
                        {editProb ? (
                          <>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="v2-h-pct-input"
                              aria-label="Probabilidad alta 72 horas"
                              value={probDraft.p72}
                              onChange={e => setProbDraft(d => ({ ...d, p72: e.target.value }))}
                              onClick={e => e.stopPropagation()}
                            />
                            <span>%</span>
                          </>
                        ) : (
                          <>{patient.probAlta72}<span>%</span></>
                        )}
                      </div>
                      <div className="v2-h-bar"><div className="v2-h-fill" style={{ width: `${editProb ? (Number(probDraft.p72) || 0) : patient.probAlta72}%` }} /></div>
                    </div>
                  </div>
                  <div className="v2-prob-headline">
                    <div className="v2-h-model mono">
                      XGBoost · LOS-Predict v2.4
                      <InfoTip text="Modelo de gradient boosting entrenado con 38.412 altas históricas (2019–2025). AUC 0.847. IC 95% = rango de confianza estadística donde se espera que caiga el valor real con 95% de certeza." />
                    </div>
                    <button type="button" className="v2-h-link" onClick={(e) => { e.stopPropagation(); setTab('ia'); }}>Ver explicabilidad IA →</button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {tab === 'clinico' && (
            <div className="v2-stack">
              <p className="v2-tab-intro">Resultados de exámenes solicitados e interconsultas con otras especialidades. Los puntos verdes indican estado <b>completo</b>; ámbar indica <b>pendiente</b>. Use <b>Agregar examen</b> o el lápiz en cada fila para cargar datos sin HIS.</p>
              <section className="v2-section">
                <div className="v2-section-head">
                  <h3 className="v2-section-title" style={{ margin: 0 }}>Exámenes</h3>
                  {canEdit && <button type="button" className="v2-mini-btn" onClick={openNewExamen}>Agregar examen</button>}
                </div>
                <div className="v2-list">
                  {(patient.examenes || []).length === 0 && !examenFormOpen && (
                    <div className="v2-empty">Sin exámenes registrados.</div>
                  )}
                  {(patient.examenes || []).map((e, i) => (
                    <div key={i} className="v2-list-row v2-list-row-exam">
                      <span className={`v2-status-dot ${e.estado}`} />
                      <div className="v2-list-name">{e.tipo}</div>
                      {e.valor && <div className={`v2-list-val mono ${e.flag || ''}`}>{e.valor}</div>}
                      {e.solicitado && <div className="v2-list-date mono">solicitado {e.solicitado}</div>}
                      <div className="v2-examen-row-actions" style={{ display: canEdit ? undefined : 'none' }}>
                        <button type="button" className="v2-examen-icon-btn" title="Editar examen" onClick={() => startEditExamen(i)}>
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button type="button" className="v2-examen-icon-btn danger" title="Eliminar examen" onClick={() => removeExamen(i)}>
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {examenFormOpen && (
                  <div className="v2-examen-form-card">
                    <div className="v2-examen-form-title">{examenEditIdx != null ? 'Editar examen' : 'Nuevo examen'}</div>
                    <div className="v2-clinical-form" style={{ marginTop: 0 }}>
                      <div className="v2-clinical-field">
                        <label htmlFor="exam-tipo">Nombre del examen</label>
                        <input
                          id="exam-tipo"
                          type="text"
                          className="v2-input-datalist"
                          list="exam-tipo-datalist"
                          placeholder="Escriba o elija de la lista…"
                          value={examenDraft.tipo}
                          onChange={e => setExamenDraft(d => ({ ...d, tipo: e.target.value }))}
                          autoComplete="off"
                        />
                        <datalist id="exam-tipo-datalist">
                          {EXAMEN_NOMBRE_PRESETS.map((x) => (
                            <option key={x} value={x} />
                          ))}
                        </datalist>
                      </div>
                      <div className="v2-clinical-row2">
                        <div className="v2-clinical-field">
                          <label htmlFor="exam-estado">Estado</label>
                          <select
                            id="exam-estado"
                            className="v2-select"
                            value={examenDraft.estado}
                            onChange={e => {
                              const estado = e.target.value;
                              setExamenDraft(d => ({
                                ...d,
                                estado,
                                ...(estado === 'pendiente' ? { valor: '', flag: '' } : { solicitado: '' }),
                              }));
                            }}
                          >
                            <option value="pendiente">Pendiente (solicitado)</option>
                            <option value="listo">Listo (con resultado)</option>
                          </select>
                        </div>
                        {examenDraft.estado === 'pendiente' ? (
                          <div className="v2-clinical-field">
                            <label htmlFor="exam-sol">Fecha solicitado</label>
                            <input
                              id="exam-sol"
                              className="mono"
                              type="date"
                              value={examenDraft.solicitado}
                              onChange={e => setExamenDraft(d => ({ ...d, solicitado: e.target.value }))}
                            />
                          </div>
                        ) : (
                          <div className="v2-clinical-field">
                            <label htmlFor="exam-val">Resultado</label>
                            <input
                              id="exam-val"
                              type="text"
                              className="v2-input-datalist"
                              list="exam-valor-datalist"
                              placeholder="Escriba o elija de la lista…"
                              value={examenDraft.valor}
                              onChange={e => setExamenDraft(d => ({ ...d, valor: e.target.value }))}
                              autoComplete="off"
                            />
                            <datalist id="exam-valor-datalist">
                              {EXAMEN_VALOR_PRESETS.map((x) => (
                                <option key={x} value={x} />
                              ))}
                            </datalist>
                          </div>
                        )}
                      </div>
                      {examenDraft.estado === 'listo' && (
                        <div className="v2-clinical-field">
                          <label htmlFor="exam-flag">Resaltado del resultado (opcional)</label>
                          <select
                            id="exam-flag"
                            className="v2-select"
                            value={examenDraft.flag}
                            onChange={e => setExamenDraft(d => ({ ...d, flag: e.target.value }))}
                          >
                            <option value="">Sin resaltado</option>
                            <option value="alto">Alterado alto</option>
                            <option value="bajo">Alterado bajo</option>
                          </select>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" className="v2-mini-btn primary" onClick={saveExamen}>
                          {examenEditIdx != null ? 'Guardar cambios' : 'Agregar a la lista'}
                        </button>
                        <button type="button" className="v2-mini-btn" onClick={cancelExamenForm}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
              <section className="v2-section">
                <h3 className="v2-section-title">Interconsultas</h3>
                <div className="v2-list">
                  {patient.interconsultas.length === 0 && <div className="v2-empty">Sin interconsultas activas.</div>}
                  {patient.interconsultas.map((ic, i) => (
                    <div key={i} className="v2-list-row">
                      <span className={`v2-status-dot ${ic.estado}`} />
                      <div className="v2-list-name">{ic.especialidad}</div>
                      <span className={`v2-pill v2-pill-${ic.estado}`}>{ic.estado}</span>
                      {ic.dias > 0 && <span className="v2-list-date mono">{ic.dias}d esperando</span>}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {tab === 'gestion' && (
            <div className="v2-stack">
              <p className="v2-tab-intro">Marca cada tarea al completarla. Las marcadas como <b>CRÍT</b> son bloqueadores: sin ellas no se puede confirmar el alta.</p>

              <section className="v2-section">
                <div className="v2-section-head">
                  <h3 className="v2-section-title" style={{ margin: 0 }}>Pendientes para el alta</h3>
                  <span className="mono v2-section-meta">{tareasCompletas}/{patient.tareas.length} completas</span>
                </div>
                <div className="v2-list">
                  {patient.tareas.length === 0 && <div className="v2-empty">Sin tareas registradas. Agrega una abajo.</div>}
                  {patient.tareas.map((t, i) => (
                    <div key={i} className={`v2-task-row ${t.estado} ${t.critico ? 'crit' : ''}`}>
                      <button
                        type="button"
                        className={`v2-task-check ${t.estado}`}
                        onClick={() => canEdit && toggleTask(i)}
                        disabled={!canEdit}
                        title={!canEdit ? 'Sin permisos para modificar' : (t.estado === 'completo' ? 'Marcar pendiente' : 'Marcar completa')}
                      >
                        {t.estado === 'completo' && <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>}
                      </button>
                      <span className="v2-task-text">{t.texto}</span>
                      {t.critico && t.estado === 'pendiente' && <span className="v2-pill-crit-sm">CRÍT</span>}
                      {canEdit && (
                        <button type="button" className="v2-task-del" onClick={() => removeTask(i)} title="Eliminar tarea">
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <div className="v2-task-add">
                    <input
                      type="text"
                      placeholder="Agregar nueva tarea (ej: receta antibiótico al alta)…"
                      value={newTaskText}
                      onChange={e => setNewTaskText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
                    />
                    <label className="v2-checkbox-label">
                      <input type="checkbox" checked={newTaskCrit} onChange={e => setNewTaskCrit(e.target.checked)} />
                      Crítica
                    </label>
                    <button type="button" className="v2-mini-btn primary" onClick={addTask} disabled={!newTaskText.trim()}>Agregar</button>
                  </div>
                )}
              </section>

              {tareasCriticas.length > 0 && (
                <section className="v2-section v2-blocker">
                  <h3 className="v2-section-title">Bloqueadores del alta</h3>
                  <p className="v2-blocker-text">
                    Para liberar la cama <span className="mono" style={{ fontWeight: 600 }}>{patient.cama}</span> es necesario resolver {tareasCriticas.length} {tareasCriticas.length === 1 ? 'tarea crítica' : 'tareas críticas'}.
                  </p>
                </section>
              )}
            </div>
          )}

          {tab === 'ia' && (
            <div className="v2-stack">
              <p className="v2-tab-intro">
                Esta sección muestra <b>cómo</b> y <b>por qué</b> el modelo llega a su predicción. Útil para validar clínicamente el score antes de tomar decisiones.
              </p>

              <section className="v2-section v2-ia-hero">
                <div className="v2-ia-hero-grid">
                  <div>
                    <div className="v2-section-title" style={{ marginBottom: 12 }}>Probabilidad de alta · 24h</div>
                    <div className="v2-ia-score">{patient.probAlta}<span>%</span></div>
                    <div className="v2-ia-score-sub mono">
                      IC 95% <InfoTip text="Intervalo de Confianza al 95%: en 95 de cada 100 inferencias el valor real cae dentro de este rango." />
                    </div>
                    <div className="v2-ia-horizons">
                      <span className="v2-ia-h"><b>48h</b> {patient.probAlta48}%</span>
                      <span className="v2-ia-h"><b>72h</b> {patient.probAlta72}%</span>
                    </div>
                  </div>
                  <div className="v2-ia-meta">
                    <div className="v2-ia-meta-row"><span>Modelo</span><span className="mono">XGBoost LOS-Predict v2.4</span></div>
                    <div className="v2-ia-meta-row">
                      <span>AUC <InfoTip text="Area Under the Curve. Mide la capacidad del modelo de distinguir entre pacientes que serán dados de alta vs los que no. 1.0 = perfecto, 0.5 = azar. 0.847 es buena performance clínica." /></span>
                      <span className="mono">0.847</span>
                    </div>
                    <div className="v2-ia-meta-row"><span>Entrenamiento</span><span className="mono">38.412 altas · 2019–2025</span></div>
                    <div className="v2-ia-meta-row"><span>Última inferencia</span><span className="mono">hace 4 min</span></div>
                  </div>
                </div>
              </section>

              <section className="v2-section">
                <div className="v2-section-head">
                  <div>
                    <h3 className="v2-section-title">
                      Explicabilidad SHAP <InfoTip text="SHAP (SHapley Additive exPlanations) muestra cuánto suma o resta cada variable a la predicción final. Verde aumenta la probabilidad de alta; rojo la disminuye." />
                    </h3>
                    <p className="v2-section-sub">Por qué el modelo entregó este score: contribución de cada variable.</p>
                  </div>
                  <span className="v2-section-meta mono">8 features</span>
                </div>
                <ShapChart shap={patient.shap} baseline={0.5} finalValue={patient.probAlta} />
              </section>

              <section className="v2-section">
                <div className="v2-section-head">
                  <div>
                    <h3 className="v2-section-title">Estadía esperada vs real</h3>
                    <p className="v2-section-sub">Trayectoria del paciente comparada con la predicción. Si la línea sólida supera a la punteada, el caso se está alargando más de lo esperado.</p>
                  </div>
                  <div className="v2-los-legend">
                    <span><span className="v2-leg-line solid" /> Real</span>
                    <span><span className="v2-leg-line dashed" /> Predicho</span>
                    <span><span className="v2-leg-band" /> IC 95%</span>
                  </div>
                </div>
                <LosChart data={patient.losTrend} currentDay={patient.estadia} />
                <div className="v2-los-summary">
                  <div><span className="v2-meta-lbl">LOS real</span><span className="v2-meta-val mono">{patient.estadia}d</span></div>
                  <div><span className="v2-meta-lbl">LOS predicho</span><span className="v2-meta-val mono">{patient.losPredicho}d</span></div>
                  <div><span className="v2-meta-lbl">Desviación</span><span className={`v2-meta-val mono ${desviacion > 0 ? 'neg' : 'pos'}`}>{desviacion > 0 ? '+' : ''}{desviacion}d</span></div>
                </div>
              </section>

              <section className="v2-section">
                <div className="v2-section-head">
                  <div>
                    <h3 className="v2-section-title">
                      Anomalías en signos vitales <InfoTip text="Isolation Forest: algoritmo que detecta lecturas que se salen del patrón habitual del paciente. Útil para alertar deterioros tempranos antes de que crucen umbrales clínicos." />
                    </h3>
                    <p className="v2-section-sub">Últimas 24h. Los puntos rojos son lecturas atípicas detectadas por el modelo.</p>
                  </div>
                </div>
                <div className="v2-vitals-charts">
                  <VitalsChart data={patient.vitalsTrend} metric="fc" label="Frecuencia cardíaca" unit="lpm" normal={[60, 100]} />
                  <VitalsChart data={patient.vitalsTrend} metric="sat" label="Saturación O₂" unit="%" normal={[94, 100]} />
                </div>
              </section>

              <div className="v2-grid-2">
                <section className="v2-section">
                  <h3 className="v2-section-title">Cohorte similar</h3>
                  <p className="v2-section-sub">Cómo evolucionaron pacientes parecidos (diagnóstico, edad y comorbilidades) en el pasado.</p>
                  <CohortChart patientLos={patient.estadia} cohortMean={patient.cohortDias} cohortN={patient.cohortN} />
                  <div className="v2-cohort-stats">
                    <div><span className="v2-meta-lbl">Cohorte</span><span className="v2-meta-val mono">{patient.cohortN} pacientes</span></div>
                    <div><span className="v2-meta-lbl">LOS medio cohorte</span><span className="v2-meta-val mono">{patient.cohortDias}d</span></div>
                  </div>
                </section>

                <section className="v2-section">
                  <h3 className="v2-section-title">Riesgo de reingreso 30d</h3>
                  <p className="v2-section-sub">Probabilidad de que el paciente vuelva a hospitalizarse dentro de 30 días post-alta. Bajo &lt;15% · Medio 15–30% · Alto &gt;30%.</p>
                  <div className="v2-readm-hero">
                    <div className={`v2-readm-score ${patient.riskReadmision >= 30 ? 'high' : patient.riskReadmision >= 15 ? 'med' : 'low'}`}>
                      {patient.riskReadmision}<span>%</span>
                    </div>
                    <div className="v2-readm-gauge">
                      <div className="v2-readm-track">
                        <div className="v2-readm-zone low" />
                        <div className="v2-readm-zone med" />
                        <div className="v2-readm-zone high" />
                      </div>
                      <div className="v2-readm-marker" style={{ left: `${Math.min(patient.riskReadmision, 50) * 2}%` }} />
                    </div>
                    <div className="v2-readm-label">
                      {patient.riskReadmision >= 30 ? 'Alto riesgo · considerar seguimiento ambulatorio temprano' : patient.riskReadmision >= 15 ? 'Riesgo medio · plan de seguimiento estándar' : 'Bajo riesgo · alta segura'}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>

        <div className="v2-modal-footer">
          <div className="v2-footer-hint">
            {tareasCriticas.length > 0
              ? <><span className="v2-dot-rose" /> {tareasCriticas.length} tarea(s) crítica(s) bloquean el alta</>
              : <><span className="v2-dot-emerald" /> Sin bloqueadores · paciente puede ser dado de alta</>}
          </div>
          <div className="v2-footer-actions">
            {canEdit && (
              <button
                type="button"
                className="v2-btn v2-btn-secondary"
                onClick={() => setTab('gestion')}
              >
                Editar tareas
              </button>
            )}
            <button
              type="button"
              className="v2-btn v2-btn-primary"
              onClick={handleConfirmAlta}
              disabled={tareasCriticas.length > 0 || !canDischarge}
              title={!canDischarge ? 'Tu rol no permite confirmar el alta' : (tareasCriticas.length > 0 ? 'Resuelve las tareas críticas primero' : 'Confirmar alta médica')}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12l5 5L20 7"/></svg>
              Confirmar alta
            </button>
          </div>
        </div>

        {confirming && (
          <div className="v2-confirm-overlay" onClick={() => setConfirming(false)}>
            <div className="v2-confirm-card" onClick={e => e.stopPropagation()}>
              <h3>¿Confirmar alta médica?</h3>
              <p>
                Se cerrará la ficha de <b>{patient.nombre}</b> y la cama <span className="mono">{patient.cama}</span> quedará disponible.
              </p>
              <div className="v2-confirm-actions">
                <button type="button" className="v2-btn v2-btn-secondary" onClick={() => setConfirming(false)}>Cancelar</button>
                <button type="button" className="v2-btn v2-btn-primary" onClick={() => { setConfirming(false); onDischarge(); }}>Sí, dar de alta</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className="v2-toast">{toast}</div>}
      </div>
    </div>
  );
}

window.PatientModal = PatientModal;
