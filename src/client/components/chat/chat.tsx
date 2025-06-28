"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import styles from "./chat.module.css";
import Markdown from "react-markdown";
import sanitize from "sanitize-html";
import { ChatMessage } from "@/shared/types/chat";

interface VisitorData {
  nome?: string;
  email?: string;
  cnpj?: string;
  cargo?: string;
  area?: string;
  interesse?: string;
}

const UserMessage = React.memo(function UserMessage({
  text,
}: {
  text: string;
}) {
  return <div className={styles.userMessage}>{text}</div>;
});
UserMessage.displayName = "UserMessage";

const AssistantMessage = React.memo(function AssistantMessage({
  text,
}: {
  text: string;
}) {
  return (
    <div className={styles.assistantMessage}>
      <Markdown
        components={{
          html: (props) => {
            const clean = sanitize(String(props.children[0]), {
              allowedTags: ["b", "i", "em", "strong", "a", "code", "pre"],
              allowedAttributes: { a: ["href", "target"] },
            });
            return <span dangerouslySetInnerHTML={{ __html: clean }} />;
          },
        }}
      >
        {text}
      </Markdown>
    </div>
  );
});
AssistantMessage.displayName = "AssistantMessage";

const Message = ({ role, text }: ChatMessage) => {
  switch (role) {
    case "user":
      return <UserMessage text={text} />;
    case "assistant":
      return <AssistantMessage text={text} />;
    default:
      return null;
  }
};

const MemoizedMessage = React.memo(Message);

const LoadingIndicator = ({ text }: { text: string }) => (
  <div className={styles.loadingIndicator}>{text}</div>
);

const translations = {
  "pt-BR": { thinking: "pensando...", placeholder: "Digite sua mensagem..." },
  "en-US": { thinking: "thinking...", placeholder: "Type your message..." },
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [locale, setLocale] = useState<keyof typeof translations>("pt-BR");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const visitorDataRef = useRef<VisitorData | null>(null);
  const initRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isOnline, setIsOnline] = useState(true);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
    const lastMessage = document.querySelector(
      `.${styles.messageWrapper}:last-child`
    );
    (lastMessage as HTMLElement | null)?.focus?.();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string, id?: string, showUser: boolean = true) => {
      const convId = id || conversationId;
      if (!convId) return;

      if (showUser) {
        const userId = crypto.randomUUID();
        setMessages((prev) => [
          ...prev,
          { id: userId, role: "user", text: content, timestamp: Date.now() },
        ]);
      }

      setIsLoading(true);
      try {
        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convId, content }),
        });
        if (!res.ok) throw new Error("Erro ao enviar mensagem");
        const json = await res.json();
        const assistantId = crypto.randomUUID();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            text: json.data.message,
            timestamp: Date.now(),
          },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  const greetVisitor = useCallback(
    async (visitor: VisitorData, id: string) => {
      if (!visitor.nome) return;
      const { nome, cargo, area, interesse } = visitor;
      const intro = `O visitante se chama ${nome}, atua em ${area} como ${cargo} e tem interesse em ${interesse}. Cumprimente-o pelo nome e ofereça ajuda.`;
      await sendMessage(intro, id, false);
    },
    [sendMessage]
  );

  const startConversation = useCallback(
    async (visitor: VisitorData) => {
      try {
        const res = await fetch("/api/chat/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: visitor.nome,
            email: visitor.email,
            cnpj: visitor.cnpj,
            cargo: visitor.cargo,
            areaAtuacao: visitor.area,
            interesse: visitor.interesse,
          }),
        });
        if (!res.ok) throw new Error("Falha ao iniciar conversa");
        const json = await res.json();
        const id = json.data.conversationId as string;
        setConversationId(id);
        localStorage.setItem("conversationId", id);
        greetVisitor(visitor, id);
      } catch (err) {
        console.error(err);
      }
    },
    [greetVisitor]
  );

  const fetchHistory = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/chat/conversation/${id}`);
        if (!res.ok) throw new Error("Falha ao buscar conversa");
        const json = await res.json();
        const conv = json.data;
        const mapped: ChatMessage[] = conv.messages
          .filter(
            (m: { role: string; content: string }, index: number) =>
              index !== 0 ||
              m.role !== "USER" ||
              !m.content.includes("Cumprimente-o pelo nome")
          )
          .map(
            (m: {
              id: string;
              role: string;
              content: string;
              timestamp: string;
            }) => ({
              id: m.id,
              role: m.role.toLowerCase(),
              text: m.content,
              timestamp: new Date(m.timestamp).getTime(),
            })
          );
        setMessages(mapped);
      } catch (err) {
        console.error(err);
        setConversationId(null);
        localStorage.removeItem("conversationId");
        if (visitorDataRef.current) {
          startConversation(visitorDataRef.current);
        }
      }
    },
    [startConversation]
  );

  const endConversation = async () => {
    if (!conversationId) return;
    try {
      await fetch("/api/chat/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Conversa encerrada. Se precisar de mais ajuda, estamos à disposição! 😊",
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const storedVisitor = localStorage.getItem("visitorData");
    const storedConv = localStorage.getItem("conversationId");
    if (storedVisitor) {
      const visitor = JSON.parse(storedVisitor) as VisitorData;
      visitorDataRef.current = visitor;
      if (storedConv) {
        setConversationId(storedConv);
        fetchHistory(storedConv);
      } else {
        startConversation(visitor);
      }
    }
  }, [fetchHistory, startConversation]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const debouncedSend = useDebouncedCallback(
    (msg: string) => sendMessage(msg),
    300
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userInput.trim() || !conversationId || isLoading) return;
    debouncedSend(userInput);
    setUserInput("");
  };

  // Foco automático no input ao carregar
  useEffect(() => {
    const input = document.querySelector(
      `.${styles.input}`
    ) as HTMLInputElement;
    input?.focus();
  }, []);

  const { thinking, placeholder } = translations[locale];

  return (
    <div
      className={styles.chatContainer}
      role="region"
      aria-label="Chat de conversa"
    >
      {!isOnline && (
        <div className={styles.offlineBanner}>
          Você está offline. Mensagens serão enviadas quando a conexão for
          restabelecida.
        </div>
      )}
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as keyof typeof translations)}
        className={styles.localeSelector}
      >
        <option value="pt-BR">Português</option>
        <option value="en-US">English</option>
      </select>
      <div
        className={styles.messagesContainer}
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
      >
        {messages.map((m) => (
          <div key={m.id} className={styles.messageWrapper}>
            <MemoizedMessage {...m} />
          </div>
        ))}
        {isLoading && <LoadingIndicator text={thinking} />}
        <div ref={messagesEndRef} />
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={isLoading || !isOnline}
          placeholder={isLoading ? "Aguarde a resposta..." : placeholder}
          className={styles.input}
          aria-label="Digite sua mensagem"
        />
        <button
          type="submit"
          disabled={isLoading || !userInput.trim() || !isOnline}
          className={styles.sendButton}
          aria-label="Enviar mensagem"
        >
          Enviar
        </button>
      </form>

      <button
        onClick={endConversation}
        className={styles.endButton}
        aria-label="Encerrar conversa"
      >
        Encerrar Conversa
      </button>
    </div>
  );
};

export default Chat;
