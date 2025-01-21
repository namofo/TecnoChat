import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Contact } from '../types/database';

interface ContactsState {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  fetchContacts: () => Promise<void>;
  createContact: (contact: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

export const useContactsStore = create<ContactsState>((set) => ({
  contacts: [],
  loading: false,
  error: null,

  fetchContacts: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ contacts: data || [] });
    } catch (error) {
      set({ error: 'Error al cargar los contactos' });
    } finally {
      set({ loading: false });
    }
  },

  createContact: async (contact) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('contacts')
        .insert([{
          ...contact,
          user_id: user.id
        }]);

      if (error) throw error;
      
      // Recargar los contactos después de crear uno nuevo
      const { data: newContacts } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
        
      set({ contacts: newContacts || [] });
    } catch (error: any) {
      set({ error: error.message || 'Error al crear el contacto' });
    } finally {
      set({ loading: false });
    }
  },

  updateContact: async (id, contact) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('contacts')
        .update(contact)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Recargar los contactos después de actualizar
      const { data: updatedContacts } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      set({ contacts: updatedContacts || [] });
    } catch (error: any) {
      set({ error: error.message || 'Error al actualizar el contacto' });
    } finally {
      set({ loading: false });
    }
  },

  deleteContact: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      set((state) => ({
        contacts: state.contacts.filter((contact) => contact.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Error al eliminar el contacto' });
    } finally {
      set({ loading: false });
    }
  },
}));