// Admin panel — gestión de usuarios. Solo accesible para role === 'admin'.
function AdminView({ users, currentUser, servicios, onUpdateUsers }) {
  const [editing, setEditing] = React.useState(null); // user obj or 'new'
  const [confirmDel, setConfirmDel] = React.useState(null);

  const counts = {
    admin: users.filter(u => u.role === 'admin').length,
    jefe_servicio: users.filter(u => u.role === 'jefe_servicio').length,
    enfermero_continuidad: users.filter(u => u.role === 'enfermero_continuidad').length,
    enfermero: users.filter(u => u.role === 'enfermero').length,
  };

  const startCreate = () => setEditing({
    id: null, username: '', password: '', nombre: '', role: 'enfermero', servicio: '',
  });

  const startEdit = (u) => setEditing({ ...u });

  const saveUser = (draft, errors) => {
    if (errors) return;
    if (draft.id == null) {
      const id = users.reduce((m, u) => Math.max(m, u.id), 0) + 1;
      onUpdateUsers([...users, { ...draft, id }]);
    } else {
      onUpdateUsers(users.map(u => u.id === draft.id ? { ...draft } : u));
    }
    setEditing(null);
  };

  const deleteUser = (u) => {
    if (u.id === currentUser.id) return;
    onUpdateUsers(users.filter(x => x.id !== u.id));
    setConfirmDel(null);
  };

  return (
    <div className="v2-admin">
      <div className="v2-admin-hero">
        <div>
          <div className="v2-eyebrow">Administración</div>
          <h1 className="v2-display">Gestión de usuarios</h1>
          <p className="v2-display-sub">
            Administra accesos al sistema. Los <b>jefes de servicio</b> y <b>enfermeros de continuidad</b> pueden modificar fichas;
            los <b>enfermeros</b> solo pueden visualizar.
          </p>
        </div>
        <button className="v2-tb-btn primary" onClick={startCreate} style={{ alignSelf: 'flex-end' }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Nuevo usuario
        </button>
      </div>

      <div className="v2-admin-counts">
        <div className="v2-count-card"><div className="v2-count-v">{counts.admin}</div><div className="v2-count-l">Administradores</div></div>
        <div className="v2-count-card"><div className="v2-count-v">{counts.jefe_servicio}</div><div className="v2-count-l">Jefes de servicio</div></div>
        <div className="v2-count-card"><div className="v2-count-v">{counts.enfermero_continuidad}</div><div className="v2-count-l">Enf. de continuidad</div></div>
        <div className="v2-count-card"><div className="v2-count-v">{counts.enfermero}</div><div className="v2-count-l">Enfermeros</div></div>
      </div>

      <div className="v2-admin-table">
        <div className="v2-admin-th">
          <div>Usuario</div>
          <div>Nombre</div>
          <div>Rol</div>
          <div>Servicio</div>
          <div>Permisos</div>
          <div></div>
        </div>
        {users.map(u => {
          const perms = window.AUTH.permsOf(u);
          const svc = servicios.find(s => s.id === u.servicio);
          return (
            <div key={u.id} className={`v2-admin-tr ${u.id === currentUser.id ? 'me' : ''}`}>
              <div className="mono">{u.username}{u.id === currentUser.id && <span className="v2-me-pill">tú</span>}</div>
              <div>{u.nombre}</div>
              <div><span className={`v2-role-pill role-${u.role}`}>{window.AUTH.ROLE_LABEL[u.role]}</span></div>
              <div>{svc ? svc.abrev : <span style={{ color: 'var(--text-3)' }}>—</span>}</div>
              <div>
                <span className={`v2-perm-pip ${perms.edit ? 'on' : ''}`} title="Editar fichas">✎</span>
                <span className={`v2-perm-pip ${perms.discharge ? 'on' : ''}`} title="Confirmar alta">✓</span>
                <span className={`v2-perm-pip ${perms.create ? 'on' : ''}`} title="Crear pacientes">+</span>
                <span className={`v2-perm-pip ${perms.manageUsers ? 'on' : ''}`} title="Gestionar usuarios">⚙</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button className="v2-mini-btn" onClick={() => startEdit(u)}>Editar</button>
                <button
                  className="v2-mini-btn"
                  style={{ marginLeft: 6, color: u.id === currentUser.id ? 'var(--text-3)' : 'var(--rose)' }}
                  onClick={() => setConfirmDel(u)}
                  disabled={u.id === currentUser.id}
                  title={u.id === currentUser.id ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <UserEditModal
          user={editing}
          users={users}
          servicios={servicios}
          onSave={saveUser}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmDel && (
        <div className="v2-modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="v2-confirm-card" onClick={e => e.stopPropagation()}>
            <h3>¿Eliminar usuario?</h3>
            <p>
              Se eliminará la cuenta de <b>{confirmDel.nombre}</b> ({confirmDel.username}).
              Ya no podrá iniciar sesión.
            </p>
            <div className="v2-confirm-actions">
              <button className="v2-btn v2-btn-secondary" onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className="v2-btn v2-btn-primary" style={{ background: 'var(--rose)', boxShadow: '0 4px 12px -3px rgba(185,28,28,0.4)' }} onClick={() => deleteUser(confirmDel)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserEditModal({ user, users, servicios, onSave, onClose }) {
  const [draft, setDraft] = React.useState(user);
  const [showPwd, setShowPwd] = React.useState(false);
  const isNew = draft.id == null;

  const errs = {};
  if (!draft.username.trim()) errs.username = 'Usuario requerido';
  else if (!/^[a-z0-9_.]+$/i.test(draft.username.trim())) errs.username = 'Solo letras, números, . y _';
  else if (users.some(u => u.id !== draft.id && u.username.toLowerCase() === draft.username.trim().toLowerCase())) {
    errs.username = 'Ya existe un usuario con ese nombre';
  }
  if (!draft.nombre.trim()) errs.nombre = 'Nombre requerido';
  if (!draft.password || draft.password.length < 4) errs.password = 'Mínimo 4 caracteres';
  const hasErrors = Object.keys(errs).length > 0;

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  return (
    <div className="v2-modal-overlay" onClick={onClose}>
      <div className="v2-modal v2-form-modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div className="v2-modal-header">
          <div>
            <h2 className="v2-modal-name">{isNew ? 'Nuevo usuario' : 'Editar usuario'}</h2>
            <div className="v2-modal-meta">{isNew ? 'Crea una cuenta nueva' : `Modificando @${user.username}`}</div>
          </div>
          <button className="v2-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="v2-modal-body">
          <div className="v2-form-grid">
            <div className="v2-field">
              <label>Usuario <span className="v2-req">*</span></label>
              <input type="text" value={draft.username} onChange={e => set('username', e.target.value)} className={errs.username ? 'err' : ''} />
              {errs.username && <div className="v2-field-err">{errs.username}</div>}
            </div>
            <div className="v2-field">
              <label>Contraseña <span className="v2-req">*</span></label>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} value={draft.password} onChange={e => set('password', e.target.value)} className={errs.password ? 'err' : ''} style={{ paddingRight: 60 }} />
                <button type="button" className="v2-mini-btn" onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 6, top: 6 }}>
                  {showPwd ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {errs.password && <div className="v2-field-err">{errs.password}</div>}
            </div>
            <div className="v2-field v2-field-full">
              <label>Nombre completo <span className="v2-req">*</span></label>
              <input type="text" value={draft.nombre} onChange={e => set('nombre', e.target.value)} className={errs.nombre ? 'err' : ''} placeholder="Ej: Dra. Carmen Reyes" />
              {errs.nombre && <div className="v2-field-err">{errs.nombre}</div>}
            </div>
            <div className="v2-field v2-field-full">
              <label>Rol</label>
              <div className="v2-role-grid">
                {Object.keys(window.AUTH.ROLE_LABEL).map(r => {
                  const perms = window.AUTH.ROLE_PERMS[r];
                  return (
                    <label key={r} className={`v2-role-card ${draft.role === r ? 'active' : ''}`}>
                      <input type="radio" name="role" checked={draft.role === r} onChange={() => set('role', r)} />
                      <div className="v2-role-name">{window.AUTH.ROLE_LABEL[r]}</div>
                      <div className="v2-role-perms">
                        {perms.edit ? '✓ editar fichas' : '· solo lectura'}
                        {perms.manageUsers && <><br/>✓ gestiona usuarios</>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="v2-field v2-field-full">
              <label>Servicio asignado</label>
              <select value={draft.servicio || ''} onChange={e => set('servicio', e.target.value)}>
                <option value="">Sin asignar (todos los servicios)</option>
                {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="v2-modal-footer">
          <button className="v2-btn v2-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="v2-btn v2-btn-primary" disabled={hasErrors} onClick={() => onSave(draft, hasErrors ? errs : null)}>
            {isNew ? 'Crear usuario' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

window.AdminView = AdminView;
