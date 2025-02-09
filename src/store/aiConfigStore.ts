// Ruta: e:\project\src\store\aiConfigStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { AiConfig } from '../types/database';

interface AiConfigState {
  aiConfigs: AiConfig[];
  loading: boolean;
  error: string | null;
  fetchAiConfigs: () => Promise<void>;
  createAiConfig: (settings: AiConfig['settings'], enabled?: boolean) => Promise<void>;
  updateAiConfig: (id: string, settings: Partial<AiConfig['settings']>, enabled?: boolean) => Promise<void>;
  deleteAiConfig: (id: string) => Promise<void>;
}

export const useAiConfigStore = create<AiConfigState>((set, get) => ({
  aiConfigs: [],
  loading: false,
  error: null,

  fetchAiConfigs: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('ai_config')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ aiConfigs: data || [], loading: false });
    } catch (error) {
      console.error('Error al cargar configuraciones:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error desconocido', 
        loading: false 
      });
    }
  },

  createAiConfig: async (settings, enabled = true) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('ai_config')
        .insert({
          user_id: user.id,
          enabled,
          settings
        })
        .select();

      if (error) throw error;

      set({
        aiConfigs: data ? [...get().aiConfigs, data[0]] : get().aiConfigs,
        loading: false
      });
    } catch (error) {
      console.error('Error al crear configuración:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al crear configuración', 
        loading: false 
      });
      throw error;
    }
  },

  updateAiConfig: async (id, settings, enabled) => {
    set({ loading: true, error: null });
    try {
      const updateData: { settings?: AiConfig['settings'], enabled?: boolean } = {};
      if (settings) updateData.settings = settings;
      if (enabled !== undefined) updateData.enabled = enabled;

      const { data, error } = await supabase
        .from('ai_config')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;

      set({
        aiConfigs: get().aiConfigs.map(config => 
          config.id === id ? data[0] : config
        ),
        loading: false
      });
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al actualizar configuración', 
        loading: false 
      });
      throw error;
    }
  },

  deleteAiConfig: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('ai_config')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set({
        aiConfigs: get().aiConfigs.filter(config => config.id !== id),
        loading: false
      });
    } catch (error) {
      console.error('Error al eliminar configuración:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al eliminar configuración', 
        loading: false 
      });
      throw error;
    }
  }
}));