'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Landmark, PieChart, Target, Wallet } from 'lucide-react';

type DashboardPayload = {
  summary: { netWorth: number; monthlyFlow: number; accountCount: number; goalCount: number };
  allocation: { label: string; value: number }[];
  accounts: { id: string; name: string; institution: string; balance: number; type: string }[];
  assets: { id: string; name: string; category: string; value: number; performancePct: number | null }[];
  transactions: { id: string; label: string; category: string; occurredAt: string; amount: number }[];
  goals: { id: string; name: string; target: number; current: number; deadline: string | null }[];
};

const currency = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
const date = (value: string | null) => value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) : 'Sans échéance';

export function Dashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Impossible de charger les données.');
        return response.json();
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <main className="mx-auto max-w-4xl px-6 py-10"><div className="card p-6 text-red-600">{error}</div></main>;
  if (!data) return <main className="mx-auto max-w-4xl px-6 py-10"><div className="card p-6 text-slate-500">Chargement du patrimoine…</div></main>;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Wallet className="h-5 w-5" />} label="Patrimoine net" value={currency(data.summary.netWorth)} detail="Comptes + actifs" />
        <Metric icon={<Landmark className="h-5 w-5" />} label="Comptes suivis" value={String(data.summary.accountCount)} detail="Banque, épargne, investissement" />
        <Metric icon={<ArrowUpRight className="h-5 w-5" />} label="Flux récents" value={currency(data.summary.monthlyFlow)} detail="Dix dernières transactions" />
        <Metric icon={<Target className="h-5 w-5" />} label="Objectifs actifs" value={String(data.summary.goalCount)} detail="Suivi de progression" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Vue d’ensemble</p>
              <h2 className="text-2xl font-semibold">Allocation du patrimoine</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-700">
              <PieChart className="h-4 w-4" /> Diversification maîtrisée
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {data.allocation.map((slice) => (
              <div key={slice.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{slice.label}</span>
                  <span className="text-slate-500">{slice.value}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" style={{ width: `${slice.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <p className="text-sm text-slate-500">Objectifs</p>
          <h2 className="text-2xl font-semibold">Cap à tenir</h2>
          <div className="mt-5 space-y-5">
            {data.goals.map((goal) => {
              const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
              return (
                <div key={goal.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-slate-800">{goal.name}</h3>
                      <p className="text-sm text-slate-500">Échéance {date(goal.deadline)}</p>
                    </div>
                    <span className="text-sm font-medium text-slate-600">{progress}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-slate-900" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{currency(goal.current)} / {currency(goal.target)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Comptes" subtitle="Suivi multi-établissements">
          <div className="space-y-3">
            {data.accounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-slate-900">{account.name}</h3>
                    <p className="text-sm text-slate-500">{account.institution} · {account.type}</p>
                  </div>
                  <span className="text-right font-semibold text-slate-900">{currency(account.balance)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Actifs" subtitle="Positions principales">
          <div className="space-y-3">
            {data.assets.map((asset) => (
              <div key={asset.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-slate-900">{asset.name}</h3>
                    <p className="text-sm text-slate-500">{asset.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{currency(asset.value)}</p>
                    <p className="text-sm text-emerald-600">{asset.performancePct ? `${asset.performancePct > 0 ? '+' : ''}${asset.performancePct}%` : '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="mt-6">
        <Panel title="Transactions récentes" subtitle="Historique consolidé">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Libellé</th>
                  <th className="px-4 py-3 font-medium">Catégorie</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">{tx.label}</td>
                    <td className="px-4 py-3 text-slate-500">{tx.category}</td>
                    <td className="px-4 py-3 text-slate-500">{date(tx.occurredAt)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>{tx.amount >= 0 ? '+' : ''}{currency(tx.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </main>
  );
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="metric"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">{icon}</div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></div>;
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="card p-6"><p className="text-sm text-slate-500">{subtitle}</p><h2 className="text-2xl font-semibold">{title}</h2><div className="mt-5">{children}</div></div>;
}
