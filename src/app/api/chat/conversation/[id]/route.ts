import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/utils/prisma'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { visitor: true, messages: { orderBy: { createdAt: 'asc' } } }
    })

    if (!conversation) {
      return NextResponse.json({ success: false, data: {}, message: 'Conversa não encontrada', errors: [] }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: conversation, message: '', errors: [] })
  } catch (err) {
    console.error('Erro ao obter conversa', err)
    return NextResponse.json({ success: false, data: {}, message: 'Erro interno', errors: [] }, { status: 500 })
  }
}
