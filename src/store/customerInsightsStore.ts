import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { CustomerInsight } from '../types/database';

interface CustomerInsightsState {
  customerInsights: CustomerInsight[];
  loading: boolean;
  error: string | null;
  fetchCustomerInsights: () => Promise<void>;
  createCustomerInsight: (customerInsight: Partial<CustomerInsight>) => Promise<void>;
  updateCustomerInsight: (id: string, customerInsight: Partial<CustomerInsight>) => Promise<void>;
  deleteCustomerInsight: (id: string) => Promise<void>;
}

export const useCustomerInsightsStore = create<CustomerInsightsState>((set, get) => ({
  customerInsights: [],
  loading: false,
  error: null,

  fetchCustomerInsights: async () => {
    set({ loading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('customer_insights')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedInsights: CustomerInsight[] = data ? data.map(item => ({
        id: item.id || '',
        user_id: item.user_id || '',
        phone_number: item.phone_number || '',
        customer_type: item.customer_type || '',
        confidence_score: parseFloat(item.confidence_score) || 0,
        last_interaction: item.last_interaction || new Date().toISOString(),
        interaction_count: parseInt(item.interaction_count) || 0,
        metadata: item.metadata || {},
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at
      })) : [];

      set({ 
        customerInsights: typedInsights, 
        loading: false,
        error: null 
      });
    } catch (error) {
      console.error('Error al cargar customer insights:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error desconocido', 
        loading: false,
        customerInsights: [] 
      });
      throw error;
    }
  },

  createCustomerInsight: async (customerInsight) => {
    set({ loading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No hay usuario autenticado');

      const insightToInsert = {
        user_id: userData.user.id,
        phone_number: customerInsight.phone_number || '',
        customer_type: customerInsight.customer_type || 'potencialmente_interesado',
        confidence_score: customerInsight.confidence_score || 0,
        last_interaction: customerInsight.last_interaction || new Date().toISOString(),
        interaction_count: customerInsight.interaction_count || 0,
        metadata: customerInsight.metadata || {}
      };

      const { data, error } = await supabase
        .from('customer_insights')
        .insert(insightToInsert)
        .select();

      if (error) throw error;

      const currentInsights = get().customerInsights;
      set({ 
        customerInsights: data ? [data[0], ...currentInsights] : currentInsights, 
        loading: false 
      });
    } catch (error) {
      console.error('Error al crear customer insight:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al crear insight', 
        loading: false 
      });
      throw error;
    }
  },

  updateCustomerInsight: async (id, customerInsight) => {
    set({ loading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('customer_insights')
        .update({
          phone_number: customerInsight.phone_number,
          customer_type: customerInsight.customer_type,
          confidence_score: customerInsight.confidence_score,
          last_interaction: customerInsight.last_interaction,
          interaction_count: customerInsight.interaction_count,
          metadata: customerInsight.metadata
        })
        .eq('id', id)
        .eq('user_id', userData.user.id)
        .select();

      if (error) throw error;

      const currentInsights = get().customerInsights;
      const updatedInsights = currentInsights.map(c => 
        c.id === id ? { ...c, ...data[0] } : c
      );

      set({ 
        customerInsights: updatedInsights, 
        loading: false 
      });
    } catch (error) {
      console.error('Error al actualizar customer insight:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al actualizar insight', 
        loading: false 
      });
      throw error;
    }
  },

  deleteCustomerInsight: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('customer_insights')
        .delete()
        .eq('id', id)
        .eq('user_id', userData.user.id);

      if (error) throw error;

      const currentInsights = get().customerInsights;
      set({ 
        customerInsights: currentInsights.filter(c => c.id !== id), 
        loading: false 
      });
    } catch (error) {
      console.error('Error al eliminar customer insight:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al eliminar insight', 
        loading: false 
      });
      throw error;
    }
  },
}));