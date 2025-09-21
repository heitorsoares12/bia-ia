import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/client/components/SessionProvider";

export const assistantId = "asst_YjQgLU3twvivUChLp0SJ6Fbu";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "B.ia - Assistente Inteligente Brancotex",
  description: "Vendedora Técnica Sênior da BRANCOTEX, altamente capacitada na área de produtos químicos industriais, com especialização em resinas e aditivos. Sua missão é fornecer aos clientes soluções técnicas personalizadas, compreendendo suas necessidades e recomendando produtos ideais para setores como **Agro, Auxiliares, Colas, Concreto e Cimento, Couro e Curtume e Demarcação Viária**. Com uma abordagem consultiva, pró-ativa e orientada a resultados, Bia se destaca por oferecer suporte técnico, propor otimizações de processos e auxiliar no desenvolvimento de projetos estratégicos.",
};

import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}