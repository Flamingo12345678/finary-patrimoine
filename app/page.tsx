import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-teal-300">MVP wealth dashboard</p>
          <h1 className="text-5xl font-semibold leading-tight sm:text-7xl">Une interface patrimoine claire, rapide et rassurante.</h1>
          <p className="mt-6 text-lg text-slate-300">
            Centralisez vos comptes, visualisez votre allocation et suivez vos objectifs sur un tableau de bord élégant pensé mobile et desktop.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/dashboard" className="rounded-2xl bg-teal-500 px-6 py-3 font-medium text-slate-950 hover:bg-teal-400">Voir la démo</Link>
          <a href="#features" className="rounded-2xl border border-white/15 px-6 py-3 font-medium text-white hover:bg-white/5">Explorer les fonctionnalités</a>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3" id="features">
          {[
            ['Patrimoine consolidé', 'Agrégation visuelle des soldes, actifs et objectifs.'],
            ['Transactions lisibles', 'Historique synthétique pour comprendre les flux.'],
            ['Responsive natif', 'Expérience soignée sur mobile, tablette et desktop.'],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-slate-300">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
