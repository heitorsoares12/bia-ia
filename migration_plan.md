# Plano de Implementação de Streaming para OpenAI

## 1. Análise da Arquitetura Atual

### Diagrama de Comunicação
O fluxo de dados atual é o seguinte:

`Client (chat.tsx)` -> `POST /api/chat/send` -> `chatService.ts` -> `openaiService.ts` -> `OpenAI API`

A resposta da OpenAI retorna ao `openaiService.ts`, é consolidada, e então enviada de volta ao cliente como uma única resposta JSON.

### Componentes e Dependências
- **Next.js:** `^15.2.3`
- **OpenAI:** `^4.87.4` (já usando a API de assistentes com `stream`)
- **Requisições:** `fetch` nativo
- **Gerenciamento de Estado:** `useState` e `useRef` no `chat.tsx`

## 2. Plano de Migração para Streaming

O objetivo é modificar a rota da API para que ela não espere a resposta completa da OpenAI, mas sim envie cada *chunk* recebido diretamente para o cliente usando Server-Sent Events (SSE).

### Passo 1: Modificar a Rota da API (`/api/chat/send/route.ts`)

A rota `/api/chat/send` será o ponto de partida. Em vez de chamar `sendMessage` e esperar a resposta, ela vai invocar um novo serviço que retorna um `ReadableStream`.

**Arquivo:** `src/app/api/chat/send/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { streamAssistantResponse } from '@/server/services/chatService';

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1),
});

export async function POST(req: Request) {
  const json = await req.json();
  const result = bodySchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: 'Dados inválidos' },
      { status: 400 }
    );
  }

  const { conversationId, content } = result.data;

  try {
    // Invoca o novo serviço que retorna um stream
    const stream = await streamAssistantResponse(conversationId, content);

    // Retorna o stream diretamente para o cliente
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error sending message', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao enviar mensagem' },
      { status: 500 }
    );
  }
}
```

### Passo 2: Criar o Serviço de Streaming (`chatService.ts`)

Vamos criar uma nova função `streamAssistantResponse` que gerencia a lógica de streaming.

**Arquivo:** `src/server/services/chatService.ts`

```typescript
// Adicionar esta nova função em chatService.ts

export async function streamAssistantResponse(conversationId: string, content: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || conversation.status !== 'OPEN') {
    throw new Error('Conversa não encontrada ou encerrada');
  }

  await prisma.message.create({
    data: {
      conversationId,
      role: 'USER',
      content,
    },
  });

  let threadId = conversation.threadId;
  if (!threadId) {
    threadId = await createThread();
    await prisma.conversation.update({ where: { id: conversationId }, data: { threadId } });
  }

  // Passa o threadId para o openaiService, que agora retorna um stream
  return getAssistantResponseStream(threadId, content);
}
```

### Passo 3: Adaptar o `openaiService.ts` para Retornar um `ReadableStream`

Esta é a mudança principal. A função `getAssistantResponse` (renomeada para `getAssistantResponseStream`) não vai mais acumular o texto. Em vez disso, ela vai criar e retornar um `ReadableStream` que o Next.js pode enviar ao cliente.

**Arquivo:** `src/server/services/openaiService.ts`

```typescript
import { openai } from '@/server/utils/openai';
import { assistantId } from '@/server/config/assistant';
import { prisma } from '@/server/utils/prisma';

export async function createThread() {
  const thread = await openai.beta.threads.create();
  return thread.id;
}

export function getAssistantResponseStream(threadId: string, content: string) {
  const encoder = new TextEncoder();
  let assistantResponse = '';

  const readableStream = new ReadableStream({
    async start(controller) {
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content,
      });

      const stream = await openai.beta.threads.runs.stream(threadId, {
        assistant_id: assistantId,
      });

      stream.on('textDelta', (delta) => {
        if (delta.value) {
          assistantResponse += delta.value;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta.value })}\n\n`));
        }
      });

      stream.on('end', async () => {
        // Salva a mensagem completa no banco de dados
        await prisma.message.create({
          data: {
            conversationId: (await prisma.conversation.findFirst({ where: { threadId } }))!.id,
            role: 'ASSISTANT',
            content: assistantResponse,
          },
        });
        controller.close();
      });

      stream.on('error', (err) => {
        console.error("Stream error:", err);
        controller.error(err);
      });
    },
  });

  return readableStream;
}
```

### Passo 4: Modificar o Frontend (`chat.tsx`) para Consumir o Stream

Finalmente, vamos alterar o componente `Chat` para usar `fetch` de uma forma que processe a resposta como um stream.

**Arquivo:** `src/client/components/chat/chat.tsx`

```typescript
// Dentro do componente Chat, substitua a função sendMessage

const sendMessage = useCallback(async (content: string) => {
  const convId = conversationId;
  if (!convId) return;

  // Adiciona a mensagem do usuário imediatamente
  setMessages((prev) => [
    ...prev,
    { id: crypto.randomUUID(), role: "user", text: content, timestamp: Date.now() },
  ]);

  setIsLoading(true);

  // Adiciona uma mensagem de assistente vazia que será preenchida
  const assistantId = crypto.randomUUID();
  setMessages((prev) => [
    ...prev,
    { id: assistantId, role: "assistant", text: "", timestamp: Date.now() },
  ]);

  try {
    const res = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: convId, content }),
    });

    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const json = JSON.parse(line.substring(6));
          if (json.content) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, text: msg.text + json.content }
                  : msg
              )
            );
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
    // Adicionar tratamento de erro visual para o usuário
  } finally {
    setIsLoading(false);
  }
}, [conversationId]);
```

## 3. Fluxo de Trabalho Recomendado

1.  **Implementar as alterações no backend:** Comece pelos arquivos `openaiService.ts`, `chatService.ts` e a rota da API.
2.  **Testar o endpoint com `curl`:** Use `curl -N http://localhost:3000/api/chat/send` para verificar se o stream está funcionando antes de ir para o frontend.
3.  **Implementar as alterações no frontend:** Adapte o componente `chat.tsx` para consumir e renderizar o stream.
4.  **Adicionar indicador de "digitando":** O estado `isLoading` já pode ser usado para isso.
5.  **Tratamento de erros:** Implemente uma lógica no `catch` do frontend para exibir uma mensagem de erro ao usuário caso o stream falhe.
6.  **Otimização:** O uso de `React.memo` já está implementado, o que é ótimo para o desempenho da renderização.

## 4. Cronograma Estimado

| Tarefa | Complexidade | Tempo Estimado |
| :--- | :--- | :--- |
| Adaptação do Backend (API Route e Services) | Média | 2-3 horas |
| Implementação do Frontend (Consumo de Stream) | Média | 3-4 horas |
| Tratamento de Erros e Testes | Baixa | 1-2 horas |
| **Total** | | **6-9 horas** |

Este plano fornece um caminho claro para a migração. Recomendo seguir os passos na ordem apresentada para uma implementação mais suave.
