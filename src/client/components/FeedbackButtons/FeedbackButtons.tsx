import React from "react";
import styles from "../chat/chat.module.css";

export const FeedbackButtons = ({ 
  onFeedback 
}: { 
  onFeedback: (isPositive: boolean) => void 
}) => {
  return (
    <div className={styles.feedbackButtons}>
      <button 
        onClick={() => onFeedback(true)} 
        aria-label="Feedback positivo"
      >
        👍
      </button>
      <button 
        onClick={() => onFeedback(false)} 
        aria-label="Feedback negativo"
      >
        👎
      </button>
    </div>
  );
};