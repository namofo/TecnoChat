import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { BehaviorPrompt } from '../types/database';
import { EmbeddingService } from '../services/database/embeddingService';

interface BehaviorState {
  behaviors: BehaviorPrompt[];
  loading: boolean;
  error: string | null;
}

interface BehaviorActions {
  fetchBehaviors: () => Promise<void>;
  createBehavior: (behavior: Omit<BehaviorPrompt, 'id' | 'created_at' | 'updated_at' | 'embedding'>) => Promise<void>;
  updateBehavior: (id: string, behavior: Partial<BehaviorPrompt>) => Promise<void>;
  deleteBehavior: (id: string) => Promise<void>;
  updateBehaviorOptimistic: (id: string, update: Partial<BehaviorPrompt>) => Promise<void>;
}

type BehaviorStore = BehaviorState & BehaviorActions;

export const useBehaviorStore = create<BehaviorStore>((set, get) => ({
  behaviors: [],
  loading: false,
  error: null,

  fetchBehaviors: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error }: { data: BehaviorPrompt[] | null, error: any } = await supabase
        .from('behavior_prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ behaviors: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching behaviors:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error fetching behaviors', 
        loading: false,
        behaviors: []
      });
    }
  },

  createBehavior: async (behavior) => {
    try {
      set({ loading: true, error: null });
      
      if (!behavior.chatbot_id || !behavior.prompt_text) {
        throw new Error('Faltan campos requeridos');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      // Usar el servicio directamente
      const data = await EmbeddingService.createBehaviorPrompt(
        user.id,
        behavior.chatbot_id,
        behavior.prompt_text
      );

      const currentBehaviors = get().behaviors;
      set({ 
        behaviors: data ? [data, ...currentBehaviors] : currentBehaviors,
        loading: false 
      });
    } catch (error) {
      console.error('Create behavior error:', error);
      set({ 
        error: error instanceof Error 
          ? `Error al crear comportamiento: ${error.message}` 
          : 'Error inesperado al crear comportamiento',
        loading: false 
      });
    }
  },

  updateBehavior: async (id, behavior) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const updateData = {
        ...behavior,
        updated_at: new Date().toISOString()
      };

      // Corregir la llamada al update agregando .select()
      const { data, error } = await supabase
        .from('behavior_prompts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(); // Agregar select() para obtener los datos actualizados

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No se encontró el prompt de comportamiento');
      }

      set({
        behaviors: get().behaviors.map(b => b.id === id ? data[0] : b),
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

  deleteBehavior: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('behavior_prompts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      set({
        behaviors: get().behaviors.filter(b => b.id !== id),
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

  updateBehaviorOptimistic: async (id: string, update: Partial<BehaviorPrompt>) => {
    const previousBehaviors = get().behaviors;
    
    try {
      set(state => ({
        behaviors: state.behaviors.map(b => 
          b.id === id ? { ...b, ...update } : b
        )
      }));

      const { error } = await supabase
        .from('behavior_prompts')
        .update(update)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      set({ behaviors: previousBehaviors });
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