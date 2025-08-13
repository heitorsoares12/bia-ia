
import React from 'react';
import styles from './Form.module.css';

interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, icon, children }) => (
  <div className={styles.formSection}>
    <div className={styles.sectionHeader}>
      {icon}
      <h3 className={styles.sectionTitle}>{title}</h3>
    </div>
    {children}
  </div>
);
