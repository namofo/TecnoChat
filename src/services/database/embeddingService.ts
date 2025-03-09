import { OpenAIService } from '../ai/openai';
import { supabase } from '../../lib/supabase';

export class EmbeddingService {
  static async createEmbedding(prompt_text: string) {
    try {
      const embedding = await OpenAIService.generateEmbedding(prompt_text);
      return embedding;
    } catch (error) {
      console.error('Error en createEmbedding:', error);
      throw error;
    }
  }

  static async createBehaviorPrompt(userId: string, chatbotId: string, promptText: string) {
    try {
      // Primero crear el registro sin embedding
      const { data: initialData, error: initialError } = await supabase
        .from('behavior_prompts')
        .insert({
          user_id: userId,
          chatbot_id: chatbotId,
          prompt_text: promptText,
          is_active: true
        })
        .select()
        .single();

      if (initialError) throw initialError;

      // Luego generar y actualizar el embedding
      const embedding = await OpenAIService.generateEmbedding(promptText);
      
      // Actualizar el registro con el embedding
      const { data, error } = await supabase
        .from('behavior_prompts')
        .update({ embedding })
        .eq('id', initialData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating behavior prompt:', error);
      throw error;
    }
  }

  static async createKnowledgePrompt(userId: string, chatbotId: string, promptText: string, category: string) {
    try {
      const embedding = await OpenAIService.generateEmbedding(promptText);
      
      const { data, error } = await supabase
        .from('knowledge_prompts')
        .insert({
          user_id: userId,
          chatbot_id: chatbotId,
          prompt_text: promptText,
          category: category,
          embedding: embedding,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating knowledge prompt:', error);
      throw error;
    }
  }
}
