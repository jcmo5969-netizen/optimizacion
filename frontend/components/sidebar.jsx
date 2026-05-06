// Sidebar — glass morphism · clinical premium
function Sidebar({ servicios, pacientes, servicioActivo, onServicio, view, onView, currentUser, perms, onLogout }) {
  const [userMenu, setUserMenu] = React.useState(false);

  const contar = (sid) => {
    const list = pacientes.filter(p => p.servicio === sid);
    const criticos = list.filter(p => p.estadia > p.losPredicho + 2).length;
    return { total: list.length, criticos };
  };

  const VIEWS = [
    { id: 'dashboard', label: 'Dashboard',      icon: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z' },
    { id: 'pizarra',   label: 'Pizarra Digital', icon: 'M3 3h18v18H3zM3 9h18M9 21V9' },
    { id: 'insights',  label: 'AI Insights',    icon: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83' },
    { id: 'analytics', label: 'Analytics ML',   icon: 'M3 3v18h18M7 14l4-4 4 4 5-5' },
  ];

  const userInitials = window.AUTH.initialsOf(currentUser?.nombre || '');
  const userRole = currentUser ? window.AUTH.ROLE_LABEL[currentUser.role] : '';

  return (
    <aside className="v2-sidebar">
      <div className="v2-brand">
        <div className="v2-brand-mark">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l3-9 4 18 3-9h4"/>
          </svg>
        </div>
        <div>
          <div className="v2-brand-name">Altas</div>
          <div className="v2-brand-sub">Pizarra Digital · HRC</div>
        </div>
      </div>

      <div className="v2-nav-section">
        <div className="v2-nav-label">Vistas</div>
        {VIEWS.map(v => (
          <button key={v.id} className={`v2-nav-item ${view === v.id ? 'active' : ''}`} onClick={() => onView(v.id)}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.icon}/>
            </svg>
            <span>{v.label}</span>
          </button>
        ))}
        {perms?.manageUsers && (
          <button className={`v2-nav-item ${view === 'admin' ? 'active' : ''}`} onClick={() => onView('admin')}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"/>
            </svg>
            <span>Administración</span>
          </button>
        )}
      </div>

      <div className="v2-nav-section">
        <div className="v2-nav-label">Servicios</div>
        {servicios.map(s => {
          const { total, criticos } = contar(s.id);
          const active = view === 'pizarra' && servicioActivo === s.id;
          return (
            <button
              key={s.id}
              type="button"
              className={`v2-svc-item ${active ? 'active' : ''}`}
              title={s.camaDesde != null ? `Camas ${s.camaDesde}–${s.camaHasta}` : undefined}
              onClick={() => { onView('pizarra'); onServicio(s.id); }}
            >
              <span className="v2-svc-tag mono">{s.abrev}</span>
              <span className="v2-svc-name">{s.nombre.replace('Medicina Quirúrgica ', 'Quirúrgica ')}</span>
              <span className="v2-svc-counts mono">
                <b>{total}</b><span className="v2-svc-sl">/</span>{s.camas}
                {criticos > 0 && <span className="v2-svc-crit">{criticos}</span>}
              </span>
            </button>
          );
        })}
        <button className={`v2-svc-item ${view === 'pizarra' && servicioActivo === 'todos' ? 'active' : ''}`} onClick={() => { onView('pizarra'); onServicio('todos'); }}>
          <span className="v2-svc-tag mono">∑</span>
          <span className="v2-svc-name">Todos los servicios</span>
          <span className="v2-svc-counts mono"><b>{pacientes.length}</b></span>
        </button>
      </div>

      <div className="v2-nav-section">
        <div className="v2-nav-label">Modelo activo</div>
        <div className="v2-model-card">
          <div className="v2-model-row">
            <span className="v2-model-key">Versión</span>
            <span className="v2-model-val mono">LOS-Predict v2.4</span>
          </div>
          <div className="v2-model-row">
            <span className="v2-model-key">AUC</span>
            <span className="v2-model-val mono">0.847</span>
          </div>
          <div className="v2-model-row">
            <span className="v2-model-key">Inferencia</span>
            <span className="v2-model-val mono"><span className="v2-live-dot" />en vivo</span>
          </div>
        </div>
      </div>

      {currentUser && (
        <div className="v2-user-wrap">
          <button
            type="button"
            className={`v2-user ${userMenu ? 'open' : ''}`}
            onClick={() => setUserMenu(m => !m)}
            aria-haspopup="menu"
            aria-expanded={userMenu}
          >
            <div className={`v2-user-avatar role-${currentUser.role}`}>{userInitials}</div>
            <div className="v2-user-info">
              <div className="v2-user-name">{currentUser.nombre}</div>
              <div className="v2-user-role">
                {userRole}
                {!perms.edit && <span className="v2-user-badge ro">solo lectura</span>}
              </div>
            </div>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-3)', transform: userMenu ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }}><path d="m6 9 6 6 6-6"/></svg>
          </button>

          {userMenu && (
            <div className="v2-user-menu">
              <div className="v2-user-menu-h">@{currentUser.username}</div>
              {perms.manageUsers && (
                <button onClick={() => { onView('admin'); setUserMenu(false); }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Administración
                </button>
              )}
              <button onClick={onLogout} className="v2-user-menu-danger">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

window.Sidebar = Sidebar;
