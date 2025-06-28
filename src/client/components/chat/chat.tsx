"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./chat.module.css";
import Markdown from "react-markdown";
import { ChatMessage } from "@/shared/types/chat";

interface VisitorData {
  nome?: string;
  email?: string;
  cnpj?: string;
  cargo?: string;
  area?: string;
  interesse?: string;
}

const UserMessage = ({ text }: { text: string }) => (
  <div className={styles.userMessage}>{text}</div>
);

const AssistantMessage = ({ text }: { text: string }) => (
  <div className={styles.assistantMessage}>
    <Markdown>{text}</Markdown>
  </div>
);

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

const LoadingIndicator = () => (
  <div className={styles.loadingIndicator}>digitando...</div>
);

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const visitorDataRef = useRef<VisitorData | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchHistory = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chat/conversation/${id}`);
      if (!res.ok) throw new Error("Falha ao buscar conversa");
      const json = await res.json();
      const conv = json.data;
      const mapped: ChatMessage[] = conv.messages.map((m: {
        id: string;
        role: string;
        content: string;
        timestamp: string;
      }) => ({
        id: m.id,
        role: m.role.toLowerCase(),
        text: m.content,
        timestamp: new Date(m.timestamp).getTime(),
      }));
      setMessages(mapped);
    } catch (err) {
      console.error(err);
    }
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
          { id: assistantId, role: "assistant", text: json.data.message, timestamp: Date.now() },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  const greetVisitor = useCallback(async (visitor: VisitorData, id: string) => {
    if (!visitor.nome) return;
    const { nome, cargo, area, interesse } = visitor;
    const intro = `O visitante se chama ${nome}, atua em ${area} como ${cargo} e tem interesse em ${interesse}. Cumprimente-o pelo nome e ofereça ajuda.`;
    await sendMessage(intro, id, false);
  }, [sendMessage]);

  const startConversation = useCallback(async (visitor: VisitorData) => {
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
  }, [greetVisitor]);

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
          text: "Conversa encerrada. Se precisar, estamos à disposição!",
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userInput.trim() || !conversationId) return;
    sendMessage(userInput);
    setUserInput("");
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesContainer} aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={styles.messageWrapper}>
            <Message {...m} />
          </div>
        ))}
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={isLoading}
          placeholder={isLoading ? "Aguarde a resposta..." : "Digite sua mensagem..."}
          className={styles.input}
        />
        <button type="submit" disabled={isLoading || !userInput.trim()} className={styles.sendButton}>
          Enviar
        </button>
      </form>
      <button onClick={endConversation} className={styles.endButton}>
        Encerrar Conversa
      </button>
    </div>
  );
};

export default Chat;