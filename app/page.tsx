"use client";

import React from "react";
import styles from "./page.module.css";

const Home = () => {
  return (
    <main className={styles.main}>
      <div className={styles.title}>
        Assistente Bia
      </div>
      <div className={styles.container}>
        <a className={styles.chatButton} href="/examples/basic-chat">
          Iniciar chat
        </a>
      </div>
    </main>
  );
};

export default Home;