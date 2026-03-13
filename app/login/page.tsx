'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('camille@example.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await signIn('credentials', { email, password, redirect: false });
    setPending(false);

    if (result?.error) {
      setError('Identifiants invalides.');
      return;
    }

    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
        <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-sm text-teal-200">
              <Lock className="h-4 w-4" /> MVP patrimoine avec backend réel
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">Pilotez votre patrimoine en un coup d’œil.</h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-300">Prisma pour les données, Auth.js pour la session, API Next.js pour les opérations métier principales.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {['Auth.js crédible', 'Prisma + DB', 'API App Router'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">{item}</div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold">Connexion</h2>
            <p className="mt-2 text-sm text-slate-300">Compte de démo seedé automatiquement en dev.</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Email</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 outline-none ring-0" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Mot de passe</span>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 outline-none ring-0" />
              </label>
              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              <button disabled={pending} className="w-full rounded-2xl bg-teal-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-teal-400 disabled:opacity-60">{pending ? 'Connexion…' : 'Entrer dans le dashboard'}</button>
            </form>
            <div className="mt-6 rounded-2xl bg-slate-900/70 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Démo</p>
              <p>camille@example.com</p>
              <p>demo1234</p>
            </div>
            <p className="mt-4 text-sm text-slate-400">Retour à <Link href="/" className="text-teal-300 hover:text-teal-200">l’accueil</Link>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
