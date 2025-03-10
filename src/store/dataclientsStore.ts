// src/store/dataclientsStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { ClientData } from '../types/database';

interface DataClientsState {
  clientsData: ClientData[];
  loading: boolean;
  error: string | null;
}

interface DataClientsActions {
  fetchClientsData: () => Promise<void>;
  createClientData: (client: Omit<ClientData, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateClientData: (id: string, client: Partial<ClientData>) => Promise<void>;
  deleteClientData: (id: string) => Promise<void>;
}

type DataClientsStore = DataClientsState & DataClientsActions;

export const useDataClientsStore = create<DataClientsStore>((set, get) => ({
  clientsData: [],
  loading: false,
  error: null,

  fetchClientsData: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('client_data')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ clientsData: data || [], loading: false });
    } catch (error) {
      handleStoreError(error, set);
    }
  },

  createClientData: async (client) => {
    try {
      set({ loading: true, error: null });
      
      if (!client.chatbot_id || !client.full_name || !client.phone_number) {
        throw new Error('Faltan campos requeridos');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('client_data')
        .insert([{
          ...client,
          user_id: user.id,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      const currentClientsData = get().clientsData;
      set({ 
        clientsData: data ? [data[0], ...currentClientsData] : currentClientsData,
        loading: false 
      });
    } catch (error) {
      handleStoreError(error, set);
    }
  },

  updateClientData: async (id, client) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('client_data')
        .update(client)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No se encontró el cliente');
      }

      set({
        clientsData: get().clientsData.map(c => c.id === id ? data[0] : c),
        loading: false
      });
    } catch (error) {
      handleStoreError(error, set);
    }
  },

  deleteClientData: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('client_data')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      set({
        clientsData: get().clientsData.filter(c => c.id !== id),
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