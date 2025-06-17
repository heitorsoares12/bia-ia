export const runtime = "edge"; // Mudando para Edge Runtime para melhor performance

import { NextRequest } from 'next/server';
import { openai } from '@/server/utils/openai';
import { assistantId } from '@/server/config/assistant';

export async function POST(request: NextRequest, { params }: { params: { threadId: string } }) {
    try {
        const { content } = await request.json();
        
        // Validações rápidas
        if (!assistantId || !params.threadId || !content) {
            return Response.json(
                { error: "Parâmetros inválidos" },
                { status: 400 }
            );
        }

        // Criar mensagem no thread com um timeout
        const messagePromise = openai.beta.threads.messages.create(params.threadId, {
            role: "user",
            content: content,
        });

        // Usar Promise.race para implementar um timeout manual
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout ao enviar mensagem')), 10000);
        });

        await Promise.race([messagePromise, timeoutPromise]);
        
        // Iniciar execução do assistente
        const stream = await openai.beta.threads.runs.createAndStream(params.threadId, {
            assistant_id: assistantId,
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