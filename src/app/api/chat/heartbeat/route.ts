import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/utils/prisma';

const bodySchema = z.object({
  conversationId: z.string().uuid(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const result = bodySchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: 'ID de conversa inválido' },
      { status: 400 }
    );
  }

  const { conversationId } = result.data;

  try {
    // Verifica se a conversa existe e está ativa
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.status !== 'OPEN') {
      return NextResponse.json(
        { success: false, message: 'Conversa não encontrada ou encerrada' },
        { status: 404 }
      );
    }

    // Atualiza o timestamp da última atividade
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastActivity: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no heartbeat:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}