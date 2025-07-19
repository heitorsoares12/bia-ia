
import { useState, useCallback } from 'react';
import { FieldValues, UseFormSetValue, UseFormTrigger, Path } from 'react-hook-form';
import toast from 'react-hot-toast';

export const useCnpjApi = <T extends FieldValues>(
  setValue: UseFormSetValue<T>,
  trigger: UseFormTrigger<T>
) => {
  const [isFetching, setIsFetching] = useState(false);

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
          throw new Error("API sobrecarregada");
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
        setValue('empresa' as Path<T>, nomeFantasia as any, { shouldValidate: true });
        trigger('empresa' as Path<T>);
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

  return { isFetching, fetchCompanyData };
};
