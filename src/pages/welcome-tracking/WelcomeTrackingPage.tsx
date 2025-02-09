import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { useWelcomeTrackingStore } from '../../store/welcomeTrackingStore';
import type { WelcomeTracking } from '../../types/database';

interface WelcomeTrackingFormData {
  client_id: string;
  welcome_id: number;
  status: string;
  interaction_date: string;
  notes: string;
}

const initialFormData: WelcomeTrackingFormData = {
  client_id: '',
  welcome_id: 0,
  status: 'pending',
  interaction_date: new Date().toISOString().split('T')[0],
  notes: '',
};

export default function WelcomeTrackingPage() {
  const { 
    welcomeTrackings, 
    loading, 
    error, 
    fetchWelcomeTrackings, 
    createWelcomeTracking, 
    updateWelcomeTracking, 
    deleteWelcomeTracking 
  } = useWelcomeTrackingStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<WelcomeTrackingFormData>(initialFormData);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWelcomeTrackings();
  }, [fetchWelcomeTrackings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateWelcomeTracking(editingId, formData);
    } else {
      await createWelcomeTracking(formData);
    }
    setIsModalOpen(false);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleEdit = (tracking: WelcomeTracking) => {
    setFormData({
      client_id: tracking.client_id,
      welcome_id: tracking.welcome_id,
      status: tracking.status,
      interaction_date: new Date(tracking.interaction_date).toISOString().split('T')[0],
      notes: tracking.notes || '',
    });
    setEditingId(tracking.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deleteWelcomeTracking(id);
  };

  const filteredTrackings = welcomeTrackings.filter(tracking => 
    JSON.stringify(tracking).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Seguimiento de Bienvenidas</h1>
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
            <Plus className="mr-2" size={18} /> Nuevo Seguimiento
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
        {filteredTrackings.map((tracking) => (
          <div 
            key={tracking.id} 
            className="bg-gray-800 rounded-lg p-4 shadow-md"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold truncate">Seguimiento de Bienvenida</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(tracking)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(tracking.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-300 mb-2">
                <span className="font-semibold">Cliente ID:</span> {tracking.client_id}
              </p>
              <div className="flex justify-between items-center">
                <div className="space-x-2">
                  <span 
                    className={`text-xs px-2 py-1 rounded ${
                      tracking.status === 'completed' 
                        ? 'bg-green-600 text-green-100' 
                        : tracking.status === 'pending'
                        ? 'bg-yellow-600 text-yellow-100'
                        : 'bg-red-600 text-red-100'
                    }`}
                  >
                    {tracking.status}
                  </span>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                    Mensaje ID: {tracking.welcome_id}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(tracking.interaction_date).toLocaleDateString()}
                </span>
              </div>
              {tracking.notes && (
                <p className="text-xs text-gray-400 mt-2 italic">
                  Notas: {tracking.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar' : 'Nuevo'} Seguimiento de Bienvenida
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">ID del Cliente</label>
                <input
                  type="text"
                  value={formData.client_id}
                  onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block mb-2">ID del Mensaje de Bienvenida</label>
                <input
                  type="number"
                  value={formData.welcome_id}
                  onChange={(e) => setFormData({...formData, welcome_id: Number(e.target.value)})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-gray-700 text-white p-2 rounded-md"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Fecha de Interacción</label>
                  <input
                    type="date"
                    value={formData.interaction_date}
                    onChange={(e) => setFormData({...formData, interaction_date: e.target.value})}
                    className="w-full bg-gray-700 text-white p-2 rounded-md"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  rows={3}
                />
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