import { openai } from '@/server/utils/openai';
import { assistantId } from '@/server/config/assistant';
import { prisma } from '@/server/utils/prisma';

export async function createThread() {
  const thread = await openai.beta.threads.create();
  return thread.id;
}

export async function getAssistantResponse(threadId: string, content: string) {
  const messagePromise = openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content,
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout ao enviar mensagem')), 45000)
  );

  await Promise.race([messagePromise, timeoutPromise]);

  const stream = await openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
  });

  let assistantText = '';
  await new Promise<void>((resolve, reject) => {
    stream.on('textDelta', (delta) => {
      if (delta.value) assistantText += delta.value;
    });
    stream.on('end', () => resolve());
    stream.on('error', (err) => reject(err));
  });

  return assistantText;
}

export function getAssistantResponseStream(threadId: string, content: string) {
  const encoder = new TextEncoder();
  let assistantResponse = '';

  const readableStream = new ReadableStream<Uint8Array>({
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
          // Envia como SSE: data: { content }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: delta.value })}\n\n`)
          );
        }
      });

      stream.on('end', async () => {
        try {
          const conversation = await prisma.conversation.findFirst({ where: { threadId } });
          if (conversation) {
            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                role: 'ASSISTANT',
                content: assistantResponse,
              } as any,
            });
          }
        } catch (err) {
          console.error('Erro ao salvar mensagem do assistente:', err);
        } finally {
          // Sinaliza fim de stream SSE
          controller.enqueue(encoder.encode('event: end\ndata: "end"\n\n'));
          controller.close();
        }
      });

      stream.on('error', (err) => {
        console.error('Stream error:', err);
        controller.error(err);
      });
    },
  });

  return readableStream;
}