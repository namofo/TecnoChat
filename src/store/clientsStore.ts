import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Client } from '../types/database';

interface ClientsState {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  createClient: (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  loading: false,
  error: null,

  fetchClients: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ clients: data || [] });
    } catch (error) {
      set({ error: 'Error al cargar los clientes' });
    } finally {
      set({ loading: false });
    }
  },

  createClient: async (client) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('clients')
        .insert([{
          ...client,
          user_id: user.id
        }]);

      if (error) throw error;
      
      const { data: newClients } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
        
      set({ clients: newClients || [] });
    } catch (error: any) {
      set({ error: error.message || 'Error al crear el cliente' });
    } finally {
      set({ loading: false });
    }
  },

  updateClient: async (id, client) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('clients')
        .update(client)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      const { data: updatedClients } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      set({ clients: updatedClients || [] });
    } catch (error: any) {
      set({ error: error.message || 'Error al actualizar el cliente' });
    } finally {
      set({ loading: false });
    }
  },

  deleteClient: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      set((state) => ({
        clients: state.clients.filter((client) => client.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Error al eliminar el cliente' });
    } finally {
      set({ loading: false });
    }
  },
}));