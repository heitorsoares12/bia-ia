import { NextResponse } from 'next/server';
import { z } from 'zod';
import { startConversation } from '@/server/services/chatService';

const bodySchema = z.object({
  nome: z.string(),
  email: z.string().email(),
  cnpj: z.string().optional(),
  cargo: z.string().optional(),
  areaAtuacao: z.string().optional(),
  interesse: z.string().optional(),
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

  const data = result.data;

  try {
    const { conversationId } = await startConversation(data);
    console.log('Conversation started', conversationId);

    return NextResponse.json(
      { success: true, data: { conversationId }, message: null, errors: [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error starting conversation', error);
    return NextResponse.json(
      { success: false, data: null, message: 'Erro ao iniciar conversa', errors: [String(error)] },
      { status: 500 }
    );
  }
}