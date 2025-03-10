import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,    // Nuevo
  FileText,  // Nuevo
  MessageCircle,  // Nuevo
  Workflow,  // Nuevo
  Briefcase,  // Nuevo
  Bot,  // Nuevo
  Brain,  // Nuevo
  Ban,  // Nuevo
  QrCode,  // Nuevo
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import tecnochatLogo from '../assets/tecnochat.svg';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const { signOut } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const menuItems = [
    { icon: LayoutDashboard, text: 'Dashboard', path: '/' },
    { icon: Users, text: 'Contactos', path: '/contacts' },
    { icon: UserSquare2, text: 'Clientes', path: '/clients' },
    
    // Gestión de Chatbots
    { icon: Bot, text: 'Chatbots', path: '/chatbots' },
    { icon: Brain, text: 'Comportamientos IA', path: '/behaviors' },
    { icon: FileText, text: 'Base de Conocimiento', path: '/knowledge' }, // Nueva ruta
    { icon: MessageCircle, text: 'Mensajes Bienvenida', path: '/welcomes' },
    { icon: Workflow, text: 'Flujos', path: '/flows' },

    // Otras rutas CRUD
    { icon: FileText, text: 'Documentos', path: '/business-documents' },
    { icon: Workflow, text: 'Contexto Conversación', path: '/conversation-context' },
    { icon: Users, text: 'Insights de Clientes', path: '/customer-insights' },
    { icon: Briefcase, text: 'Leads', path: '/leads' },
    { icon: Settings, text: 'Productos y Servicios', path: '/products-services' },
    { icon: Ban, text: 'Lista Negra', path: '/blacklist' }, // Nueva ruta
    { icon: UserSquare2, text: 'Datos de Clientes', path: '/data-clients' }, // Agregar esta línea
    { icon: QrCode, text: 'Código QR', path: '/qr' }, // Nueva ruta
    
    // Configuración
    { icon: Settings, text: 'Configuración', path: '/settings' },
    { icon: HelpCircle, text: 'Ayuda', path: '/help' },
  ];

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Overlay para móviles */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Botón de menú móvil */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-30 lg:hidden text-white hover:text-emerald-500 transition-colors"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 bg-gray-900 text-white transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-16' : 'w-64'}`}
      >
        <div className="flex flex-col h-full p-4 relative">
          {/* Logo y título */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} mb-8`}>
            <img 
              src={tecnochatLogo} 
              alt="TecnoChat Logo" 
              className="h-8 w-8 text-emerald-500 flex-shrink-0" 
            />
            {!isCollapsed && <span className="text-xl font-bold">TecnoChat</span>}
          </div>

          {/* Botón para colapsar en desktop */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex items-center justify-center absolute -right-3 top-8 w-6 h-6 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors shadow-lg z-50"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Navegación */}
          <nav className="space-y-2 flex-grow">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center px-2' : 'space-x-2 px-4'
                  } py-2 rounded-lg transition-colors relative group ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.text}</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      {item.text}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Botón de cerrar sesión */}
          <div className="mt-auto pt-2">
            <button
              onClick={() => signOut()}
              className={`flex items-center ${
                isCollapsed ? 'justify-center px-2' : 'space-x-2 px-4'
              } py-2 w-full text-gray-300 hover:bg-gray-800 rounded-lg transition-colors relative group`}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>Cerrar sesión</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  Cerrar sesión
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}