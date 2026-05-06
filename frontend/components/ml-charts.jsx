// ML visualization charts — SHAP waterfall, LOS forecasting, vital anomalies, cohort
const { useEffect: useMlEffect, useRef: useMlRef } = React;

// SHAP waterfall chart — feature contributions
function ShapChart({ shap, baseline = 0.5, finalValue }) {
  const max = Math.max(...shap.map(s => s.abs));
  return (
    <div className="shap-chart">
      <div className="shap-axis">
        <div className="shap-baseline">
          <span className="shap-baseline-label">base</span>
          <span className="shap-baseline-val">{Math.round(baseline * 100)}%</span>
        </div>
        <div className="shap-rows">
          {shap.map((s, i) => {
            const pct = (s.abs / max) * 100;
            const positive = s.value > 0;
            return (
              <div key={i} className={`shap-row ${positive ? 'pos' : 'neg'}`}>
                <div className="shap-feature">{s.feature}</div>
                <div className="shap-bar-wrap">
                  <div className="shap-zero" />
                  <div className={`shap-bar ${positive ? 'pos' : 'neg'}`} style={{ width: `${pct * 0.5}%`, [positive ? 'left' : 'right']: '50%' }} />
                </div>
                <div className={`shap-val ${positive ? 'pos' : 'neg'}`}>{positive ? '+' : '−'}{Math.abs(Math.round(s.value * 100))}</div>
              </div>
            );
          })}
        </div>
        <div className="shap-final">
          <span className="shap-final-label">predicción</span>
          <span className="shap-final-val">{finalValue}%</span>
        </div>
      </div>
    </div>
  );
}

// LOS forecast — line chart with confidence band, real vs predicted
function LosChart({ data, currentDay }) {
  const w = 520, h = 180, pad = { t: 18, r: 16, b: 26, l: 32 };
  const maxDay = Math.max(...data.map(d => d.dia));
  const maxY = Math.max(...data.map(d => Math.max(d.high, d.real || 0))) + 1;

  const x = (d) => pad.l + (d / maxDay) * (w - pad.l - pad.r);
  const y = (v) => h - pad.b - (v / maxY) * (h - pad.t - pad.b);

  const bandPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(d.dia)} ${y(Math.max(0, d.low))}`).join(' ')
    + ' ' + [...data].reverse().map(d => `L ${x(d.dia)} ${y(d.high)}`).join(' ') + ' Z';

  const predPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(d.dia)} ${y(d.predicho)}`).join(' ');
  const realPoints = data.filter(d => d.real != null);
  const realPath = realPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(d.dia)} ${y(d.real)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={pad.l} x2={w - pad.r} y1={y(maxY * t)} y2={y(maxY * t)} stroke="#f1f5f9" strokeWidth="1" />
      ))}
      {/* y-axis labels */}
      {[0, 0.5, 1].map((t, i) => (
        <text key={i} x={pad.l - 6} y={y(maxY * t) + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="Instrument Sans">{Math.round(maxY * t)}d</text>
      ))}
      {/* x-axis */}
      {[0, Math.round(maxDay / 2), maxDay].map((d, i) => (
        <text key={i} x={x(d)} y={h - 10} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="Instrument Sans">d{d}</text>
      ))}
      {/* confidence band */}
      <path d={bandPath} fill="rgba(30,58,138,0.10)" stroke="none" />
      {/* predicted line */}
      <path d={predPath} fill="none" stroke="#1e3a8a" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
      {/* real line */}
      <path d={realPath} fill="none" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" />
      {realPoints.map((d, i) => (
        <circle key={i} cx={x(d.dia)} cy={y(d.real)} r="3" fill="#fff" stroke="#1e3a8a" strokeWidth="1.5" />
      ))}
      {/* current day marker */}
      <line x1={x(currentDay)} x2={x(currentDay)} y1={pad.t} y2={h - pad.b} stroke="#dc2626" strokeWidth="1" strokeDasharray="2 3" />
      <text x={x(currentDay)} y={pad.t - 4} textAnchor="middle" fontSize="9" fill="#dc2626" fontFamily="Instrument Sans" fontWeight="600">hoy</text>
    </svg>
  );
}

