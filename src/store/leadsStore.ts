// src/store/leadsStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Lead } from '../types/database';

interface LeadsStore {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  fetchLeads: () => Promise<void>;
  createLead: (lead: Lead) => Promise<void>;
  updateLead: (id: string, lead: Lead) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
}

export const useLeadsStore = create<LeadsStore>((set) => ({
  leads: [],
  loading: false,
  error: null,
  
  fetchLeads: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('leads').select('*');
    if (error) {
      set({ error: error.message });
    } else {
      set({ leads: data || [], error: null });
    }
    set({ loading: false });
  },

  createLead: async (lead: Lead) => {
    const { error } = await supabase.from('leads').insert([lead]);
    if (error) {
      set({ error: error.message });
    } else {
      set((state) => ({ leads: [...state.leads, lead], error: null }));
    }
  },

  updateLead: async (id: string, lead: Lead) => {
    const { error } = await supabase.from('leads').update(lead).eq('id', id);
    if (error) {
      set({ error: error.message });
    } else {
      set((state) => ({
        leads: state.leads.map((l) => (l.id === id ? { ...l, ...lead } : l)),
        error: null,
      }));
    }
  },

  deleteLead: async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      set({ error: error.message });
    } else {
      set((state) => ({
        leads: state.leads.filter((lead) => lead.id !== id),
        error: null,
      }));
    }
  },
}));