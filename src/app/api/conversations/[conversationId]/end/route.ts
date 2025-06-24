import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()
export const runtime = 'nodejs'

export async function POST(req: Request, { params }: { params: { conversationId: string } }) {
  const { conversationId } = params
  try {
    const now = new Date()
    const convo = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'closed', endedAt: now }
    })
    const duration = Math.floor((now.getTime() - convo.startedAt.getTime()) / 1000)
    await prisma.conversation.update({ where: { id: conversationId }, data: { duration } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Falha ao encerrar conversa' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
