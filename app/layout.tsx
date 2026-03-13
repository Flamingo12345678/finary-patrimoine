import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Finary Patrimoine',
  description: 'MVP dashboard patrimoine moderne inspiré des usages wealth-tech.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${plusJakartaSans.className} ${plusJakartaSans.variable} font-sans`}>{children}</body>
    </html>
  );
}
