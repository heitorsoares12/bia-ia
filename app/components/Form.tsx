import { useState } from 'react';

export default function Form({ onSuccess }: { onSuccess: (visitorId: number) => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [consentimento, setConsentimento] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, telefone, cnpj, consentimento }),
    });
    const data = await response.json();
    if (data.visitorId) onSuccess(data.visitorId);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
      <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="tel" placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
      <input type="text" placeholder="CNPJ" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required />
      <label>
        <input type="checkbox" checked={consentimento} onChange={(e) => setConsentimento(e.target.checked)} required />
        Aceito a política de privacidade (LGPD)
      </label>
      <button type="submit">Iniciar Chat</button>
    </form>
  );
}