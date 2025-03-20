export const runtime = "nodejs";

// Conteúdo de assistant-config.ts
const assistantId = "asst_LTs4N9cLNBS66TDDMV7ojIza";

// Conteúdo de openai.ts
import OpenAI from "openai";
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Send a new message to a thread
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { threadId: string } }) {
    // Restante do código...

    try {
        const { content } = await request.json();
        
        // Verificar se temos ID do assistente
        if (!assistantId) {
            return Response.json(
                { error: "ID do assistente não configurado" },
                { status: 400 }
            );
        }
        
        // Verificar se temos thread ID
        if (!params.threadId) {
            return Response.json(
                { error: "ID do thread não fornecido" },
                { status: 400 }
            );
        }
        
        // Criar mensagem no thread
        await openai.beta.threads.messages.create(params.threadId, {
            role: "user",
            content: content,
        });
        
        // Iniciar execução do assistente
        const stream = openai.beta.threads.runs.stream(params.threadId, {
            assistant_id: assistantId,
        });
        
        return new Response(stream.toReadableStream());
    } catch (error) {
        console.error("Erro ao processar mensagem:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        return Response.json(
            { error: "Erro ao processar sua mensagem: " + errorMessage },
            { status: 500 }
        );
    }
}