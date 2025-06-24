import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendToAssistant } from '@/server/services/chatService';
import { openai } from "@/server/utils/openai";

const prisma = new PrismaClient();

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
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.status !== 'OPEN') {
      return NextResponse.json(
        { success: false, data: null, message: 'Conversa não encontrada ou encerrada', errors: [] },
        { status: 400 }
      );
    }

    await prisma.message.create({ data: { conversationId, role: 'USER', content } });

    let threadId = conversation.threadId;
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      await prisma.conversation.update({ where: { id: conversationId }, data: { threadId } });
    }

    const assistantText = await sendToAssistant(threadId, content);

    await prisma.message.create({ data: { conversationId, role: 'ASSISTANT', content: assistantText } });

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
  } finally {
    await prisma.$disconnect();
  }
}