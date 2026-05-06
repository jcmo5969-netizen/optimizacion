// La pizarra digital — tabla con sort, density y preview flotante.

const TABLE_COLS = [
  { id: 'cama',       label: 'Cama',         sortable: true,  cls: 'v2-c-cama' },
  { id: 'paciente',   label: 'Paciente',     sortable: true,  cls: 'v2-c-pat' },
  { id: 'rut',        label: 'RUT',          sortable: false, cls: 'v2-c-rut' },
  { id: 'diagnostico',label: 'Diagnóstico',  sortable: false, cls: 'v2-c-dx' },
  { id: 'estadia',    label: 'Estadía',      sortable: true,  cls: 'v2-c-est' },
  { id: 'losPredicho',label: 'LOS pred.',    sortable: true,  cls: 'v2-c-los' },
  { id: 'tareas',     label: 'Pendientes',   sortable: true,  cls: 'v2-c-tar' },
  { id: 'probAlta',   label: 'Score alta',   sortable: true,  cls: 'v2-c-prob' },
];

function PatientTable({ pacientes, onSelect, search, sort, onSortChange, density = 'comfy', onClearFilters, hasFilters }) {
  const [hoveredId, setHoveredId] = React.useState(null);

  const handleSort = (col) => {
    if (!col.sortable) return;
    if (sort?.key === col.id) {
      onSortChange({ key: col.id, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ key: col.id, dir: col.id === 'cama' ? 'asc' : 'desc' });
    }
  };

  const sortIndicator = (col) => {
    if (!col.sortable) return null;
    const active = sort?.key === col.id;
    return (
      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`v2-th-sort ${active ? 'active' : ''}`}>
        {active && sort.dir === 'asc'
          ? <path d="m6 15 6-6 6 6"/>
          : active && sort.dir === 'desc'
            ? <path d="m6 9 6 6 6-6"/>
            : <><path d="m6 9 6-6 6 6" opacity="0.4"/><path d="m6 15 6 6 6-6" opacity="0.4"/></>
        }
      </svg>
    );
  };

  const isNuevo = (p) => {
    try {
      const ms = Date.now() - new Date(p.ingreso).getTime();
      return ms >= 0 && ms < 1000 * 60 * 60 * 24;
    } catch { return false; }
  };

  return (
    <div className={`v2-table-card density-${density}`}>
      <div className="v2-table">
        <div className="v2-th">
          {TABLE_COLS.map(col => (
            <button
              key={col.id}
              type="button"
              className={`${col.cls} v2-th-cell ${col.sortable ? 'sortable' : ''} ${sort?.key === col.id ? 'active' : ''}`}
              onClick={() => handleSort(col)}
              disabled={!col.sortable}
            >
              <span>{col.label}</span>
              {sortIndicator(col)}
            </button>
          ))}
        </div>
        <div className="v2-tbody">
          {pacientes.map((p, idx) => {
            const desv = p.estadia - p.losPredicho;
            const critico = desv > 2;
            const tareasDone = p.tareas.filter(t => t.estado === 'completo').length;
            const tareasCrit = p.tareas.filter(t => t.critico && t.estado === 'pendiente').length;
            const probTier = p.probAlta >= 70 ? 'high' : p.probAlta >= 40 ? 'mid' : 'low';
            const probColor = p.probAlta >= 70 ? '#065f46' : p.probAlta >= 40 ? '#b45309' : '#64748b';
            const readmTone = p.riskReadmision >= 30 ? 'high' : p.riskReadmision >= 15 ? 'mid' : 'low';
            const nuevo = isNuevo(p);
            return (
              <div key={p.id} className={`v2-tr ${critico ? 'crit' : ''} ${nuevo ? 'nuevo' : ''}`}
                style={{ animationDelay: `${Math.min(idx, 14) * 28}ms` }}
                onClick={() => onSelect(p)}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}>
                <div className="v2-c-cama">
                  <span className={`v2-cama-tag mono ${critico ? 'crit' : ''}`}>{p.cama}</span>
                </div>
                <div className="v2-c-pat">
                  <div className="v2-pat-row">
                    <div className={`v2-pat-avatar ${critico ? 'crit' : ''}`}>
                      {(() => {
                        const parts = String(p.nombre || '').trim().split(/\s+/).filter(Boolean);
                        if (parts.length === 0) return '?';
                        return parts.slice(0, 2).map(n => n[0]).join('');
                      })()}
                    </div>
                    <div className="v2-pat-info">
                      <div className="v2-pat-name">
                        {p.nombre || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Sin nombre</span>}
                        {nuevo && <span className="v2-nuevo-badge" title="Ingreso reciente (&lt;24h)">NUEVO</span>}
                      </div>
                      <div className="v2-pat-meta mono">{p.edad}a · {p.sexo} · {p.medico}</div>
                    </div>
                  </div>
                </div>
                <div className="v2-c-rut mono">{p.rut}</div>
                <div className="v2-c-dx">
                  {p.diagnostico || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Sin diagnóstico</span>}
                </div>
                <div className="v2-c-est">
                  <div className={`v2-est-stack ${critico ? 'crit' : ''}`}>
                    <span className={`v2-est-val mono ${critico ? 'crit' : ''}`}>{p.estadia}</span>
                    <span className="v2-est-unit">d</span>
                  </div>
                </div>
                <div className="v2-c-los mono">
                  <div className="v2-los-stack">
                    <span className="v2-los-val">{p.losPredicho}<span className="v2-los-d-unit">d</span></span>
                    {desv !== 0 && (
                      <span className={`v2-los-delta ${desv > 0 ? 'neg' : 'pos'}`} title={desv > 0 ? 'Por encima del LOS predicho' : 'Por debajo del LOS predicho'}>
                        {desv > 0 ? '+' : ''}{desv}
                      </span>
                    )}
                  </div>
                </div>
                <div className="v2-c-tar">
                  <div className="v2-tar-frac mono">{tareasDone}<span className="v2-tar-sep">/</span>{p.tareas.length}</div>
                  <div className="v2-tar-pips" title="Progreso de tareas: verde=completo, ámbar=pendiente, rojo=crítico pendiente">
                    {p.tareas.map((t, i) => (
                      <span
                        key={i}
                        className={`v2-tar-pip ${t.estado}${t.critico && t.estado === 'pendiente' ? ' crit' : ''}${t.estado === 'pendiente' && !t.critico ? ' warn' : ''}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="v2-c-prob">
                  <div className="v2-prob-num" style={{ color: probColor }}>{p.probAlta}<span>%</span></div>
                  <div className={`v2-prob-bar v2-prob-bar--${probTier}`}>
                    <div className="v2-prob-fill" style={{ width: `${p.probAlta}%`, background: probColor }} />
                  </div>
                </div>
                {hoveredId === p.id && (
                  <div className="v2-row-preview">
                    <div className="v2-prev-head">Resumen predictivo</div>
                    <div className="v2-prev-horizons">
                      <div className="v2-prev-h-cell">
                        <span className="v2-prev-h-lbl">24h</span>
                        <span className="v2-prev-h-val mono" style={{ color: probColor }}>{p.probAlta}<span className="v2-prev-pct">%</span></span>
                      </div>
                      <div className="v2-prev-h-cell">
                        <span className="v2-prev-h-lbl">48h</span>
                        <span className="v2-prev-h-val mono">{p.probAlta48}<span className="v2-prev-pct">%</span></span>
                      </div>
                      <div className="v2-prev-h-cell">
                        <span className="v2-prev-h-lbl">72h</span>
                        <span className="v2-prev-h-val mono">{p.probAlta72}<span className="v2-prev-pct">%</span></span>
                      </div>
                    </div>
                    <div className="v2-prev-divider" />
                    <div className="v2-prev-readm-row">
                      <span className="v2-prev-readm-lbl">Reingreso 30d</span>
                      <span className={`v2-prev-readm-val mono v2-prev-readm--${readmTone}`}>{p.riskReadmision}<span className="v2-prev-pct">%</span></span>
                    </div>
                    {tareasCrit > 0 && (
                      <>
                        <div className="v2-prev-divider" />
                        <div className="v2-prev-block-head">Bloqueadores críticos</div>
                        <div className="v2-prev-blockers">
                          {p.tareas.filter(t => t.critico && t.estado === 'pendiente').slice(0, 2).map((t, i) => (
                            <div key={i} className="v2-prev-block">{t.texto}</div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {pacientes.length === 0 && (
            <div className="v2-empty-state">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ color: 'var(--text-3)', marginBottom: 10 }}>
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <div style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 4 }}>
                Sin resultados {search && <>para "<b>{search}</b>"</>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
                {hasFilters ? 'Prueba ajustando los filtros activos.' : 'No hay pacientes en este servicio.'}
              </div>
              {hasFilters && (
                <button type="button" className="v2-mini-btn primary" onClick={onClearFilters}>
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.PatientTable = PatientTable;
