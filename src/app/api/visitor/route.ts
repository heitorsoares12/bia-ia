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
        cnpj: data.cnpj || null,
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (email) {
    try {
      const visitor = await prisma.visitor.findUnique({
        where: { email },
      });
      return NextResponse.json({ exists: !!visitor });
    } catch (error) {
      return NextResponse.json({ exists: false });
    } finally {
      await prisma.$disconnect();
    }
  }

  const visitorId = searchParams.get('id');
  if (visitorId) {
    try {
      const visitor = await prisma.visitor.findUnique({
        where: { id: visitorId },
      });

      if (!visitor) {
        return NextResponse.json({ error: 'Visitante não encontrado' }, { status: 404 });
      }

      return NextResponse.json(visitor, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { error: 'Falha ao buscar visitante', details: error instanceof Error ? error.message : 'Erro desconhecido' },
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }
  }

  return NextResponse.json({ error: 'É necessário um ID de visitante ou e-mail' }, { status: 400 });
}
