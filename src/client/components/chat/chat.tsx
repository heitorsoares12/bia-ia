"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./chat.module.css";
import Markdown from "react-markdown";
import { useAssistantStream } from "@/client/hooks/useAssistantStream";
import { ChatMessage } from "@/shared/types/chat";
import { FeedbackButtons } from "../FeedbackButtons/FeedbackButtons";
import { AssistantStream } from "openai/lib/AssistantStream";

const ErrorMessage = ({ message, show }: { message: string; show: boolean }) => 
  show ? <div className={styles.errorMessage}>{message}</div> : null;

const LoadingIndicator = () => {
  return <div className={styles.loadingIndicator}>Pensando...</div>;
};

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
    case "user": return <UserMessage text={text} />;
    case "assistant": return <AssistantMessage text={text} />;
    default: return null;
  }
};

interface ChatProps {
  visitorId: string;
  conversationId: string;
  threadId: string;
  onEnd: () => void;
}

export interface VisitorData {
  nome?: string;
  cargo?: string;
  area?: string;
  interesse?: string;
  email?: string;
  telefone?: string;
  cnpj?: string;
  consentimento?: boolean;
}

const Chat: React.FC<ChatProps> = ({ visitorId, conversationId, threadId, onEnd }) => {
  const [userInput, setUserInput] = useState("");
  const [inputDisabled, setInputDisabled] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const visitorDataRef = useRef<VisitorData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { 
    messages, 
    setMessages, 
    isLoading, 
    setIsLoading, 
    error, 
    setError, 
    handleReadableStream 
  } = useAssistantStream();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  useEffect(() => {
    const stored = localStorage.getItem("visitorData");
    if (stored) {
      const parsed = JSON.parse(stored);
      setVisitorData(parsed);
      visitorDataRef.current = parsed;
    }
  }, []);

  useEffect(() => {
    visitorDataRef.current = visitorData;
  }, [visitorData]);

  const sendMessage = useCallback(async (text: string) => {
    setIsLoading(true);
    setError({ message: "", show: false });

    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        }
      );

      if (!response.ok) throw new Error("Falha ao enviar mensagem");
      
      if (response.body) {
        const stream = AssistantStream.fromReadableStream(response.body);
        handleReadableStream(stream);
      } else {
        throw new Error("Resposta vazia do servidor");
      }
    } catch {
      setError({
        message: "Erro ao enviar mensagem. Por favor, tente novamente.",
        show: true
      });
      setInputDisabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, handleReadableStream, setError, setIsLoading]);

  const endConversation = async () => {
    await fetch(`/api/conversations/${conversationId}/end`, { method: 'POST' });
    setMessages([]);
    localStorage.removeItem('visitorId');
    localStorage.removeItem('conversationId');
    localStorage.removeItem('threadId');
    onEnd();
  };

  useEffect(() => {
    if (threadId && messages.length === 0 && visitorId) {
      const data = localStorage.getItem("visitorData");
      if (data) {
        const parsed = JSON.parse(data);
        setVisitorData(parsed);
        visitorDataRef.current = parsed;
        const { nome, cargo, area, interesse } = parsed;
        const intro = `O visitante se chama ${nome}, atua em ${area} como ${cargo} e tem interesse em ${interesse}. Cumprimente-o pelo nome e ofere\u00e7a ajuda.`;
        sendMessage(intro);
      }
    }
  }, [conversationId, messages.length, visitorId, sendMessage]);

  const handleFeedback = async (messageId: string, isPositive: boolean) => {
    if (feedbackGiven.has(messageId)) return;
    
    try {
      await fetch(`/api/feedback`, {
        method: "POST",
        body: JSON.stringify({ threadId, messageId, isPositive }),
      });
      
      setFeedbackGiven(prev => new Set(prev).add(messageId));
    } catch (err) {
      console.error("Erro ao enviar feedback:", err);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;
    
    const userMessageId = crypto.randomUUID();
    setMessages(prev => [
      ...prev,
      { id: userMessageId, role: "user", text: userInput, timestamp: Date.now() },
    ]);
    
    setUserInput("");
    setInputDisabled(true);
    sendMessage(userInput);
  };

 return (
    <div className={styles.chatContainer}>
      <div 
        className={styles.messagesContainer} 
        aria-live="polite"
      >
        {messages.map((message) => (
          <div key={message.id} className={styles.messageWrapper}>
            <Message {...message} />
            {message.role === "assistant" && !feedbackGiven.has(message.id) && (
              <FeedbackButtons 
                onFeedback={(isPositive) => handleFeedback(message.id, isPositive)} 
              />
            )}
          </div>
        ))}
        {isLoading && <LoadingIndicator />}
        {error.show && <ErrorMessage message={error.message} show={error.show} />}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={inputDisabled || isLoading}
          placeholder={inputDisabled || isLoading 
            ? "Aguarde a resposta..." 
            : "Digite sua mensagem..."
          }
          className={styles.input}
        />
        <button 
          type="submit" 
          disabled={inputDisabled || isLoading || !userInput.trim()} 
          className={styles.sendButton}
          aria-busy={isLoading}
        >
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
