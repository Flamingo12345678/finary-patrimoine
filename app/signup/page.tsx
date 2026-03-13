'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { UserPlus } from 'lucide-react';

type SignupErrors = Partial<Record<'name' | 'email' | 'password' | 'confirmPassword', string>>;

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<SignupErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setServerError(null);

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const fieldErrors = payload?.details?.fieldErrors;
      setErrors({
        name: fieldErrors?.name?.[0],
        email: fieldErrors?.email?.[0],
        password: fieldErrors?.password?.[0],
        confirmPassword: fieldErrors?.confirmPassword?.[0],
      });
      setServerError(payload?.error ?? 'Impossible de créer le compte.');
      setPending(false);
      return;
    }

    const result = await signIn('credentials', { email, password, redirect: false });
    setPending(false);

    if (result?.error) {
      router.push('/login?created=1');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
        <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-sm text-teal-200">
              <UserPlus className="h-4 w-4" /> Création de compte sécurisée
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">Créez votre espace patrimoine en quelques secondes.</h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-300">Inscription par email + mot de passe hashé, session Auth.js, base Prisma/PostgreSQL compatible avec la stack existante.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {['Hash bcrypt', 'Validation Zod', 'Connexion directe après signup'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">{item}</div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold">Créer un compte</h2>
            <p className="mt-2 text-sm text-slate-300">Aucun écran fantôme: compte créé, puis connexion automatique.</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Field label="Nom" value={name} onChange={setName} error={errors.name} autoComplete="name" />
              <Field label="Email" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" />
              <Field label="Mot de passe" type="password" value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" />
              <Field label="Confirmer le mot de passe" type="password" value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} autoComplete="new-password" />
              {serverError ? <p className="text-sm text-red-300">{serverError}</p> : null}
              <button disabled={pending} className="w-full rounded-2xl bg-teal-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-teal-400 disabled:opacity-60">{pending ? 'Création…' : 'Créer mon compte'}</button>
            </form>
            <p className="mt-4 text-sm text-slate-400">Déjà un compte ? <Link href="/login" className="text-teal-300 hover:text-teal-200">Se connecter</Link>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, error, type = 'text', autoComplete }: { label: string; value: string; onChange: (value: string) => void; error?: string; type?: string; autoComplete?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        autoComplete={autoComplete}
        className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 outline-none ring-0"
      />
      {error ? <span className="mt-2 block text-sm text-red-300">{error}</span> : null}
    </label>
  );
}
