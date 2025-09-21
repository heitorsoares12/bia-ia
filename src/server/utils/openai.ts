import OpenAI from "openai";

// Configuração otimizada do cliente OpenAI para sessões longas
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60 segundos de timeout para permitir respostas mais longas
  maxRetries: 3, // Aumentar retentativas para melhor confiabilidade
});

// Configurações do assistente
export const assistantConfig = {
  temperature: 0.7,
  max_tokens: 150,
};