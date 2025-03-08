import { useEffect, useState, useMemo } from 'react';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useChatbotsStore } from '../../store/chatbotsStore';
import { supabase } from '../../lib/supabase';
import type { Chatbot } from '../../types/database';
import { Switch } from '../../components/ui/Switch';

interface FormDataType extends Omit<Chatbot, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  name_chatbot: string;
  description: string;
  is_active: boolean;
}

const initialFormData: FormDataType = {
  name_chatbot: '',
  description: '',
  is_active: true
};

export default function ChatbotsPage() {
  const { chatbots, loading, error, fetchChatbots, createChatbot, updateChatbot, deleteChatbot } = useChatbotsStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await fetchChatbots();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (chatbot: Chatbot) => {
    setFormData({
      name_chatbot: chatbot.name_chatbot,
      description: chatbot.description,
      is_active: chatbot.is_active,
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
        alert('No se pudo eliminar el chatbot. Verifica los permisos.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      const chatbotData = {
        ...formData,
        user_id: user.id
      };

      if (!validateForm(chatbotData)) return;

      if (editingId) {
        await updateChatbot(editingId, chatbotData);
      } else {
        await createChatbot(chatbotData);
      }
      
      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
      fetchChatbots();
    } catch (error) {
      handleError(error);
    }
  };

  const validateForm = (data: FormDataType): boolean => {
    if (!data.name_chatbot.trim()) {
      alert('El nombre del chatbot no puede estar vacío');
      return false;
    }
    if (!data.description.trim()) {
      alert('La descripción no puede estar vacía');
      return false;
    }
    return true;
  };

  const handleError = (error: unknown) => {
    console.error('Error:', error);
    const message = error instanceof Error 
      ? error.message 
      : 'Ha ocurrido un error inesperado';
    alert(message);
  };

  const filteredChatbots = useMemo(() => 
    chatbots.filter(chatbot => 
      JSON.stringify(chatbot).toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [chatbots, searchTerm]
  );

  if (loading) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen text-white flex justify-center items-center">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
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
          <button onClick={() => { setIsModalOpen(true); setFormData(initialFormData); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
            <Plus className="mr-2" size={18} /> Nuevo Chatbot
          </button>
        </div>
      </div>

      {error && <div className="bg-red-600 text-white p-4 rounded-md mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChatbots.map((chatbot) => (
          <div key={chatbot.id} className="bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="text-lg font-semibold">{chatbot.name_chatbot}</h2>
                <p className="text-sm text-gray-400">{chatbot.description}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleEdit(chatbot)} className="text-blue-400 hover:text-blue-300">
                  <Pencil size={18} />
                </button>
                <button onClick={() => handleDelete(chatbot.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="mt-2">
              <Switch
                checked={chatbot.is_active}
                onChange={async (checked) => {
                  try {
                    await updateChatbot(chatbot.id, { is_active: checked });
                    fetchChatbots();
                  } catch (error) {
                    console.error('Error al actualizar estado:', error);
                  }
                }}
                label={chatbot.is_active ? 'Activo' : 'Inactivo'}
              />
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Chatbot' : 'Nuevo Chatbot'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.name_chatbot}
                  onChange={(e) => setFormData({...formData, name_chatbot: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>

              <div>
                <Switch
                  checked={formData.is_active}
                  onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  label={formData.is_active ? 'Activo' : 'Inactivo'}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData(initialFormData);
                    setEditingId(null);
                  }}
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