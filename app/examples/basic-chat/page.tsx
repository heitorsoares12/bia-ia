"use client";

import React from "react";
import styles from "./page.module.css";
import Chat from "../../components/chat";

const BasicChat = () => {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Chat />
      </div>
    </main>
  );
};

export default BasicChat;