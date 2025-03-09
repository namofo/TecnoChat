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
      const embedding = await OpenAIService.generateEmbedding(promptText);
      
      const { data, error } = await supabase
        .from('behavior_prompts')
        .insert({
          user_id: userId,
          chatbot_id: chatbotId,
          prompt_text: promptText,
          embedding: embedding,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating behavior prompt:', error);
      throw error;
    }
  }
}
