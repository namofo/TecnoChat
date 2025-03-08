// src/store/flowsStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { BotFlow } from '../types/database';

interface FlowsState {
  flows: BotFlow[];
  loading: boolean;
  error: string | null;
}

interface FlowsActions {
  fetchFlows: () => Promise<void>;
  createFlow: (flow: Omit<BotFlow, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateFlow: (id: string, flow: Partial<BotFlow>) => Promise<void>;
  deleteFlow: (id: string) => Promise<void>;
  updateFlowOptimistic: (id: string, update: Partial<BotFlow>) => Promise<void>;
}

type FlowsStore = FlowsState & FlowsActions;

export const useFlowsStore = create<FlowsStore>((set, get) => ({
  flows: [],
  loading: false,
  error: null,

  fetchFlows: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('bot_flows')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (error) throw error;

      set({ flows: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching flows:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error fetching flows', 
        loading: false,
        flows: []
      });
    }
  },

  createFlow: async (flow: Omit<BotFlow, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      set({ loading: true, error: null });
      
      if (!flow.chatbot_id || !flow.keyword || !flow.response_text) {
        throw new Error('Faltan campos requeridos');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      // Convertir el string o array de keywords a array
      const keywords = Array.isArray(flow.keyword) 
        ? flow.keyword
        : (flow.keyword as string).split(',').map(k => k.trim());

      const flowToInsert = {
        ...flow,
        keyword: keywords,
        user_id: user.id,
        is_active: flow.is_active ?? true,
        priority: flow.priority ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bot_flows')
        .insert([flowToInsert])
        .select();

      if (error) throw error;

      const currentFlows = get().flows;
      set({ 
        flows: data ? [...currentFlows, data[0]] : currentFlows,
        loading: false 
      });
    } catch (error) {
      handleStoreError(error, set);
    }
  },

  updateFlow: async (id, flow) => {
    set({ loading: true, error: null });
    try {
      if (flow.keyword) {
        // Convertir string de keywords a array para PostgreSQL
        flow.keyword = typeof flow.keyword === 'string'
          ? (flow.keyword as string).split(',').map(k => k.trim())
          : flow.keyword;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const updateData = {
        ...flow,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bot_flows')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)  // Asegurar que el usuario sea el propietario
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No se encontró el flujo de bot');
      }

      // Actualizar el estado local
      set({
        flows: get().flows.map(f => f.id === id ? data[0] : f),
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

  deleteFlow: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('bot_flows')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);  // Asegurar que el usuario sea el propietario

      if (error) throw error;

      set({
        flows: get().flows.filter(f => f.id !== id),
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

  updateFlowOptimistic: async (id: string, update: Partial<BotFlow>) => {
    const previousFlows = get().flows;
    
    try {
      // Actualizar UI inmediatamente
      set(state => ({
        flows: state.flows.map(f => 
          f.id === id ? { ...f, ...update } : f
        )
      }));

      // Luego actualizar en la DB
      const { error } = await supabase
        .from('bot_flows')
        .update(update)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      // Revertir en caso de error
      set({ flows: previousFlows });
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