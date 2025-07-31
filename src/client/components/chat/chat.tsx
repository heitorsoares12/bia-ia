"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
          <button onClick={requestEndConversation} className={styles.endChatButton}>
            Encerrar
          </button>
        </div>
      </div>
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
