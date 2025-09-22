import styles from './PrivacyModal.module.css';

export default function PrivacyModal({ open, onClose }: {
  open: boolean;
  onClose: () => void
}) {
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <dialog
      open
      className={styles.modal}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.modalContent}>
        <h2>Política de Privacidade</h2>
        <p>
          Coletamos os dados fornecidos neste formulário para identificá-lo,
          oferecer atendimento personalizado e registrar histórico de
          conversas. A base legal é o <strong>consentimento</strong> (art. 7º, I da LGPD).
        </p>
        <p>
          <strong>Informações importantes:</strong>
        </p>
        <p>
          • Dados armazenados em servidores AWS na região São Paulo<br/>
          • Retenção: 5 anos ou até revogação do consentimento<br/>
          • Você pode acessar, corrigir ou excluir seus dados enviando e-mail para dpo@exemplo.com<br/>
          • Não compartilhamos suas informações com terceiros fora das finalidades descritas
        </p>
        <button
          className={styles.closeButton}
          onClick={onClose}
          autoFocus
          aria-label="Fechar modal de política de privacidade"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Fechar
        </button>
      </div>
    </dialog>
  );
}