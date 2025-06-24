import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { openai } from '@/server/utils/openai'
import { prisma } from '@/server/utils/prisma'

export const runtime = 'nodejs'

const visitorSchema = z.object({
  nome: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  cnpj: z.string().optional(),
  consentimento: z.boolean().optional()
})

const bodySchema = z.object({
  visitorId: z.number().optional(),
  visitorData: visitorSchema.optional()
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: {}, message: 'Payload inválido', errors: parsed.error.errors })
    }

    const { visitorId, visitorData } = parsed.data
    let id = visitorId

    if (!id) {
      if (!visitorData) {
        return NextResponse.json({ success: false, data: {}, message: 'visitorId ou visitorData requerido', errors: [] }, { status: 400 })
      }
      const visitor = await prisma.visitor.create({ data: {
        nome: visitorData.nome ?? 'Visitante',
        email: visitorData.email ?? `anon-${Date.now()}@example.com`,
        telefone: visitorData.telefone ?? '0000000000',
        cnpj: visitorData.cnpj ?? '00000000000000',
        consentimento: visitorData.consentimento ?? true
      }})
      id = visitor.id
    }

    const thread = await openai.beta.threads.create()
    const conversation = await prisma.conversation.create({ data: {
      visitorId: id,
      threadId: thread.id,
      status: 'OPEN'
    }})

    return NextResponse.json({ success: true, data: { visitorId: id, conversationId: conversation.id, threadId: thread.id }, message: '', errors: [] })
  } catch (err) {
    console.error('Erro start chat', err)
    return NextResponse.json({ success: false, data: {}, message: 'Erro interno', errors: [] }, { status: 500 })
  }
}
