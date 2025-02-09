import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { ConversationContext } from '../types/database';

interface ConversationContextState {
  conversationContexts: ConversationContext[];
  loading: boolean;
  error: string | null;
  fetchConversationContexts: () => Promise<void>;
  createConversationContext: (conversationContext: Partial<ConversationContext>) => Promise<void>;
  updateConversationContext: (id: string, conversationContext: Partial<ConversationContext>) => Promise<void>;
  deleteConversationContext: (id: string) => Promise<void>;
}

export const useConversationContextStore = create<ConversationContextState>((set, get) => ({
  conversationContexts: [],
  loading: false,
  error: null,

  fetchConversationContexts: async () => {
    set({ loading: true, error: null });
    try {
      console.log('Iniciando fetchConversationContexts');
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Usuario autenticado:', user);
      
      if (!user) {
        console.warn('No hay usuario autenticado');
        throw new Error('No hay usuario autenticado');
      }

      const { data, error } = await supabase
        .from('conversation_context')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Datos recuperados:', data);
      console.log('Error:', error);

      if (error) throw error;
      
      set({ 
        conversationContexts: data || [], 
        loading: false,
        error: null 
      });
    } catch (error) {
      console.error('Error detallado al cargar contextos de conversación:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error desconocido', 
        loading: false,
        conversationContexts: [] 
      });
      throw error;
    }
  },

  createConversationContext: async (conversationContext) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const contextToInsert = {
        user_id: user.id,
        role: conversationContext.role || 'user',
        content: conversationContext.content || '',
        phone_number: conversationContext.phone_number || '',
        metadata: conversationContext.metadata || {},
        timestamp: new Date().toISOString()
      };

      console.log('Insertando contexto:', contextToInsert);

      const { data, error } = await supabase
        .from('conversation_context')
        .insert(contextToInsert)
        .select();

      console.log('Resultado de inserción:', data);
      console.log('Error de inserción:', error);

      if (error) throw error;

      const currentContexts = get().conversationContexts;
      set({ 
        conversationContexts: data ? [data[0], ...currentContexts] : currentContexts, 
        loading: false 
      });
    } catch (error) {
      console.error('Error al crear contexto de conversación:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al crear contexto', 
        loading: false 
      });
      throw error;
    }
  },

  updateConversationContext: async (id, conversationContext) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('conversation_context')
        .update({
          role: conversationContext.role,
          content: conversationContext.content,
          phone_number: conversationContext.phone_number,
          metadata: conversationContext.metadata
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      const currentContexts = get().conversationContexts;
      const updatedContexts = currentContexts.map(c => 
        c.id === id ? { ...c, ...data[0] } : c
      );

      set({ 
        conversationContexts: updatedContexts, 
        loading: false 
      });
    } catch (error) {
      console.error('Error al actualizar contexto de conversación:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al actualizar contexto', 
        loading: false 
      });
      throw error;
    }
  },

  deleteConversationContext: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('conversation_context')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      const currentContexts = get().conversationContexts;
      set({ 
        conversationContexts: currentContexts.filter(c => c.id !== id), 
        loading: false 
      });
    } catch (error) {
      console.error('Error al eliminar contexto de conversación:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al eliminar contexto', 
        loading: false 
      });
      throw error;
    }
  },
}));