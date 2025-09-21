import { useCallback, useEffect, useState } from 'react';

interface SessionData {
  visitorId: string;
  conversationId: string;
  visitorData: {
    nome: string;
    email: string;
    cnpj?: string;
    empresa: string;
    cargo: string;
    area: string;
    interesse: string;
  };
  manterLogado: boolean;
  expiresAt: number;
}

const SESSION_STORAGE_KEY = 'userSession';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Salva a sessão
  const saveSession = useCallback((sessionData: Omit<SessionData, 'expiresAt'>) => {
    if (sessionData.manterLogado) {
      const fullSessionData: SessionData = {
        ...sessionData,
        expiresAt: Date.now() + SESSION_DURATION,
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fullSessionData));
      setSession(fullSessionData);
    }
  }, []);

  // Remove a sessão
  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('conversationId');
    localStorage.removeItem('chatMessages');
    localStorage.removeItem('visitorData');
    setSession(null);
  }, []);

  // Verifica se o usuário tem uma sessão ativa
  const hasActiveSession = useCallback(() => {
    return session !== null && session !== undefined && session.expiresAt > Date.now();
  }, [session]);

  // Atualiza a conversa atual na sessão
  const updateConversation = useCallback((conversationId: string) => {
    if (session) {
      const updatedSession = {
        ...session,
        conversationId,
        expiresAt: Date.now() + SESSION_DURATION, // Renova expiração
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
      setSession(updatedSession);
    }
  }, [session]);

  // Carrega a sessão na inicialização
  useEffect(() => {
    const initSession = () => {
      try {
        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSession) {
          const sessionData: SessionData = JSON.parse(storedSession);

          // Verifica se a sessão expirou
          if (sessionData.expiresAt > Date.now()) {
            setSession(sessionData);
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch (error) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  return {
    session,
    isLoading,
    hasActiveSession,
    saveSession,
    clearSession,
    updateConversation,
  };
}