import { useEffect, useState, useMemo } from 'react';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useWelcomesStore } from '../../store/welcomesStore';
import { supabase } from '../../lib/supabase';
import type { Welcome } from '../../types/database';
import { Switch } from '../../components/ui/Switch';

interface FormDataType extends Omit<Welcome, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  welcome_message: string;
  media_url: string;
  is_active: boolean;
  chatbot_id: string;
}

interface ChatbotOption {
  id: string;
  name_chatbot: string;
  is_active: boolean;
}

const initialFormData: FormDataType = {
  welcome_message: '',
  media_url: '',
  is_active: true,
  chatbot_id: ''
};

export default function WelcomesPage() {
  const { welcomes, loading, error, fetchWelcomes, createWelcome, updateWelcome, deleteWelcome } = useWelcomesStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatbots, setChatbots] = useState<ChatbotOption[]>([]);

  const fetchChatbots = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chatbots')
        .select('id, name_chatbot, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      
      setChatbots(data || []);
    } catch (error) {
      console.error('Error al cargar chatbots:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await Promise.all([
          fetchWelcomes(),
          fetchChatbots()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (welcome: Welcome) => {
    setFormData({
      welcome_message: welcome.welcome_message,
      media_url: welcome.media_url || '',
      is_active: welcome.is_active,
      chatbot_id: welcome.chatbot_id || '',
    });
    setEditingId(welcome.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este mensaje de bienvenida?')) {
      try {
        await deleteWelcome(id);
      } catch (error) {
        console.error('Error al eliminar mensaje de bienvenida:', error);
        alert('No se pudo eliminar el mensaje de bienvenida. Verifica los permisos.');
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

      const welcomeData = {
        ...formData,
        user_id: user.id
      };

      if (!validateForm(welcomeData)) return;

      if (editingId) {
        await updateWelcome(editingId, welcomeData);
      } else {
        await createWelcome(welcomeData);
      }
      
      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
      fetchWelcomes();
    } catch (error) {
      handleError(error);
    }
  };

  const validateForm = (data: FormDataType): boolean => {
    if (!data.chatbot_id) {
      alert('Debe seleccionar un chatbot');
      return false;
    }
    if (!data.welcome_message.trim()) {
      alert('El mensaje no puede estar vacío');
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

  const filteredWelcomes = useMemo(() => 
    welcomes.filter(welcome => 
      JSON.stringify(welcome).toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [welcomes, searchTerm]
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
        <h1 className="text-2xl font-bold">Mensajes de Bienvenida</h1>
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
          <button onClick={() => { setIsModalOpen(true); setFormData(initialFormData); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
            <Plus className="mr-2" size={18} /> Nuevo Mensaje de Bienvenida
          </button>
        </div>
      </div>

      {error && <div className="bg-red-600 text-white p-4 rounded-md mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWelcomes.map((welcome) => (
          <div key={welcome.id} className="bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <div>
              <p className="text-sm text-gray-400">
                  Chatbot: {chatbots.find(c => c.id === welcome.chatbot_id)?.name_chatbot || 'No encontrado'}
                </p>
                <h2 className="text-lg font-semibold">{welcome.welcome_message}</h2>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleEdit(welcome)} className="text-blue-400 hover:text-blue-300">
                  <Pencil size={18} />
                </button>
                <button onClick={() => handleDelete(welcome.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="mb-2">
              {welcome.media_url && (
                <div className="flex flex-col mb-2">
                  {welcome.media_url.endsWith('.jpg') || welcome.media_url.endsWith('.png') || welcome.media_url.endsWith('.jpeg') ? (
                    <img src={welcome.media_url} alt="Vista previa" className="w-full h-auto rounded-md" />
                  ) : welcome.media_url.endsWith('.mp4') ? (
                    <video controls className="w-full h-auto rounded-md">
                      <source src={welcome.media_url} type="video/mp4" />
                      Tu navegador no soporta el video.
                    </video>
                  ) : welcome.media_url.endsWith('.mp3') ? (
                    <div className="flex flex-col items-center bg-gray-700 p-4 rounded-md">
                    <audio controls className="w-full">
                      <source src={welcome.media_url} type="audio/mpeg" />
                      Tu navegador no soporta el audio.
                    </audio>
                    </div>
                  ) : welcome.media_url.endsWith('.pdf') || welcome.media_url.endsWith('.doc') || welcome.media_url.endsWith('.docx') ? (
                    <iframe 
                      src={welcome.media_url} 
                      className="w-full h-60 rounded-md" 
                      title="Documento PDF"
                    ></iframe>
                  ) : (
                    <a href={welcome.media_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                      Ver Documento
                    </a>
                  )}
                </div>
              )}
            
            <div className="mt-2">
              <Switch
                checked={welcome.is_active}
                onChange={async (checked) => {
                  try {
                    await updateWelcome(welcome.id, { is_active: checked });
                    fetchWelcomes();
                  } catch (error) {
                    console.error('Error al actualizar estado:', error);
                  }
                }}
                label={welcome.is_active ? 'Activo' : 'Inactivo'}
              />
            </div>

            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Mensaje' : 'Nuevo Mensaje'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Chatbot</label>
                <select
                  value={formData.chatbot_id}
                  onChange={(e) => setFormData({ ...formData, chatbot_id: e.target.value })}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                >
                  <option value="">Selecciona un chatbot</option>
                  {chatbots.map(chatbot => (
                    <option key={chatbot.id} value={chatbot.id}>
                      {chatbot.name_chatbot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">Mensaje</label>
                <textarea
                  value={formData.welcome_message}
                  onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">URL del Medio</label>
                <input
                  type="text"
                  value={formData.media_url}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
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
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}