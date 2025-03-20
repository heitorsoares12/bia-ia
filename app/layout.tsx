import { Inter } from "next/font/google";
import "./globals.css";
export const assistantId = "your-assistant-id";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Assistente Bia",
  description: "Assistente virtual para ajudar funcionários",
};

import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        {/* Você pode adicionar o logo da sua empresa aqui */}
        {/* <img className="logo" src="/logo-empresa.svg" alt="Logo da Empresa" /> */}
      </body>
    </html>
  );
}