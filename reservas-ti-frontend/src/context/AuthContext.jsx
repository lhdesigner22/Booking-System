import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

function parseToken(token) {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
}

function isTokenExpired(token) {
  const payload = parseToken(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

async function fetchAdminStatus(token) {
  try {
    const res = await fetch(`${API_BASE}/usuarios/perfil`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Boolean(data.admin);
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]         = useState(() => localStorage.getItem('token'));
  const [usuario, setUsuario]     = useState(() => {
    const t = localStorage.getItem('token');
    return t ? parseToken(t) : null;
  });
  // adminReal: valor vindo do servidor (null = ainda não consultado)
  const [adminReal, setAdminReal] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const login = useCallback(async (novoToken) => {
    localStorage.setItem('token', novoToken);
    setToken(novoToken);
    const payload = parseToken(novoToken);
    setUsuario(payload);
    // Busca o status admin atualizado do servidor após o login
    const adminServidor = await fetchAdminStatus(novoToken);
    setAdminReal(adminServidor !== null ? adminServidor : Boolean(payload?.admin));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
    setAdminReal(null);
  }, []);

  // ── Validação inicial + consulta ao servidor ────────────────────────────────
  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t || isTokenExpired(t)) {
      localStorage.removeItem('token');
      setToken(null);
      setUsuario(null);
      setAdminReal(null);
      setCarregando(false);
      return;
    }

    setToken(t);
    setUsuario(parseToken(t));

    // Busca o status admin real no servidor — garante que mudanças pós-login
    // (ex: promoção a admin) sejam refletidas sem precisar fazer logout
    fetchAdminStatus(t).then(adminServidor => {
      setAdminReal(adminServidor);
      setCarregando(false);
    });
  }, []);

  // ── Revalida token a cada minuto ────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const intervalo = setInterval(() => {
      if (isTokenExpired(token)) logout();
    }, 60 * 1000);
    return () => clearInterval(intervalo);
  }, [token, logout]);

  // ── Eventos globais de auth ─────────────────────────────────────────────────
  useEffect(() => {
    const handleLogout    = () => logout();
    const handleForbidden = () => console.warn('[Auth] Acesso negado (403).');
    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:forbidden', handleForbidden);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:forbidden', handleForbidden);
    };
  }, [logout]);

  const autenticado = Boolean(token) && !isTokenExpired(token);

  // Usa o valor do servidor quando disponível; enquanto carrega, usa o JWT
  const ehAdmin = autenticado && (
    adminReal !== null ? adminReal : Boolean(usuario?.admin)
  );

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <AuthContext.Provider value={{
      token, usuario, autenticado, ehAdmin,
      carregando, authHeader, login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
