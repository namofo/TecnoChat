import { useEffect, useState, useMemo } from 'react';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useBehaviorStore } from '../../store/behaviorStore';
import { supabase } from '../../lib/supabase';
import type { BehaviorPrompt } from '../../types/database';
import { Switch } from '../../components/ui/Switch';

interface FormDataType extends Omit<BehaviorPrompt, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'embedding'> {
  chatbot_id: string;
  prompt_text: string;
  is_active: boolean;
}

interface ChatbotOption {
  id: string;
  name_chatbot: string;
  is_active: boolean;
}

const initialFormData: FormDataType = {
  chatbot_id: '',
  prompt_text: '',
  is_active: true
};

export default function BehaviorPage() {
  const { behaviors, loading, error, fetchBehaviors, createBehavior, updateBehavior, deleteBehavior } = useBehaviorStore();
  
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
    console.log('BehaviorPage mounted');
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user found');
          return;
        }
        console.log('Fetching behaviors...');
        await Promise.all([
          fetchBehaviors(),
          fetchChatbots()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, []);

  console.log('Rendering BehaviorPage:', { behaviors, loading, error });

  const handleEdit = (behavior: BehaviorPrompt) => {
    setFormData({
      prompt_text: behavior.prompt_text,
      is_active: behavior.is_active,
      chatbot_id: behavior.chatbot_id || '',
    });
    setEditingId(behavior.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este comportamiento?')) {
      try {
        await deleteBehavior(id);
      } catch (error) {
        console.error('Error al eliminar comportamiento:', error);
        alert('No se pudo eliminar el comportamiento. Verifica los permisos.');
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

      const behaviorData = {
        ...formData,
        user_id: user.id
      };

      if (!validateForm(behaviorData)) return;

      if (editingId) {
        await updateBehavior(editingId, behaviorData);
      } else {
        await createBehavior(behaviorData);
      }
      
      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
      fetchBehaviors();
    } catch (error) {
      handleError(error);
    }
  };

  const validateForm = (data: FormDataType): boolean => {
    if (!data.chatbot_id) {
      alert('Debe seleccionar un chatbot');
      return false;
    }
    if (!data.prompt_text.trim()) {
      alert('El prompt no puede estar vacío');
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

  const filteredBehaviors = useMemo(() => 
    behaviors.filter(behavior => 
      JSON.stringify(behavior).toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [behaviors, searchTerm]
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
        <h1 className="text-2xl font-bold">Comportamientos de IA</h1>
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
            <Plus className="mr-2" size={18} /> Nuevo Comportamiento
          </button>
        </div>
      </div>

      {error && <div className="bg-red-600 text-white p-4 rounded-md mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBehaviors.map((behavior) => (
          <div key={behavior.id} className="bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm text-gray-400">
                  Chatbot: {chatbots.find(c => c.id === behavior.chatbot_id)?.name_chatbot || 'No encontrado'}
                </p>
                <div className="max-h-40 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">{behavior.prompt_text}</pre>
                </div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleEdit(behavior)} className="text-blue-400 hover:text-blue-300">
                  <Pencil size={18} />
                </button>
                <button onClick={() => handleDelete(behavior.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="mt-2">
              <Switch
                checked={behavior.is_active}
                onChange={async (checked) => {
                  try {
                    await updateBehavior(behavior.id, { is_active: checked });
                    fetchBehaviors();
                  } catch (error) {
                    console.error('Error al actualizar estado:', error);
                  }
                }}
                label={behavior.is_active ? 'Activo' : 'Inactivo'}
              />
            </div>

          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Comportamiento' : 'Nuevo Comportamiento'}
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
                <label className="block mb-2">Prompt de Comportamiento</label>
                <textarea
                  value={formData.prompt_text}
                  onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                  className="w-full bg-gray-700 text-white p-2 rounded-md min-h-[200px]"
                  placeholder="Define el comportamiento del asistente..."
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