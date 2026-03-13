'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function AuthShell({ name, children }: { name?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-teal-700">Patrimoine</p>
            <h1 className="text-xl font-semibold text-slate-900">Tableau de bord personnel</h1>
            <p className="text-sm text-slate-500">Connecté{ name ? ` · ${name}` : '' }</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
