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

export interface AiConfig {
  id: string;
  user_id: string;
  enabled: boolean;
  settings: {
    name?: string;
    model?: string;
    temperature?: number;
    max_tokens?: number;
    system_prompt?: string;
    priority?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface BusinessDocument {
  id: string;
  user_id: string;
  title: string;
  content: string;
  document_type: string;
  category: string;
  tags: string[];
  metadata: Record<string, any>;
  embedding?: any;
  priority?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Chatbot {
  id: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  nombre: string;
  estado: boolean;
}

export interface ConversationContext {
  id: string;
  user_id: string;
  role: string;
  content: string;
  phone_number: string;
  metadata: Record<string, any>;
  timestamp: string;
  created_at: string;
  updated_at?: string;
}

export interface CustomerInsight {
  id: string;
  user_id: string;
  phone_number: string;
  customer_type: string;
  confidence_score: number;
  last_interaction: string;
  interaction_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

// src/types/database.ts
export interface Flow {
  id: string;
  chatbot_id: string;
  user_id: string;
  addkeyword: string;
  addanswer: string;
  archivo: string;
  created_at: string;
  updated_at?: string;
}

// src/types/database.ts
export interface Lead {
  id: string;
  identification: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// src/types/database.ts
export interface ProductService {
  id: string;
  user_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  metadata: string; // JSON string
  active: boolean;
  created_at: string;
  updated_at: string;
}

// src/types/database.ts
export interface Welcome {
  id: string;
  user_id: string;
  welcomereply: string;
  mediapath: string | null;
  created_at: string;
  updated_at: string;
}