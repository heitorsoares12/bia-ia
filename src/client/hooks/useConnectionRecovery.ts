import { useCallback, useEffect, useRef, useState } from 'react';

interface UseConnectionRecoveryOptions {
  conversationId?: string | null;
  onReconnect?: () => void;
  maxRetries?: number;
  retryDelay?: number;
}

export function useConnectionRecovery({
  conversationId,
  onReconnect,
  maxRetries = 3,
  retryDelay = 5000, // 5 segundos em produção
}: UseConnectionRecoveryOptions = {}) {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!conversationId) return false;

    try {
      const response = await fetch('/api/chat/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }, [conversationId]);

  const attemptReconnection = useCallback(async () => {
    if (!conversationId || retryCountRef.current >= maxRetries) {
      setIsReconnecting(false);
      setConnectionError('Não foi possível restabelecer a conexão');
      return;
    }

    setIsReconnecting(true);
    retryCountRef.current += 1;

    const isConnected = await testConnection();

    if (isConnected) {
      setIsReconnecting(false);
      setConnectionError(null);
      retryCountRef.current = 0;
      onReconnect?.();
    } else {
      // Agenda nova tentativa
      retryTimeoutRef.current = setTimeout(
        attemptReconnection,
        retryDelay * retryCountRef.current // Delay progressivo
      );
    }
  }, [conversationId, maxRetries, retryDelay, testConnection, onReconnect]);

  const handleConnectionError = useCallback((error: Error) => {
    console.warn('Connection error detected:', error);
    setConnectionError(error.message);

    // Só inicia reconexão se não estiver já tentando
    if (!isReconnecting && retryCountRef.current < maxRetries) {
      attemptReconnection();
    }
  }, [isReconnecting, maxRetries, attemptReconnection]);

  const resetConnection = useCallback(() => {
    setConnectionError(null);
    setIsReconnecting(false);
    retryCountRef.current = 0;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Reset quando conversationId muda
  useEffect(() => {
    resetConnection();
  }, [conversationId, resetConnection]);

  return {
    isReconnecting,
    connectionError,
    handleConnectionError,
    resetConnection,
    testConnection,
  };
}