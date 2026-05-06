// AI Insights view — recomendaciones priorizadas por impacto
function AiInsightsView({ recomendaciones, pacientes, onSelectPatient }) {
  return (
    <div className="v2-insights">
      <div className="v2-insights-hero">
        <div>
          <div className="v2-eyebrow mono">AI Copilot · Recomendaciones</div>
          <h1 className="v2-display">Acciones priorizadas para hoy</h1>
          <p className="v2-display-sub">El modelo identifica las {recomendaciones.length} acciones de mayor impacto en LOS y disponibilidad de camas.</p>
        </div>
        <div className="v2-insights-stats">
          <div className="v2-istat"><span className="v2-istat-v mono">2.4d</span><span className="v2-istat-l">reducción potencial LOS</span></div>
          <div className="v2-istat"><span className="v2-istat-v mono">3</span><span className="v2-istat-l">camas liberables 48h</span></div>
        </div>
      </div>

      <div className="v2-rec-list">
        {recomendaciones.map((r, idx) => {
          const p = pacientes.find(x => x.id === r.pacienteId);
          if (!p) return null;
          return (
            <div key={r.id} className={`v2-rec-card prio-${r.prioridad}`} style={{ animationDelay: `${idx * 60}ms` }}>
              <div className="v2-rec-rank mono">#{idx + 1}</div>
              <div className="v2-rec-body">
                <div className="v2-rec-head">
                  <h3 className="v2-rec-title">{r.accion}</h3>
                  <span className={`v2-rec-prio ${r.prioridad}`}>{r.prioridad}</span>
                </div>
                <p className="v2-rec-impact">{r.impacto}</p>
                <div className="v2-rec-pat" onClick={() => onSelectPatient(p)}>
                  <div className="v2-rec-avatar">{p.nombre.split(' ').slice(0, 2).map(n => n[0]).join('')}</div>
                  <div>
                    <div className="v2-rec-pname">{p.nombre}</div>
                    <div className="v2-rec-pmeta mono">{p.cama} · {p.diagnostico}</div>
                  </div>
                  <div className="v2-rec-arrow">→</div>
                </div>
              </div>
              <div className="v2-rec-confidence">
                <div className="v2-rec-conf-label mono">confianza</div>
                <div className="v2-rec-conf-val">{Math.round(r.confianza * 100)}<span>%</span></div>
                <div className="v2-rec-conf-bar"><div className="v2-rec-conf-fill" style={{ width: `${r.confianza * 100}%` }}/></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.AiInsightsView = AiInsightsView;
