"use client";

import { useState } from "react";
import { Form } from "@/client/components/form/Form";
import Chat from "@/client/components/chat/chat";
import styles from "./page.module.css";
import Image from "next/image";

export default function FormPage() {
  const [formDone, setFormDone] = useState(false);

  return (
    <div className={styles.pageContainer}>
      <>
        <div className={styles.formWrapper}>
          {!formDone ? <Form onSuccess={() => setFormDone(true)} /> : <Chat />}
        </div>
        <div className={styles.assistantWrapper}>
          <div className={styles.assistantContent}>
            <Image
              src="/assets/Bia.png"
              alt="Assistente Virtual Bia"
              width={220}
              height={220}
              className={styles.avatar}
              priority
            />
            <h3>Olá!</h3>
            <p>
              Estou aqui para ajudá-lo a encontrar a melhor solução 
              <strong> BRANCOTEX</strong>, para seu projeto, mas ainda estou em treinamento.
            </p>
            <p>
              Então, caso alguma informação pareça imprecisa, por favor
              pergunte a um de nossos especialistas.
            </p>
          </div>
        </div>
      </>
    </div>
  );
}
