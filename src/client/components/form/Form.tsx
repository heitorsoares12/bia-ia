"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import styles from "./Form.module.css";
import { useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import PrivacyModal from "../Modal/PrivacyModal/PrivacyModal";
import { isValidCNPJ } from "@/client/utils/cnpj";

const cargoOptions = [
  { value: "comprador", label: "Comprador" },
  { value: "gerenteCompras", label: "Gerente de Compras" },
  { value: "proprietario", label: "Proprietário" },
  { value: "gerenteVendas", label: "Gerente de Vendas" },
  { value: "vendedor", label: "Vendedor" },
  { value: "arquitetoDecorador", label: "Arquitetura/Decorador" },
  { value: "engenheiro", label: "Engenheiro" },
  { value: "outros", label: "Outros" },
] as const;

const areaOptions = [
  { value: "construcaoCivil", label: "Construção Civil" },
  { value: "arquiteturaDecoracao", label: "Arquitetura/Decoração" },
  { value: "industriaMoveleira", label: "Indústria Moveleira" },
  { value: "automotivo", label: "Automotivo" },
  { value: "naval", label: "Naval" },
  { value: "varejoMateriais", label: "Varejo de Materiais" },
  { value: "outros", label: "Outros" },
] as const;

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  cnpj: z
    .string()
    .min(14, "CNPJ deve ter 14 dígitos")
    .refine((cnpj) => isValidCNPJ(cnpj), {
      message: "CNPJ inválido",
    }),
  empresa: z.string().min(2, "Empresa é obrigatória"),
  cargo: z.enum(cargoOptions.map((c) => c.value) as [string, ...string[]]),
  cargoOutro: z.string().optional(),
  area: z.enum(areaOptions.map((a) => a.value) as [string, ...string[]]),
  areaOutro: z.string().optional(),
  interesse: z.enum(["produto", "servico", "parceria", "outro"]),
  lgpdConsent: z.boolean().refine((val) => val, {
    message: "Você deve consentir com a política de privacidade",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface FormProps {
  onSuccess?: (visitorId: string) => void;
}

export const Form: React.FC<FormProps> = ({ onSuccess }) => {
  const [cnpjValue, setCnpjValue] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    trigger,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      lgpdConsent: false,
    },
  });

  const cargoSelected = watch("cargo");
  const areaSelected = watch("area");

  const handleLgpdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("lgpdConsent", e.target.checked);
    trigger("lgpdConsent");
  };

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(
      /^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})$/
    );

    if (!match) return value;

    return `${match[1]}${match[2] ? "." + match[2] : ""}${
      match[3] ? "." + match[3] : ""
    }${match[4] ? "/" + match[4] : ""}${match[5] ? "-" + match[5] : ""}`;
  };

  const fetchCompanyData = useCallback(
    async (cnpj: string) => {
      const cleanedCNPJ = cnpj.replace(/\D/g, "");
      if (cleanedCNPJ.length !== 14) return;

      setIsFetching(true);
      const brasilApiUrl = `https://brasilapi.com.br/api/cnpj/v1/${cleanedCNPJ}`;
      const cnpjWsUrl = `https://publica.cnpj.ws/cnpj/${cleanedCNPJ}`;

      const fetchBrasilApi = async () => {
        const response = await fetch(brasilApiUrl);
        if (response.status === 429 || response.status >= 500) {
          throw new Error("API overloaded");
        }
        const data = await response.json();
        if (data.message || !data.nome_fantasia) {
          throw new Error(data.message || "CNPJ não encontrado na BrasilAPI");
        }
        return data.nome_fantasia as string;
      };

      const fetchCnpjWs = async () => {
        const response = await fetch(cnpjWsUrl);
        if (!response.ok) {
          throw new Error("Erro na segunda API");
        }
        const data = await response.json();
        if (!data.estabelecimento?.nome_fantasia) {
          throw new Error("CNPJ não encontrado");
        }
        return data.estabelecimento.nome_fantasia as string;
      };

      try {
        const nomeFantasia = await Promise.any([
          fetchBrasilApi(),
          fetchCnpjWs(),
        ]);
        setValue("empresa", nomeFantasia);
        trigger("empresa");
        toast.success("Dados da empresa carregados!");
      } catch (err) {
        toast.error("Falha ao buscar CNPJ. Preencha manualmente.");
        console.error("Falha ao buscar CNPJ:", err);
      } finally {
        setIsFetching(false);
      }
    },
    [setValue, trigger]
  );

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setCnpjValue(formatted);

    const cleanedValue = formatted.replace(/\D/g, "");
    setValue("cnpj", cleanedValue, { shouldValidate: true });
  };

  const handleCnpjBlur = () => {
    if (cnpjValue.replace(/\D/g, "").length === 14) {
      fetchCompanyData(cnpjValue);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error("Falha ao enviar");
      localStorage.setItem(
        "visitorData",
        JSON.stringify({
          nome: data.nome,
          cargo: data.cargo,
          area: data.area,
          interesse: data.interesse,
        })
      );
      onSuccess?.(result.userId);
    } catch {
      toast.error("Erro ao enviar dados");
    }
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          },
        }}
      />

      <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
        <h2 className={styles.formTitle}>Converse com nosso assistente</h2>
        <p className={styles.formSubtitle}>
          Preencha seus dados para iniciar o chat
        </p>

        <div className={styles.formGrid}>
          <InputField
            label="Nome completo*"
            id="nome"
            error={errors.nome}
            {...register("nome")}
          />

          <InputField
            label="E-mail*"
            id="email"
            type="email"
            error={errors.email}
            {...register("email")}
          />

          <div className={styles.inputGroup}>
            <label htmlFor="cnpj" className={styles.inputLabel}>
              CNPJ*
            </label>
            <input
              id="cnpj"
              className={`${styles.input} ${
                errors.cnpj ? styles.inputError : ""
              }`}
              value={cnpjValue}
              onChange={handleCnpjChange}
              onBlur={handleCnpjBlur}
              placeholder="00.000.000/0000-00"
              aria-invalid={!!errors.cnpj}
              aria-describedby={errors.cnpj ? "cnpj-error" : undefined}
              aria-label="CNPJ"
              aria-busy={isFetching}
            />
            {errors.cnpj && (
              <span id="cnpj-error" role="alert" className={styles.errorMessage}>
                {errors.cnpj.message}
              </span>
            )}
            {isFetching && (
              <div className={styles.loaderContainer}>
                <div className={styles.loader}></div>
                <span className={styles.loaderText}>
                  Buscando dados do CNPJ...
                </span>
              </div>
            )}
          </div>

          <InputField
            label="Empresa"
            id="empresa"
            error={errors.empresa}
            {...register("empresa")}
          />

          <SelectField
            label="Cargo*"
            id="cargo"
            options={cargoOptions}
            error={errors.cargo}
            {...register("cargo", { required: true })}
          />
          {cargoSelected === "outros" && (
            <InputField
              label="Informe o cargo"
              id="cargoOutro"
              {...register("cargoOutro")}
            />
          )}

          <SelectField
            label="Área de Atuação*"
            id="area"
            options={areaOptions}
            error={errors.area}
            {...register("area", { required: true })}
          />
          {areaSelected === "outros" && (
            <InputField
              label="Informe a área"
              id="areaOutro"
              {...register("areaOutro")}
            />
          )}

          <SelectField
            label="Interesse principal*"
            id="interesse"
            options={[
              { value: "produto", label: "Conhecer produtos" },
              { value: "servico", label: "Serviços personalizados" },
              { value: "parceria", label: "Parcerias" },
              { value: "outro", label: "Outro assunto" },
            ]}
            error={errors.interesse}
            {...register("interesse")}
          />
        </div>

        <div className={`${styles.lgpdContainer} ${errors.lgpdConsent ? styles.lgpdContainerError : ''}`}>
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="lgpdConsent"
              {...register("lgpdConsent")}
              onChange={handleLgpdChange}
              className={styles.checkbox}
              aria-required="true"
              aria-invalid={!!errors.lgpdConsent}
              aria-label="Consentimento de LGPD"
              aria-describedby={errors.lgpdConsent ? "lgpdConsent-error" : undefined}
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
                aria-label="Abrir política de privacidade"
              >
                Política de Privacidade
              </button>
              &nbsp;e tratamento de dados pessoais.
            </label>
          </div>
          {errors.lgpdConsent && (
            <span id="lgpdConsent-error" role="alert" className={styles.errorMessage}>
              {errors.lgpdConsent.message}
            </span>
          )}
        </div>

        <PrivacyModal open={showPolicy} onClose={() => setShowPolicy(false)} />

        <button
          type="submit"
          className={styles.submitButton}
          disabled={!isValid}
          aria-label="Iniciar conversa"
        >
          Iniciar conversa
        </button>
      </form>
    </>
  );
};

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: { message?: string };
};

const InputField = ({ label, id, error, ...props }: InputFieldProps) => (
  <div className={styles.inputGroup}>
    <label htmlFor={id} className={styles.inputLabel}>
      {label}
    </label>
    <input
      id={id}
      className={`${styles.input} ${error ? styles.inputError : ""}`}
      aria-invalid={!!error}
      aria-label={label}
      aria-describedby={error ? `${id}-error` : undefined}
      {...props}
    />
    {error && (
      <span id={`${id}-error`} role="alert" className={styles.errorMessage}>
        {error.message}
      </span>
    )}
  </div>
);

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  error?: { message?: string };
};

const SelectField = ({
  label,
  id,
  options,
  error,
  ...props
}: SelectFieldProps) => (
  <div className={styles.inputGroup}>
    <label htmlFor={id} className={styles.inputLabel}>
      {label}
    </label>
    <select
      id={id}
      className={`${styles.select} ${error ? styles.inputError : ""}`}
      aria-invalid={!!error}
      aria-label={label}
      aria-describedby={error ? `${id}-error` : undefined}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && (
      <span id={`${id}-error`} role="alert" className={styles.errorMessage}>
        {error.message}
      </span>
    )}
  </div>
);
