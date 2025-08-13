import { NextResponse } from 'next/server';
import { fetchConversation } from '@/server/services/chatService';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const conversation = await fetchConversation(id);
    if (!conversation) {
      return NextResponse.json(
        { success: false, data: null, message: 'Conversa não encontrada', errors: [] },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: conversation, message: null, errors: [] },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, data: null, message: 'Erro ao buscar conversa', errors: [String(error)] },
      { status: 500 }
    );
  }
}
