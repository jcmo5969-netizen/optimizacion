const { useState, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showAnimations": true
}/*EDITMODE-END*/;

function enrichOne(p) {
  const examPend = (p.examenes || []).filter(e => e.estado === 'pendiente').length;
  const tareasPend = (p.tareas || []).filter(t => t.estado === 'pendiente').length;
  return {
    ...p,
    shap: window.makeShap(p.probAlta, p.estadia, p.losPredicho, p.vitales, tareasPend, examPend),
    losTrend: window.makeLos(p.estadia, p.losPredicho),
    vitalsTrend: window.makeVitalsTrend(p.vitales),
  };
}

const LS_PACIENTES = 'pizarra-pacientes-v2';

function stripDerivedForStorage(p) {
  const { shap, losTrend, vitalsTrend, ...rest } = p;
  return rest;
}

function loadPacientesFromStorage() {
  try {
    const raw = localStorage.getItem(LS_PACIENTES);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr.map(p => enrichOne(p));
  } catch {
    return null;
  }
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState('pizarra');
  const [servicio, setServicio] = useState('mq1');
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [live, setLive] = useState(true);
  const [toast, setToast] = useState(null);
  const [showNuevo, setShowNuevo] = useState(false);

  const [users, setUsers] = useState(() => window.AUTH.loadUsers());
  const [currentUser, setCurrentUser] = useState(() => window.AUTH.loadSession(window.AUTH.loadUsers()));
  const perms = window.AUTH.permsOf(currentUser);

  React.useEffect(() => { window.AUTH.saveUsers(users); }, [users]);
  React.useEffect(() => { window.AUTH.saveSession(currentUser); }, [currentUser]);

  const [pacientes, setPacientes] = useState(() => {
    const fromLs = loadPacientesFromStorage();
    if (fromLs) return fromLs;
    return window.PACIENTES_V2.map(p => enrichOne({ ...p }));
  });

  React.useEffect(() => {
    try {
      localStorage.removeItem('pizarra-pacientes-v1');
    } catch { /* ignore */ }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_PACIENTES, JSON.stringify(pacientes.map(stripDerivedForStorage)));
    } catch (e) { /* quota o modo privado */ }
  }, [pacientes]);

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2800);
  };

  const updatePatient = (id, updater) => {
    setPacientes(prev => prev.map(p => p.id === id ? enrichOne(updater(p)) : p));
  };

  const removePatient = (id) => {
    setPacientes(prev => prev.filter(p => p.id !== id));
  };

  const addPatient = (raw) => {
    let created;
    setPacientes(prev => {
      const id = (prev.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
      created = enrichOne({ id, ...raw });
      return [created, ...prev];
    });
    return created;
  };

  const selected = selectedId != null ? pacientes.find(p => p.id === selectedId) : null;

  const [tableFilter, setTableFilter] = useState('all');
  const [tableSort, setTableSort] = useState({ key: 'desviacion', dir: 'desc' });
  const [tableDensity, setTableDensity] = useState('comfy');

  const pacientesFiltrados = useMemo(
    () => filtrarPacientes(pacientes, { servicio, search }),
    [pacientes, servicio, search]
  );

  const stats = useMemo(() => statsPacientes(pacientesFiltrados), [pacientesFiltrados]);

  const pacientesVisibles = useMemo(() => {
    let list = pacientesFiltrados;
    switch (tableFilter) {
      case 'criticos':     list = list.filter(p => p.estadia > p.losPredicho + 2); break;
      case 'alta48':       list = list.filter(p => p.probAlta48 >= 70); break;
      case 'bloqueadores': list = list.filter(p => p.tareas.some(t => t.critico && t.estado === 'pendiente')); break;
      case 'mios':
        if (currentUser?.servicio) list = list.filter(p => p.servicio === currentUser.servicio);
        break;
      default: break;
    }
    const sorted = [...list];
    const dir = tableSort.dir === 'asc' ? 1 : -1;
    const cmp = (a, b) => {
      switch (tableSort.key) {
        case 'cama':        return String(a.cama).localeCompare(String(b.cama), 'es', { numeric: true }) * dir;
        case 'paciente':    return String(a.nombre).localeCompare(String(b.nombre), 'es') * dir;
        case 'estadia':     return (a.estadia - b.estadia) * dir;
        case 'losPredicho': return (a.losPredicho - b.losPredicho) * dir;
        case 'tareas':      return (a.tareas.filter(t => t.estado === 'pendiente').length - b.tareas.filter(t => t.estado === 'pendiente').length) * dir;
        case 'probAlta':    return (a.probAlta - b.probAlta) * dir;
        case 'desviacion':
        default:            return ((a.estadia - a.losPredicho) - (b.estadia - b.losPredicho)) * dir;
      }
    };
    sorted.sort(cmp);
    return sorted;
  }, [pacientesFiltrados, tableFilter, tableSort, currentUser]);

  const filterCounts = useMemo(() => ({
    all: pacientesFiltrados.length,
    criticos: pacientesFiltrados.filter(p => p.estadia > p.losPredicho + 2).length,
    alta48: pacientesFiltrados.filter(p => p.probAlta48 >= 70).length,
    bloqueadores: pacientesFiltrados.filter(p => p.tareas.some(t => t.critico && t.estado === 'pendiente')).length,
    mios: currentUser?.servicio ? pacientesFiltrados.filter(p => p.servicio === currentUser.servicio).length : 0,
  }), [pacientesFiltrados, currentUser]);

  const hasActiveFilters = tableFilter !== 'all' || !!search;
  const clearTableFilters = () => { setTableFilter('all'); setSearch(''); };

  const servicioActual = window.SERVICIOS_V2.find(s => s.id === servicio);
  const titulo =
    view === 'dashboard' ? 'Dashboard' :
    view === 'insights' ? 'AI Insights' :
    view === 'analytics' ? 'Analytics ML' :
    view === 'admin' ? 'Administración' :
    (servicio === 'todos' ? 'Todos los servicios' : servicioActual?.nombre);
  const fecha = new Date(2026, 3, 27).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (!currentUser) {
    return <LoginView users={users} onLogin={(u) => { setCurrentUser(u); setView('pizarra'); }} />;
  }

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedId(null);
    setShowNuevo(false);
    setView('pizarra');
  };

  return (
    <>
      <div className="v2-app">
        <Sidebar
          servicios={window.SERVICIOS_V2}
          pacientes={pacientes}
          servicioActivo={servicio}
          onServicio={setServicio}
          view={view}
          onView={setView}
          currentUser={currentUser}
          perms={perms}
          onLogout={handleLogout}
        />

        <div className="v2-main">
          <div className="v2-topbar">
            <div>
              <div className="v2-topbar-title">{titulo}</div>
              <div className="v2-topbar-sub">
                {view === 'dashboard' && `Resumen ejecutivo · ${pacientes.length} pacientes activos · ${fecha}`}
                {view === 'pizarra' && servicioActual && `${pacientesFiltrados.length}/${servicioActual.camas} camas · ${stats.desviados} en desviación de LOS · ${fecha}`}
                {view === 'pizarra' && !servicioActual && `${pacientesFiltrados.length} pacientes activos · ${fecha}`}
                {view === 'insights' && `Recomendaciones del modelo · ${fecha}`}
                {view === 'analytics' && `LOS-Predict v2.4 · ventana últimos 30 días`}
                {view === 'admin' && `Gestión de usuarios y permisos · ${users.length} cuentas activas`}
              </div>
            </div>
            <div className="v2-topbar-right">
              {view === 'pizarra' && (
                <div className="v2-search">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)' }}>
                    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
                  </svg>
                  <input placeholder="Buscar paciente, RUT, cama, diagnóstico…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              )}
              <button
                className={`v2-tb-btn ${live ? 'live-on' : 'live-off'}`}
                onClick={() => { setLive(l => !l); showToast(live ? 'Streaming pausado · datos congelados' : 'Streaming reanudado · actualización cada 30s'); }}
                title={live ? 'Pausar actualización en tiempo real' : 'Reanudar actualización en tiempo real'}
              >
                <span className={`v2-live-pill ${live ? '' : 'paused'}`} /> {live ? 'En vivo' : 'Pausado'}
              </button>
              {perms.create && view !== 'admin' && (
                <button className="v2-tb-btn primary" onClick={() => setShowNuevo(true)}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                  Nuevo ingreso
                </button>
              )}
            </div>
          </div>

          {view === 'dashboard' && (
            <div className="v2-body" style={{ padding: 0 }}>
              <DashboardView
                servicios={window.SERVICIOS_V2}
                pacientes={pacientes}
                recomendaciones={window.AI_RECOMENDACIONES}
                analytics={window.ANALYTICS}
                onSelectPatient={(p) => setSelectedId(p.id)}
                onOpenServicio={(id) => { setServicio(id); setView('pizarra'); }}
                onOpenView={setView}
              />
            </div>
          )}

          {view === 'pizarra' && (
            <>
              <div className="v2-stats">
                <button type="button" className="v2-stat" onClick={() => setTableFilter('all')}>
                  <div className="v2-stat-l">Ocupación</div>
                  <div className="v2-stat-v">{stats.ocupacion}<span>/{servicioActual?.camas || 66}</span></div>
                  <div className="v2-stat-d">camas activas</div>
                </button>
                <button
                  type="button"
                  className={`v2-stat ${tableFilter === 'criticos' ? 'active' : ''}`}
                  onClick={() => setTableFilter(f => f === 'criticos' ? 'all' : 'criticos')}
                  title="Click para filtrar críticos (estadía >2d sobre LOS)"
                >
                  <div className="v2-stat-l">Desviación LOS</div>
                  <div className="v2-stat-v">{stats.desviados}</div>
                  <div className="v2-stat-d down">+2d sobre predicción</div>
                </button>
                <button
                  type="button"
                  className={`v2-stat ${tableFilter === 'alta48' ? 'active' : ''}`}
                  onClick={() => setTableFilter(f => f === 'alta48' ? 'all' : 'alta48')}
                  title="Click para filtrar pacientes con alta probable a 48h"
                >
                  <div className="v2-stat-l">Alta probable 48h</div>
                  <div className="v2-stat-v">{stats.altaProb}</div>
                  <div className="v2-stat-d up">↑ score &gt; 70%</div>
                </button>
                <button
                  type="button"
                  className={`v2-stat ${tableFilter === 'bloqueadores' ? 'active' : ''}`}
                  onClick={() => setTableFilter(f => f === 'bloqueadores' ? 'all' : 'bloqueadores')}
                  title="Click para ver pacientes con tareas críticas pendientes"
                >
                  <div className="v2-stat-l">Pendientes alta</div>
                  <div className="v2-stat-v">{stats.tareasPend}</div>
                  <div className="v2-stat-d">tareas activas</div>
                </button>
                <div className="v2-stat">
                  <div className="v2-stat-l">LOS promedio</div>
                  <div className="v2-stat-v">{stats.losActual}<span>d</span></div>
                  <div className="v2-stat-d down">+1.3 vs target</div>
                </div>
              </div>

              <div className="v2-table-toolbar">
                <div className="v2-chips">
                  {[
                    { id: 'all', label: 'Todos', count: filterCounts.all },
                    { id: 'criticos', label: 'Críticos +2d', count: filterCounts.criticos, tone: 'rose' },
                    { id: 'alta48', label: 'Alta probable 48h', count: filterCounts.alta48, tone: 'emerald' },
                    { id: 'bloqueadores', label: 'Con bloqueadores', count: filterCounts.bloqueadores, tone: 'amber' },
                    ...(currentUser?.servicio ? [{ id: 'mios', label: 'Mi servicio', count: filterCounts.mios, tone: 'indigo' }] : []),
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className={`v2-chip ${tableFilter === c.id ? `active tone-${c.tone || 'indigo'}` : ''}`}
                      onClick={() => setTableFilter(c.id)}
                      disabled={c.count === 0 && c.id !== 'all'}
                    >
                      {c.label}
                      <span className="v2-chip-count">{c.count}</span>
                    </button>
                  ))}
                </div>

                <div className="v2-toolbar-right">
                  {(tableFilter !== 'all' || search) && (
                    <button type="button" className="v2-mini-btn" onClick={clearTableFilters}>
                      Limpiar filtros
                    </button>
                  )}
                  <div className="v2-density-toggle" role="group" aria-label="Densidad de tabla">
                    <button
                      type="button"
                      className={tableDensity === 'comfy' ? 'active' : ''}
                      onClick={() => setTableDensity('comfy')}
                      title="Vista cómoda"
                    >
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
                    </button>
                    <button
                      type="button"
                      className={tableDensity === 'compact' ? 'active' : ''}
                      onClick={() => setTableDensity('compact')}
                      title="Vista compacta"
                    >
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5h18M3 9h18M3 13h18M3 17h18M3 21h18"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="v2-body">
                <PatientTable
                  pacientes={pacientesVisibles}
                  onSelect={(p) => setSelectedId(p.id)}
                  search={search}
                  sort={tableSort}
                  onSortChange={setTableSort}
                  density={tableDensity}
                  hasFilters={hasActiveFilters}
                  onClearFilters={clearTableFilters}
                />
              </div>
            </>
          )}

          {view === 'insights' && (
            <div className="v2-body" style={{ padding: 0 }}>
              <AiInsightsView
                recomendaciones={window.AI_RECOMENDACIONES}
                pacientes={pacientes}
                onSelectPatient={(p) => setSelectedId(p.id)}
              />
            </div>
          )}

          {view === 'analytics' && (
            <div className="v2-body" style={{ padding: 0 }}>
              <AnalyticsView analytics={window.ANALYTICS} pacientes={pacientes} />
            </div>
          )}

          {view === 'admin' && perms.manageUsers && (
            <div className="v2-body" style={{ padding: 0 }}>
              <AdminView
                users={users}
                currentUser={currentUser}
                servicios={window.SERVICIOS_V2}
                onUpdateUsers={(next) => {
                  setUsers(next);
                  showToast('Usuarios actualizados.');
                }}
              />
            </div>
          )}

          {view === 'admin' && !perms.manageUsers && (
            <div className="v2-empty-state" style={{ marginTop: 60 }}>
              <h2 className="serif" style={{ fontSize: 32, color: 'var(--text-2)', margin: 0 }}>Sin acceso</h2>
              <p>Solo los administradores pueden ver esta sección.</p>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <PatientModal
          key={selected.id}
          patient={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={(updater) => updatePatient(selected.id, updater)}
          onDischarge={() => { removePatient(selected.id); setSelectedId(null); showToast(`Alta confirmada · cama ${selected.cama} liberada.`); }}
          servicios={window.SERVICIOS_V2}
          perms={perms}
          currentUser={currentUser}
        />
      )}

      {showNuevo && perms.create && (
        <NuevoIngresoForm
          servicios={window.SERVICIOS_V2}
          pacientesExistentes={pacientes}
          onClose={() => setShowNuevo(false)}
          onCreate={(raw) => {
            const created = addPatient(raw);
            setShowNuevo(false);
            showToast(`Paciente ingresado · cama ${created.cama}`);
            setSelectedId(created.id);
          }}
        />
      )}

      {toast && <div className="v2-app-toast">{toast}</div>}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Demo">
          <TweakButton label="Abrir paciente con IA tab" onClick={() => setSelectedId(pacientes[0]?.id)} />
          <TweakButton label="Ver Dashboard" onClick={() => setView('dashboard')} />
          <TweakButton label="Ver AI Insights" onClick={() => setView('insights')} />
          <TweakButton label="Ver Analytics ML" onClick={() => setView('analytics')} />
          <TweakButton label="Nuevo ingreso" onClick={() => setShowNuevo(true)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
