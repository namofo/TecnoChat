// src/pages/flows/FlowsPage.tsx
import { useEffect, useState, useMemo } from 'react';
import { Loader2, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFlowsStore } from '../../store/flowsStore';
import type { Flow } from '../../types/database';
import { useNavigate } from 'react-router-dom';

interface FlowFormData {
  addkeyword: string;
  addanswer: string;
  archivo: string;
}

const initialFormData: FlowFormData = {
  addkeyword: '',
  addanswer: '',
  archivo: ''
};

export default function FlowsPage() {
  const navigate = useNavigate();
  
  const { 
    flows, 
    loading, 
    error, 
    fetchFlows, 
    createFlow, 
    updateFlow, 
    deleteFlow 
  } = useFlowsStore();
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<FlowFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        
        if (data.user) {
          fetchFlows();
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error al verificar usuario:', error);
        navigate('/login');
      }
    };

    checkUser();
  }, [navigate, fetchFlows]);

  const filteredFlows = useMemo(() => 
    flows.filter(flow => 
      JSON.stringify(flow).toLowerCase().includes(searchTerm.toLowerCase())
    ), 
    [flows, searchTerm]
  );

  const handleEdit = (flow: Flow) => {
    setFormData({
      addkeyword: flow.addkeyword,
      addanswer: flow.addanswer,
      archivo: flow.archivo
    });
    setEditingId(flow.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este flow?')) {
      try {
        await deleteFlow(id);
      } catch (error) {
        console.error('Error al eliminar flow:', error);
        alert('No se pudo eliminar el flow');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const flowToSave = {
        addkeyword: formData.addkeyword,
        addanswer: formData.addanswer,
        archivo: formData.archivo
      };

      if (editingId) {
        await updateFlow(editingId, flowToSave);
      } else {
        await createFlow(flowToSave);
      }
      
      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
    } catch (error) {
      console.error('Error al guardar flow:', error);
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
        <h1 className="text-2xl font-bold">Flows</h1>
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
            <Plus className="mr-2" size={18} /> Nuevo Flow
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {flows.length === 0 && !loading && (
        <div className="text-center text-gray-400 mt-10">
          No hay flows. Haga clic en "Nuevo Flow" para comenzar.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFlows.map((flow) => (
          <div 
            key={flow.id} 
            className="bg-gray-800 rounded-lg p-4 shadow-md"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold mb-2">Flow {flow.id}</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(flow)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(flow.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col mb-2">
              {/* Mostrar el archivo */}
              {flow.archivo && (
                <div className="mb-2">
                  {flow.archivo.endsWith('.jpg') || flow.archivo.endsWith('.png') || flow.archivo.endsWith('.jpeg') ? (
                    <img src={flow.archivo} alt="Contenido" className="w-full h-auto rounded-md" />
                  ) : flow.archivo.endsWith('.mp4') ? (
                    <video controls className="w-full h-auto rounded-md">
                      <source src={flow.archivo} type="video/mp4" />
                      Tu navegador no soporta el video.
                    </video>
                  ) : flow.archivo.endsWith('.mp3') ? (
                    <div className="flex flex-col items-center bg-gray-700 p-4 rounded-md">
                      <audio controls className="w-full">
                        <source src={flow.archivo} type="audio/mpeg" />
                        Tu navegador no soporta el audio.
                      </audio>
                      <span className="text-gray-400 mt-2">Audio</span>
                    </div>
                  ) : flow.archivo.endsWith('.pdf') ? (
                    <iframe 
                      src={flow.archivo} 
                      className="w-full h-60 rounded-md" 
                      title="Documento PDF"
                    ></iframe>
                  ) : (
                    <a href={flow.archivo} className="text-blue-400 hover:underline">Ver documento</a>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-400">Respuesta:</span>
                  <p className="text-sm">
                    {flow.addanswer.split('|').map((line, index) => (
                      <span key={index} className="block">
                        {line.trim().startsWith('✅') ? line : `✅ ${line}`}
                      </span>
                    ))}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-400">Palabras Clave:</span>
                  <p className="text-sm">{flow.addkeyword}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-400">Creado En:</span>
                  <p className="text-sm">{new Date(flow.created_at).toLocaleString()}</p>
                </div>
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
              {editingId ? 'Editar Flow' : 'Nuevo Flow'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Palabras Clave</label>
                  <input
                    type="text"
                    value={formData.addkeyword}
                    onChange={(e) => setFormData({...formData, addkeyword: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Respuesta</label>
                  <textarea
                    value={formData.addanswer}
                    onChange={(e) => setFormData({...formData, addanswer: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Archivo</label>
                  <input
                    type="text"
                    value={formData.archivo}
                    onChange={(e) => setFormData({...formData, archivo: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                    required
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