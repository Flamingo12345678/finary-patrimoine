import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-teal-300">MVP wealth dashboard</p>
          <h1 className="text-5xl font-semibold leading-tight sm:text-7xl">Une interface patrimoine claire, rapide et rassurante.</h1>
          <p className="mt-6 text-lg text-slate-300">Centralisez vos comptes, visualisez votre allocation et suivez vos objectifs sur un tableau de bord élégant avec backend, authentification et base de données.</p>
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/login" className="rounded-2xl bg-teal-500 px-6 py-3 font-medium text-slate-950 hover:bg-teal-400">Se connecter à la démo</Link>
          <Link href="/dashboard" className="rounded-2xl border border-white/15 px-6 py-3 font-medium text-white hover:bg-white/5">Voir le dashboard</Link>
        </div>
      </section>
    </main>
  );
}
