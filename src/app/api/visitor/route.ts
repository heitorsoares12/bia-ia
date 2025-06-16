import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

interface RequestBody {
  nome: string;
  email: string;
  telefone: string;
  cnpj: string;
  consentimento: boolean;
}

export async function POST(req: Request) {
  const data: RequestBody = await req.json();

  try {
    const visitor = await prisma.visitor.create({
      data: {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        cnpj: data.cnpj,
        consentimento: data.consentimento
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