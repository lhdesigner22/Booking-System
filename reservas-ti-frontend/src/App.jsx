import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Login        from './pages/login.jsx';
import Register     from './pages/register.jsx';
import Equipamentos from './pages/equipamentos.jsx';
import Reservas     from './pages/reservas.jsx';
import Admin        from './pages/admin.jsx';
import Perfil       from './pages/perfil.jsx';
import Devolucoes   from './pages/devolucoes.jsx';
import Estoque      from './pages/estoque.jsx';
import Suporte      from './pages/suporte.jsx';
import { ToastProvider }            from './context/ToastContext.jsx';
import { AuthProvider, useAuth }    from './context/AuthContext.jsx';

function RotaProtegida({ children }) {
  const { autenticado, carregando } = useAuth();
  if (carregando) return <Carregando />;
  return autenticado ? children : <Navigate to="/login" replace />;
}

function RotaAdmin({ children }) {
  const { autenticado, ehAdmin, carregando } = useAuth();
  if (carregando) return <Carregando />;
  if (!autenticado) return <Navigate to="/login" replace />;
  if (!ehAdmin)    return <Navigate to="/equipamentos" replace />;
  return children;
}

function RotaPublica({ children }) {
  const { autenticado, carregando } = useAuth();
  if (carregando) return <Carregando />;
  return autenticado ? <Navigate to="/equipamentos" replace /> : children;
}

function Carregando() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontSize: '1.1rem', color: '#6B7280',
    }}>
      Carregando...
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login"        element={<RotaPublica><Login /></RotaPublica>} />
        <Route path="/register"     element={<RotaPublica><Register /></RotaPublica>} />
        <Route path="/equipamentos" element={<RotaProtegida><Equipamentos /></RotaProtegida>} />
        <Route path="/reservas"     element={<RotaProtegida><Reservas /></RotaProtegida>} />
        <Route path="/perfil"       element={<RotaProtegida><Perfil /></RotaProtegida>} />
        <Route path="/suporte"      element={<RotaProtegida><Suporte /></RotaProtegida>} />
        <Route path="/devolucoes"   element={<RotaAdmin><Devolucoes /></RotaAdmin>} />
        <Route path="/admin"        element={<RotaAdmin><Admin /></RotaAdmin>} />
        <Route path="/estoque"      element={<RotaAdmin><Estoque /></RotaAdmin>} />
        <Route path="*"             element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AnimatedRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}