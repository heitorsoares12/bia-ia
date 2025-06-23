export const runtime = "nodejs";

import { NextRequest } from 'next/server';
import { openai } from '@/server/utils/openai';
import { assistantId } from '@/server/config/assistant';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
    request: NextRequest,
    { params }: { params: { threadId: string } | Promise<{ threadId: string }> }
) {
    const { threadId } = await params;
    try {
        const { content, visitorId } = await request.json();

        // Validações rápidas
        if (!assistantId || !threadId || !content || !visitorId) {
            return Response.json(
                { error: "Parâmetros inválidos" },
                { status: 400 }
            );
        }

        // Criar mensagem no thread com um timeout
        const messagePromise = openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: content,
        });

        // Usar Promise.race para implementar um timeout manual
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout ao enviar mensagem')), 10000);
        });

        await prisma.message.create({
            data: {
                content,
                sender: 'user',
                visitorId: Number(visitorId)
            }
        });

        await Promise.race([messagePromise, timeoutPromise]);

        // Iniciar execução do assistente
        const stream = await openai.beta.threads.runs.createAndStream(threadId, {
            assistant_id: assistantId,
        });

        let assistantText = '';
        stream.on('textDelta', (delta) => {
            if (delta.value) assistantText += delta.value;
        });

        stream.on('end', async () => {
            await prisma.message.create({
                data: {
                    content: assistantText,
                    sender: 'bot',
                    visitorId: Number(visitorId)
                }
            });
            await prisma.$disconnect();
        });

        stream.on('error', async () => {
            await prisma.$disconnect();
        });

        return new Response(stream.toReadableStream(), {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error("Erro ao processar mensagem:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        return Response.json(
            { error: "Erro ao processar sua mensagem: " + errorMessage },
            { status: 500 }
        );
    }

}

