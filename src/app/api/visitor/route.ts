import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

interface RequestBody {
  nome?: string;
  email?: string;
  cnpj?: string;
  cargo?: string;
  areaAtuacao?: string;
  interesse?: string;
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
        nome: data.nome!,
        email: data.email!,
        cnpj: data.cnpj ?? '00000000000000',
        cargo: data.cargo ?? null,
        areaAtuacao: data.areaAtuacao ?? null,
        interesse: data.interesse ?? null,
      },
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