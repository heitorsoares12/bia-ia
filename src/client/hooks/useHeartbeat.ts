import { useEffect, useRef } from 'react';

interface UseHeartbeatOptions {
  interval?: number; // Intervalo em milissegundos (padrão: 5 minutos)
  enabled?: boolean; // Se o heartbeat está ativo
  conversationId?: string | null; // ID da conversa
}

export function useHeartbeat({
  interval = 5 * 60 * 1000, // 5 minutos
  enabled = true,
  conversationId
}: UseHeartbeatOptions = {}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const sendHeartbeat = async () => {
    if (!conversationId) return;

    try {
      await fetch('/api/chat/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });
    } catch (error) {
      console.warn('Heartbeat failed:', error);
    }
  };

  const updateActivity = () => {
    lastActivityRef.current = Date.now();
  };

  useEffect(() => {
    if (!enabled || !conversationId) return;

    // Registra eventos de atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Inicia o heartbeat
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;

      // Só envia heartbeat se não houve atividade recente
      // Isso evita spam quando o usuário está ativo
      if (timeSinceActivity >= interval - 30000) { // 30s antes do intervalo
        sendHeartbeat();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [enabled, conversationId, interval]);

  return { updateActivity };
}