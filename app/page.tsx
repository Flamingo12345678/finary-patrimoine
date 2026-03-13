import Link from 'next/link';
import { ArrowRight, PieChart, ShieldCheck, Upload, UserPlus } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.35em] text-teal-300">Wealth dashboard MVP</p>
            <h1 className="text-5xl font-semibold leading-tight sm:text-7xl">Une interface patrimoine plus premium, pilotable et concrète.</h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-300">Centralisez vos comptes, positions, objectifs et transactions dans un cockpit moderne avec authentification, persistance Prisma, CRUD complet et import CSV exploitable.</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-teal-400 px-6 py-3 font-medium text-slate-950 hover:bg-teal-300">Se connecter <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-6 py-3 font-medium text-white hover:bg-white/5">Créer un compte <UserPlus className="h-4 w-4" /></Link>
              <Link href="/dashboard" className="rounded-2xl border border-white/15 px-6 py-3 font-medium text-white hover:bg-white/5">Voir le dashboard</Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-2">
              <Feature icon={<PieChart className="h-5 w-5" />} title="Vision consolidée" description="Comptes, actifs, objectifs et transactions synchronisés dans la même UI." />
              <Feature icon={<Upload className="h-5 w-5" />} title="Import CSV" description="Flux patrimonial concret avec preview et persistance en base." />
              <Feature icon={<ShieldCheck className="h-5 w-5" />} title="API validée" description="Validation Zod, endpoints sécurisés et opérations PATCH/DELETE." />
              <div className="rounded-3xl border border-teal-400/20 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 p-5">
                <p className="text-sm text-teal-200">Compte de démo</p>
                <p className="mt-3 text-lg font-semibold">camille@example.com</p>
                <p className="text-slate-300">demo1234</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-teal-300">{icon}</div><h2 className="mt-4 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-300">{description}</p></div>;
}
