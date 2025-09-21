"use client";

import { createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/client/hooks/useSession';

interface SessionContextType {
  session: ReturnType<typeof useSession>['session'];
  isLoading: boolean;
  hasActiveSession: () => boolean;
  saveSession: ReturnType<typeof useSession>['saveSession'];
  clearSession: ReturnType<typeof useSession>['clearSession'];
  updateConversation: ReturnType<typeof useSession>['updateConversation'];
}

const SessionContext = createContext<SessionContextType | null>(null);

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext deve ser usado dentro de SessionProvider');
  }
  return context;
}

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const sessionHook = useSession();
  const { session, isLoading, hasActiveSession } = sessionHook;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Só executa redirecionamento após carregar a sessão
    if (isLoading) return;

    const isHomePage = pathname === '/';

    // Se tem sessão ativa e está na home, redireciona para o formulário
    if (hasActiveSession() && isHomePage && session) {
      // Restaura dados no localStorage para o chat funcionar
      localStorage.setItem('conversationId', session.conversationId);
      localStorage.setItem('visitorData', JSON.stringify(session.visitorData));
      router.push('/formulario');
    }
  }, [session, isLoading, hasActiveSession, pathname, router]);

  const contextValue: SessionContextType = {
    session: sessionHook.session,
    isLoading: sessionHook.isLoading,
    hasActiveSession: sessionHook.hasActiveSession,
    saveSession: sessionHook.saveSession,
    clearSession: sessionHook.clearSession,
    updateConversation: sessionHook.updateConversation,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}