import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendMessage } from '@/server/services/chatService';

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1),
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

  const { conversationId, content } = result.data;

  try {
    const assistantText = await sendMessage(conversationId, content);

    console.log('Message exchanged on conversation', conversationId);

    return NextResponse.json(
      { success: true, data: { message: assistantText }, message: null, errors: [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending message', error);
    return NextResponse.json(
      { success: false, data: null, message: 'Erro ao enviar mensagem', errors: [String(error)] },
      { status: 500 }
    );
  }
}