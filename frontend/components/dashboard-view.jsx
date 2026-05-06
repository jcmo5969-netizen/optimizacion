// Dashboard view — executive overview con un panel rico por servicio
function DashboardView({ servicios, pacientes, recomendaciones, analytics, onSelectPatient, onOpenServicio, onOpenView }) {
  const fecha = new Date(2026, 3, 27).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const numCama = typeof window.numeroDeCama === 'function' ? window.numeroDeCama : (s) => {
    const m = String(s ?? '').trim().match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : NaN;
  };

  /** Solo el número de cama (sin sufijo tipo -A / -B) para mostrar en UI. */
  function camaSoloNumero(camaStr) {
    const n = numCama(camaStr);
    return Number.isFinite(n) ? String(n) : String(camaStr ?? '').trim();
  }

  /** Una entrada por cama física, en orden numérico, con el paciente que ocupa esa numeración (si hay). */
  function bedSlotsForServicio(s, list) {
    if (s.camaDesde != null && s.camaHasta != null && Number.isFinite(s.camaDesde) && Number.isFinite(s.camaHasta)) {
      const slots = [];
      for (let n = s.camaDesde; n <= s.camaHasta; n++) {
        const p = list.find((pat) => numCama(pat.cama) === n) || null;
        slots.push({ n, p });
      }
      return slots;
    }
    return Array.from({ length: s.camas }, (_, i) => ({ n: i + 1, p: list[i] || null }));
  }

  const totalCamas = servicios.reduce((s, x) => s + x.camas, 0);
  const ocupacion = pacientes.length;
  const desviados = pacientes.filter(p => p.estadia > p.losPredicho + 2).length;
  const altasProb48 = pacientes.filter(p => p.probAlta48 >= 70).length;
  const tareasCrit = pacientes.reduce((s, p) => s + p.tareas.filter(t => t.critico && t.estado === 'pendiente').length, 0);

  const topRec = recomendaciones[0];
  const topRecPat = pacientes.find(p => p.id === topRec.pacienteId);

  const altaTop = [...pacientes].sort((a, b) => b.probAlta48 - a.probAlta48).slice(0, 3);
  const desvTop = [...pacientes]
    .map(p => ({ ...p, desv: p.estadia - p.losPredicho }))
    .sort((a, b) => b.desv - a.desv)
    .slice(0, 3);

  return (
    <div className="dash-root">
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div className="v2-eyebrow mono">Pizarra Digital · Hospital Regional Concepción</div>
          <h1 className="dash-hero-title">Buenos días, Dra. Reyes.</h1>
          <p className="dash-hero-sub">{fecha[0].toUpperCase() + fecha.slice(1)} · {ocupacion} pacientes activos en {servicios.length} servicios.</p>
        </div>
        <div className="dash-hero-kpis">
          <div className="dash-kpi">
            <div className="dash-kpi-l">Ocupación</div>
            <div className="dash-kpi-v">{Math.round(ocupacion / totalCamas * 100)}<span>%</span></div>
            <div className="dash-kpi-d mono">{ocupacion}/{totalCamas} camas</div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-l">Desviación LOS</div>
            <div className="dash-kpi-v" style={{ color: 'var(--rose)' }}>{desviados}</div>
            <div className="dash-kpi-d mono">+2d sobre predicción</div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-l">Alta probable 48h</div>
            <div className="dash-kpi-v" style={{ color: 'var(--emerald)' }}>{altasProb48}</div>
            <div className="dash-kpi-d mono">score &gt; 70%</div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-l">Bloqueadores</div>
            <div className="dash-kpi-v">{tareasCrit}</div>
            <div className="dash-kpi-d mono">tareas críticas</div>
          </div>
        </div>
      </div>

      <div className="dash-services">
        {servicios.map((s, idx) => {
          const list = pacientes.filter(p => p.servicio === s.id);
          const desvCount = list.filter(p => p.estadia > p.losPredicho + 2).length;
          const altaCount = list.filter(p => p.probAlta48 >= 70).length;
          const losAvg = list.length ? (list.reduce((sum, p) => sum + p.estadia, 0) / list.length).toFixed(1) : '0.0';
          const ocupPct = Math.round(list.length / s.camas * 100);
          const tareasC = list.reduce((sum, p) => sum + p.tareas.filter(t => t.critico && t.estado === 'pendiente').length, 0);
          const topAlta = [...list].sort((a, b) => b.probAlta48 - a.probAlta48)[0];
          const topDesv = [...list].sort((a, b) => (b.estadia - b.losPredicho) - (a.estadia - a.losPredicho))[0];

          return (
            <div key={s.id} className="dash-svc" style={{ animationDelay: `${idx * 80}ms` }}>
              <div className="dash-svc-head">
                <div className="dash-svc-head-left">
                  <span className="dash-svc-tag mono">{s.abrev}</span>
                  <div>
                    <h3 className="dash-svc-name">{s.nombre}</h3>
                    <div className="dash-svc-meta mono">{s.camas} camas · jefe rotativo</div>
                  </div>
                </div>
                <button className="dash-svc-open" onClick={() => onOpenServicio(s.id)}>
                  Abrir pizarra <span>→</span>
                </button>
              </div>

              <div className="dash-svc-occ">
                <div className="dash-occ-row">
                  <span className="dash-occ-label">Ocupación</span>
                  <span className="dash-occ-val mono">{list.length}<span className="dash-occ-of">/{s.camas}</span> · {ocupPct}%</span>
                </div>
                <div className="dash-bed-grid">
                  {bedSlotsForServicio(s, list).map(({ n, p }) => {
                    const cls = !p ? 'free' : (p.estadia > p.losPredicho + 2 ? 'crit' : (p.probAlta48 >= 70 ? 'alta' : 'occ'));
                    const title = p ? `Cama ${n} · ${p.nombre}` : `Cama ${n} · libre`;
                    return (
                      <div
                        key={n}
                        className={`dash-bed-cell ${cls}`}
                        title={title}
                        onClick={() => p && onSelectPatient(p)}
                      >
                        <span className="dash-bed-num mono">{n}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="dash-occ-legend">
                  <span><i className="dash-leg occ"/>Ocupada</span>
                  <span><i className="dash-leg alta"/>Alta probable</span>
                  <span><i className="dash-leg crit"/>Desviación</span>
                  <span><i className="dash-leg free"/>Libre</span>
                </div>
              </div>

              <div className="dash-svc-mini">
                <div className="dash-mini">
                  <div className="dash-mini-l">LOS promedio</div>
                  <div className="dash-mini-v mono">{losAvg}<span>d</span></div>
                </div>
                <div className="dash-mini">
                  <div className="dash-mini-l">Desviación</div>
                  <div className="dash-mini-v mono" style={{ color: desvCount > 0 ? 'var(--rose)' : 'var(--text)' }}>{desvCount}</div>
                </div>
                <div className="dash-mini">
                  <div className="dash-mini-l">Alta 48h</div>
                  <div className="dash-mini-v mono" style={{ color: altaCount > 0 ? 'var(--emerald)' : 'var(--text)' }}>{altaCount}</div>
                </div>
                <div className="dash-mini">
                  <div className="dash-mini-l">Bloqueadores</div>
                  <div className="dash-mini-v mono">{tareasC}</div>
                </div>
              </div>

              <div className="dash-svc-highlights">
                {topAlta && (
                  <div className="dash-hl alta" onClick={() => onSelectPatient(topAlta)}>
                    <div className="dash-hl-tag">próximo alta</div>
                    <div className="dash-hl-name">{topAlta.nombre.split(' ').slice(0, 2).join(' ')}</div>
                    <div className="dash-hl-meta mono">Cama {camaSoloNumero(topAlta.cama)} · score {topAlta.probAlta48}%</div>
                  </div>
                )}
                {topDesv && (topDesv.estadia - topDesv.losPredicho) > 0 && (
                  <div className="dash-hl desv" onClick={() => onSelectPatient(topDesv)}>
                    <div className="dash-hl-tag">mayor desviación</div>
                    <div className="dash-hl-name">{topDesv.nombre.split(' ').slice(0, 2).join(' ')}</div>
                    <div className="dash-hl-meta mono">Cama {camaSoloNumero(topDesv.cama)} · +{topDesv.estadia - topDesv.losPredicho}d sobre LOS</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="dash-grid-2">
        <div className="dash-card">
          <div className="dash-card-head">
            <div>
              <div className="v2-eyebrow mono">AI Copilot</div>
              <h3 className="dash-card-title">Acción priorizada de hoy</h3>
            </div>
            <button className="dash-card-link" onClick={() => onOpenView('insights')}>Ver todas <span>→</span></button>
          </div>
          {topRecPat && (
            <div className="dash-rec-feature">
              <div className="dash-rec-rank mono">#1</div>
              <div className="dash-rec-body">
                <div className="dash-rec-title">{topRec.accion}</div>
                <p className="dash-rec-impact">{topRec.impacto}</p>
                <div className="dash-rec-pat" onClick={() => onSelectPatient(topRecPat)}>
                  <div className="v2-rec-avatar">{topRecPat.nombre.split(' ').slice(0, 2).map(n => n[0]).join('')}</div>
                  <div>
                    <div className="v2-rec-pname">{topRecPat.nombre}</div>
                    <div className="v2-rec-pmeta mono">Cama {camaSoloNumero(topRecPat.cama)} · {topRecPat.diagnostico}</div>
                  </div>
                  <div className="v2-rec-arrow">→</div>
                </div>
              </div>
              <div className="dash-rec-conf">
                <div className="dash-rec-conf-v">{Math.round(topRec.confianza * 100)}<span>%</span></div>
                <div className="dash-rec-conf-l mono">confianza</div>
              </div>
            </div>
          )}
          <div className="dash-rec-rest">
            {recomendaciones.slice(1, 4).map((r, i) => {
              const p = pacientes.find(x => x.id === r.pacienteId);
              if (!p) return null;
              return (
                <div key={r.id} className={`dash-rec-row prio-${r.prioridad}`} onClick={() => onSelectPatient(p)}>
                  <div className="dash-rec-row-rank mono">#{i + 2}</div>
                  <div className="dash-rec-row-body">
                    <div className="dash-rec-row-title">{r.accion}</div>
                    <div className="dash-rec-row-pat mono">Cama {camaSoloNumero(p.cama)} · {p.nombre.split(' ').slice(0, 2).join(' ')}</div>
                  </div>
                  <div className="dash-rec-row-conf mono">{Math.round(r.confianza * 100)}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <div>
              <div className="v2-eyebrow mono">Top de hoy</div>
              <h3 className="dash-card-title">Movimientos esperados</h3>
            </div>
          </div>
          <div className="dash-movers-section">
            <div className="dash-movers-h">↑ Alta probable 48h</div>
            {altaTop.map(p => (
              <div key={p.id} className="dash-mover-row" onClick={() => onSelectPatient(p)}>
                <div className="v2-rec-avatar">{p.nombre.split(' ').slice(0, 2).map(n => n[0]).join('')}</div>
                <div className="dash-mover-info">
                  <div className="dash-mover-name">{p.nombre.split(' ').slice(0, 2).join(' ')}</div>
                  <div className="dash-mover-meta mono">Cama {camaSoloNumero(p.cama)} · {p.diagnostico.split(' ').slice(0, 4).join(' ')}…</div>
                </div>
                <div className="dash-mover-score">
                  <div className="dash-mover-num mono" style={{ color: 'var(--emerald)' }}>{p.probAlta48}<span>%</span></div>
                  <div className="dash-mover-bar"><div className="dash-mover-fill alta" style={{ width: `${p.probAlta48}%` }}/></div>
                </div>
              </div>
            ))}
          </div>
          <div className="dash-movers-section">
            <div className="dash-movers-h">↓ Mayor desviación de LOS</div>
            {desvTop.map(p => (
              <div key={p.id} className="dash-mover-row" onClick={() => onSelectPatient(p)}>
                <div className="v2-rec-avatar crit">{p.nombre.split(' ').slice(0, 2).map(n => n[0]).join('')}</div>
                <div className="dash-mover-info">
                  <div className="dash-mover-name">{p.nombre.split(' ').slice(0, 2).join(' ')}</div>
                  <div className="dash-mover-meta mono">Cama {camaSoloNumero(p.cama)} · LOS pred. {p.losPredicho}d</div>
                </div>
                <div className="dash-mover-score">
                  <div className="dash-mover-num mono" style={{ color: 'var(--rose)' }}>+{p.desv}<span>d</span></div>
                  <div className="dash-mover-bar"><div className="dash-mover-fill desv" style={{ width: `${Math.min(100, (p.desv / 8) * 100)}%` }}/></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-model-strip">
        <div className="dash-model-item">
          <div className="dash-model-l">Modelo</div>
          <div className="dash-model-v mono">LOS-Predict v2.4</div>
        </div>
        <div className="dash-model-item">
          <div className="dash-model-l">AUC</div>
          <div className="dash-model-v mono">0.847</div>
        </div>
        <div className="dash-model-item">
          <div className="dash-model-l">Precisión 30d</div>
          <div className="dash-model-v mono">{(analytics.precision_modelo * 100).toFixed(1)}%</div>
        </div>
        <div className="dash-model-item">
          <div className="dash-model-l">Inferencia</div>
          <div className="dash-model-v"><span className="v2-live-dot"/> en vivo · cada 5 min</div>
        </div>
        <button className="dash-model-link" onClick={() => onOpenView('analytics')}>Analytics ML <span>→</span></button>
      </div>
    </div>
  );
}

window.DashboardView = DashboardView;
