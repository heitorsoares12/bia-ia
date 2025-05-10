"use client";

import React from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

const Home = () => {
  const router = useRouter();

  return (
    <main className={styles.main}>
      <div className={styles.title}>Assistente Bia</div>
      <div className={styles.container}>
        <button 
          className={styles.chatButton}
          onClick={() => router.push("/formulario")} // Atualizado para a nova rota
        >
          Iniciar chat
        </button>
      </div>
    </main>
  );
};

export default Home;