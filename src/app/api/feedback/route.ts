import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { threadId, timestamp, isPositive } = body;

    // Aqui você pode implementar a lógica para salvar o feedback
    // Por exemplo, salvando em um banco de dados ou enviando para um serviço de analytics
    console.log('Feedback recebido:', { threadId, timestamp, isPositive });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar feedback:', error);
    return NextResponse.json(
      { error: 'Erro ao processar feedback' },
      { status: 500 }
    );
  }
}
