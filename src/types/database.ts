export interface Chatbot {
  id: string;
  user_id: string;
  name_chatbot: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BotFlow {
  id: string;
  chatbot_id: string;
  user_id: string;
  keyword: string[];  // Cambiado a array de strings
  response_text: string;
  media_url: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface Welcome {
  id: string;
  user_id: string;
  chatbot_id: string;
  welcome_message: string;
  media_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BehaviorPrompt {
  id: string;
  user_id: string;
  chatbot_id: string;
  prompt_text: string;
  embedding?: any; // Hacer el embedding opcional
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgePrompt {
  id: string;
  user_id: string;
  chatbot_id: string;
  prompt_text: string;
  embedding?: any;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Blacklist {
  id: string;
  phone_number: string;
  chatbot_id: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientData {
  id: string;
  chatbot_id: string;
  user_id: string;
  identification_number: string;
  full_name: string;
  phone_number: string;
  email: string;
  media_url?: string | null;
  created_at: string;
}

export interface AssignQR {
  id: string;
  url_qr: string;
  port: string;
  user_id: string;
  is_assigned: boolean;
  created_at: string;
  updated_at: string;
}