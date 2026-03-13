'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Bell, LayoutDashboard, LogOut, ShieldCheck, Sparkles } from 'lucide-react';

export function AuthShell({ name, children }: { name?: string | null; children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(6,8,22,0.72)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-[#66e2cf] shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-400">
                <span>Patrimoine cockpit</span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block" />
                <span className="text-[#66e2cf]">Premium household</span>
              </div>
              <h1 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">Console patrimoniale</h1>
              <p className="mt-1 text-sm text-slate-400">Connecté{name ? ` · ${name}` : ''}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="status-pill hidden sm:inline-flex"><ShieldCheck className="h-3.5 w-3.5 text-[#66e2cf]" /> Données structurées</span>
            <span className="status-pill hidden lg:inline-flex"><Bell className="h-3.5 w-3.5 text-[#8ba8ff]" /> Vue temps réel</span>
            <Link href="/" className="btn-secondary px-4 py-2.5">Accueil</Link>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="btn-secondary px-4 py-2.5">
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
            <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right md:block">
              <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">Session</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-200"><Sparkles className="h-4 w-4 text-[#66e2cf]" /> {name || 'Membre foyer'}</div>
            </div>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
