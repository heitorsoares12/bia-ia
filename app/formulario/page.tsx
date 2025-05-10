"use client";

import { useState } from 'react';
import Form from '../components/Form';

export default function FormPage() {
  const [visitorId, setVisitorId] = useState<number | null>(null);

  return (
    <div>
      {!visitorId ? (
        <Form onSuccess={(id) => setVisitorId(id)} />
      ) : (
        <div>
          <p>Chat liberado para o visitante ID: {visitorId}</p>
        </div>
      )}
    </div>
  );
}