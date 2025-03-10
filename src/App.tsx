import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import Dashboard from './pages/Dashboard';
import ContactsPage from './pages/contacts/ContactsPage';
import ClientsPage from './pages/clients/ClientsPage';
import Login from './pages/Login';
import Register from './pages/Register';
import BehaviorPage from './pages/behaviors/BehaviorPage';

// Importar nuevas páginas CRUD
import AiConfigPage from './pages/ai-config/AiConfigPage';
import BusinessDocumentsPage from './pages/business-documents/BusinessDocumentsPage';
import ChatbotsPage from './pages/chatbots/ChatbotsPage';
import ConversationContextPage from './pages/conversation-context/ConversationContextPage';
import CustomerInsightsPage from './pages/customer-insights/CustomerInsightsPage';
import FlowsPage from './pages/flows/FlowsPage';
import LeadsPage from './pages/leads/LeadsPage';
import ProductsServicesPage from './pages/products-services/ProductsServicesPage';
import WelcomesPage from './pages/welcomes/WelcomesPage';
import WelcomeTrackingPage from './pages/welcome-tracking/WelcomeTrackingPage';
import KnowledgePage from './pages/knowledge/KnowledgePage';
import BlacklistPage from './pages/blacklist/BlacklistPage';

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
        <Route 
          path="/behaviors" 
          element={
            <PrivateRoute>
              <Dashboard>
                <BehaviorPage />
              </Dashboard>
            </PrivateRoute>
          } 
        />
        <Route path="/knowledge" element={<PrivateRoute><Dashboard><KnowledgePage /></Dashboard></PrivateRoute>} />
        <Route path="/welcomes" element={<PrivateRoute><Dashboard><WelcomesPage /></Dashboard></PrivateRoute>} />
        <Route path="/flows" element={<PrivateRoute><Dashboard><FlowsPage /></Dashboard></PrivateRoute>} />
        
        <Route
          path="/contacts"
          element={
            <PrivateRoute>
              <Dashboard>
                <ContactsPage />
              </Dashboard>
            </PrivateRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <PrivateRoute>
              <Dashboard>
                <ClientsPage />
              </Dashboard>
            </PrivateRoute>
          }
        />

        {/* Nuevas rutas CRUD */}
        <Route
          path="/ai-config"
          element={
            <PrivateRoute>
              <Dashboard>
                <AiConfigPage />
              </Dashboard>
            </PrivateRoute>
          }
        />
        <Route
          path="/business-documents"
          element={
            <PrivateRoute>
              <Dashboard>
                <BusinessDocumentsPage />
              </Dashboard>
            </PrivateRoute>
          }
        />
        <Route
          path="/conversation-context"
          element={
            <PrivateRoute>
              <Dashboard>
                <ConversationContextPage />
              </Dashboard>
            </PrivateRoute>
          }
        />
        <Route
          path="/customer-insights"
          element={
            <PrivateRoute>
              <Dashboard>
                <CustomerInsightsPage />
              </Dashboard>
            </PrivateRoute>
          }
        />
        <Route
          path="/leads"
          element={
            <PrivateRoute>
              <Dashboard>
                <LeadsPage />
              </Dashboard>
            </PrivateRoute>
          }
        />
        <Route
          path="/products-services"
          element={
            <PrivateRoute>
              <Dashboard>
                <ProductsServicesPage />
              </Dashboard>
            </PrivateRoute>
          }
        />
        <Route
          path="/welcome-tracking"
          element={
            <PrivateRoute>
              <Dashboard>
                <WelcomeTrackingPage />
              </Dashboard>
            </PrivateRoute>
          }
        />
        <Route
          path="/blacklist"
          element={
            <PrivateRoute>
              <Dashboard>
                <BlacklistPage />
              </Dashboard>
            </PrivateRoute>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;