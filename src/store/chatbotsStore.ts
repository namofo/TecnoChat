import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Chatbot } from '../types/database';

interface ChatbotsState {
  chatbots: Chatbot[];
  loading: boolean;
  error: string | null;
  fetchChatbots: () => Promise<void>;
  createChatbot: (chatbot: Partial<Chatbot>) => Promise<void>;
  updateChatbot: (id: string, chatbot: Partial<Chatbot>) => Promise<void>;
  deleteChatbot: (id: string) => Promise<void>;
}

export const useChatbotsStore = create<ChatbotsState>((set, get) => ({
  chatbots: [],
  loading: false,
  error: null,

fetchChatbots: async () => {
  set({ loading: true, error: null });
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay usuario autenticado');

    console.log('Fetching chatbots for user:', user.id);

    const { data, error } = await supabase
      .from('chatbots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('Fetch result:', { data, error });

    if (error) throw error;
    
    // Asegurarse de que se muestren TODOS los registros, no solo los nuevos
    set({ chatbots: data || [], loading: false });
  } catch (error) {
    console.error('Error al cargar chatbots:', error);
    set({ 
      error: error instanceof Error ? error.message : 'Error desconocido', 
      loading: false,
      chatbots: [] 
    });
    throw error;
  }
},

  createChatbot: async (chatbot) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');
  
      console.log('Creando chatbot para usuario:', user.id);
  
      // Validar campos obligatorios
      if (!chatbot.nombre) throw new Error('El nombre es obligatorio');
  
      // Preparar datos para inserción
      const chatbotToInsert = {
        user_id: user.id,
        nombre: chatbot.nombre,
        estado: chatbot.estado ?? true
      };
  
      console.log('Datos del chatbot a insertar:', chatbotToInsert);
  
      const { data, error } = await supabase
        .from('chatbots')
        .insert(chatbotToInsert)
        .select();
  
      console.log('Resultado de inserción:', { data, error });
  
      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }
  
      // Actualizar el estado local
      const currentChatbots = get().chatbots;
      set({ 
        chatbots: data ? [data[0], ...currentChatbots] : currentChatbots, 
        loading: false 
      });
  
      console.log('Chatbot creado:', data);
    } catch (error) {
      console.error('Error al crear chatbot:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al crear chatbot', 
        loading: false 
      });
      throw error;
    }
  },
  
  updateChatbot: async (id, chatbot) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');
  
      console.log('Actualizando chatbot:', { id, chatbot, userId: user.id });
  
      // Validar que los campos necesarios estén presentes
      if (!chatbot.nombre) throw new Error('El nombre es obligatorio');
  
      const { data, error } = await supabase
        .from('chatbots')
        .update({
          nombre: chatbot.nombre,
          estado: chatbot.estado ?? true
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select();
  
      console.log('Resultado de actualización:', { data, error });
  
      if (error) {
        console.error('Error de Supabase al actualizar:', error);
        throw error;
      }
  
      // Verificar si se actualizó correctamente
      if (!data || data.length === 0) {
        throw new Error('No se encontró el chatbot para actualizar');
      }
  
      // Actualizar el estado local
      const currentChatbots = get().chatbots;
      const updatedChatbots = currentChatbots.map(c => 
        c.id === id ? { ...c, ...data[0] } : c
      );
  
      set({ 
        chatbots: updatedChatbots, 
        loading: false 
      });
  
      console.log('Chatbot actualizado exitosamente');
    } catch (error) {
      console.error('Error completo al actualizar chatbot:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al actualizar chatbot', 
        loading: false 
      });
      throw error;
    }
  },

  deleteChatbot: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('chatbots')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Actualizar el estado local
      const currentChatbots = get().chatbots;
      set({ 
        chatbots: currentChatbots.filter(c => c.id !== id), 
        loading: false 
      });
    } catch (error) {
      console.error('Error al eliminar chatbot:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al eliminar chatbot', 
        loading: false 
      });
      throw error;
    }
  }
}));