import styles from './PrivacyModal.module.css';

export default function PrivacyModal({ open, onClose }: { 
  open: boolean; 
  onClose: () => void 
}) {
  if (!open) return null;

  return (
    <dialog open className={styles.modal}>
      <div className={styles.modalContent}>
        <h2>Política de Privacidade</h2>
        <p>
          Coletamos os dados fornecidos neste formulário para identifica-lo,
          oferecer atendimento personalizado e registrar histórico de
          conversas. A base legal é o <strong>consentimento</strong> (art. 7º, I da LGPD).
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
        >
          Fechar
        </button>
      </div>
    </dialog>
  );
}