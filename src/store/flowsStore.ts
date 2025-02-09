// src/store/flowsStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Flow } from '../types/database';

interface FlowsState {
  flows: Flow[];
  loading: boolean;
  error: string | null;
  fetchFlows: () => Promise<void>;
  createFlow: (flow: Partial<Flow>) => Promise<void>;
  updateFlow: (id: string, flow: Partial<Flow>) => Promise<void>;
  deleteFlow: (id: string) => Promise<void>;
}

export const useFlowsStore = create<FlowsState>((set, get) => ({
  flows: [],
  loading: false,
  error: null,

  fetchFlows: async () => {
    set({ loading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('flows')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ flows: data || [], loading: false });
    } catch (error) {
      console.error('Error al cargar flows:', error);
      set({ error: error instanceof Error ? error.message : 'Error desconocido', loading: false });
    }
  },

  createFlow: async (flow) => {
    set({ loading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No hay usuario autenticado');

      const flowToInsert = {
        user_id: userData.user.id,
        ...flow,
        created_at: new Date().toISOString(), // Agregar fecha de creación
        updated_at: new Date().toISOString()  // Agregar fecha de actualización
      };

      const { data, error } = await supabase
        .from('flows')
        .insert(flowToInsert)
        .select();

      if (error) throw error;

      const currentFlows = get().flows;
      set({ flows: data ? [data[0], ...currentFlows] : currentFlows, loading: false });
    } catch (error) {
      console.error('Error al crear flow:', error);
      set({ error: error instanceof Error ? error.message : 'Error al crear flow', loading: false });
    }
  },

  updateFlow: async (id, flow) => {
    set({ loading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('flows')
        .update(flow)
        .eq('id', id)
        .eq('user_id', userData.user.id);

      if (error) throw error;

      const currentFlows = get().flows;
      const updatedFlows = currentFlows.map(f => (f.id === id ? { ...f, ...flow } : f));
      set({ flows: updatedFlows, loading: false });
    } catch (error) {
      console.error('Error al actualizar flow:', error);
      set({ error: error instanceof Error ? error.message : 'Error al actualizar flow', loading: false });
    }
  },

  deleteFlow: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('flows')
        .delete()
        .eq('id', id)
        .eq('user_id', userData.user.id);

      if (error) throw error;

      const currentFlows = get().flows;
      set({ flows: currentFlows.filter(f => f.id !== id), loading: false });
    } catch (error) {
      console.error('Error al eliminar flow:', error);
      set({ error: error instanceof Error ? error.message : 'Error al eliminar flow', loading: false });
    }
  },
}));