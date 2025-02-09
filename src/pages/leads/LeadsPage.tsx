// src/pages/leads/LeadsPage.tsx
import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLeadsStore } from '../../store/leadsStore';
import type { Lead } from '../../types/database';
import { useNavigate } from 'react-router-dom';

export default function LeadsPage() {
  const navigate = useNavigate();
  const { leads, loading, error, fetchLeads, createLead, updateLead, deleteLead } = useLeadsStore();
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleEdit = (lead: Lead) => {
    setFormData(lead);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este lead?')) {
      await deleteLead(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      if (formData.id) {
        await updateLead(formData.id, formData);
      } else {
        await createLead(formData);
      }
      setIsModalOpen(false);
      setFormData(null);
    }
  };

  const filteredLeads = leads.filter(lead => 
    JSON.stringify(lead).toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-2xl font-bold">Leads</h1>
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
          <button onClick={() => { setIsModalOpen(true); setFormData(null); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
            <Plus className="mr-2" size={18} /> Nuevo Lead
          </button>
        </div>
      </div>

      {error && <div className="bg-red-600 text-white p-4 rounded-md mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeads.map((lead) => (
          <div key={lead.id} className="bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold mb-2">{lead.full_name}</h2>
              <div className="flex space-x-2">
                <button onClick={() => handleEdit(lead)} className="text-blue-400 hover:text-blue-300">
                  <Pencil size={18} />
                </button>
                <button onClick={() => handleDelete(lead.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <p>Email: {lead.email}</p>
            <p>Teléfono: {lead.phone}</p>
            <p>Estado: {lead.status}</p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{formData ? 'Editar Lead' : 'Nuevo Lead'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Nombre Completo</label>
                <input
                  type="text"
                  value={formData?.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value } as Lead)}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block mb-2">Email</label>
                <input
                  type="email"
                  value={formData?.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value } as Lead)}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData?.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value } as Lead)}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                />
              </div>
              <div>
                <label className="block mb-2">Estado</label>
                <select
                  value={formData?.status || 'pending'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value } as Lead)}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="converted">Convertido</option>
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