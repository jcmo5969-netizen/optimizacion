// Login screen — credentials are checked against AUTH.authenticate.
function LoginView({ users, onLogin }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [showHint, setShowHint] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const res = window.AUTH.authenticate(users, username, password);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onLogin(res.user);
  };

  return (
    <div className="v2-login-screen">
      <div className="v2-login-bg" />

      <div className="v2-login-card">
        <div className="v2-login-brand">
          <div className="v2-brand-mark" style={{ width: 44, height: 44, borderRadius: 11 }}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l3-9 4 18 3-9h4"/>
            </svg>
          </div>
          <div>
            <div className="v2-brand-name" style={{ fontSize: 28 }}>Altas</div>
            <div className="v2-brand-sub">Pizarra Digital · HRC</div>
          </div>
        </div>

        <h2 className="v2-login-title">Inicia sesión</h2>
        <p className="v2-login-sub">Accede con tu cuenta clínica para ver y gestionar pacientes.</p>

        <form className="v2-login-form" onSubmit={handleSubmit}>
          <div className="v2-field">
            <label>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Ej: creyes"
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="v2-field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="v2-login-err">{error}</div>}

          <button type="submit" className="v2-btn v2-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            Entrar
          </button>
        </form>

        <button type="button" className="v2-login-hint-btn" onClick={() => setShowHint(s => !s)}>
          {showHint ? 'Ocultar credenciales de demo' : '¿No tienes cuenta? Ver credenciales de demo'}
        </button>

        {showHint && (
          <div className="v2-login-hint">
            <div className="v2-login-hint-h">Cuentas de prueba</div>
            <table>
              <thead><tr><th>Usuario</th><th>Contraseña</th><th>Rol</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} onClick={() => { setUsername(u.username); setPassword(u.password); }}>
                    <td className="mono">{u.username}</td>
                    <td className="mono">{u.password}</td>
                    <td>{window.AUTH.ROLE_LABEL[u.role]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="v2-login-hint-foot">Click en una fila para autocompletar.</div>
          </div>
        )}
      </div>
    </div>
  );
}

window.LoginView = LoginView;
