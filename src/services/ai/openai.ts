import.meta.env.OPENAI_API_KEY;

export const OpenAIService = {
  async generateEmbedding(text: string) {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('VITE_OPENAI_API_KEY no está configurada');
      }

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: text
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error de OpenAI:', errorData);
        throw new Error(`Error de OpenAI: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generando embedding:', error);
      throw error;
    }
  }
};
