import { useEffect, useState, useMemo } from 'react';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useDataClientsStore } from '../../store/dataclientsStore';
import { supabase } from '../../lib/supabase';
import type { ClientData } from '../../types/database';

interface FormDataType extends Omit<ClientData, 'id' | 'user_id' | 'created_at'> {
  chatbot_id: string;
  identification_number: string;
  full_name: string;
  phone_number: string;
  email: string;
  media_url?: string;
}

interface ChatbotOption {
  id: string;
  name_chatbot: string;
  is_active: boolean;
}

const initialFormData: FormDataType = {
  chatbot_id: '',
  identification_number: '',
  full_name: '',
  phone_number: '',
  email: '',
  media_url: ''
};

export default function DataClientsPage() {
  const { clientsData, loading, error, fetchClientsData, createClientData, updateClientData, deleteClientData } = useDataClientsStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatbots, setChatbots] = useState<ChatbotOption[]>([]);

  // Fetch chatbots for dropdown
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
          fetchClientsData(),
          fetchChatbots()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (clientData: ClientData) => {
    setFormData({
      chatbot_id: clientData.chatbot_id,
      identification_number: clientData.identification_number,
      full_name: clientData.full_name,
      phone_number: clientData.phone_number,
      email: clientData.email,
      media_url: clientData.media_url || ''
    });
    setEditingId(clientData.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await deleteClientData(id);
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        alert('No se pudo eliminar el cliente. Verifica los permisos.');
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

      const clientData = {
        ...formData,
        user_id: user.id
      };

      if (!validateForm(clientData)) return;

      if (editingId) {
        await updateClientData(editingId, clientData);
      } else {
        await createClientData(clientData);
      }
      
      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
      fetchClientsData();
    } catch (error) {
      handleError(error);
    }
  };

  const validateForm = (data: FormDataType): boolean => {
    if (!data.chatbot_id) {
      alert('Debe seleccionar un chatbot');
      return false;
    }
    if (!data.identification_number.trim()) {
      alert('El número de identificación no puede estar vacío');
      return false;
    }
    if (!data.full_name.trim()) {
      alert('El nombre completo no puede estar vacío');
      return false;
    }
    if (!data.phone_number.trim() || !/^\d+$/.test(data.phone_number)) {
      alert('El número de teléfono debe contener solo dígitos');
      return false;
    }
    if (!data.email.trim() || !data.email.includes('@')) {
      alert('Debe ingresar un correo electrónico válido');
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

  const filteredClientsData = useMemo(() => 
    clientsData.filter(clientData => 
      JSON.stringify(clientData).toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [clientsData, searchTerm]
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
        <h1 className="text-2xl font-bold">Datos de Clientes</h1>
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
            <Plus className="mr-2" size={18} /> Nuevo Cliente
          </button>
        </div>
      </div>

      {error && <div className="bg-red-600 text-white p-4 rounded-md mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClientsData.map((client) => (
          <div key={client.id} className="bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm text-gray-400">
                  Chatbot: {chatbots.find(c => c.id === client.chatbot_id)?.name_chatbot || 'No encontrado'}
                </p>
                <h3 className="text-lg font-semibold">{client.full_name}</h3>
                <p className="text-sm">ID: {client.identification_number}</p>
                <p className="text-sm">Tel: {client.phone_number}</p>
                <p className="text-sm">{client.email}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleEdit(client)} className="text-blue-400 hover:text-blue-300">
                  <Pencil size={18} />
                </button>
                <button onClick={() => handleDelete(client.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {client.media_url && (
              <div className="mt-2">
                <img 
                  src={client.media_url} 
                  alt="Media" 
                  className="w-full h-40 object-cover rounded-md"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">ID del Chatbot</label>
                <select
                  value={formData.chatbot_id}
                  onChange={(e) => setFormData({...formData, chatbot_id: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                >
                  <option value="">Seleccione un chatbot</option>
                  {chatbots.map(chatbot => (
                    <option key={chatbot.id} value={chatbot.id}>{chatbot.name_chatbot}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">Número de Identificación</label>
                <input
                  type="text"
                  value={formData.identification_number}
                  onChange={(e) => setFormData({...formData, identification_number: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Número de Teléfono</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">URL de Medios</label>
                <input
                  type="text"
                  value={formData.media_url}
                  onChange={(e) => setFormData({...formData, media_url: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
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