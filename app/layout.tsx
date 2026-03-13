import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Finary Patrimoine',
  description: 'MVP dashboard patrimoine moderne inspiré des usages wealth-tech.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
