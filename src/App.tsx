import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

// Importar nuevas páginas CRUD
import ChatbotsPage from './pages/chatbots/ChatbotsPage';
import FlowsPage from './pages/flows/FlowsPage';
import WelcomesPage from './pages/welcomes/WelcomesPage';
import BehaviorPage from './pages/behaviors/BehaviorPage';
import KnowledgePage from './pages/knowledge/KnowledgePage';
import BlacklistPage from './pages/blacklist/BlacklistPage';
import DataClientsPage from './pages/data-clients/DataclientsPage';
import QRPage from './pages/qr/QRPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
        });
      }
    });

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return (
    <Router>
      <Routes>
        {/* Rutas principales */}
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        
        {/* Rutas de gestión de chatbot */}
        <Route path="/chatbots" element={<PrivateRoute><Dashboard><ChatbotsPage /></Dashboard></PrivateRoute>} />
        <Route path="/behaviors" element={<PrivateRoute><Dashboard><BehaviorPage /></Dashboard></PrivateRoute>} />
        <Route path="/knowledge" element={<PrivateRoute><Dashboard><KnowledgePage /></Dashboard></PrivateRoute>} />
        <Route path="/welcomes" element={<PrivateRoute><Dashboard><WelcomesPage /></Dashboard></PrivateRoute>} />
        <Route path="/flows" element={<PrivateRoute><Dashboard><FlowsPage /></Dashboard></PrivateRoute>} />
        <Route path="/blacklist" element={<PrivateRoute><Dashboard><BlacklistPage /></Dashboard></PrivateRoute>} />
        <Route path="/data-clients" element={<PrivateRoute><Dashboard><DataClientsPage /></Dashboard></PrivateRoute>} />
        <Route path="/qr" element={<PrivateRoute><Dashboard><QRPage /></Dashboard></PrivateRoute>} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;