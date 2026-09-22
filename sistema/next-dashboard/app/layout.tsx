import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dashboard de Conformidade | Gestão de Resíduos',
  description: 'Dashboard B2B de conformidade ambiental e gestão de resíduos.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-950 antialiased">
        {children}
      </body>
    </html>
  );
}
