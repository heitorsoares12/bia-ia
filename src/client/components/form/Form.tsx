'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import styles from './Form.module.css'
import { useState, useCallback  } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import PrivacyModal from '../Modal/PrivacyModal/PrivacyModal';
import { isValidCNPJ } from '@/client/utils/cnpj'

const formSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  cnpj: z.string()
    .min(14, 'CNPJ deve ter 14 dígitos')
    .refine(cnpj => isValidCNPJ(cnpj), { 
      message: 'CNPJ inválido' 
    }),
  empresa: z.string().min(2, 'Empresa é obrigatória'),
  cargo: z.string().min(2, 'Cargo é obrigatório'),
  interesse: z.enum(['produto', 'servico', 'parceria', 'outro']),
  lgpdConsent: z.boolean().refine(val => val, {
    message: 'Você deve consentir com a política de privacidade',
  }),
})

type FormValues = z.infer<typeof formSchema>


interface FormProps {
  onSuccess?: (visitorId: string) => void
}

export const Form: React.FC<FormProps> = ({ onSuccess }) => {
  
  const [cnpjValue, setCnpjValue] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [showPolicy, setShowPolicy] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid }, 
    setValue, 
    trigger
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      lgpdConsent: false,
    },
  })

  const handleLgpdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('lgpdConsent', e.target.checked);
    trigger('lgpdConsent');
  }

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})$/)
    
    if (!match) return value
    
    return `${match[1]}${match[2] ? '.' + match[2] : ''}${match[3] ? '.' + match[3] : ''}${match[4] ? '/' + match[4] : ''}${match[5] ? '-' + match[5] : ''}`
  }

  const fetchCompanyData = useCallback(async (cnpj: string) => {
  const cleanedCNPJ = cnpj.replace(/\D/g, '');
  if (cleanedCNPJ.length !== 14) return;
  
  setIsFetching(true);
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanedCNPJ}`);
    
    if (response.status === 429 || response.status >= 500) {
      throw new Error('API overloaded');
    }
    
    const data = await response.json();

    if (data.message) {
      throw new Error(data.message);
    }
    
    if (data.nome_fantasia) {
      setValue('empresa', data.nome_fantasia);
      trigger('empresa');
      toast.success('Dados da empresa carregados!');
    } else {
      throw new Error('CNPJ não encontrado na BrasilAPI');
    }
  } catch (firstError) {
    try {
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleanedCNPJ}`);
      
      if (!response.ok) {
        throw new Error('Erro na segunda API');
      }
      
      const data = await response.json();
      
      if (data.estabelecimento?.nome_fantasia) {
        setValue('empresa', data.estabelecimento.nome_fantasia);
        trigger('empresa');
        toast.success('Dados da empresa carregados!');
      } else {
        throw new Error('CNPJ não encontrado');
      }
    } catch (secondError) {
      toast.error('Erro ao buscar CNPJ. Preencha manualmente.');
      console.error('Ambas as APIs falharam:', firstError, secondError);
    }
  } finally {
    setIsFetching(false);
  }
}, [setValue, trigger]);


  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value)
    setCnpjValue(formatted)
    
    const cleanedValue = formatted.replace(/\D/g, '')
    setValue('cnpj', cleanedValue, { shouldValidate: true })
  }

  const handleCnpjBlur = () => {
    if (cnpjValue.replace(/\D/g, '').length === 14) {
      fetchCompanyData(cnpjValue)
    }
  }

  const onSubmit = () => {
    onSuccess?.(cnpjValue)
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        }}
      />

      <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
        <h2 className={styles.formTitle}>Converse com nosso assistente</h2>
        <p className={styles.formSubtitle}>Preencha seus dados para iniciar o chat</p>

        <div className={styles.formGrid}>
          <InputField
            label="Nome completo*"
            id="nome"
            error={errors.nome}
            {...register('nome')}
          />

          <InputField
            label="E-mail*"
            id="email"
            type="email"
            error={errors.email}
            {...register('email')}
          />

          <div className={styles.inputGroup}>
            <label htmlFor="cnpj" className={styles.inputLabel}>
              CNPJ*
            </label>
            <input
              id="cnpj"
              className={`${styles.input} ${errors.cnpj ? styles.inputError : ''}`}
              value={cnpjValue}
              onChange={handleCnpjChange}
              onBlur={handleCnpjBlur}
              placeholder="00.000.000/0000-00"
              aria-invalid={!!errors.cnpj}
            />
            {errors.cnpj && <span className={styles.errorMessage}>{errors.cnpj.message}</span>}
            {isFetching && <span className={styles.errorMessage}>Buscando dados...</span>}
          </div>

          <InputField
            label="Empresa"
            id="empresa"
            error={errors.empresa}
            {...register('empresa')}
          />

          <InputField
            label="Cargo"
            id="cargo"
            error={errors.cargo}
            {...register('cargo')}
          />

          <SelectField
            label="Interesse principal*"
            id="interesse"
            options={[
              { value: 'produto', label: 'Conhecer produtos' },
              { value: 'servico', label: 'Serviços personalizados' },
              { value: 'parceria', label: 'Parcerias' },
              { value: 'outro', label: 'Outro assunto' },
            ]}
            error={errors.interesse}
            {...register('interesse')}
          />
        </div>

        <div className={styles.lgpdContainer}>
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="lgpdConsent"
              {...register('lgpdConsent')}
              onChange={handleLgpdChange}
              className={styles.checkbox}
            />
            <label htmlFor="lgpdConsent" className={styles.lgpdLabel}>
              Li e concordo com a&nbsp;
              <button 
                type="button" 
                className={styles.privacyLink}
                onClick={(e) => {
                  e.preventDefault();
                  setShowPolicy(true);
                }}
              >
                Política de Privacidade
              </button>
              &nbsp;e tratamento de dados pessoais.
            </label>
          </div>
          {errors.lgpdConsent && (
            <span className={styles.errorMessage}>{errors.lgpdConsent.message}</span>
          )}
        </div>
        
        <PrivacyModal 
          open={showPolicy} 
          onClose={() => setShowPolicy(false)} 
        />

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={!isValid}
        >
          Iniciar conversa
        </button>
      </form>
    </>
  )
}

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: { message?: string }
}

const InputField = ({ label, id, error, ...props }: InputFieldProps) => (
  <div className={styles.inputGroup}>
    <label htmlFor={id} className={styles.inputLabel}>
      {label}
    </label>
    <input
      id={id}
      className={`${styles.input} ${error ? styles.inputError : ''}`}
      aria-invalid={!!error}
      {...props}
    />
    {error && <span className={styles.errorMessage}>{error.message}</span>}
  </div>
)

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: Array<{ value: string; label: string }>
  error?: { message?: string }
}

const SelectField = ({ label, id, options, error, ...props }: SelectFieldProps) => (
  <div className={styles.inputGroup}>
    <label htmlFor={id} className={styles.inputLabel}>
      {label}
    </label>
    <select
      id={id}
      className={`${styles.select} ${error ? styles.inputError : ''}`}
      aria-invalid={!!error}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <span className={styles.errorMessage}>{error.message}</span>}
  </div>
)