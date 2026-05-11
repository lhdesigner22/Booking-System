import { createContext, useContext, useState, useEffect, useCallback } from 'react';

function parseToken(token) {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
}

function isTokenExpired(token) {
  const payload = parseToken(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]     = useState(() => localStorage.getItem('token'));
  const [usuario, setUsuario] = useState(() => {
    const t = localStorage.getItem('token');
    return t ? parseToken(t) : null;
  });
  const [carregando, setCarregando] = useState(true);

  // ✅ Declarados ANTES dos useEffects que os referenciam
  const login = useCallback((novoToken) => {
    localStorage.setItem('token', novoToken);
    setToken(novoToken);
    setUsuario(parseToken(novoToken));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t || isTokenExpired(t)) {
      localStorage.removeItem('token');
      setToken(null);
      setUsuario(null);
    } else {
      setToken(t);
      setUsuario(parseToken(t));
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!token) return;
    const intervalo = setInterval(() => {
      if (isTokenExpired(token)) logout();
    }, 60 * 1000);
    return () => clearInterval(intervalo);
  }, [token, logout]); // ✅ logout adicionado nas deps

  useEffect(() => {
    const handleLogout    = () => logout();
    const handleForbidden = () => console.warn('[Auth] Acesso negado (403).');

    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:forbidden', handleForbidden);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:forbidden', handleForbidden);
    };
  }, [logout]); // ✅ logout adicionado nas deps

  const autenticado = Boolean(token) && !isTokenExpired(token);
  const ehAdmin     = autenticado && Boolean(usuario?.admin);
  const authHeader  = token ? { Authorization: `Bearer ${token}` } : {};

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