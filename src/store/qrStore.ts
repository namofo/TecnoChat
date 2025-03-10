import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { AssignQR } from '../types/database';

interface QRState {
  qrData: AssignQR | null;
  loading: boolean;
  error: string | null;
}

interface QRActions {
  fetchQR: () => Promise<void>;
}

type QRStore = QRState & QRActions;

export const useQRStore = create<QRStore>((set) => ({
  qrData: null,
  loading: false,
  error: null,

  fetchQR: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('assign_qr')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      set({ qrData: data, loading: false });
    } catch (error) {
      console.error('Error fetching QR:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al cargar QR', 
        loading: false,
        qrData: null
      });
    }
  }
}));
