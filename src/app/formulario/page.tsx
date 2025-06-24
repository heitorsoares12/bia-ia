"use client";

import { useState, useEffect } from 'react';
import { Form } from '@/client/components/form/Form';
import Chat from '@/client/components/chat/chat';
import styles from "./page.module.css";

export default function FormPage() {
  const [session, setSession] = useState<{
    visitorId: string;
    conversationId: string;
    threadId: string;
  } | null>(null);

  useEffect(() => {
    const vid = localStorage.getItem('visitorId');
    const cid = localStorage.getItem('conversationId');
    const tid = localStorage.getItem('threadId');
    if (vid && cid && tid) {
      setSession({ visitorId: vid, conversationId: cid, threadId: tid });
    }
  }, []);

  const startChat = async (visitorId: string) => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('visitorId', visitorId);
      localStorage.setItem('conversationId', data.conversationId);
      localStorage.setItem('threadId', data.threadId);
      setSession({ visitorId, conversationId: data.conversationId, threadId: data.threadId });
    }
  };

  const handleEnd = () => {
    localStorage.removeItem('visitorId');
    localStorage.removeItem('conversationId');
    localStorage.removeItem('threadId');
    setSession(null);
  };

  return (
    <div>
      {!session ? (
        <Form onSuccess={startChat} />
      ) : (
        <main className={styles.main}>
          <div className={styles.container}>
            <Chat
              visitorId={session.visitorId}
              conversationId={session.conversationId}
              threadId={session.threadId}
              onEnd={handleEnd}
            />
          </div>
        </main>
      )}
    </div>
  );
}