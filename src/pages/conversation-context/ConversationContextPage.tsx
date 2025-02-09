import { useEffect, useState, useMemo } from 'react';
import { Loader2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ConversationContext } from '../../types/database';
import { useNavigate } from 'react-router-dom';

export default function ConversationContextPage() {
  const navigate = useNavigate();
  
  const [conversationContexts, setConversationContexts] = useState<ConversationContext[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchConversationContexts = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData.user) {
          const { data, error } = await supabase
            .from('conversation_context')
            .select('id, content, metadata, phone_number, timestamp, user_id, role, created_at, updated_at')
            .eq('user_id', userData.user.id)
            .order('timestamp', { ascending: false });

          if (error) throw error;
          
          // Asegurarse de que los datos sean del tipo correcto
          const typedContexts: ConversationContext[] = data ? data.map(item => ({
            id: item.id || '',
            user_id: item.user_id || '',
            content: item.content || '',
            metadata: item.metadata || {},
            phone_number: item.phone_number || '',
            timestamp: item.timestamp || new Date().toISOString(),
            role: item.role || 'user',
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at
          })) : [];

          setConversationContexts(typedContexts);
          setLoading(false);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error al cargar contextos:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
        setLoading(false);
      }
    };

    fetchConversationContexts();
  }, [navigate]);

  const filteredContexts = useMemo(() => 
    conversationContexts.filter(context => 
      JSON.stringify(context).toLowerCase().includes(searchTerm.toLowerCase())
    ), 
    [conversationContexts, searchTerm]
  );

  if (loading) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen text-white flex justify-center items-center">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen text-white">
        <div className="bg-red-600 text-white p-4 rounded-md mb-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contextos de Conversación</h1>
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
      </div>

      {conversationContexts.length === 0 && (
        <div className="text-center text-gray-400 mt-10">
          No hay contextos de conversación.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContexts.map((context, index) => (
          <div 
            key={index} 
            className="bg-gray-800 rounded-lg p-4 shadow-md"
          >
            <div className="mb-2">
              <h2 className="text-lg font-semibold mb-2">Contexto de Conversación</h2>
              
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-400">Contenido:</span>
                  <pre className="text-xs bg-gray-700 p-2 rounded overflow-auto max-h-24">
                    {context.content}
                  </pre>
                </div>
                
                <div>
                  <span className="font-medium text-gray-400">Número de Teléfono:</span>
                  <p className="text-sm">{context.phone_number}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-400">Timestamp:</span>
                  <p className="text-sm">
                    {new Date(context.timestamp).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-400">Metadata:</span>
                  <pre className="text-xs bg-gray-700 p-2 rounded overflow-auto max-h-24">
                    {JSON.stringify(context.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 