import { prisma } from '@/server/utils/prisma';
import { Prisma } from '@prisma/client';
import { getAssistantResponse, createThread } from './openaiService';

interface VisitorData {
  nome: string;
  email: string;
  cnpj?: string;
  cargo?: string;
  areaAtuacao?: string;
  interesse?: string;
}

export async function startConversation(data: VisitorData) {
  let visitor = await prisma.visitor.findUnique({ where: { email: data.email } });
  if (!visitor) {
    visitor = await prisma.visitor.create({
      data: data as Prisma.VisitorUncheckedCreateInput,
    });
  }

  const conversation = await prisma.conversation.create({
    data: {
      visitorId: visitor.id,
      status: 'OPEN',
      startedAt: new Date(),
    },
  });

  return { conversationId: conversation.id };
}

export async function sendMessage(
  conversationId: string,
  content: string,
  formatDirectives?: string
) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || conversation.status !== 'OPEN') {
    throw new Error('Conversa não encontrada ou encerrada');
  }

  await prisma.message.create({
    data: {
      conversationId,
      role: 'USER',
      content,
    } as Prisma.MessageUncheckedCreateInput,
  });

  let threadId = conversation.threadId;
  if (!threadId) {
    threadId = await createThread();
    await prisma.conversation.update({ where: { id: conversationId }, data: { threadId } });
  }

  const enrichedContent = formatDirectives
    ? `${content}\n\n[INSTRUÇÕES DE FORMATO – SIGA ESTRITAMENTE]\n${formatDirectives}`
    : content;

  const assistantText = await getAssistantResponse(threadId, enrichedContent);

  await prisma.message.create({
    data: {
      conversationId,
      role: 'ASSISTANT',
      content: assistantText,
    } as Prisma.MessageUncheckedCreateInput,
  });

  return assistantText;
}

export async function endConversation(conversationId: string) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: 'CLOSED', endedAt: new Date() },
  });
}

export async function fetchConversation(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: {
      visitor: true,
      messages: { orderBy: { timestamp: 'asc' } as Record<string, unknown> },
    },
  });
}