import { useEffect, useState, useMemo } from 'react';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useBlacklistStore } from '../../store/blacklistStore';
import { supabase } from '../../lib/supabase';
import type { Blacklist } from '../../types/database';
import { Switch } from '../../components/ui/Switch';

interface FormDataType extends Omit<Blacklist, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  chatbot_id: string;
  phone_number: string;
  is_active: boolean;
}

interface ChatbotOption {
  id: string;
  name_chatbot: string;
  is_active: boolean;
}

const initialFormData: FormDataType = {
  chatbot_id: '',
  phone_number: '',
  is_active: true
};

export default function BlacklistPage() {
  const { blockedNumbers, loading, error, fetchBlockedNumbers, createBlockedNumber, updateBlockedNumber, deleteBlockedNumber } = useBlacklistStore();
  
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
          fetchBlockedNumbers(),
          fetchChatbots()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (blockedNumber: Blacklist) => {
    setFormData({
      chatbot_id: blockedNumber.chatbot_id,
      phone_number: blockedNumber.phone_number,
      is_active: blockedNumber.is_active,
    });
    setEditingId(blockedNumber.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este número bloqueado?')) {
      try {
        await deleteBlockedNumber(id);
      } catch (error) {
        console.error('Error al eliminar número:', error);
        alert('No se pudo eliminar el número. Verifica los permisos.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!validateForm(formData)) return;

      if (editingId) {
        await updateBlockedNumber(editingId, formData);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        await createBlockedNumber({ ...formData, user_id: user.id });
      }
      
      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
    } catch (error) {
      handleError(error);
    }
  };

  const validateForm = (data: FormDataType): boolean => {
    if (!data.chatbot_id) {
      alert('Debe seleccionar un chatbot');
      return false;
    }
    if (!data.phone_number.trim()) {
      alert('El número de teléfono no puede estar vacío');
      return false;
    }
    if (!/^\d+$/.test(data.phone_number)) {
      alert('El número de teléfono solo debe contener dígitos');
      return false;
    }
    return true;
  };

  const handleError = (error: unknown) => {
    console.error('Error:', error);
    alert(error instanceof Error ? error.message : 'Error inesperado');
  };

  const filteredNumbers = useMemo(() => 
    blockedNumbers.filter(number => 
      JSON.stringify(number).toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [blockedNumbers, searchTerm]
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
        <h1 className="text-2xl font-bold">Lista Negra</h1>
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
            onClick={() => { setIsModalOpen(true); setFormData(initialFormData); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus className="mr-2" size={18} /> Nuevo Número
          </button>
        </div>
      </div>

      {error && <div className="bg-red-600 text-white p-4 rounded-md mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNumbers.map((number) => (
          <div key={number.id} className="bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm text-gray-400">
                  Chatbot: {chatbots.find(c => c.id === number.chatbot_id)?.name_chatbot || 'No encontrado'}
                </p>
                <h3 className="text-lg font-semibold">{number.phone_number}</h3>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleEdit(number)} className="text-blue-400 hover:text-blue-300">
                  <Pencil size={18} />
                </button>
                <button onClick={() => handleDelete(number.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="mt-2">
              <Switch
                checked={number.is_active}
                onChange={async (checked) => {
                  try {
                    await updateBlockedNumber(number.id, { is_active: checked });
                    fetchBlockedNumbers();
                  } catch (error) {
                    console.error('Error al actualizar estado:', error);
                  }
                }}
                label={number.is_active ? 'Bloqueado' : 'Desbloqueado'}
              />
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Número Bloqueado' : 'Nuevo Número Bloqueado'}
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
                <label className="block mb-2">Número de Teléfono</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  placeholder="Ej: 573125550000"
                  required
                />
              </div>

              <div>
                <Switch
                  checked={formData.is_active}
                  onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  label={formData.is_active ? 'Bloqueado' : 'Desbloqueado'}
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