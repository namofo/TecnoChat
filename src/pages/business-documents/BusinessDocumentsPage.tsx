// e:\project\src\pages\business-documents\BusinessDocumentsPage.tsx
import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { useBusinessDocumentsStore } from '../../store/businessDocumentsStore';
import type { BusinessDocument } from '../../types/database';
import { supabase } from '../../lib/supabase';

// Definir la interfaz de forma más explícita
interface BusinessDocumentFormData {
  title: string;
  content: string;
  document_type: string;
  category: string;
  tags: string[];
  metadata?: Record<string, any>;
  priority?: number;
  active: boolean;
}

// Inicializar con valores por defecto más explícitos
const initialFormData: BusinessDocumentFormData = {
  title: '',
  content: '',
  document_type: 'info',
  category: '',
  tags: [],
  metadata: {},
  priority: 0,
  active: true
};

export default function BusinessDocumentsPage() {
  // Destructurar con valores por defecto
  const { 
    businessDocuments = [], 
    loading = false, 
    error = null, 
    fetchBusinessDocuments, 
    createBusinessDocument, 
    updateBusinessDocument, 
    deleteBusinessDocument 
  } = useBusinessDocumentsStore();
  
  // Estados con tipos explícitos
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<BusinessDocumentFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Usar useCallback para optimizar la función de búsqueda
  const filteredDocuments = React.useMemo(() => {
    return businessDocuments.filter(doc => 
      JSON.stringify(doc).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [businessDocuments, searchTerm]);

  // Usar useCallback para memoizar la función de fetchDocuments
  const fetchDocumentsCallback = React.useCallback(async () => {
    try {
      await fetchBusinessDocuments();
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  }, [fetchBusinessDocuments]);

  // UseEffect con la función memoizada
  useEffect(() => {
    fetchDocumentsCallback();
  }, [fetchDocumentsCallback]);

  // Función de envío de formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.title.trim()) {
        alert('El título es obligatorio');
        return;
      }
  
      // Limpiar y procesar tags
      const tagsArray = formData.tags
        .filter(tag => tag.trim() !== '')
        .map(tag => tag.trim());
  
      // Obtener el user_id desde el store o desde Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Debe iniciar sesión para crear un documento');
        return;
      }
  
      const documentToSave = {
        ...formData,
        tags: tagsArray,
        user_id: user.id, 
        // Asegurar que metadata sea un objeto, no undefined
        metadata: formData.metadata || {}, 
        // Asegurar que priority tenga un valor por defecto
        priority: formData.priority ?? 0
      };
  
      if (editingId) {
        await updateBusinessDocument(editingId, documentToSave);
      } else {
        await createBusinessDocument(documentToSave);
      }
      
      // Resetear el formulario
      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
    } catch (error) {
      console.error('Error al guardar documento:', error);
      alert(`Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Función de edición
  const handleEdit = (document: BusinessDocument) => {
    setFormData({
      title: document.title,
      content: document.content,
      document_type: document.document_type,
      category: document.category,
      tags: document.tags || [],
      metadata: document.metadata || {},
      priority: document.priority || 0,
      active: document.active
    });
    setEditingId(document.id);
    setIsModalOpen(true);
  };

  // Función de eliminación
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este documento?')) {
      try {
        await deleteBusinessDocument(id);
      } catch (error) {
        console.error('Error al eliminar documento:', error);
        alert('No se pudo eliminar el documento');
      }
    }
  };

  // Renderizado del componente
  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      {/* Encabezado y barra de búsqueda */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Documentos de Negocio</h1>
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
            <Plus className="mr-2" size={18} /> Nuevo Documento
          </button>
        </div>
      </div>

      {/* Indicador de carga */}
      {loading && (
        <div className="flex justify-center items-center">
          <Loader2 className="animate-spin text-white" size={32} />
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-600 text-white p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Mensaje cuando no hay documentos */}
      {businessDocuments.length === 0 && !loading && (
        <div className="text-center text-gray-400 mt-10">
          No hay documentos de negocio. Haga clic en "Nuevo Documento" para comenzar.
        </div>
      )}

      {/* Cuadrícula de documentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((doc) => (
          <div 
            key={doc.id} 
            className="bg-gray-800 rounded-lg p-4 shadow-md"
          >
            {/* Contenido de cada documento */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold truncate">
                {doc.title}
              </h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(doc)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Detalles del documento */}
            <div>
              <div className="flex justify-between items-center">
                <div className="space-x-2">
                  <span 
                    className={`text-xs px-2 py-1 rounded ${
                      doc.active ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                    }`}
                  >
                    {doc.active ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {doc.document_type}
                  </span>
                </div>
              </div>

              {/* Contenido del documento */}
              <div className="mt-2">
                <p className="text-sm text-gray-300 line-clamp-3">
                  {doc.content}
                </p>
              </div>

              {/* Etiquetas */}
              {doc.tags && doc.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {doc.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de edición/creación */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar' : 'Nuevo'} Documento de Negocio
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos del formulario */}
              <div>
                <label className="block mb-2">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block mb-2">Contenido</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Tipo de Documento</label>
                  <select
                    value={formData.document_type}
                    onChange={(e) => setFormData({...formData, document_type: e.target.value})}
                    className="w-full bg-gray-700 text-white p-2 rounded-md"
                  >
                    <option value="info">Información</option>
                    <option value="schedule">Horario</option>
                    <option value="policy">Política</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Categoría</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-gray-700 text-white p-2 rounded-md"
                    placeholder="Ej. Servicio al Cliente"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2">Etiquetas (separadas por coma)</label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData, 
                    tags: e.target.value.split(',').map(tag => tag.trim())
                  })}
                  className="w-full bg-gray-700 text-white p-2 rounded-md"
                  placeholder="horarios, atención, ubicación"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300">
                  Estado del Documento
                </label>
                <div 
                  className={`w-11 h-6 ${formData.active ? 'bg-emerald-600' : 'bg-gray-700'} rounded-full relative cursor-pointer`}
                  onClick={() => setFormData({...formData, active: !formData.active})}
                >
                  <div 
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 ${
                      formData.active ? 'right-1' : 'left-1'
                    }`} 
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData(initialFormData);
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