import { PrismaClient } from '@prisma/client'
import { openai } from '@/server/utils/openai'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { visitorId } = await req.json()
    if (!visitorId) {
      return NextResponse.json({ error: 'visitorId obrigatorio' }, { status: 400 })
    }
    const thread = await openai.beta.threads.create()
    const conversation = await prisma.conversation.create({
      data: {
        threadId: thread.id,
        visitorId: Number(visitorId)
      }
    })
    return NextResponse.json({ conversationId: conversation.id, threadId: thread.id })
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao criar conversa' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
