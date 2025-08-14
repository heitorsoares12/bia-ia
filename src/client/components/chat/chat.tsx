"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import styles from "./chat.module.css";
import Markdown from "react-markdown";
import sanitize from "sanitize-html";
import { ChatMessage } from "@/shared/types/chat";
import { quickQuestions, QuickQuestion } from "@/data/quickQuestions";

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
            const child = Array.isArray(props.children)
              ? props.children[0]
              : props.children;
            const clean = sanitize(String(child ?? ""), {
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

const thinking = "pensando...";
const placeholder = "Digite sua mensagem...";

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationEnded, setConversationEnded] = useState(false);
  const router = useRouter();
  const [showEndDialog, setShowEndDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const visitorDataRef = useRef<VisitorData | null>(null);
  const initRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const wasNearBottom = useRef(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toEndVisible, setToEndVisible] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const prevMessagesLengthRef = useRef(0);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    },
    []
  );

  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = scrollAreaRef.current;
    const currentIsNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    setIsNearBottom(currentIsNearBottom);
    wasNearBottom.current = currentIsNearBottom;

    if (currentIsNearBottom) {
      setUnreadCount(0);
      setToEndVisible(false);
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    }
  }, []);

  const debouncedHandleScroll = useDebouncedCallback(handleScroll, 100);

  useEffect(() => {
    if (wasNearBottom.current) {
      scrollToBottom("auto");
    }
  }, [messages, isLoading, scrollToBottom]);


  const showToEndTemporarily = useCallback(() => {
    setToEndVisible(true);
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    hideTimerRef.current = window.setTimeout(() => {
      setToEndVisible(false);
      hideTimerRef.current = null;
    }, 5000);
  }, []);

  useEffect(() => {
    const prevLen = prevMessagesLengthRef.current;
    const currLen = messages.length;
    if (currLen > prevLen) {
      if (!wasNearBottom.current) {
        const newMessages = messages.slice(prevLen);
        const newAssistantCount = newMessages.filter((m) => m.role === "assistant").length;
        if (newAssistantCount > 0) {
          setUnreadCount((c) => c + newAssistantCount);
          showToEndTemporarily();
        }
      }
      prevMessagesLengthRef.current = currLen;
    }
  }, [messages, showToEndTemporarily]);

  useEffect(() => {
    if (!isNearBottom) {
      showToEndTemporarily();
    }
  }, [isNearBottom, showToEndTemporarily]);

  useEffect(() => {
    const vv = window.visualViewport;
    const el = scrollAreaRef.current;
    if (!vv || !el) return;
    const update = () => {
      const keyboardOffset = Math.max(0, window.innerHeight - vv.height);
      const base = 88;
      const safe = Math.max(base, base + keyboardOffset);
      el.style.setProperty("--to-end-bottom", `calc(${safe}px + env(safe-area-inset-bottom, 0px))`);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, []);

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
    async (
      content: string,
      id?: string,
      showUser: boolean = true,
      formatDirectives?: string
    ) => {
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
        const payload: {
          conversationId: string;
          content: string;
          formatDirectives?: string;
        } = { conversationId: convId, content };
        if (formatDirectives) payload.formatDirectives = formatDirectives;

        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok || !res.body) throw new Error("Erro ao enviar mensagem");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const assistantId = crypto.randomUUID();

        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", text: "", timestamp: Date.now() },
        ]);

        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // processa linhas SSE completas
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";
          for (const evt of events) {
            const line = evt.trim();
            if (!line) continue;
            if (line.startsWith("event:")) {
              continue;
            }
            if (line.startsWith("data:")) {
              const dataStr = line.slice(5).trim();
              if (dataStr === '"end"') continue;
              try {
                const data = JSON.parse(dataStr) as { content?: string };
                if (data.content) {
                  setMessages((prev) => {
                    if (prev.length === 0) return prev;
                    const last = prev[prev.length - 1];
                    if (last.id === assistantId && last.role === "assistant") {
                      const updated = { ...last, text: last.text + data.content };
                      return [...prev.slice(0, -1), updated];
                    }
                    return prev;
                  });
                }
              } catch (e) {
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  const handleQuickQuestion = useCallback(
    (q: QuickQuestion) => {
      if (isLoading || conversationEnded || !conversationId) return;
      sendMessage(q.userMessage, undefined, true, q.formatDirectives);
    },
    [conversationId, conversationEnded, isLoading, sendMessage]
  );

  const greetVisitor = useCallback(
    async (visitor: VisitorData, id: string) => {
      if (!visitor.nome) return;
      const { nome, area, interesse } = visitor;
      const intro = `## 🚀 **Prompt para a IA gerar a mensagem inicial do chat**
        > O usuário preencheu um formulário com os seguintes dados:
        >
        > * **Área de atuação:** ${area}
        > * **Interesse principal:** ${interesse}

        Com base nessas informações, você deve:

        1️⃣ Cumprimente o visitante chamado ${nome} de forma personalizada e acolhedora, usando o contexto da área de atuação dele.
        2️⃣ Apresente uma lista inicial de soluções ou produtos diretamente relacionados à área e ao interesse dele.
        3️⃣ Seja direto, útil e proativo. Não apenas cumprimente — já ofereça informações práticas.
        4️⃣ Caso o interesse seja "conhecer produtos", apresente os principais produtos disponíveis na área informada (exemplo: se área = automotivo, mostre produtos automotivos).
        5️⃣ Se o interesse for outro, adapte a mensagem para oferecer informações relevantes ou opções de ajuda.

        O tom deve ser **técnico, amigável e objetivo**, como um consultor que realmente entende do assunto.

        Exemplo esperado:
        "Olá, seja bem-vindo! Vejo que você atua no setor automotivo e tem interesse em conhecer nossos produtos. Aqui estão algumas opções recomendadas para você:"
      `;

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

  const requestEndConversation = () => setShowEndDialog(true);

  const handleConfirmEnd = async () => {
    if (!conversationId || conversationEnded) return;
    try {
      await fetch("/api/chat/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      // Limpa os dados da sessão
      localStorage.removeItem("conversationId");
      localStorage.removeItem("chatMessages");
      localStorage.removeItem("visitorData");
      setConversationId(null);
      setMessages([]);
      setConversationEnded(true);
      setShowEndDialog(false);
      // Redireciona para a tela inicial
      router.push("/");
    } catch (err) {
      console.error(err);
    } finally {
      setShowEndDialog(false);
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

  return (
    <div
      className={styles.chatContainer}
      role="region"
      aria-label="Chat de conversa"
    >
      {showEndDialog && (
        <>
          <div className={styles.overlay} />
          <div className={styles.confirmDialog}>
            <div className={styles.dialogHeader}>
              <span className={styles.warningIcon}>⚠️</span>
              <h3>Encerrar conversa</h3>
            </div>
            <p>Tem certeza que deseja encerrar esta conversa?</p>
            <div className={styles.dialogButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowEndDialog(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleConfirmEnd}
              >
                Encerrar
              </button>
            </div>
          </div>
        </>
      )}
      <div
        className={styles.scrollArea}
        onScroll={debouncedHandleScroll}
        ref={scrollAreaRef}
      >
        {!isOnline && (
          <div className={styles.offlineBanner}>
            Você está offline. Mensagens serão enviadas quando a conexão for
            restabelecida.
          </div>
        )}
        <div className={styles.chatHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>B</div>
            <div className={styles.headerInfo}>
              <h4>Chat com BIA</h4>
              <p>Assistente Virtual Brancotex</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button
              onClick={requestEndConversation}
              className={styles.endChatButton}
            >
              Encerrar
            </button>
          </div>
        </div>
        <div className={styles.quickQuestionsSection}>
          <h4 className={styles.quickQuestionsTitle}>Perguntas rápidas</h4>
          <div className={styles.quickQuestionsList}>
            {quickQuestions.map((q) => (
              <button
                key={q.id}
                type="button"
                className={styles.quickQuestionButton}
                onClick={() => handleQuickQuestion(q)}
                disabled={isLoading || conversationEnded || !conversationId}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
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
          {!isNearBottom && (
            <button
              onClick={() => {
                scrollToBottom();
                setUnreadCount(0);
                setToEndVisible(false);
              }}
              className={`${styles.toEndButton} ${unreadCount > 0 ? styles.toEndButtonNew : ""} ${toEndVisible ? styles.toEndVisible : styles.toEndHidden}`}
              aria-label={unreadCount > 0 ? `Ir para o fim. ${unreadCount} nova${unreadCount > 1 ? "s" : ""} mensagem${unreadCount > 1 ? "s" : ""}.` : "Ir para o fim do chat"}
              aria-haspopup="false"
              aria-live="off"
              title={unreadCount > 0 ? `Novas mensagens: ${unreadCount}` : "Ir para o fim do chat"}
              onMouseEnter={() => {
                if (hideTimerRef.current) {
                  window.clearTimeout(hideTimerRef.current);
                  hideTimerRef.current = null;
                }
              }}
              onMouseLeave={() => {
                if (!toEndVisible) {
                  showToEndTemporarily();
                }
              }}
              onFocus={() => {
                if (hideTimerRef.current) {
                  window.clearTimeout(hideTimerRef.current);
                  hideTimerRef.current = null;
                }
              }}
              onBlur={() => {
                if (!toEndVisible) {
                  showToEndTemporarily();
                }
              }}
            >
              <svg
                className={styles.toEndIcon}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M6 7l6 6 6-6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 12l6 6 6-6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {unreadCount > 0 && (
                <span className={styles.unreadBadge} aria-hidden="true">{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
              <span className={styles.tooltip} role="tooltip">
                {unreadCount > 0 ? `${unreadCount} nova${unreadCount > 1 ? "s" : ""} mensagem${unreadCount > 1 ? "s" : ""}. Clique para ir ao fim.` : "Ir para o fim do chat"}
              </span>
            </button>
          )}
        </div>
      </div>
      <form ref={formRef} onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={isLoading || !isOnline || conversationEnded}
          placeholder={isLoading ? "Aguarde a resposta..." : placeholder}
          className={styles.input}
          aria-label="Digite sua mensagem"
        />
        <button
          type="submit"
          disabled={
            isLoading || !userInput.trim() || !isOnline || conversationEnded
          }
          className={styles.sendButton}
          aria-label="Enviar mensagem"
        >
          <span>Enviar</span>
          <svg
            className={styles.sendIcon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
              fill="white"
            />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default Chat;
