// src/store/welcomesStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Welcome } from '../types/database';

// 1. Mejorar el tipado del store
interface WelcomesState {
  welcomes: Welcome[];
  loading: boolean;
  error: string | null;
}

interface WelcomesActions {
  fetchWelcomes: () => Promise<void>;
  createWelcome: (welcome: Omit<Welcome, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateWelcome: (id: string, welcome: Partial<Welcome>) => Promise<void>;
  deleteWelcome: (id: string) => Promise<void>;
  updateWelcomeOptimistic: (id: string, update: Partial<Welcome>) => Promise<void>;
}

type WelcomesStore = WelcomesState & WelcomesActions;

// 2. Agregar selectores para mejor rendimiento
export const useWelcomesStore = create<WelcomesStore>((set, get) => ({
  welcomes: [],
  loading: false,
  error: null,

  fetchWelcomes: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('welcomes')
        .select('*')
        .eq('user_id', user.id)  // Filtrar por user_id
        .order('created_at', { ascending: false });  // Ordenar por fecha

      if (error) throw error;

      set({ welcomes: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching welcomes:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error fetching welcomes', 
        loading: false,
        welcomes: [] // Limpiar welcomes en caso de error
      });
    }
  },

  // 3. Mejorar el manejo de errores y validaciones
  createWelcome: async (welcome) => {
    try {
      set({ loading: true, error: null });
      
      // Validaciones
      if (!welcome.chatbot_id || !welcome.welcome_message) {
        throw new Error('Faltan campos requeridos');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const welcomeToInsert = {
        ...welcome,
        user_id: user.id,
        is_active: welcome.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('welcomes')
        .insert([welcomeToInsert])
        .select();

      if (error) throw error;

      // Actualizar el estado y recargar la lista
      const currentWelcomes = get().welcomes;
      set({ 
        welcomes: data ? [data[0], ...currentWelcomes] : currentWelcomes,
        loading: false 
      });
    } catch (error) {
      handleStoreError(error, set);
    }
  },

  updateWelcome: async (id, welcome) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const updateData = {
        ...welcome,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('welcomes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)  // Asegurar que el usuario sea el propietario
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No se encontró el mensaje de bienvenida');
      }

      // Actualizar el estado local
      set({
        welcomes: get().welcomes.map(w => w.id === id ? data[0] : w),
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

  deleteWelcome: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('welcomes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);  // Asegurar que el usuario sea el propietario

      if (error) throw error;

      set({
        welcomes: get().welcomes.filter(w => w.id !== id),
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

  // 4. Agregar método de utilidad para actualización optimista
  updateWelcomeOptimistic: async (id: string, update: Partial<Welcome>) => {
    const previousWelcomes = get().welcomes;
    
    try {
      // Actualizar UI inmediatamente
      set(state => ({
        welcomes: state.welcomes.map(w => 
          w.id === id ? { ...w, ...update } : w
        )
      }));

      // Luego actualizar en la DB
      const { error } = await supabase
        .from('welcomes')
        .update(update)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      // Revertir en caso de error
      set({ welcomes: previousWelcomes });
      handleStoreError(error, set);
    }
  }
}));

// 5. Agregar utilidades para manejo de errores
const handleStoreError = (error: unknown, set: any) => {
  console.error('Store error:', error);
  set({ 
    error: error instanceof Error ? error.message : 'Error inesperado',
    loading: false 
  });
  throw error;
};