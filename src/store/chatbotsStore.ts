// src/store/chatbotsStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Chatbot } from '../types/database';

interface ChatbotsState {
  chatbots: Chatbot[];
  loading: boolean;
  error: string | null;
}

interface ChatbotsActions {
  fetchChatbots: () => Promise<void>;
  createChatbot: (chatbot: Omit<Chatbot, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateChatbot: (id: string, chatbot: Partial<Chatbot>) => Promise<void>;
  deleteChatbot: (id: string) => Promise<void>;
  updateChatbotOptimistic: (id: string, update: Partial<Chatbot>) => Promise<void>;
}

type ChatbotsStore = ChatbotsState & ChatbotsActions;

export const useChatbotsStore = create<ChatbotsStore>((set, get) => ({
  chatbots: [],
  loading: false,
  error: null,

  fetchChatbots: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ chatbots: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching chatbots:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error fetching chatbots', 
        loading: false,
        chatbots: []
      });
    }
  },

  createChatbot: async (chatbot) => {
    try {
      set({ loading: true, error: null });
      
      if (!chatbot.name_chatbot || !chatbot.description) {
        throw new Error('Faltan campos requeridos');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const chatbotToInsert = {
        ...chatbot,
        user_id: user.id,
        is_active: chatbot.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('chatbots')
        .insert([chatbotToInsert])
        .select();

      if (error) throw error;

      const currentChatbots = get().chatbots;
      set({ 
        chatbots: data ? [data[0], ...currentChatbots] : currentChatbots,
        loading: false 
      });
    } catch (error) {
      handleStoreError(error, set);
    }
  },

  updateChatbot: async (id, chatbot) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const updateData = {
        ...chatbot,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('chatbots')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No se encontró el chatbot');
      }

      set({
        chatbots: get().chatbots.map(c => c.id === id ? data[0] : c),
        loading: false
      });
    } catch (error) {
      console.error('Error al actualizar:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al actualizar', 
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

      set({
        chatbots: get().chatbots.filter(c => c.id !== id),
        loading: false
      });
    } catch (error) {
      console.error('Error al eliminar:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al eliminar', 
        loading: false 
      });
      throw error;
    }
  },

  updateChatbotOptimistic: async (id: string, update: Partial<Chatbot>) => {
    const previousChatbots = get().chatbots;
    
    try {
      set(state => ({
        chatbots: state.chatbots.map(c => 
          c.id === id ? { ...c, ...update } : c
        )
      }));

      const { error } = await supabase
        .from('chatbots')
        .update(update)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      set({ chatbots: previousChatbots });
      handleStoreError(error, set);
    }
  }
}));

const handleStoreError = (error: unknown, set: any) => {
  console.error('Store error:', error);
  set({ 
    error: error instanceof Error ? error.message : 'Error inesperado',
    loading: false 
  });
  throw error;
};