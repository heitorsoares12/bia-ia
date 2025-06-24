// export const runtime = "nodejs";

// import { NextRequest } from 'next/server';
// import { openai } from '@/server/utils/openai';
// import { assistantId } from '@/server/config/assistant';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export async function POST(
//     request: NextRequest,
//     { params }: { params: { threadId: string } | Promise<{ threadId: string }> }
// ) {
//     const { threadId } = await params;
//     try {
//         const { content, visitorId, visitorData } = await request.json();

//         if (!assistantId || !threadId || !content) {
//             return Response.json(
//                 { error: "Parâmetros inválidos" },
//                 { status: 400 }
//             );
//         }

//         let numericVisitorId: number | null = null;

//         if (visitorId !== undefined && visitorId !== null) {
//             numericVisitorId = Number(visitorId);
//             if (Number.isNaN(numericVisitorId)) {
//                 return Response.json(
//                     { error: "visitorId inválido" },
//                     { status: 400 }
//                 );
//             }
//             const exists = await prisma.visitor.findUnique({ where: { id: numericVisitorId } });
//             if (!exists) {
//                 if (visitorData) {
//                     const newVisitor = await prisma.visitor.create({
//                         data: {
//                             nome: visitorData.nome ?? 'Visitante',
//                             email: visitorData.email ?? `anon-${Date.now()}@example.com`,
//                             telefone: visitorData.telefone ?? '0000000000',
//                             cnpj: visitorData.cnpj ?? '00000000000000',
//                             consentimento: visitorData.consentimento ?? true,
//                         }
//                     });
//                     numericVisitorId = newVisitor.id;
//                 } else {
//                     return Response.json(
//                         { error: "Visitante não encontrado" },
//                         { status: 400 }
//                     );
//                 }
//             }
//         } else if (visitorData) {
//             const newVisitor = await prisma.visitor.create({
//                 data: {
//                     nome: visitorData.nome ?? 'Visitante',
//                     email: visitorData.email ?? `anon-${Date.now()}@example.com`,
//                     telefone: visitorData.telefone ?? '0000000000',
//                     cnpj: visitorData.cnpj ?? '00000000000000',
//                     consentimento: visitorData.consentimento ?? true,
//                 }
//             });
//             numericVisitorId = newVisitor.id;
//         } else {
//             return Response.json(
//                 { error: "visitorId obrigatório" },
//                 { status: 400 }
//             );
//         }

//         console.log('Usando visitorId:', numericVisitorId);

//         // Criar mensagem no thread com um timeout
//         const messagePromise = openai.beta.threads.messages.create(threadId, {
//             role: "user",
//             content: content,
//         });

//         // Usar Promise.race para implementar um timeout manual
//         const timeoutPromise = new Promise((_, reject) => {
//             setTimeout(() => reject(new Error('Timeout ao enviar mensagem')), 10000);
//         });

//         await prisma.message.create({
//             data: {
//                 content,
//                 sender: 'user',
//                 visitorId: numericVisitorId as number
//             }
//         });

//         await Promise.race([messagePromise, timeoutPromise]);

//         // Iniciar execução do assistente
//         const stream = await openai.beta.threads.runs.createAndStream(threadId, {
//             assistant_id: assistantId,
//         });

//         let assistantText = '';
//         stream.on('textDelta', (delta) => {
//             if (delta.value) assistantText += delta.value;
//         });

//         stream.on('end', async () => {
//             await prisma.message.create({
//                 data: {
//                     content: assistantText,
//                     sender: 'bot',
//                     visitorId: numericVisitorId as number
//                 }
//             });
//             await prisma.$disconnect();
//         });

//         stream.on('error', async () => {
//             await prisma.$disconnect();
//         });

//         return new Response(stream.toReadableStream(), {
//             headers: {
//                 'Content-Type': 'text/event-stream',
//                 'Cache-Control': 'no-cache',
//                 'Connection': 'keep-alive',
//             },
//         });
//     } catch (error) {
//         console.error("Erro ao processar mensagem:", error);
//         const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
//         return Response.json(
//             { error: "Erro ao processar sua mensagem: " + errorMessage },
//             { status: 500 }
//         );
//     } finally {
//         await prisma.$disconnect();
//     }

// }