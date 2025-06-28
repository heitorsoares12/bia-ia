"use client";

import { useState } from 'react';
import { Form } from '@/client/components/form/Form';
import Chat from '@/client/components/chat/chat';
import styles from "./page.module.css";

export default function FormPage() {
  const [formDone, setFormDone] = useState(false);

  return (
    <div>
      {!formDone ? (
        <Form onSuccess={() => setFormDone(true)} />
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