import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();

const bodySchema = z.object({
  conversationId: z.string().uuid(),
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

  try {
    const { conversationId } = result.data;
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'CLOSED', endedAt: new Date() },
    });

    console.log('Conversation ended', conversationId);

    return NextResponse.json(
      { success: true, data: null, message: 'Conversa encerrada', errors: [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error ending conversation', error);
    return NextResponse.json(
      { success: false, data: null, message: 'Erro ao encerrar conversa', errors: [String(error)] },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}