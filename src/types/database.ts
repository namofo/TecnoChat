export interface Contact {
  id: string;
  user_id: string;
  nombre: string;
  telefono: string;
  fecha: string;
  imagen: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  nombre: string;
  telefono: string;
  email: string;
  fecha: string;
  created_at: string;
  updated_at: string;
}