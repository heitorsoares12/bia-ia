"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./chat.module.css";
import { AssistantStream } from "openai/lib/AssistantStream";
import Markdown from "react-markdown";

type MessageProps = {
  role: "user" | "assistant";
  text: string;
  timestamp?: number;
};

type ErrorType = {
  message: string;
  show: boolean;
};

const UserMessage = ({ text }: { text: string }) => {
  return <div className={styles.userMessage}>{text}</div>;
};

const AssistantMessage = ({ text }: { text: string }) => {
  return (
    <div className={styles.assistantMessage}>
      <Markdown>{text}</Markdown>
    </div>
  );
};

const Message = ({ role, text }: MessageProps) => {
  switch (role) {
    case "user":
      return <UserMessage text={text} />;
    case "assistant":
      return <AssistantMessage text={text} />;
    default:
      return null;
  }
};

const ErrorMessage = ({ message, show }: ErrorType) => {
  if (!show) return null;
  return <div className={styles.errorMessage}>{message}</div>;
};

const LoadingIndicator = () => {
  return <div className={styles.loadingIndicator}>Pensando...</div>;
};

const FeedbackButtons = ({ onFeedback }: { onFeedback: (isPositive: boolean) => void }) => {
  return (
    <div className={styles.feedbackButtons}>
      <button onClick={() => onFeedback(true)} aria-label="Feedback positivo">👍</button>
      <button onClick={() => onFeedback(false)} aria-label="Feedback negativo">👎</button>
    </div>
  );
};

const Chat = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [threadId, setThreadId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorType>({ message: "", show: false });
  const [feedbackGiven, setFeedbackGiven] = useState<Set<number>>(new Set());

  // automatically scroll to bottom of chat
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages from localStorage
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
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // Save threadId to localStorage whenever it changes
  useEffect(() => {
    if (threadId) {
      localStorage.setItem("threadId", threadId);
    }
  }, [threadId]);

  const createThread = async () => {
    try {
      const res = await fetch(`/api/assistants/threads`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Falha ao criar thread");
      const data = await res.json();
      setThreadId(data.threadId);
    } catch (err) {
      setError({
        message: "Erro ao iniciar conversa. Por favor, tente novamente.",
        show: true
      });
    }
  };

  const handleFeedback = async (messageTimestamp: number, isPositive: boolean) => {
    if (feedbackGiven.has(messageTimestamp)) return;
    
    try {
      await fetch(`/api/feedback`, {
        method: "POST",
        body: JSON.stringify({
          threadId,
          timestamp: messageTimestamp,
          isPositive
        }),
      });
      
      setFeedbackGiven(prev => new Set(prev).add(messageTimestamp));
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
        {
          method: "POST",
          body: JSON.stringify({
            content: text,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao enviar mensagem");
      }

      if (response.body) {
        const stream = AssistantStream.fromReadableStream(response.body);
        handleReadableStream(stream);
      } else {
        throw new Error("Resposta vazia do servidor");
      }
    } catch (err) {
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
    
    const timestamp = Date.now();
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", text: userInput, timestamp },
    ]);
    setUserInput("");
    setInputDisabled(true);
    sendMessage(userInput);
    scrollToBottom();
  };

  const appendMessage = (role: "assistant" | "user", text: string) => {
    const timestamp = Date.now();
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      if (lastMessage && lastMessage.role === role) {
        return [
          ...prevMessages.slice(0, -1),
          { ...lastMessage, text: lastMessage.text + text },
        ];
      }
      return [...prevMessages, { role, text, timestamp }];
    });
  };

  /* Stream Event Handlers */
  const handleTextCreated = () => {
    appendMessage("assistant", "");
  };

  const handleTextDelta = (delta: { value?: string }, snapshot: any) => {
    if (delta.value) {
      appendMessage("assistant", delta.value);
    }
  };

  const handleTextComplete = () => {
    setInputDisabled(false);
    setIsLoading(false);
  };

  const handleReadableStream = (stream: AssistantStream) => {
    stream.on("textCreated", handleTextCreated);
    stream.on("textDelta", handleTextDelta);
    stream.on("end", handleTextComplete);
    stream.on("error", (error) => {
      setError({
        message: "Erro durante a conversa. Por favor, tente novamente.",
        show: true
      });
      setInputDisabled(false);
      setIsLoading(false);
    });
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div key={index} className={styles.messageWrapper}>
            <Message {...message} />
            {message.role === "assistant" && message.timestamp && !feedbackGiven.has(message.timestamp) && (
              <FeedbackButtons onFeedback={(isPositive) => handleFeedback(message.timestamp!, isPositive)} />
            )}
          </div>
        ))}
        {isLoading && <LoadingIndicator />}
        {error.show && <ErrorMessage {...error} />}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={inputDisabled}
          placeholder={inputDisabled ? "Aguarde a resposta..." : "Digite sua mensagem..."}
          className={styles.input}
        />
        <button 
          type="submit" 
          disabled={inputDisabled || !userInput.trim()} 
          className={styles.sendButton}
        >
          Enviar
        </button>
      </form>
    </div>
  );
};

export default Chat;