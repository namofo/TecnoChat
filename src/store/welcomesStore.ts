// src/store/welcomesStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Welcome } from '../types/database';

interface WelcomesStore {
  welcomes: Welcome[];
  loading: boolean;
  error: string | null;
  fetchWelcomes: () => Promise<void>;
  createWelcome: (welcome: Omit<Welcome, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateWelcome: (id: string, welcome: Partial<Welcome>) => Promise<void>;
  deleteWelcome: (id: string) => Promise<void>;
}

export const useWelcomesStore = create<WelcomesStore>((set, get) => ({
  welcomes: [],
  loading: false,
  error: null,

  fetchWelcomes: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.from('welcomes').select('*');
      if (error) throw error;

      set({ welcomes: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching welcomes:', error);
      set({ error: error instanceof Error ? error.message : 'Error fetching welcomes', loading: false });
    }
  },

  createWelcome: async (welcome) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('welcomes')
        .insert({
          ...welcome,
          user_id: user.id,
        })
        .select();

      if (error) throw error;

      set({
        welcomes: data ? [...get().welcomes, data[0]] : get().welcomes,
        loading: false
      });
    } catch (error) {
      console.error('Error al crear mensaje de bienvenida:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al crear mensaje de bienvenida', 
        loading: false 
      });
      throw error;
    }
  },

  updateWelcome: async (id, welcome) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('welcomes')
        .update(welcome)
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        set({
          welcomes: get().welcomes.map(doc => 
            doc.id === id ? data[0] : doc
          ),
          loading: false
        });
      } else {
        throw new Error('No se encontró el mensaje de bienvenida actualizado');
      }
    } catch (error) {
      console.error('Error al actualizar mensaje de bienvenida:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al actualizar mensaje de bienvenida', 
        loading: false 
      });
      throw error;
    }
  },

  deleteWelcome: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('welcomes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set({
        welcomes: get().welcomes.filter(doc => doc.id !== id),
        loading: false
      });
    } catch (error) {
      console.error('Error al eliminar mensaje de bienvenida:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al eliminar mensaje de bienvenida', 
        loading: false 
      });
      throw error;
    }
  }
}));