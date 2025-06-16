import { useState, useCallback } from "react";
import { AssistantStream } from "openai/lib/AssistantStream";
import { ChatMessage } from "../types/chat";

export const useAssistantStream = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; show: boolean }>({ 
    message: "", 
    show: false 
  });

  const appendMessage = useCallback((role: "assistant" | "user", text: string, id?: string) => {
    setMessages(prev => {
      const newId = id || crypto.randomUUID();
      const timestamp = Date.now();
      
      // Se for continuação da última mensagem
      if (id && prev.length > 0 && prev[prev.length - 1].id === id) {
        return [
          ...prev.slice(0, -1),
          { 
            ...prev[prev.length - 1], 
            text: prev[prev.length - 1].text + text 
          }
        ];
      }
      
      // Nova mensagem
      return [...prev, { id: newId, role, text, timestamp }];
    });
  }, []);

  const handleReadableStream = useCallback((stream: AssistantStream, messageId?: string) => {
    const newMessageId = messageId || crypto.randomUUID();
    
    stream.on("textCreated", () => {
      appendMessage("assistant", "", newMessageId);
    });

    stream.on("textDelta", (delta) => {
      if (delta.value) {
        appendMessage("assistant", delta.value, newMessageId);
      }
    });

    stream.on("end", () => {
      setIsLoading(false);
    });

    stream.on("error", (error) => {
      setError({
        message: "Erro durante a conversa. Por favor, tente novamente.",
        show: true
      });
      setIsLoading(false);
    });
  }, [appendMessage]);

  return {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    error,
    setError,
    handleReadableStream,
    appendMessage
  };
};