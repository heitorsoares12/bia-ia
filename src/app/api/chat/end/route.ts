import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/server/utils/prisma'

export const runtime = 'nodejs'

const schema = z.object({ conversationId: z.string() })

export async function POST(req: NextRequest) {
  const json = await req.json()
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: {}, message: 'Payload inválido', errors: parsed.error.errors })
  }

  const { conversationId } = parsed.data

  try {
    await prisma.conversation.update({ where: { id: conversationId }, data: { status: 'CLOSED', endedAt: new Date() } })
    return NextResponse.json({ success: true, data: {}, message: '', errors: [] })
  } catch (err) {
    console.error('Erro ao finalizar', err)
    return NextResponse.json({ success: false, data: {}, message: 'Erro interno', errors: [] }, { status: 500 })
  }
}
