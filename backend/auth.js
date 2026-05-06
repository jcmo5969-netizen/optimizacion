// Auth + role-based permissions. Persists users in localStorage.
// NOTE: passwords stored in cleartext — esta demo no tiene backend real.
//       En producción se usaría hash + servidor.

const ROLE_LABEL = {
  admin: 'Administrador',
  jefe_servicio: 'Jefe/a de Servicio',
  enfermero_continuidad: 'Enfermero/a de Continuidad',
  enfermero: 'Enfermero/a',
};

const ROLE_PERMS = {
  admin:                 { edit: true,  discharge: true,  create: true,  manageUsers: true,  manageServices: true },
  jefe_servicio:         { edit: true,  discharge: true,  create: true,  manageUsers: false, manageServices: false },
  enfermero_continuidad: { edit: true,  discharge: true,  create: true,  manageUsers: false, manageServices: false },
  enfermero:             { edit: false, discharge: false, create: false, manageUsers: false, manageServices: false },
};

const USERS_DEFAULT = [
  { id: 1, username: 'admin',       password: 'admin1234',  nombre: 'Administrador del Sistema',  role: 'admin' },
  { id: 2, username: 'creyes',      password: 'carmen1234', nombre: 'Dra. Carmen Reyes',          role: 'jefe_servicio',         servicio: 'mq1' },
  { id: 3, username: 'mlopez',      password: 'maria1234',  nombre: 'Enf. María López',           role: 'enfermero_continuidad', servicio: 'mq1' },
  { id: 4, username: 'jsoto',       password: 'juan1234',   nombre: 'Enf. Juan Soto',             role: 'enfermero',             servicio: 'mq1' },
];

const LS_USERS = 'pizarra-users-v1';
const LS_SESSION = 'pizarra-session-v1';

function loadUsers() {
  try {
    const raw = localStorage.getItem(LS_USERS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    }
  } catch { /* ignore */ }
  return USERS_DEFAULT.slice();
}

function saveUsers(users) {
  try { localStorage.setItem(LS_USERS, JSON.stringify(users)); } catch { /* ignore */ }
}

function loadSession(users) {
  try {
    const raw = localStorage.getItem(LS_SESSION);
    if (!raw) return null;
    const sess = JSON.parse(raw);
    const user = users.find(u => u.id === sess.userId);
    return user || null;
  } catch { return null; }
}

function saveSession(user) {
  try {
    if (user) localStorage.setItem(LS_SESSION, JSON.stringify({ userId: user.id }));
    else localStorage.removeItem(LS_SESSION);
  } catch { /* ignore */ }
}

function authenticate(users, username, password) {
  const u = users.find(u => u.username.toLowerCase() === String(username).trim().toLowerCase());
  if (!u) return { ok: false, error: 'Usuario no encontrado.' };
  if (u.password !== password) return { ok: false, error: 'Contraseña incorrecta.' };
  return { ok: true, user: u };
}

function permsOf(user) {
  if (!user) return ROLE_PERMS.enfermero;
  return ROLE_PERMS[user.role] || ROLE_PERMS.enfermero;
}

function initialsOf(name) {
  if (!name) return '?';
  const parts = name.replace(/^(Dra?|Enf|Tens|Klgo)\.?\s*/i, '').split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

window.AUTH = {
  ROLE_LABEL,
  ROLE_PERMS,
  USERS_DEFAULT,
  loadUsers,
  saveUsers,
  loadSession,
  saveSession,
  authenticate,
  permsOf,
  initialsOf,
};
