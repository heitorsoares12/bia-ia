// pages/api/visitor.ts
import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

interface RequestBody {
  nome: string;
  email: string;
  telefone: string;
  cnpj: string;
  consentimento: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  
  const { nome, email, telefone, cnpj, consentimento } = req.body as RequestBody;

  try {
    const visitor = await prisma.visitor.create({
      data: { 
        nome, 
        email, 
        telefone, 
        cnpj, 
        consentimento 
      },
    });

    res.status(200).json({ visitorId: visitor.id });
  } catch (error) {
    res.status(500).json({ 
      error: 'Falha ao criar visitante', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  } finally {
    await prisma.$disconnect();
  }
}