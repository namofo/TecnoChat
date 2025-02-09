// src/pages/welcomes/WelcomesPage.tsx
import { useEffect, useState, useMemo } from 'react';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useWelcomesStore } from '../../store/welcomesStore';
import type { Welcome } from '../../types/database';
import { useNavigate } from 'react-router-dom';

export default function WelcomesPage() {
  const navigate = useNavigate();
  const { welcomes, loading, error, fetchWelcomes, createWelcome, updateWelcome, deleteWelcome } = useWelcomesStore();
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<Welcome | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchWelcomes();
  }, [fetchWelcomes]);

  const handleEdit = (welcome: Welcome) => {
    setFormData(welcome);
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
    if (formData) {
      const { id, ...dataToUpdate } = formData;
      try {
        if (id) {
          await updateWelcome(id, dataToUpdate);
        } else {
          await createWelcome(dataToUpdate);
        }
        setIsModalOpen(false);
        setFormData(null);
        setEditingId(null);
      } catch (error) {
        console.error('Error al guardar mensaje de bienvenida:', error);
        alert('No se pudo guardar el mensaje de bienvenida. Verifica los permisos.');
      }
    }
  };

  const filteredWelcomes = welcomes.filter(welcome => 
    JSON.stringify(welcome).toLowerCase().includes(searchTerm.toLowerCase())
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
          <button onClick={() => { setIsModalOpen(true); setFormData(null); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
            <Plus className="mr-2" size={18} /> Nuevo Mensaje de Bienvenida
          </button>
        </div>
      </div>

      {error && <div className="bg-red-600 text-white p-4 rounded-md mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWelcomes.map((welcome) => (
          <div key={welcome.id} className="bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold mb-2">{welcome.welcomereply}</h2>
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
              {welcome.mediapath && (
                <div className="flex flex-col mb-2">
                  {/* Mostrar el archivo */}
                  {welcome.mediapath.endsWith('.jpg') || welcome.mediapath.endsWith('.png') || welcome.mediapath.endsWith('.jpeg') ? (
                    <img src={welcome.mediapath} alt="Vista previa" className="w-full h-auto rounded-md" />
                  ) : welcome.mediapath.endsWith('.mp4') ? (
                    <video controls className="w-full h-auto rounded-md">
                      <source src={welcome.mediapath} type="video/mp4" />
                      Tu navegador no soporta el video.
                    </video>
                  ) : welcome.mediapath.endsWith('.mp3') ? (
                    <div className="flex flex-col items-center bg-gray-700 p-4 rounded-md">
                    <audio controls className="w-full">
                      <source src={welcome.mediapath} type="audio/mpeg" />
                      Tu navegador no soporta el audio.
                    </audio>
                    </div>
                  ) : welcome.mediapath.endsWith('.pdf') || welcome.mediapath.endsWith('.doc') || welcome.mediapath.endsWith('.docx') ? (
                    <iframe 
                      src={welcome.mediapath} 
                      className="w-full h-60 rounded-md" 
                      title="Documento PDF"
                    ></iframe>
                  ) : (
                    <a href={welcome.mediapath} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                      Ver Documento
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{formData ? 'Editar Mensaje de Bienvenida' : 'Nuevo Mensaje de Bienvenida'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Mensaje de Bienvenida</label>
                <textarea
                  value={formData?.welcomereply || ''}
                  onChange={(e) => setFormData({ ...formData, welcomereply: e.target.value } as Welcome)}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block mb-2">Media Path</label>
                <input
                  type="text"
                  value={formData?.mediapath || ''}
                  onChange={(e) => setFormData({ ...formData, mediapath: e.target.value } as Welcome)}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
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