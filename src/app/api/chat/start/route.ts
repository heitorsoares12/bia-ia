import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();

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
    let visitor = await prisma.visitor.findUnique({ where: { email: data.email } });
    if (!visitor) {
      visitor = await prisma.visitor.create({ data });
    }

    const conversation = await prisma.conversation.create({
      data: {
        visitorId: visitor.id,
        status: 'OPEN',
        startedAt: new Date(),
      },
    });

    console.log('Conversation started', conversation.id);

    return NextResponse.json(
      { success: true, data: { conversationId: conversation.id }, message: null, errors: [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error starting conversation', error);
    return NextResponse.json(
      { success: false, data: null, message: 'Erro ao iniciar conversa', errors: [String(error)] },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
