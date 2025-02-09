import { useEffect, useState, useMemo } from 'react';
import { Loader2, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCustomerInsightsStore } from '../../store/customerInsightsStore';
import type { CustomerInsight } from '../../types/database';
import { useNavigate } from 'react-router-dom';

// Función para renderizar metadata de forma más amigable
const renderMetadata = (metadata: Record<string, any>) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <p className="text-gray-500">No hay metadata disponible</p>;
  }

  // Renderización específica para conversation_history
  if (metadata.conversation_history && Array.isArray(metadata.conversation_history)) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-400">Historial de Conversación</h3>
        <div className="max-h-48 overflow-y-auto">
          {metadata.conversation_history.map((entry, index) => (
            <div 
              key={index} 
              className="bg-gray-700 rounded-md p-2 mb-2 text-xs"
            >
              <div className="flex justify-between">
                <span className="font-medium text-gray-300">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <span 
                  className={`px-2 py-1 rounded text-xs ${
                    entry.confidence === 1 ? 'bg-green-600 text-white' :
                    entry.confidence >= 0.9 ? 'bg-green-500 text-white' :
                    entry.confidence >= 0.7 ? 'bg-yellow-500 text-black' :
                    'bg-red-500 text-white'
                  }`}
                >
                  Confianza: {(entry.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="mt-1">{entry.message}</p>
              <span 
                className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                  entry.classification === 'potencialmente_interesado' ? 'bg-blue-600 text-white' :
                  entry.classification === 'curioso' ? 'bg-yellow-600 text-black' :
                  'bg-gray-600 text-white'
                }`}
              >
                {entry.classification}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Renderización genérica para otros tipos de metadata
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-400">Detalles de Metadata</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(metadata).map(([key, value]) => (
          <div 
            key={key} 
            className="bg-gray-700 rounded-md p-2 text-xs"
          >
            <span className="font-medium text-gray-300 block mb-1">
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <span className="text-white">
              {typeof value === 'object' 
                ? JSON.stringify(value, null, 2) 
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface CustomerInsightFormData {
  phone_number: string;
  customer_type: string;
  confidence_score: number;
  last_interaction: string;
  interaction_count: number;
  metadata: Record<string, any>;
}

const initialFormData: CustomerInsightFormData = {
  phone_number: '',
  customer_type: 'potencialmente_interesado',
  confidence_score: 0,
  last_interaction: '',
  interaction_count: 0,
  metadata: {}
};

export default function CustomerInsightsPage() {
  const navigate = useNavigate();
  
  const { 
    customerInsights, 
    loading, 
    error, 
    fetchCustomerInsights, 
    createCustomerInsight, 
    updateCustomerInsight, 
    deleteCustomerInsight 
  } = useCustomerInsightsStore();
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CustomerInsightFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        
        if (data.user) {
          fetchCustomerInsights();
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error al verificar usuario:', error);
        navigate('/login');
      }
    };

    checkUser();
  }, [navigate, fetchCustomerInsights]);

  const filteredInsights = useMemo(() => 
    customerInsights.filter(insight => 
      JSON.stringify(insight).toLowerCase().includes(searchTerm.toLowerCase())
    ), 
    [customerInsights, searchTerm]
  );

  const handleEdit = (insight: CustomerInsight) => {
    setFormData({
      phone_number: insight.phone_number,
      customer_type: insight.customer_type,
      confidence_score: insight.confidence_score,
      last_interaction: insight.last_interaction,
      interaction_count: insight.interaction_count,
      metadata: insight.metadata
    });
    setEditingId(insight.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este customer insight?')) {
      try {
        await deleteCustomerInsight(id);
      } catch (error) {
        console.error('Error al eliminar customer insight:', error);
        alert('No se pudo eliminar el customer insight');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const insightToSave = {
        phone_number: formData.phone_number,
        customer_type: formData.customer_type,
        confidence_score: formData.confidence_score,
        last_interaction: formData.last_interaction || new Date().toISOString(),
        interaction_count: formData.interaction_count,
        metadata: formData.metadata
      };

      if (editingId) {
        await updateCustomerInsight(editingId, insightToSave);
      } else {
        await createCustomerInsight(insightToSave);
      }
      
      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
    } catch (error) {
      console.error('Error al guardar customer insight:', error);
      alert(`Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

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
        <h1 className="text-2xl font-bold">Customer Insights</h1>
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
            <Plus className="mr-2" size={18} /> Nuevo Customer Insight
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {customerInsights.length === 0 && !loading && (
        <div className="text-center text-gray-400 mt-10">
          No hay customer insights. Haga clic en "Nuevo Customer Insight" para comenzar.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInsights.map((insight) => (
          <div 
            key={insight.id} 
            className="bg-gray-800 rounded-lg p-4 shadow-md"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold truncate">Insight {insight.phone_number}</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(insight)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(insight.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-gray-400">Tipo de Cliente:</span>
                <p className="text-sm">{insight.customer_type}</p>
              </div>
              <div>
                <span className="font-medium text-gray-400">Puntuación de Confianza:</span>
                <p className="text-sm">{insight.confidence_score}</p>
              </div>
              <div>
                <span className="font-medium text-gray-400">Última Interacción:</span>
                <p className="text-sm">{new Date(insight.last_interaction).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-400">Conteo de Interacciones:</span>
                <p className="text-sm">{insight.interaction_count}</p>
              </div>
              <div>
                <span className="font-medium text-gray-400 block mb-2">Metadata:</span>
                {renderMetadata(insight.metadata)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de creación/edición */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Customer Insight' : 'Nuevo Customer Insight'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Número de Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Cliente</label>
                  <select
                    value={formData.customer_type}
                    onChange={(e) => setFormData({...formData, customer_type: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                  >
                    <option value="potencialmente_interesado">Potencialmente Interesado</option>
                    <option value="curioso">Curioso</option>
                    <option value="cliente_activo">Cliente Activo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Puntuación de Confianza</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={formData.confidence_score}
                    onChange={(e) => setFormData({...formData, confidence_score: parseFloat(e.target.value)})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Última Interacción</label>
                  <input
                    type="datetime-local"
                    value={formData.last_interaction}
                    onChange={(e) => setFormData({...formData, last_interaction: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Conteo de Interacciones</label>
                  <input
                    type="number"
                    value={formData.interaction_count}
                    onChange={(e) => setFormData({...formData, interaction_count: parseInt(e.target.value)})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Metadata (JSON)</label>
                  <textarea
                    value={JSON.stringify(formData.metadata, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsedMetadata = JSON.parse(e.target.value);
                        setFormData({...formData, metadata: parsedMetadata});
                      } catch (error) {
                        console.error('Error parsing JSON:', error);
                      }
                    }}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md font-mono"
                    rows={4}
                    placeholder='{"key": "value"}'
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
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