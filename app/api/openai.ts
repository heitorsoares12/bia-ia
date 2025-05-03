import OpenAI from "openai";

// Configuração otimizada do cliente OpenAI
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 15000, // 15 segundos de timeout
  maxRetries: 2, // Reduzir número de retentativas para falhar mais rápido
});

// Configurações do assistente para respostas mais rápidas
export const assistantConfig = {
  temperature: 0.7, // Reduzir temperatura para respostas mais diretas
  max_tokens: 150, // Limitar tamanho das respostas (nome correto do parâmetro)
};