import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { openai } from '@/server/utils/openai'
import { assistantId } from '@/server/config/assistant'
import { prisma } from '@/server/utils/prisma'
import { AssistantStream } from 'openai/lib/AssistantStream'

export const runtime = 'nodejs'

const bodySchema = z.object({
  conversationId: z.string(),
  content: z.string()
})

export async function POST(req: NextRequest) {
  const json = await req.json()
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: {}, message: 'Payload inválido', errors: parsed.error.errors })
  }

  const { conversationId, content } = parsed.data

  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } })
    if (!conversation) {
      return NextResponse.json({ success: false, data: {}, message: 'Conversa não encontrada', errors: [] }, { status: 404 })
    }

    await prisma.message.create({ data: { role: 'user', content, visitorId: conversation.visitorId, conversationId } })

    await openai.beta.threads.messages.create(conversation.threadId!, { role: 'user', content })

    const stream = await openai.beta.threads.runs.createAndStream(conversation.threadId!, { assistant_id: assistantId })

    let assistantText = ''
    stream.on('textDelta', (d) => { if (d.value) assistantText += d.value })
    stream.on('end', async () => {
      await prisma.message.create({ data: { role: 'assistant', content: assistantText, visitorId: conversation.visitorId, conversationId } })
    })

    return new Response(stream.toReadableStream(), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    })
  } catch (err) {
    console.error('Erro ao enviar', err)
    return NextResponse.json({ success: false, data: {}, message: 'Erro interno', errors: [] }, { status: 500 })
  }
}
