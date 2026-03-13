'use client';

import { useEffect, useState } from 'react';
import { mockUser } from '@/lib/data';
import { Lock, LogOut } from 'lucide-react';

export function AuthShell({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('fp-auth');
    setIsAuthenticated(saved === 'true');
  }, []);

  const login = () => {
    window.localStorage.setItem('fp-auth', 'true');
    setIsAuthenticated(true);
  };

  const logout = () => {
    window.localStorage.removeItem('fp-auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
          <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-sm text-teal-200">
                <Lock className="h-4 w-4" /> Démo patrimoine moderne
              </p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">Pilotez votre patrimoine en un coup d’œil.</h1>
              <p className="mt-6 max-w-2xl text-lg text-slate-300">
                Une interface claire pour suivre vos comptes, actifs, transactions et objectifs financiers sans surcharge inutile.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {['Vue consolidée', 'Allocation lisible', 'Objectifs actionnables'].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">{item}</div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
              <h2 className="text-2xl font-semibold">Connexion locale</h2>
              <p className="mt-2 text-sm text-slate-300">Mode MVP sans backend. La session est stockée dans le navigateur.</p>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-900/70 p-4">
                  <p className="text-sm text-slate-400">Utilisateur démo</p>
                  <p className="mt-1 font-medium">{mockUser.name}</p>
                  <p className="text-sm text-slate-300">{mockUser.email}</p>
                </div>
                <button onClick={login} className="w-full rounded-2xl bg-teal-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-teal-400">
                  Entrer dans le dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-teal-700">Patrimoine</p>
            <h1 className="text-xl font-semibold text-slate-900">Tableau de bord personnel</h1>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
