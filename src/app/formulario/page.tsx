"use client";

import { useState, useEffect } from "react";
import { Form } from "@/client/components/form/Form";
import Chat from "@/client/components/chat/chat";
import styles from "./page.module.css";
import Image from "next/image";
import { useSessionContext } from "@/client/components/SessionProvider";

export default function FormPage() {
  const [formDone, setFormDone] = useState(false);
  const { session, isLoading, hasActiveSession } = useSessionContext();

  // Verifica se usuário tem sessão ativa ao carregar a página
  useEffect(() => {
    if (!isLoading && hasActiveSession()) {
      setFormDone(true);
    }
  }, [isLoading, hasActiveSession]);

  // Mostra loading enquanto verifica sessão
  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Verificando sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <>
        <div className={styles.formWrapper}>
          {!formDone ? <Form onSuccess={() => setFormDone(true)} /> : <Chat />}
        </div>
        <div className={styles.assistantWrapper}>
          <div className={styles.assistantContent}>
            <Image
              src="/assets/LogoBia.png"
              alt="Assistente Virtual Bia"
              width={220}
              height={320}
              className={styles.avatar}
              priority
            />
            {session ? (
              <div className={styles.returningUserSection}>
                <div className={styles.welcomeBackHeader}>
                  <h3>Bem-vindo de volta, {session.visitorData.nome.split(' ')[0]}!</h3>
                  <p>
                    Estou aqui para ajudá-lo a encontrar a melhor solução
                    <strong> BRANCOTEX</strong>, para seu projeto, mas ainda estou em treinamento.
                  </p>
                  <p>
                    Então, case alguma informação pareça imprecisa, por favor
                    pergunte a um de nossos especialistas.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <h3>Olá!</h3>
                <p>
                  Estou aqui para ajudá-lo a encontrar a melhor solução
                  <strong> BRANCOTEX</strong>, para seu projeto, mas ainda estou em treinamento.
                </p>
                <p>
                  Então, case alguma informação pareça imprecisa, por favor
                  pergunte a um de nossos especialistas.
                </p>
              </>
            )}
          </div>
        </div>
      </>
    </div>
  );
}
