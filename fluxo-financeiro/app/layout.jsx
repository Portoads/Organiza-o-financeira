import "./globals.css";

export const metadata = {
  title: "Fluxo — Controle Financeiro",
  description: "Organize entradas, despesas, investimentos e metas financeiras.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
