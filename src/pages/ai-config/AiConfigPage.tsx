// Ruta: e:\project\src\pages\ai-config\AiConfigPage.tsx
import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { useAiConfigStore } from '../../store/aiConfigStore';
import type { AiConfig } from '../../types/database';

interface AiConfigFormData {
  name?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  priority?: number;
}

const initialFormData: AiConfigFormData = {
  name: '',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  max_tokens: 150,
  system_prompt: '',
  priority: 0,
};

export default function AiConfigPage() {
  const { 
    aiConfigs, 
    loading, 
    error, 
    fetchAiConfigs, 
    createAiConfig, 
    updateAiConfig, 
    deleteAiConfig 
  } = useAiConfigStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<AiConfigFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);  // Estado para el switch

  useEffect(() => {
    fetchAiConfigs();
  }, [fetchAiConfigs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name) {
        alert('El nombre es obligatorio');
        return;
      }

      if (editingId) {
        await updateAiConfig(editingId, formData, isEnabled);
      } else {
        await createAiConfig(formData, isEnabled);
      }
      
      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert(`Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleEdit = (config: AiConfig) => {
    setFormData(config.settings);
    setEditingId(config.id);
    setIsEnabled(config.enabled);  // Establecer el estado del switch
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta configuración?')) {
      await deleteAiConfig(id);
    }
  };

  const filteredConfigs = aiConfigs.filter(config => 
    JSON.stringify(config).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configuraciones de IA</h1>
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
              setIsEnabled(true);  // Establecer por defecto como activo
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus className="mr-2" size={18} /> Nueva Configuración
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConfigs.map((config) => (
          <div 
            key={config.id} 
            className="bg-gray-800 rounded-lg p-4 shadow-md"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold truncate">
                {config.settings.name || 'Sin nombre'}
              </h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(config)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(config.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <div className="space-x-2">
                  <span 
                    className={`text-xs px-2 py-1 rounded ${
                      config.enabled ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                    }`}
                  >
                    {config.enabled ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {config.settings.model || 'Sin modelo'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  Prioridad: {config.settings.priority || 0}
                </span>
              </div>
              <div className="mt-2">
                <h3 className="text-sm font-semibold mb-1">Parámetros:</h3>
                <div className="text-xs text-gray-300 space-y-1">
                  <p>Temperatura: {config.settings.temperature || 'N/A'}</p>
                  <p>Máximo de Tokens: {config.settings.max_tokens || 'N/A'}</p>
                </div>
              </div>
              {config.settings.system_prompt && (
                <div className="mt-2">
                  <h3 className="text-sm font-semibold mb-1">Prompt del Sistema:</h3>
                  <p className="text-xs text-gray-400 italic line-clamp-3">
                    {config.settings.system_prompt}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar' : 'Nueva'} Configuración de IA
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Modelo</label>
                  <select
                    value={formData.model || 'gpt-3.5-turbo'}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    className="w-full bg-gray-700 text-white p-2 rounded-md"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="claude-2">Claude 2</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Prioridad</label>
                  <input
                    type="number"
                    value={formData.priority || 0}
                    onChange={(e) => setFormData({...formData, priority: Number(e.target.value)})}
                    className="w-full bg-gray-700 text-white p-2 rounded-md"
                    min="0"
                    max="10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Temperatura</label>
                  <input
                    type="number"
                    value={formData.temperature || 0.7}
                    onChange={(e) => setFormData({...formData, temperature: Number(e.target.value)})}
                    className="w-full bg-gray-700 text-white p-2 rounded-md"
                    step="0.1"
                    min="0"
                    max="1"
                  />
                </div>
                <div>
                  <label className="block mb-2">Máximo de Tokens</label>
                  <input
                    type="number"
                    value={formData.max_tokens || 150}
                    onChange={(e) => setFormData({...formData, max_tokens: Number(e.target.value)})}
                    className="w-full bg-gray-700 text-white p-2 rounded-md"
                    min="1"
                    max="4096"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2">Prompt del Sistema</label>
                <textarea
                  value={formData.system_prompt || ''}
                  onChange={(e) => setFormData({...formData, system_prompt: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300">
                  Estado de la Configuración
                </label>
                <div 
                  className={`w-11 h-6 ${isEnabled ? 'bg-emerald-600' : 'bg-gray-700'} rounded-full relative cursor-pointer`}
                  onClick={() => setIsEnabled(!isEnabled)}
                >
                  <div 
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 ${
                      isEnabled ? 'right-1' : 'left-1'
                    }`} 
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEnabled(true);  // Restablecer a valor por defecto
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}