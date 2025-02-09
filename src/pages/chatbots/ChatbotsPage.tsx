import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useChatbotsStore } from '../../store/chatbotsStore';
import type { Chatbot } from '../../types/database';
import { useNavigate } from 'react-router-dom';

interface ChatbotFormData {
  nombre: string;
  estado: boolean;
}

const initialFormData: ChatbotFormData = {
  nombre: '',
  estado: true
};

export default function ChatbotsPage() {
  const navigate = useNavigate();
  const { 
    chatbots = [], 
    loading = false, 
    error = null, 
    fetchChatbots, 
    createChatbot, 
    updateChatbot, 
    deleteChatbot 
  } = useChatbotsStore();
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<ChatbotFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
      } else {
        navigate('/login');
      }
    };

    checkUser();
  }, [navigate]);

  const filteredChatbots = useMemo(() => 
    chatbots.filter(chatbot => 
      JSON.stringify(chatbot).toLowerCase().includes(searchTerm.toLowerCase())
    ), 
    [chatbots, searchTerm]
  );

  const fetchChatbotsCallback = useCallback(async () => {
    try {
      await fetchChatbots();
    } catch (err) {
      console.error('Error fetching chatbots:', err);
    }
  }, [fetchChatbots]);

  useEffect(() => {
    if (user) {
      fetchChatbotsCallback();
    }
  }, [user, fetchChatbotsCallback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Datos del formulario:', formData);
      console.log('Usuario actual:', user);
  
      if (!formData.nombre.trim()) {
        alert('El nombre es obligatorio');
        return;
      }
  
      if (!user) {
        navigate('/login');
        return;
      }
  
      const chatbotToSave = {
        ...formData,
        user_id: user.id
      };
  
      console.log('Chatbot a guardar:', chatbotToSave);
  
      try {
        if (editingId) {
          await updateChatbot(editingId, chatbotToSave);
        } else {
          await createChatbot(chatbotToSave);
        }
        
        setIsModalOpen(false);
        setFormData(initialFormData);
        setEditingId(null);
      } catch (storeError) {
        console.error('Error en la tienda:', storeError);
        alert(`Error al guardar: ${storeError instanceof Error ? storeError.message : 'Error desconocido'}`);
      }
    } catch (authError) {
      console.error('Error de autenticación:', authError);
      alert(`Error de autenticación: ${authError instanceof Error ? authError.message : 'Error desconocido'}`);
    }
  };

  const handleEdit = (chatbot: Chatbot) => {
    setFormData({
      nombre: chatbot.nombre,
      estado: chatbot.estado
    });
    setEditingId(chatbot.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este chatbot?')) {
      try {
        await deleteChatbot(id);
      } catch (error) {
        console.error('Error al eliminar chatbot:', error);
        alert('No se pudo eliminar el chatbot');
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chatbots</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-gray-800 text-white px-3 py-2 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-3 text-gray-400" size={18} />
          </div>
          <button 
            onClick={() => {
              setIsModalOpen(true);
              setEditingId(null);
              setFormData(initialFormData);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus className="mr-2" size={18} /> Nuevo Chatbot
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center">
          <Loader2 className="animate-spin text-white" size={32} />
        </div>
      )}

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {chatbots.length === 0 && !loading && (
        <div className="text-center text-gray-400 mt-10">
          No hay chatbots. Haga clic en "Nuevo Chatbot" para comenzar.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChatbots.map((chatbot) => (
          <div 
            key={chatbot.id} 
            className="bg-gray-800 rounded-lg p-4 shadow-md"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold truncate">{chatbot.nombre}</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(chatbot)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(chatbot.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span 
                className={`text-xs px-2 py-1 rounded ${
                  chatbot.estado ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                }`}
              >
                {chatbot.estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de creación/edición */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Chatbot' : 'Nuevo Chatbot'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Estado</label>
                <select
                  value={formData.estado.toString()}
                  onChange={(e) => setFormData({...formData, estado: e.target.value === 'true'})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}