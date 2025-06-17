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

const Chat = () => {
  const [userInput, setUserInput] = useState("");
  const [inputDisabled, setInputDisabled] = useState(false);
  const [threadId, setThreadId] = useState("");
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());
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

  const createThread = useCallback(async () => {
    try {
      const res = await fetch(`/api/assistants/threads`, { method: "POST" });
      if (!res.ok) throw new Error("Falha ao criar thread");
      const data = await res.json();
      setThreadId(data.threadId);
    } catch {
      setError({
        message: "Erro ao iniciar conversa. Por favor, tente novamente.",
        show: true
      });
    }
  }, [setError]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    const savedThreadId = localStorage.getItem("threadId");
    
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
    
    if (savedThreadId) {
      setThreadId(savedThreadId);
    } else {
      createThread();
    }
  }, [setMessages, createThread]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (threadId) {
      localStorage.setItem("threadId", threadId);
    }
  }, [threadId]);

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

  const sendMessage = async (text: string) => {
    setIsLoading(true);
    setError({ message: "", show: false });
    
    try {
      const response = await fetch(
        `/api/assistants/threads/${threadId}/messages`,
        { method: "POST", body: JSON.stringify({ content: text }) }
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
    </div>
  );
};

export default Chat;