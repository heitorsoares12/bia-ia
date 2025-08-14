import { NextResponse } from 'next/server';
import { z } from 'zod';
import { streamAssistantResponse } from '@/server/services/chatService';

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1),
  formatDirectives: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const result = bodySchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      { success: false, data: null, message: 'Dados inválidos', errors: result.error.errors },
      { status: 400 }
    );
  }

  const { conversationId, content, formatDirectives } = result.data;

  try {
    const stream = await streamAssistantResponse(conversationId, content, formatDirectives);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Error sending message', error);
    return NextResponse.json(
      { success: false, data: null, message: 'Erro ao enviar mensagem', errors: [String(error)] },
      { status: 500 }
    );
  }
}