"use client";

import { useState } from 'react';
import { Form } from '../components/form/Form';
import Chat from "../components/chat/chat";
import styles from "./page.module.css";

export default function FormPage() {
  const [visitorId, setVisitorId] = useState<string | null>(null);

  return (
    <div>
      {!visitorId ? (
        <Form onSuccess={(id: string) => setVisitorId(id)} />
      ) : (
        <main className={styles.main}>
          <div className={styles.container}>
            <Chat />
          </div>
        </main>
      )}
    </div>
  );
}