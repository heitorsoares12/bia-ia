# Assistente Bia

Um chatbot inteligente construído com Next.js e OpenAI.

## Funcionalidades

- Interface de chat moderna e responsiva
- Persistência de mensagens (salvamento automático)
- Indicador de digitação
- Sistema de feedback para respostas
- Tratamento de erros
- Suporte a Markdown nas respostas
- Gerenciamento de conversas com histórico

## Como usar

1. Configure as variáveis de ambiente:
   ```env
   NEXT_PUBLIC_OPENAI_ASSISTANT_ID=seu_assistant_id
   OPENAI_API_KEY=sua_api_key
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Execute o projeto:
   ```bash
   npm run dev
   ```

4. Acesse http://localhost:3000

## Tecnologias

- Next.js 13+
- TypeScript
- OpenAI API (Assistants)
- React Markdown
- CSS Modules
