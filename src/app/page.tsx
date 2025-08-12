"use client";

import React from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import Image from "next/image";

const Home = () => {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <img 
          src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=372,fit=crop,q=95/dJo4XEjQbKIW98P8/logotipo_preferencial_horizontal-mjEvkwWoq8UOek0O.png" 
          alt="Brancotex" 
          className={styles.logo}
        />
        <h1 className={styles.title}>Assistente Virtual Bia</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.avatarContainer}>
          <Image
            src="/assets/Bia.png"
            alt="Assistente Virtual Bia"
            width={220}
            height={220}
            className={styles.avatar}
            priority
          />
        </div>
        
        <p className={styles.welcomeText}>
          Sou a Bia, uma inteligência artificial em treinamento. Posso
          cometer erros, mas vou fazer o possível para te ajudar a
          encontrar as melhores opções para o seu projeto. Se algo
          parecer impreciso, confirme comigo ou com nossa equipe.
        </p>

        <div className={styles.instructions}>
          <h2 className={styles.instructionsTitle}>Instruções de uso</h2>
          <ol className={styles.instructionsList}>
            <li>Seja específico(a) nas suas perguntas.</li>
            <li>Faça uma pergunta por vez.</li>
            <li>
              Evite compartilhar dados sensíveis (ex.: CPF, senhas).
            </li>
          </ol>
        </div>
        
        <button
          className={styles.chatButton}
          onClick={() => router.push("/formulario")}
          aria-label="Iniciar conversa com a assistente virtual"
        >
          <svg 
            className={styles.chatIcon} 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor"/>
          </svg>
          Iniciar Atendimento
        </button>
      </div>
      
      <footer className={styles.footer}>
        Evento Corporativo Brancotex • São Paulo 2024
      </footer>
    </div>
  );
};

export default Home;