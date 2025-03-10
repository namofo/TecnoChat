import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Blacklist } from '../types/database';

interface BlacklistState {
  blockedNumbers: Blacklist[];
  loading: boolean;
  error: string | null;
}

interface BlacklistActions {
  fetchBlockedNumbers: () => Promise<void>;
  createBlockedNumber: (blacklist: Omit<Blacklist, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBlockedNumber: (id: string, blacklist: Partial<Blacklist>) => Promise<void>;
  deleteBlockedNumber: (id: string) => Promise<void>;
}

type BlacklistStore = BlacklistState & BlacklistActions;

export const useBlacklistStore = create<BlacklistStore>((set, get) => ({
  blockedNumbers: [],
  loading: false,
  error: null,

  fetchBlockedNumbers: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('blacklist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ blockedNumbers: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching blacklist:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al cargar números bloqueados', 
        loading: false,
        blockedNumbers: []
      });
    }
  },

  createBlockedNumber: async (blacklist) => {
    try {
      set({ loading: true, error: null });
      
      if (!blacklist.chatbot_id || !blacklist.phone_number) {
        throw new Error('Faltan campos requeridos');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const blacklistToInsert = {
        ...blacklist,
        user_id: user.id,
        is_active: blacklist.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('blacklist')
        .insert([blacklistToInsert])
        .select();

      if (error) throw error;

      const currentBlacklist = get().blockedNumbers;
      set({ 
        blockedNumbers: data ? [data[0], ...currentBlacklist] : currentBlacklist,
        loading: false 
      });
    } catch (error) {
      handleStoreError(error, set);
    }
  },

  updateBlockedNumber: async (id, blacklist) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const updateData = {
        ...blacklist,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('blacklist')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No se encontró el número bloqueado');
      }

      set({
        blockedNumbers: get().blockedNumbers.map(b => b.id === id ? data[0] : b),
        loading: false
      });
    } catch (error) {
      handleStoreError(error, set);
    }
  },

  deleteBlockedNumber: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('blacklist')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      set({
        blockedNumbers: get().blockedNumbers.filter(b => b.id !== id),
        loading: false
      });
    } catch (error) {
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