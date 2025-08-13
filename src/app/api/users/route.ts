import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

interface RequestBody {
  nome: string;
  email: string;
  cnpj: string;
  empresa?: string;
  cargo: string;
  cargoOutro?: string;
  area: string;
  areaOutro?: string;
  interesse: string;
}

export async function POST(req: Request) {
  const data: RequestBody = await req.json();

  try {
    const user = await prisma.user.create({
      data: {
        nome: data.nome,
        email: data.email,
        cnpj: data.cnpj,
        empresa: data.empresa,
        cargo: data.cargo,
        cargoOutro: data.cargoOutro,
        area: data.area,
        areaOutro: data.areaOutro,
        interesse: data.interesse,
      },
    });

    return NextResponse.json({ userId: user.id }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao criar usuário', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}