"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import styles from "./Form.module.css";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import PrivacyModal from "../Modal/PrivacyModal/PrivacyModal";
import { isValidCNPJ } from "@/client/utils/cnpj";
import { UserIcon, BuildingIcon } from "./icons";
import { FormField } from "./FormField";
import { FormSection } from "./FormSection";
import { useCnpjApi } from "@/client/hooks/useCnpjApi";

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

const formSchema = z
  .object({
    nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    cnpj: z
      .string()
      .min(14, "CNPJ deve ter 14 dígitos")
      .refine((cnpj) => isValidCNPJ(cnpj), {
        message: "CNPJ inválido",
      }),
    empresa: z.string().min(2, "Empresa é obrigatória"),
    cargo: z
      .string({ required_error: "Por favor, selecione um cargo" })
      .refine((val) => cargoOptions.some((opt) => opt.value === val), {
        message: "Selecione um cargo válido",
      }),
    cargoOutro: z.string().optional(),
    area: z
      .string({ required_error: "Por favor, selecione uma área de atuação" })
      .refine((val) => areaOptions.some((opt) => opt.value === val), {
        message: "Selecione uma área válida",
      }),
    areaOutro: z.string().optional(),
    interesse: z
      .string({ required_error: "Selecione seu interesse principal" })
      .refine(
        (val) => ["produto", "servico", "parceria", "outro"].includes(val),
        {
          message: "Selecione um interesse válido",
        }
      ),
    interesseOutro: z.string().optional(),
    lgpdConsent: z.boolean().refine((val) => val, {
      message: "Você deve consentir com a política de privacidade",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.cargo === "outros" && !data.cargoOutro) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cargoOutro"],
        message: "Por favor, especifique o cargo.",
      });
    }
    if (data.area === "outros" && !data.areaOutro) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["areaOutro"],
        message: "Por favor, especifique a área.",
      });
    }
    if (data.interesse === "outro" && !data.interesseOutro) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["interesseOutro"],
        message: "Por favor, especifique o interesse.",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface FormProps {
  onSuccess?: (visitorId: string) => void;
}

export const Form: React.FC<FormProps> = ({ onSuccess }) => {
  const [cnpjValue, setCnpjValue] = useState("");
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
      nome: "",
      email: "",
      cnpj: "",
      empresa: "",
      cargoOutro: "",
      areaOutro: "",
    },
  });

  const { isFetching, fetchCompanyData } = useCnpjApi<FormValues>(
    setValue,
    trigger
  );

  useEffect(() => {
    trigger();
  }, [trigger]);

  const cargoSelected = watch("cargo");
  const areaSelected = watch("area");
  const interesseSelected = watch("interesse");

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
      const visitorData = {
        nome: data.nome,
        email: data.email,
        cnpj: data.cnpj,
        empresa: data.empresa,
        cargo: data.cargo === "outros" && data.cargoOutro ? data.cargoOutro : data.cargo,
        area: data.area === "outros" && data.areaOutro ? data.areaOutro : data.area,
        interesse: data.interesse === "outro" && data.interesseOutro ? data.interesseOutro : data.interesse,
        lgpdConsent: data.lgpdConsent,
      };

      // Garante que a sessão anterior seja completamente removida
      localStorage.removeItem('conversationId');
      localStorage.removeItem('chatMessages');

      const res = await fetch("/api/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...visitorData,
          areaAtuacao: visitorData.area, // Mantém o campo esperado pela API
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Falha ao enviar dados");

      // Salva os dados do novo visitante
      localStorage.setItem("visitorData", JSON.stringify(visitorData));
      onSuccess?.(result.visitorId);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar dados");
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
            borderRadius: "12px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
            fontSize: "1.1rem",
            padding: "16px 20px",
          },
        }}
      />

      <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>Cadastro para Atendimento</h2>
          <p className={styles.formSubtitle}>
            Preencha seus dados para conversar com a Bia, nossa especialista em
            soluções de tintas
          </p>
        </div>

        <FormSection title="Dados Pessoais" icon={<UserIcon />}>
          <div className={styles.formRow}>
            <FormField<FormValues>
              id="nome"
              label="Nome completo"
              register={register}
              error={errors.nome}
              required
              placeholder="Digite seu nome completo"
            />
            <FormField<FormValues>
              id="email"
              label="E-mail"
              type="email"
              register={register}
              error={errors.email}
              required
              placeholder="seu.email@exemplo.com"
            />
          </div>
        </FormSection>

        <FormSection title="Dados da Empresa" icon={<BuildingIcon />}>
          <div className={styles.formRow}>
            <FormField<FormValues>
              id="cnpj"
              label="CNPJ"
              register={register}
              error={errors.cnpj}
              required
              value={cnpjValue}
              onChange={handleCnpjChange}
              onBlur={handleCnpjBlur}
              placeholder="00.000.000/0000-00"
              isFetching={isFetching}
            />
            <FormField<FormValues>
              id="empresa"
              label="Empresa"
              register={register}
              error={errors.empresa}
              required
              placeholder="Nome da sua empresa"
            />
          </div>
          <div className={styles.formRow}>
            <FormField<FormValues>
              id="cargo"
              label="Cargo"
              type="select"
              register={register}
              error={errors.cargo}
              required
              options={cargoOptions}
            />

            {cargoSelected === "outros" && (
              <FormField<FormValues>
                id="cargoOutro"
                label="Informe o cargo"
                register={register}
                error={errors.cargoOutro}
                required
                placeholder="Seu cargo na empresa"
              />
            )}

            <FormField<FormValues>
              id="area"
              label="Área de Atuação"
              type="select"
              register={register}
              error={errors.area}
              required
              options={areaOptions}
            />
            {areaSelected === "outros" && (
              <FormField<FormValues>
                id="areaOutro"
                label="Informe a área"
                register={register}
                error={errors.areaOutro}
                required
                placeholder="Área de atuação da empresa"
              />
            )}
          </div>
          <div className={styles.formRow}>
            <FormField<FormValues>
              id="interesse"
              label="Interesse Principal"
              type="select"
              register={register}
              error={errors.interesse}
              required
              options={[
                { value: "produto", label: "Conhecer produtos" },
                { value: "servico", label: "Serviços personalizados" },
                { value: "parceria", label: "Parcerias" },
                { value: "outro", label: "Outro assunto" },
              ]}
            />
            {interesseSelected === "outro" && (
              <FormField<FormValues>
                id="interesseOutro"
                label="Informe o interesse"
                register={register}
                error={errors.interesseOutro}
                required
                placeholder="Seu interesse principal"
              />
            )}
          </div>
        </FormSection>

        <div
          className={`${styles.lgpdContainer} ${
            errors.lgpdConsent ? styles.lgpdContainerError : ""
          }`}
        >
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="lgpdConsent"
              {...register("lgpdConsent")}
              className={styles.checkbox}
              aria-required="true"
              aria-invalid={!!errors.lgpdConsent}
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
            <span className={styles.errorMessage}>
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
          Iniciar Conversa com a Bia
        </button>
      </form>
    </>
  );
};

export default Form;