// Vital sign anomaly chart — sparkline-like with anomaly highlights
function VitalsChart({ data, metric = 'fc', label = 'FC', unit = 'lpm', normal = [60, 100] }) {
  const w = 520, h = 100, pad = { t: 14, r: 12, b: 20, l: 32 };
  const values = data.map(d => d[metric]);
  const min = Math.min(...values, normal[0]) - 4;
  const max = Math.max(...values, normal[1]) + 4;
  const x = (i) => pad.l + (i / (data.length - 1)) * (w - pad.l - pad.r);
  const y = (v) => h - pad.b - ((v - min) / (max - min)) * (h - pad.t - pad.b);

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d[metric])}`).join(' ');

  return (
    <div className="vitals-chart-wrap">
      <div className="vitals-chart-header">
        <span className="vc-label">{label}</span>
        <span className="vc-unit mono">{unit}</span>
        <span className="vc-norm mono">normal {normal[0]}–{normal[1]}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
        {/* normal range band */}
        <rect x={pad.l} y={y(normal[1])} width={w - pad.l - pad.r} height={y(normal[0]) - y(normal[1])} fill="rgba(6,95,70,0.06)" />
        <line x1={pad.l} x2={w - pad.r} y1={y(normal[0])} y2={y(normal[0])} stroke="#065f46" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
        <line x1={pad.l} x2={w - pad.r} y1={y(normal[1])} y2={y(normal[1])} stroke="#065f46" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
        {/* y-axis labels */}
        <text x={pad.l - 4} y={y(normal[0]) + 3} textAnchor="end" fontSize="8" fill="#94a3b8" fontFamily="Instrument Sans">{normal[0]}</text>
        <text x={pad.l - 4} y={y(normal[1]) + 3} textAnchor="end" fontSize="8" fill="#94a3b8" fontFamily="Instrument Sans">{normal[1]}</text>
        {/* line */}
        <path d={path} fill="none" stroke="#1e3a8a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* anomalies */}
        {data.map((d, i) => d.anomalia && (
          <g key={i}>
            <circle cx={x(i)} cy={y(d[metric])} r="6" fill="rgba(220,38,38,0.15)" />
            <circle cx={x(i)} cy={y(d[metric])} r="3" fill="#dc2626" />
          </g>
        ))}
        {/* time axis */}
        {[0, 6, 12, 18, 23].map(h => (
          <text key={h} x={x(h)} y={h === 23 ? h : 96} textAnchor={h === 23 ? 'end' : 'middle'} fontSize="8" fill="#94a3b8" fontFamily="Instrument Sans">{String(h).padStart(2, '0')}h</text>
        ))}
      </svg>
    </div>
  );
}

// Cohort comparison — histogram + patient marker
function CohortChart({ patientLos, cohortMean, cohortN }) {
  const bins = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  const distribution = [3, 8, 14, 22, 28, 24, 18, 14, 9, 6, 4, 2]; // mock distribution
  const maxBin = Math.max(...distribution);
  const w = 520, h = 110, pad = { t: 14, r: 12, b: 24, l: 32 };
  const barW = (w - pad.l - pad.r) / bins.length - 2;
  const xBin = (i) => pad.l + i * ((w - pad.l - pad.r) / bins.length);
  const yBar = (v) => h - pad.b - (v / maxBin) * (h - pad.t - pad.b);

  // patient position
  const patientBin = bins.findIndex((b, i) => patientLos < (bins[i + 1] || Infinity));
  const meanBin = bins.findIndex((b, i) => cohortMean < (bins[i + 1] || Infinity));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
      {distribution.map((v, i) => (
        <rect key={i} x={xBin(i) + 1} y={yBar(v)} width={barW} height={h - pad.b - yBar(v)}
          fill={i === patientBin ? '#1e3a8a' : '#cbd5e1'} rx="1.5" />
      ))}
      {/* mean line */}
      <line x1={xBin(meanBin) + barW / 2} x2={xBin(meanBin) + barW / 2} y1={pad.t} y2={h - pad.b} stroke="#065f46" strokeWidth="1" strokeDasharray="3 2" />
      <text x={xBin(meanBin) + barW / 2} y={pad.t - 4} textAnchor="middle" fontSize="8" fill="#065f46" fontFamily="Instrument Sans" fontWeight="600">media {cohortMean}d</text>
      {/* x labels */}
      {bins.filter((_, i) => i % 2 === 0).map((b) => (
        <text key={b} x={xBin(bins.indexOf(b)) + barW / 2} y={h - 8} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="Instrument Sans">{b}d</text>
      ))}
    </svg>
  );
}

window.ShapChart = ShapChart;
window.LosChart = LosChart;
window.VitalsChart = VitalsChart;
window.CohortChart = CohortChart;
