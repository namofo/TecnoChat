import { useEffect, useState, useMemo } from 'react';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useFlowsStore } from '../../store/flowsStore';
import { supabase } from '../../lib/supabase';
import type { BotFlow } from '../../types/database';
import { Switch } from '../../components/ui/Switch';

interface FormDataType extends Omit<BotFlow, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  chatbot_id: string;
  keyword: string[]; // Cambiar a solo string[]
  response_text: string;
  media_url: string | null;
  is_active: boolean;
  priority: number;
}

interface ChatbotOption {
  id: string;
  name_chatbot: string;
  is_active: boolean;
}

const initialFormData: FormDataType = {
  chatbot_id: '',
  keyword: [],
  response_text: '',
  media_url: null,
  is_active: true,
  priority: 0
};

export default function FlowsPage() {
  const { flows, loading, error, fetchFlows, createFlow, updateFlow, deleteFlow } = useFlowsStore();
  
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
          fetchFlows(),
          fetchChatbots()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (flow: BotFlow) => {
    setFormData({
      chatbot_id: flow.chatbot_id,
      keyword: Array.isArray(flow.keyword) 
        ? flow.keyword 
        : typeof flow.keyword === 'string' 
          ? [flow.keyword] 
          : [],
      response_text: flow.response_text,
      media_url: flow.media_url || null,
      is_active: flow.is_active,
      priority: flow.priority,
    });
    setEditingId(flow.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este flujo de conversación?')) {
      try {
        await deleteFlow(id);
      } catch (error) {
        console.error('Error al eliminar flujo de conversación:', error);
        alert('No se pudo eliminar el flujo de conversación. Verifica los permisos.');
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

      const flowData = {
        ...formData,
        user_id: user.id
      };

      if (!validateForm(flowData)) return;

      if (editingId) {
        await updateFlow(editingId, flowData);
      } else {
        await createFlow(flowData);
      }
      
      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
      fetchFlows();
    } catch (error) {
      handleError(error);
    }
  };

  const validateForm = (data: FormDataType): boolean => {
    if (!data.chatbot_id) {
      alert('Debe seleccionar un chatbot');
      return false;
    }
    if (data.keyword.length === 0) {
      alert('Debe ingresar al menos una palabra clave');
      return false;
    }
    if (Array.isArray(data.keyword) && data.keyword.length === 0) {
      alert('Debe ingresar al menos una palabra clave');
      return false;
    }
    if (!data.response_text.trim()) {
      alert('La respuesta no puede estar vacía');
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

  const filteredFlows = useMemo(() => 
    flows.filter(flow => 
      JSON.stringify(flow).toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [flows, searchTerm]
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
        <h1 className="text-2xl font-bold">Flujos de Conversación</h1>
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
            <Plus className="mr-2" size={18} /> Nuevo Flujo de Conversación
          </button>
        </div>
      </div>

      {error && <div className="bg-red-600 text-white p-4 rounded-md mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFlows.map((flow) => (
          <div key={flow.id} className="bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm text-gray-400">
                  Chatbot: {chatbots.find(c => c.id === flow.chatbot_id)?.name_chatbot || 'No encontrado'}
                </p>
                <h3 className="text-lg">
                  "{typeof flow.keyword === 'string' 
                    ? flow.keyword 
                    : Array.isArray(flow.keyword) 
                      ? flow.keyword.join(', ') 
                      : ''}"
                </h3>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleEdit(flow)} className="text-blue-400 hover:text-blue-300">
                  <Pencil size={18} />
                </button>
                <button onClick={() => handleDelete(flow.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="mb-2">
              {flow.media_url && (
                <div className="flex flex-col mb-2">
                  {flow.media_url.endsWith('.jpg') || flow.media_url.endsWith('.png') || flow.media_url.endsWith('.jpeg') ? (
                    <img src={flow.media_url} alt="Vista previa" className="w-full h-auto rounded-md" />
                  ) : flow.media_url.endsWith('.mp4') ? (
                    <video controls className="w-full h-auto rounded-md">
                      <source src={flow.media_url} type="video/mp4" />
                      Tu navegador no soporta el video.
                    </video>
                  ) : flow.media_url.endsWith('.mp3') ? (
                    <div className="flex flex-col items-center bg-gray-700 p-4 rounded-md">
                    <audio controls className="w-full">
                      <source src={flow.media_url} type="audio/mpeg" />
                      Tu navegador no soporta el audio.
                    </audio>
                    </div>
                  ) : flow.media_url.endsWith('.pdf') || flow.media_url.endsWith('.doc') || flow.media_url.endsWith('.docx') ? (
                    <iframe 
                      src={flow.media_url} 
                      className="w-full h-60 rounded-md" 
                      title="Documento PDF"
                    ></iframe>
                  ) : (
                    <a href={flow.media_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                      Ver Documento
                    </a>
                  )}
                </div>
              )}
            <p className="text-lg">{flow.response_text}</p>
            <div className="flex justify-between items-center mt-2">
              <div className="text-sm text-gray-400">
                Prioridad: {flow.priority}
              </div>
              <Switch
                checked={flow.is_active}
                onChange={async (checked) => {
                  try {
                    await updateFlow(flow.id, { is_active: checked });
                    fetchFlows();
                  } catch (error) {
                    console.error('Error al actualizar estado:', error);
                  }
                }}
                label={flow.is_active ? 'Activo' : 'Inactivo'}
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
              {editingId ? 'Editar Flujo' : 'Nuevo Flujo'}
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
                <label className="block mb-2">Palabras Clave</label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value.split(',').map(k => k.trim()) })}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  placeholder="Separar palabras clave por comas: menu, servicios, productos"
                  required
                />
                <p className="text-sm text-gray-400 mt-1">
                  Ingresa las palabras clave separadas por comas
                </p>
              </div>

              <div>
                <label className="block mb-2">Respuesta</label>
                <textarea
                  value={formData.response_text}
                  onChange={(e) => setFormData({ ...formData, response_text: e.target.value })}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">URL del Medio</label>
                <input
                  type="text"
                  value={formData.media_url || ''}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                />
              </div>

              <div>
                <label className="block mb-2">Prioridad</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  min="0"
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