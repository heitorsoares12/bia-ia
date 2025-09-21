export type QuickQuestion = {
  id: string;
  label: string;          // texto no botão
  userMessage: string;    // o que aparece como pergunta do usuário
  formatDirectives: string; // molde/estrutura que será anexado à mensagem enviada à OpenAI
};

export const quickQuestions: QuickQuestion[] = [
  {
    id: "buscar-solucoes",
    label: "Buscar soluções para minha área",
    userMessage: "Estou buscando soluções para minha área de atuação, pode me ajudar?",
    formatDirectives: `
Responda seguindo exatamente este formato em Markdown:

**Para começar, preciso entender melhor sua área**
- Segmento de atuação (confecção, gráfica, decoração, artesanato, industrial, etc.)
- Tipo de produtos que você produz ou pretende produzir
- Principais materiais que trabalha (tecidos, papel, metal, cerâmica, vidro, etc.)

**Com essas informações, posso indicar:**
- Linhas de produtos BRANCOTEX mais adequadas
- Processos de aplicação recomendados
- Equipamentos necessários
- Diferenciais competitivos para seu negócio

**Próximos passos**
- Me conte sobre sua área de atuação e principais desafios
- Quais materiais você trabalha ou pretende trabalhar?
    `
  },
  {
    id: "lancamentos-brancotex",
    label: "Lançamentos Brancocryl",
    userMessage: "Gostaria de conhecer os lançamentos da BRANCOTEX, Brancocryl 409 e Brancocryl S50, pode me falar mais sobre eles?",
    formatDirectives: `
Use este formato em Markdown:

**Brancocryl 409 - Características principais**
- Tipo de tinta e aplicações específicas
- Vantagens competitivas e diferenciais
- Materiais compatíveis e processos recomendados
- Rendimento e performance

**Brancocryl S50 - Características principais**
- Tipo de tinta e aplicações específicas
- Vantagens competitivas e diferenciais
- Materiais compatíveis e processos recomendados
- Rendimento e performance

**Comparativo entre os produtos**
- Principais diferenças de aplicação
- Quando usar cada um
- Benefícios específicos de cada linha

**Para escolher o melhor produto**
- Me informe seu segmento de atuação
- Quais materiais você trabalha?
- Que tipo de acabamento/resultado você busca?
    `
  },
  {
    id: "sobre-brancotex",
    label: "Sobre a BRANCOTEX",
    userMessage: "Quero saber mais sobre a BRANCOTEX, em que áreas a empresa atua?",
    formatDirectives: `
Responder em Markdown com:

**História e posicionamento**
- Trajetória da empresa no mercado brasileiro
- Principais marcos e evolução tecnológica
- Posição no mercado de tintas para sublimação

**Áreas de atuação principais**
- Sublimação têxtil (poliéster, microfibra, lycra)
- Sublimação rígida (cerâmica, metal, polímeros)
- Tintas para transfer e serigrafia
- Segmentos atendidos (confecção, brindes, decoração, industrial)

**Diferenciais competitivos**
- Tecnologia e inovação em produtos
- Suporte técnico especializado
- Rede de distribuição nacional
- Programas de treinamento e capacitação

**Como a BRANCOTEX pode ajudar seu negócio**
- Qual segmento você atua ou pretende atuar?
- Tem interesse em alguma linha específica de produtos?
    `
  }
];