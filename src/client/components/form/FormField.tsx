import React from 'react';
import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';
import styles from './Form.module.css';

interface FormFieldProps<T extends FieldValues> {
  id: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  error?: FieldError;
  required?: boolean;
  type?: string;
  placeholder?: string;
  options?: readonly { value: string; label: string }[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur?: () => void;
  value?: string;
  isFetching?: boolean;
  disabled?: boolean;
}

export const FormField = <T extends FieldValues>({
  id,
  label,
  register,
  error,
  required = false,
  type = 'text',
  options,
  isFetching,
  ...rest
}: FormFieldProps<T>) => {
  return (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.inputLabel}>
        {label} {required && <span className={styles.requiredStar}>*</span>}
      </label>
      
      {type === 'select' ? (
        <div className={styles.selectContainer}>
          <select
            id={id}
            className={`${styles.select} ${error ? styles.selectError : ''}`}
            aria-invalid={!!error}
            {...register(id, { 
              required: required ? "Este campo é obrigatório" : false 
            })}
            {...rest}
          >
            <option value="" disabled>Selecione uma opção...</option>
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      ) : (
        <input
          id={id}
          type={type}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          aria-invalid={!!error}
          {...register(id, { 
            required: required ? "Este campo é obrigatório" : false 
          })}
          {...rest}
        />
      )}
      
      {error && (
        <span className={styles.errorMessage}>
          {error.message || "Por favor, selecione uma opção válida"}
        </span>
      )}
      
      {isFetching && (
        <div className={styles.loaderContainer}>
          <div className={styles.loader}></div>
          <span className={styles.loaderText}>Buscando dados...</span>
        </div>
      )}
    </div>
  );
};