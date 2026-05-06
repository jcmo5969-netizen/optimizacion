// Analytics view — rendimiento del modelo y cuellos de botella
function AnalyticsView({ analytics, pacientes }) {
  const totalCriticos = pacientes.filter(p => p.estadia > p.losPredicho + 2).length;
  const losActual = (pacientes.reduce((s, p) => s + p.estadia, 0) / pacientes.length).toFixed(1);

  return (
    <div className="v2-analytics">
      <div className="v2-insights-hero">
        <div>
          <div className="v2-eyebrow mono">Analytics ML · Servicio Quirúrgico</div>
          <h1 className="v2-display">Rendimiento del modelo</h1>
          <p className="v2-display-sub">Métricas agregadas de LOS-Predict v2.4 sobre la base activa.</p>
        </div>
      </div>

      <div className="v2-metrics-grid">
        <div className="v2-metric-card">
          <div className="v2-metric-l">Precisión modelo</div>
          <div className="v2-metric-v mono">{(analytics.precision_modelo * 100).toFixed(1)}<span>%</span></div>
          <div className="v2-metric-d pos">↑ 2.1% vs v2.3</div>
        </div>
        <div className="v2-metric-card">
          <div className="v2-metric-l">Altas predichas correctas</div>
          <div className="v2-metric-v mono">{analytics.altas_predichas_correctas}<span className="v2-metric-of">/{analytics.altas_totales_30d}</span></div>
          <div className="v2-metric-d neutral">últimos 30 días</div>
        </div>
        <div className="v2-metric-card">
          <div className="v2-metric-l">LOS promedio actual</div>
          <div className="v2-metric-v mono">{losActual}<span>d</span></div>
          <div className="v2-metric-d neg">+{(losActual - analytics.los_promedio_predicho).toFixed(1)} vs predicho</div>
        </div>
        <div className="v2-metric-card">
          <div className="v2-metric-l">Pacientes en desviación</div>
          <div className="v2-metric-v mono">{totalCriticos}</div>
          <div className="v2-metric-d neutral">+2d sobre LOS predicho</div>
        </div>
      </div>

      <div className="v2-section v2-bottlenecks">
        <div className="v2-section-head">
          <div>
            <h3 className="v2-section-title">Detección de cuellos de botella</h3>
            <p className="v2-section-sub">Tareas que más frecuentemente bloquean el alta y su impacto en LOS.</p>
          </div>
          <span className="v2-section-meta mono">últimos 90 días</span>
        </div>
        <div className="v2-bn-list">
          {analytics.cuellos_botella.map((b, i) => {
            const maxFreq = Math.max(...analytics.cuellos_botella.map(x => x.frecuencia));
            return (
              <div key={i} className="v2-bn-row" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="v2-bn-rank mono">#{i + 1}</div>
                <div className="v2-bn-name">{b.tipo}</div>
                <div className="v2-bn-bar">
                  <div className="v2-bn-fill" style={{ width: `${(b.frecuencia / maxFreq) * 100}%` }} />
                </div>
                <div className="v2-bn-freq mono">{b.frecuencia}<span>casos</span></div>
                <div className="v2-bn-impact mono">+{b.dias_extra}<span>d LOS</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.AnalyticsView = AnalyticsView;
