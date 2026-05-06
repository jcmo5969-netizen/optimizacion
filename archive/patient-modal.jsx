// Patient detail modal with AI prediction panel
function PatientModal({ patient, onClose, paletteTokens, aiViz }) {
  const [tab, setTab] = React.useState('resumen');
  if (!patient) return null;

  const critico = patient.estadia > 10;
  const tareasCompletas = patient.tareas.filter(t => t.estado === 'completo').length;
  const tareasCriticas = patient.tareas.filter(t => t.critico && t.estado === 'pendiente');

  // ML factors (mock — explainability for the prediction)
  const factors = [
    { label: 'Tendencia signos vitales', value: patient.vitales.fc < 90 ? 0.8 : 0.4, dir: patient.vitales.fc < 90 ? 'pos' : 'neg' },
    { label: 'Reducción tareas pendientes', value: tareasCompletas / patient.tareas.length, dir: 'pos' },
    { label: 'Estadía vs LOS predicho', value: critico ? 0.15 : 0.7, dir: critico ? 'neg' : 'pos' },
    { label: 'Exámenes pendientes', value: 1 - patient.examenes.filter(e => e.estado === 'pendiente').length / Math.max(patient.examenes.length, 1), dir: 'pos' },
    { label: 'Interconsultas abiertas', value: 1 - patient.interconsultas.filter(i => i.estado === 'pendiente').length / 3, dir: patient.interconsultas.filter(i => i.estado === 'pendiente').length > 0 ? 'neg' : 'pos' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ background: paletteTokens.surface, border: `1px solid ${paletteTokens.border}` }}>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: `1px solid ${paletteTokens.border}` }}>
          <div className="modal-header-left">
            <div className="modal-avatar" style={{ background: critico ? '#fee2e2' : paletteTokens.kpiBg, color: critico ? '#b91c1c' : paletteTokens.textPrimary }}>
              {patient.nombre.split(' ').slice(0, 2).map(n => n[0]).join('')}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 style={{ margin: 0, fontSize: 20, color: paletteTokens.textPrimary, letterSpacing: '-0.02em' }}>{patient.nombre}</h2>
                {critico && <span className="critical-pill mono">ESTADÍA +{patient.estadia - 10}d</span>}
              </div>
              <div className="mono" style={{ fontSize: 12, color: paletteTokens.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                RUT {patient.rut} · {patient.edad}a · {patient.sexo} · Cama {patient.cama} · Ingreso {patient.ingreso}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs" style={{ borderBottom: `1px solid ${paletteTokens.border}` }}>
          {['resumen', 'clínico', 'gestión', 'predicción'].map(t => (
            <button key={t} className={`modal-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}
              style={{ color: tab === t ? paletteTokens.accent : paletteTokens.textMuted, borderBottom: tab === t ? `2px solid ${paletteTokens.accent}` : '2px solid transparent' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="modal-body">
          {tab === 'resumen' && (
            <div className="modal-grid">
              <section className="modal-section">
                <h3 className="modal-section-title">Diagnóstico principal</h3>
                <p style={{ margin: 0, fontSize: 14, color: paletteTokens.textPrimary, lineHeight: 1.5 }}>{patient.diagnostico}</p>
                <div className="modal-meta-grid">
                  <div><span className="meta-lbl">Médico tratante</span><span className="meta-val">{patient.medico}</span></div>
                  <div><span className="meta-lbl">Estadía</span><span className="meta-val mono">{patient.estadia} días</span></div>
                  <div><span className="meta-lbl">LOS esperado</span><span className="meta-val mono">{critico ? '6-8' : '4-6'} días</span></div>
                  <div><span className="meta-lbl">Tendencia</span><span className="meta-val">{patient.tendencia}</span></div>
                </div>
              </section>

              <section className="modal-section vitals-section">
                <h3 className="modal-section-title">Signos vitales</h3>
                <div className="vitals-grid">
                  <div className="vital-block"><div className="vb-label">FC</div><div className="vb-value mono">{patient.vitales.fc}</div><div className="vb-unit">lpm</div></div>
                  <div className="vital-block"><div className="vb-label">FR</div><div className="vb-value mono">{patient.vitales.fr}</div><div className="vb-unit">rpm</div></div>
                  <div className="vital-block"><div className="vb-label">PA</div><div className="vb-value mono" style={{ fontSize: 18 }}>{patient.vitales.pa}</div><div className="vb-unit">mmHg</div></div>
                  <div className={`vital-block ${patient.vitales.sat < 94 ? 'alert' : ''}`}><div className="vb-label">SatO₂</div><div className="vb-value mono">{patient.vitales.sat}</div><div className="vb-unit">%</div></div>
                  <div className={`vital-block ${patient.vitales.temp >= 37.5 ? 'alert' : ''}`}><div className="vb-label">T°</div><div className="vb-value mono">{patient.vitales.temp.toFixed(1)}</div><div className="vb-unit">°C</div></div>
                </div>
              </section>

              <section className="modal-section">
                <h3 className="modal-section-title">Probabilidad de alta · próximas 24-48h</h3>
                <div className="prob-large">
                  <ProbRing value={patient.probAlta} size={88} paletteTokens={paletteTokens} kind="ring" />
                  <div className="prob-explain">
                    <div className="prob-headline">
                      {patient.probAlta >= 70 ? 'Alta muy probable' : patient.probAlta >= 40 ? 'Requiere gestión' : 'Improbable'}
                    </div>
                    <div className="prob-sub mono">Modelo XGBoost · LOS-Predict v2.4 · IC 95%</div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {tab === 'clínico' && (
            <div className="modal-stack">
              <section className="modal-section">
                <h3 className="modal-section-title">Exámenes</h3>
                <div className="exam-list">
                  {patient.examenes.length === 0 && <div className="empty-row">Sin exámenes registrados.</div>}
                  {patient.examenes.map((e, i) => (
                    <div key={i} className="exam-row">
                      <span className={`exam-status ${e.estado}`}>{e.estado === 'listo' ? '●' : '○'}</span>
                      <div className="exam-name">{e.tipo}</div>
                      {e.valor && <div className={`exam-value mono ${e.flag || ''}`}>{e.valor}</div>}
                      {e.solicitado && <div className="exam-date mono">solicitado {e.solicitado}</div>}
                    </div>
                  ))}
                </div>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">Interconsultas</h3>
                <div className="ic-list">
                  {patient.interconsultas.length === 0 && <div className="empty-row">Sin interconsultas activas.</div>}
                  {patient.interconsultas.map((ic, i) => (
                    <div key={i} className={`ic-row ${ic.estado}`}>
                      <span className="ic-spec">{ic.especialidad}</span>
                      <span className={`ic-status ${ic.estado}`}>{ic.estado}</span>
                      {ic.dias > 0 && <span className="ic-days mono">{ic.dias}d esperando</span>}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {tab === 'gestión' && (
            <div className="modal-stack">
              <section className="modal-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                  <h3 className="modal-section-title" style={{ margin: 0 }}>Pendientes para el alta</h3>
                  <span className="mono" style={{ fontSize: 12, color: paletteTokens.textMuted }}>{tareasCompletas}/{patient.tareas.length} completas</span>
                </div>
                <div className="task-list">
                  {patient.tareas.map((t, i) => (
                    <div key={i} className={`task-row ${t.estado} ${t.critico ? 'crit' : ''}`}>
                      <span className={`task-check ${t.estado}`}>
                        {t.estado === 'completo' ? (
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        ) : null}
                      </span>
                      <span className="task-text">{t.texto}</span>
                      {t.critico && t.estado === 'pendiente' && <span className="task-crit-tag mono">CRÍT</span>}
                    </div>
                  ))}
                </div>
              </section>
              {tareasCriticas.length > 0 && (
                <section className="modal-section blocker-section">
                  <h3 className="modal-section-title">Bloqueadores del alta</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7f1d1d', lineHeight: 1.5 }}>
                    Para liberar la cama <span className="mono" style={{ fontWeight: 600 }}>{patient.cama}</span> es necesario resolver {tareasCriticas.length} {tareasCriticas.length === 1 ? 'tarea crítica' : 'tareas críticas'}.
                    Esto representa el bloqueo principal según el cruce de pendientes con tiempo de estadía.
                  </p>
                </section>
              )}
            </div>
          )}

          {tab === 'predicción' && (
            <div className="modal-stack">
              <section className="modal-section">
                <h3 className="modal-section-title">Score predictivo · 24-48h</h3>
                <div className="prediction-hero">
                  <ProbRing value={patient.probAlta} size={120} paletteTokens={paletteTokens} kind="ring" />
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: paletteTokens.textPrimary, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {patient.probAlta}<span style={{ fontSize: 18, color: paletteTokens.textMuted, fontWeight: 500 }}>%</span>
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: paletteTokens.textMuted, marginTop: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Probabilidad de egreso</div>
                  </div>
                </div>
              </section>

              <section className="modal-section">
                <h3 className="modal-section-title">Factores del modelo</h3>
                <div className="factors">
                  {factors.map((f, i) => (
                    <div key={i} className="factor-row">
                      <div className="factor-label">{f.label}</div>
                      <div className="factor-bar">
                        <div className={`factor-fill ${f.dir}`} style={{ width: `${f.value * 100}%` }} />
                      </div>
                      <div className={`factor-val mono ${f.dir}`}>{f.dir === 'pos' ? '+' : '−'}{Math.round(f.value * 100)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="modal-section meta-model">
                <div className="meta-model-row">
                  <span>Modelo</span><span className="mono">XGBoost · LOS-Predict v2.4</span>
                </div>
                <div className="meta-model-row">
                  <span>Entrenamiento</span><span className="mono">38.412 altas · 2019-2025</span>
                </div>
                <div className="meta-model-row">
                  <span>AUC</span><span className="mono">0.847</span>
                </div>
                <div className="meta-model-row">
                  <span>Última actualización</span><span className="mono">hace 4 min</span>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: `1px solid ${paletteTokens.border}` }}>
          <button className="btn-secondary">Editar tareas</button>
          <button className="btn-primary" style={{ background: paletteTokens.accent }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12l5 5L20 7"/></svg>
            Confirmar alta
          </button>
        </div>
      </div>
    </div>
  );
}

window.PatientModal = PatientModal;
