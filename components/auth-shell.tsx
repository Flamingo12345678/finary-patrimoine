'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, LogOut } from 'lucide-react';

export function AuthShell({ name, children }: { name?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg"><LayoutDashboard className="h-5 w-5" /></div>
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-teal-700">Patrimoine</p>
              <h1 className="text-xl font-semibold text-slate-950">Console patrimoniale</h1>
              <p className="text-sm text-slate-500">Connecté{ name ? ` · ${name}` : '' }</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Accueil</Link>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
