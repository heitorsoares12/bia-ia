import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { openai } from '@/server/utils/openai'
import { assistantId } from '@/server/config/assistant'

const prisma = new PrismaClient()
export const runtime = 'nodejs'

export async function POST(request: NextRequest, { params }: { params: { conversationId: string } }) {
  const { conversationId } = params
  try {
    const { content } = await request.json()
    if (!content) return NextResponse.json({ error: 'Conteudo obrigatorio' }, { status: 400 })

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } })
    if (!conversation) return NextResponse.json({ error: 'Conversa nao encontrada' }, { status: 404 })

    await prisma.message.create({
      data: {
        role: 'user',
        content,
        visitorId: conversation.visitorId,
        conversationId: conversation.id
      }
    })

    await openai.beta.threads.messages.create(conversation.threadId, { role: 'user', content })

    const stream = await openai.beta.threads.runs.createAndStream(conversation.threadId, { assistant_id: assistantId })

    let assistantText = ''
    stream.on('textDelta', (delta) => { if (delta.value) assistantText += delta.value })
    stream.on('end', async () => {
      await prisma.message.create({
        data: {
          role: 'assistant',
          content: assistantText,
          visitorId: conversation.visitorId,
          conversationId: conversation.id
        }
      })
      await prisma.$disconnect()
    })
    stream.on('error', async () => { await prisma.$disconnect() })

    return new Response(stream.toReadableStream(), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    })
  } catch (err) {
    console.error('Erro ao enviar mensagem', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: { params: { conversationId: string } }) {
  const { conversationId } = params
  try {
    const messages = await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' } })
    return NextResponse.json({ messages })
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao obter mensagens' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
