// Sidebar component for Altas hospital platform
const { useState } = React;

function Sidebar({ servicios, pacientes, servicioActivo, onServicio, criticalMode, onCritical, sidebarStyle, palette, paletteTokens }) {
  const collapsed = sidebarStyle === 'collapsed';

  const contarServicio = (sid) => {
    const list = pacientes.filter(p => p.servicio === sid);
    const criticos = list.filter(p => p.estadia > 10).length;
    return { total: list.length, criticos };
  };

  const totalCriticos = pacientes.filter(p => p.estadia > 10).length;
  const totalAlta48h = pacientes.filter(p => p.probAlta >= 70).length;

  return (
    <aside className={`altas-sidebar ${collapsed ? 'collapsed' : ''}`} style={{ background: paletteTokens.sidebarBg, color: paletteTokens.sidebarFg, borderRight: `1px solid ${paletteTokens.border}` }}>
      <div className="brand">
        <div className="brand-mark" style={{ background: paletteTokens.accent }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l3-9 4 18 3-9h4"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="brand-text">
            <div className="brand-name">Altas</div>
            <div className="brand-sub">Pizarra Digital · HRC</div>
          </div>
        )}
      </div>

      <div className="nav-section">
        {!collapsed && <div className="nav-label">Servicios</div>}
        {servicios.map(s => {
          const { total, criticos } = contarServicio(s.id);
          const active = servicioActivo === s.id;
          return (
            <button key={s.id} className={`nav-item ${active ? 'active' : ''}`} onClick={() => onServicio(s.id)}
              style={active ? { background: paletteTokens.navActiveBg, color: paletteTokens.navActiveFg } : {}}>
              <div className="nav-icon" style={{ background: active ? paletteTokens.accent : paletteTokens.navIconBg, color: active ? 'white' : paletteTokens.sidebarFg }}>
                <span className="mono" style={{ fontSize: 10, fontWeight: 600 }}>{s.abrev.split('-')[1]}</span>
              </div>
              {!collapsed && (
                <>
                  <div className="nav-text">
                    <div className="nav-title">{s.nombre}</div>
                    <div className="nav-meta">{total}/{s.camas} camas</div>
                  </div>
                  <div className="nav-badges">
                    {criticos > 0 && <span className="badge badge-critical mono">{criticos}</span>}
                  </div>
                </>
              )}
              {collapsed && criticos > 0 && <span className="badge-dot" />}
            </button>
          );
        })}

        <button className={`nav-item ${servicioActivo === 'todos' ? 'active' : ''}`} onClick={() => onServicio('todos')}
          style={servicioActivo === 'todos' ? { background: paletteTokens.navActiveBg, color: paletteTokens.navActiveFg } : {}}>
          <div className="nav-icon" style={{ background: servicioActivo === 'todos' ? paletteTokens.accent : paletteTokens.navIconBg, color: servicioActivo === 'todos' ? 'white' : paletteTokens.sidebarFg }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </div>
          {!collapsed && <div className="nav-text"><div className="nav-title">Todos los servicios</div><div className="nav-meta">{pacientes.length} pacientes</div></div>}
        </button>
      </div>

      {!collapsed && (
        <div className="nav-section">
          <div className="nav-label">Inteligencia</div>
          <div className="kpi-card" style={{ background: paletteTokens.kpiBg, border: `1px solid ${paletteTokens.border}` }}>
            <div className="kpi-row">
              <span className="kpi-dot" style={{ background: '#ef4444' }} />
              <span className="kpi-text">Estadía &gt; 10 días</span>
              <span className="kpi-val mono">{totalCriticos}</span>
            </div>
            <div className="kpi-row">
              <span className="kpi-dot" style={{ background: '#10b981' }} />
              <span className="kpi-text">Alta probable 48h</span>
              <span className="kpi-val mono">{totalAlta48h}</span>
            </div>
            <div className="kpi-row">
              <span className="kpi-dot" style={{ background: paletteTokens.accent }} />
              <span className="kpi-text">Modelo LOS activo</span>
              <span className="kpi-val mono" style={{ fontSize: 10 }}>v2.4</span>
            </div>
          </div>
        </div>
      )}

      <div className="nav-section nav-bottom">
        <button className={`critical-toggle ${criticalMode ? 'on' : ''}`} onClick={onCritical}>
          <div className="crit-icon">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          {!collapsed && (
            <>
              <div className="crit-text">
                <div className="crit-title">Modo Crítico</div>
                <div className="crit-sub">{criticalMode ? 'Activado · triage' : 'Desactivado'}</div>
              </div>
              <div className={`crit-switch ${criticalMode ? 'on' : ''}`}>
                <div className="crit-switch-thumb" />
              </div>
            </>
          )}
        </button>

        {!collapsed && (
          <div className="user-card" style={{ borderTop: `1px solid ${paletteTokens.border}` }}>
            <div className="user-avatar">CR</div>
            <div className="user-info">
              <div className="user-name">Dra. Carmen Reyes</div>
              <div className="user-role">Jefa de Servicio</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
