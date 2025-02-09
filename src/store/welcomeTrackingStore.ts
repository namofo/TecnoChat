import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { WelcomeTracking } from '../types/database';

interface WelcomeTrackingState {
  welcomeTrackings: WelcomeTracking[];
  loading: boolean;
  error: string | null;
  fetchWelcomeTrackings: () => Promise<void>;
  createWelcomeTracking: (welcomeTracking: Omit<WelcomeTracking, 'id' | 'created_at'>) => Promise<void>;
  updateWelcomeTracking: (id: number, welcomeTracking: Partial<WelcomeTracking>) => Promise<void>;
  deleteWelcomeTracking: (id: number) => Promise<void>;
}

export const useWelcomeTrackingStore = create<WelcomeTrackingState>((set) => ({
  welcomeTrackings: [],
  loading: false,
  error: null,

  fetchWelcomeTrackings: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('welcome_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ welcomeTrackings: data || [] });
    } catch (error) {
      set({ error: 'Error al cargar el seguimiento de bienvenidas' });
    } finally {
      set({ loading: false });
    }
  },

  createWelcomeTracking: async (welcomeTracking) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('welcome_tracking')
        .insert([{
          ...welcomeTracking,
          user_id: user.id
        }]);

      if (error) throw error;
      await useWelcomeTrackingStore.getState().fetchWelcomeTrackings();
    } catch (error) {
      set({ error: 'Error al crear el seguimiento de bienvenida' });
    } finally {
      set({ loading: false });
    }
  },

  updateWelcomeTracking: async (id, welcomeTracking) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('welcome_tracking')
        .update(welcomeTracking)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await useWelcomeTrackingStore.getState().fetchWelcomeTrackings();
    } catch (error) {
      set({ error: 'Error al actualizar el seguimiento de bienvenida' });
    } finally {
      set({ loading: false });
    }
  },

  deleteWelcomeTracking: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('welcome_tracking')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await useWelcomeTrackingStore.getState().fetchWelcomeTrackings();
    } catch (error) {
      set({ error: 'Error al eliminar el seguimiento de bienvenida' });
    } finally {
      set({ loading: false });
    }
  }
}));