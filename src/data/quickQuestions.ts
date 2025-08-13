export type QuickQuestion = {
  id: string;
  label: string;          // texto no botão
  userMessage: string;    // o que aparece como pergunta do usuário
  formatDirectives: string; // molde/estrutura que será anexado à mensagem enviada à OpenAI
};

export const quickQuestions: QuickQuestion[] = [
  {
    id: "produtos",
    label: "Quero conhecer as linhas de produtos",
    userMessage: "Quais são as linhas de produtos de tintas e para quais aplicações cada uma é indicada?",
    formatDirectives: `
Responda seguindo exatamente este formato em Markdown:

**Resumo (1 frase)**
- [frase curta]

**Principais linhas (tabela)**
- Linha | Aplicação principal | Materiais compatíveis | Observações

**Como escolher (3 critérios)**
- Critério 1
- Critério 2
- Critério 3

**Próximos passos**
- Faça 2 perguntas para entender melhor a necessidade do usuário.
    `
  },
  {
    id: "sublimacao",
    label: "Dúvidas de sublimação (tecido e prensa)",
    userMessage: "Quais parâmetros e cuidados devo usar para sublimação em tecido poliéster?",
    formatDirectives: `
Use este formato em Markdown:

**Pré-requisitos**
- Tecido, papel, tinta, impressora, prensa

**Parâmetros sugeridos**
- Temperatura (°C), tempo (s), pressão (leve/média/alta) e variações por tecido

**Checklist de qualidade**
- Itens objetivos a verificar

**Erros comuns e como corrigir**
- Erro -> Correção

**Perguntas de confirmação**
- Liste 2 a 3 informações que você ainda precisa (tecido, gramatura, equipamento, etc.)
    `
  },
  {
    id: "cores-apagadas",
    label: "Minhas cores estão apagadas",
    userMessage: "Minhas impressões estão saindo com cores fracas/apagadas. O que verificar?",
    formatDirectives: `
Responder em Markdown com:

**Diagnóstico rápido (passo a passo)**
1. Verificar perfil ICC/driver
2. Conferir papel/mídia
3. Checar temperatura/tempo/pressão
4. Manutenção da impressora (limpeza de cabeças, alinhamento)

**Causas prováveis x Ações**
- Causa -> Ação recomendada

**Teste controlado**
- Procedimento de teste simples para isolar o problema
    `
  },
  {
    id: "indicacao-material",
    label: "Qual tinta para meu material?",
    userMessage: "Qual tinta você recomenda para o meu material?",
    formatDirectives: `
Formate assim:

**O que preciso saber**
- Material exato (algodão, poliéster, cerâmica, metal, vidro, PVC, etc.)
- Método de aplicação/transferência
- Exigências de durabilidade/acabamento

**Recomendações por cenário**
- Material: [nome] -> Tinta/processo sugerido + prós/contras + observações

**Avisos**
- Compatibilidade e cuidados importantes
    `
  },
  {
    id: "vendedor",
    label: "Falar com um vendedor",
    userMessage: "Quero falar com um vendedor.",
    formatDirectives: `
Objetivo: Coletar dados de contato em 3 linhas.

**Encaminhamento**
- Solicite cidade/UF e um contato (e-mail ou WhatsApp).
- Informe que o time comercial retornará.
- Não peça dados sensíveis.

**Estrutura**
- 1 frase de confirmação + 2 itens do que precisa para abrir o chamado.
    `
  }
];