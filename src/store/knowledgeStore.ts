import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { KnowledgePrompt } from '../types/database';
import { EmbeddingService } from '../services/database/embeddingService';

interface KnowledgeState {
  knowledgePrompts: KnowledgePrompt[];
  loading: boolean;
  error: string | null;
}

interface KnowledgeActions {
  fetchKnowledgePrompts: () => Promise<void>;
  createKnowledgePrompt: (knowledge: Omit<KnowledgePrompt, 'id' | 'created_at' | 'updated_at' | 'embedding'>) => Promise<void>;
  updateKnowledgePrompt: (id: string, knowledge: Partial<KnowledgePrompt>) => Promise<void>;
  deleteKnowledgePrompt: (id: string) => Promise<void>;
}

type KnowledgeStore = KnowledgeState & KnowledgeActions;

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  knowledgePrompts: [],
  loading: false,
  error: null,

  fetchKnowledgePrompts: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error }: { data: KnowledgePrompt[] | null, error: any } = await supabase
        .from('knowledge_prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ knowledgePrompts: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching knowledge prompts:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error fetching knowledge prompts', 
        loading: false,
        knowledgePrompts: []
      });
    }
  },

  createKnowledgePrompt: async (knowledge) => {
    try {
      set({ loading: true, error: null });
      
      if (!knowledge.chatbot_id || !knowledge.prompt_text || !knowledge.category) {
        throw new Error('Faltan campos requeridos');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const data = await EmbeddingService.createKnowledgePrompt(
        user.id,
        knowledge.chatbot_id,
        knowledge.prompt_text,
        knowledge.category
      );

      const currentPrompts = get().knowledgePrompts;
      set({ 
        knowledgePrompts: data ? [data, ...currentPrompts] : currentPrompts,
        loading: false 
      });
    } catch (error) {
      console.error('Create knowledge prompt error:', error);
      set({ 
        error: error instanceof Error 
          ? `Error al crear conocimiento: ${error.message}` 
          : 'Error inesperado al crear conocimiento',
        loading: false 
      });
    }
  },

  updateKnowledgePrompt: async (id, knowledge) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const updateData = {
        ...knowledge,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('knowledge_prompts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No se encontró el prompt de conocimiento');
      }

      set({
        knowledgePrompts: get().knowledgePrompts.map(k => k.id === id ? data[0] : k),
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

  deleteKnowledgePrompt: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('knowledge_prompts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      set({
        knowledgePrompts: get().knowledgePrompts.filter(k => k.id !== id),
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
  }
}));

