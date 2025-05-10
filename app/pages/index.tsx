import { useState } from 'react';
import Form from '../components/Form';

export default function Home() {
  const [visitorId, setVisitorId] = useState<number | null>(null);

  return (
    <div>
      {!visitorId ? (
        <Form onSuccess={(id) => setVisitorId(id)} />
      ) : (
        <div>
          {/* Componente de Chat aqui (será implementado posteriormente) */}
          <p>Chat liberado para o visitante ID: {visitorId}</p>
        </div>
      )}
    </div>
  );
}