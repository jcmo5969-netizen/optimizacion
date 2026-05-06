// Patient table — the Pizarra Digital
const { useMemo: useTableMemo } = React;

function ProbRing({ value, size = 36, palette, paletteTokens, kind = 'ring' }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  const color = value >= 70 ? '#10b981' : value >= 40 ? '#f59e0b' : '#94a3b8';

  if (kind === 'bar') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 78 }}>
        <div style={{ position: 'relative', flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, width: `${value}%`, background: color, borderRadius: 3 }} />
        </div>
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: paletteTokens.textPrimary, minWidth: 26, textAlign: 'right' }}>{value}%</span>
      </div>
    );
  }
  if (kind === 'numeric') {
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{value}</span>
        <span style={{ fontSize: 9, color: paletteTokens.textMuted, fontWeight: 500 }}>%</span>
      </div>
    );
  }
  // default ring
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: paletteTokens.textPrimary, fontVariantNumeric: 'tabular-nums', fontFamily: 'IBM Plex Mono, monospace' }}>
        {value}
      </div>
    </div>
  );
}

function VitalChip({ label, value, alert, paletteTokens }) {
  return (
    <span className={`vital-chip ${alert ? 'alert' : ''}`}>
      <span className="vital-label">{label}</span>
      <span className="vital-value mono">{value}</span>
    </span>
  );
}

function TaskBar({ tareas }) {
  const total = tareas.length;
  const done = tareas.filter(t => t.estado === 'completo').length;
  const critical = tareas.filter(t => t.critico && t.estado === 'pendiente').length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 96 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{done}/{total}</span>
        {critical > 0 && (
          <span className="task-critical-pill mono">
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            {critical} crít
          </span>
        )}
      </div>
      <div className="task-pips">
        {tareas.map((t, i) => (
          <span key={i} className={`task-pip ${t.estado} ${t.critico ? 'crit' : ''}`} />
        ))}
      </div>
    </div>
  );
}

function PatientTable({ pacientes, density, criticalMode, onSelect, paletteTokens, aiViz }) {
  const rowH = density === 'compact' ? 44 : density === 'comfortable' ? 60 : 80;
  const fontSize = density === 'compact' ? 12 : 13;

  const isVitalAlert = (v) => {
    return v.fc > 100 || v.fc < 50 || v.fr > 22 || v.sat < 94 || v.temp >= 37.5;
  };

  const trendArrow = (t) => t === 'subiendo' ? '↑' : t === 'bajando' ? '↓' : '→';
  const trendColor = (t) => t === 'subiendo' ? '#10b981' : t === 'bajando' ? '#ef4444' : '#94a3b8';

  return (
    <div className="patient-table-wrap" style={{ background: paletteTokens.surface, border: `1px solid ${paletteTokens.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div className="patient-table" style={{ fontSize }}>
        <div className="pt-head" style={{ background: paletteTokens.tableHeadBg, borderBottom: `1px solid ${paletteTokens.border}` }}>
          <div className="pt-cell pt-cama">Cama</div>
          <div className="pt-cell pt-paciente">Paciente</div>
          <div className="pt-cell pt-rut">RUT</div>
          <div className="pt-cell pt-dx">Diagnóstico</div>
          <div className="pt-cell pt-estadia">Estadía</div>
          <div className="pt-cell pt-vitales">Signos vitales</div>
          <div className="pt-cell pt-tareas">Pendientes alta</div>
          <div className="pt-cell pt-prob">Prob. alta</div>
          <div className="pt-cell pt-tend">Tend.</div>
        </div>

        <div className="pt-body">
          {pacientes.map((p, idx) => {
            const critico = p.estadia > 10;
            const vitalAlert = isVitalAlert(p.vitales);
            const dimmed = criticalMode && !critico;
            return (
              <div key={p.id}
                className={`pt-row ${critico ? 'critico' : ''} ${dimmed ? 'dimmed' : ''} ${criticalMode && critico ? 'critical-mode' : ''}`}
                style={{ height: rowH, borderBottom: `1px solid ${paletteTokens.borderSoft}`, cursor: 'pointer' }}
                onClick={() => onSelect(p)}>
                <div className="pt-cell pt-cama">
                  <span className="cama-tag mono" style={{ background: critico ? '#fef2f2' : paletteTokens.kpiBg, color: critico ? '#b91c1c' : paletteTokens.textPrimary, border: `1px solid ${critico ? '#fecaca' : paletteTokens.border}` }}>
                    {p.cama}
                  </span>
                </div>
                <div className="pt-cell pt-paciente">
                  <div className="pat-name-row">
                    <div className="pat-avatar" style={{ background: critico ? '#fee2e2' : paletteTokens.kpiBg, color: critico ? '#b91c1c' : paletteTokens.textMuted }}>
                      {p.nombre.split(' ').slice(0, 2).map(n => n[0]).join('')}
                    </div>
                    <div className="pat-info">
                      <div className="pat-name" style={{ color: paletteTokens.textPrimary }}>{p.nombre}</div>
                      <div className="pat-meta mono">
                        {p.edad}a · {p.sexo} · {p.medico}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-cell pt-rut">
                  <span className="mono" style={{ fontSize: 11, color: paletteTokens.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{p.rut}</span>
                </div>
                <div className="pt-cell pt-dx" style={{ color: paletteTokens.textSecondary }}>
                  <div className="dx-text">{p.diagnostico}</div>
                </div>
                <div className="pt-cell pt-estadia">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="mono" style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: critico ? '#b91c1c' : paletteTokens.textPrimary, letterSpacing: '-0.01em' }}>{p.estadia}</span>
                    <span style={{ fontSize: 10, color: paletteTokens.textMuted }}>días</span>
                    {critico && <span className="estadia-flag mono">+{p.estadia - 10}</span>}
                  </div>
                </div>
                <div className="pt-cell pt-vitales">
                  <div className="vitals-row">
                    <VitalChip label="FC" value={p.vitales.fc} alert={p.vitales.fc > 100 || p.vitales.fc < 50} paletteTokens={paletteTokens} />
                    <VitalChip label="PA" value={p.vitales.pa} alert={false} paletteTokens={paletteTokens} />
                    <VitalChip label="SatO₂" value={p.vitales.sat + '%'} alert={p.vitales.sat < 94} paletteTokens={paletteTokens} />
                    <VitalChip label="T°" value={p.vitales.temp.toFixed(1)} alert={p.vitales.temp >= 37.5} paletteTokens={paletteTokens} />
                  </div>
                </div>
                <div className="pt-cell pt-tareas">
                  <TaskBar tareas={p.tareas} />
                </div>
                <div className="pt-cell pt-prob">
                  <ProbRing value={p.probAlta} palette={paletteTokens.accent} paletteTokens={paletteTokens} kind={aiViz} />
                </div>
                <div className="pt-cell pt-tend">
                  <span style={{ color: trendColor(p.tendencia), fontSize: 16, fontWeight: 700 }}>{trendArrow(p.tendencia)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.PatientTable = PatientTable;
window.ProbRing = ProbRing;
