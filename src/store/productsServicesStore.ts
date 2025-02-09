// src/store/productsServicesStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { ProductService } from '../types/database';

interface ProductsServicesStore {
  productsServices: ProductService[];
  loading: boolean;
  error: string | null;
  fetchProductsServices: () => Promise<void>;
  createProductService: (productService: ProductService) => Promise<void>;
  updateProductService: (id: string, productService: ProductService) => Promise<void>;
  deleteProductService: (id: string) => Promise<void>;
}

export const useProductsServicesStore = create<ProductsServicesStore>((set) => ({
  productsServices: [],
  loading: false,
  error: null,

  fetchProductsServices: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('products_services').select('*');
    if (error) {
      set({ error: error.message });
    } else {
      set({ productsServices: data || [], error: null });
    }
    set({ loading: false });
  },

  createProductService: async (productService: ProductService) => {
    const { error } = await supabase.from('products_services').insert([productService]);
    if (error) {
      set({ error: error.message });
    } else {
      set((state) => ({ productsServices: [...state.productsServices, productService], error: null }));
    }
  },

  updateProductService: async (id: string, productService: ProductService) => {
    const { error } = await supabase.from('products_services').update(productService).eq('id', id);
    if (error) {
      set({ error: error.message });
    } else {
      set((state) => ({
        productsServices: state.productsServices.map((p) => (p.id === id ? { ...p, ...productService } : p)),
        error: null,
      }));
    }
  },

  deleteProductService: async (id: string) => {
    const { error } = await supabase.from('products_services').delete().eq('id', id);
    if (error) {
      set({ error: error.message });
    } else {
      set((state) => ({
        productsServices: state.productsServices.filter((productService) => productService.id !== id),
        error: null,
      }));
    }
  },
}));