import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

interface RequestBody {
  nome?: string;
  email?: string;
  telefone?: string;
  cnpj?: string;
  consentimento?: boolean;
}

export async function POST(req: Request) {
  const data: RequestBody = await req.json();

  if (!data.nome || !data.email) {
    return NextResponse.json(
      { error: 'Nome e email são obrigatórios' },
      { status: 400 }
    );
  }

  try {
    const visitor = await prisma.visitor.create({
      data: {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone ?? '0000000000',
        cnpj: data.cnpj ?? '00000000000000',
        consentimento: data.consentimento ?? true
      }
    });

    return NextResponse.json({ visitorId: visitor.id }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao criar visitante', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}