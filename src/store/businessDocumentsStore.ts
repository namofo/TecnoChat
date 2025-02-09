// e:\project\src\store\businessDocumentsStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { BusinessDocument } from '../types/database';

interface BusinessDocumentsState {
  businessDocuments: BusinessDocument[];
  loading: boolean;
  error: string | null;
  fetchBusinessDocuments: () => Promise<void>;
  createBusinessDocument: (businessDocument: Omit<BusinessDocument, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBusinessDocument: (id: string, businessDocument: Partial<BusinessDocument>) => Promise<void>;
  deleteBusinessDocument: (id: string) => Promise<void>;
}

export const useBusinessDocumentsStore = create<BusinessDocumentsState>((set, get) => ({
  businessDocuments: [],
  loading: false,
  error: null,

  fetchBusinessDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('business_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Documentos recuperados:', data);
      set({ businessDocuments: data || [], loading: false });
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error desconocido', 
        loading: false 
      });
    }
  },

  createBusinessDocument: async (businessDocument) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('business_documents')
        .insert({
          ...businessDocument,
          user_id: user.id,
        })
        .select();

      if (error) throw error;

      set({
        businessDocuments: data ? [...get().businessDocuments, data[0]] : get().businessDocuments,
        loading: false
      });
    } catch (error) {
      console.error('Error al crear documento:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al crear documento', 
        loading: false 
      });
      throw error;
    }
  },

  updateBusinessDocument: async (id, businessDocument) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('business_documents')
        .update(businessDocument)
        .eq('id', id)
        .select();

      if (error) throw error;

      set({
        businessDocuments: get().businessDocuments.map(doc => 
          doc.id === id ? data[0] : doc
        ),
        loading: false
      });
    } catch (error) {
      console.error('Error al actualizar documento:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al actualizar documento', 
        loading: false 
      });
      throw error;
    }
  },

  deleteBusinessDocument: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('business_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set({
        businessDocuments: get().businessDocuments.filter(doc => doc.id !== id),
        loading: false
      });
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al eliminar documento', 
        loading: false 
      });
      throw error;
    }
  }
}));