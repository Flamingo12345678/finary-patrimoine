import { accounts, allocation, assets, goals, totalNetWorth, transactions } from '@/lib/data';
import { ArrowUpRight, Landmark, PieChart, Target, Wallet } from 'lucide-react';

const currency = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

export function Dashboard() {
  const monthlyFlow = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Wallet className="h-5 w-5" />} label="Patrimoine net" value={currency(totalNetWorth)} detail="+4,8% sur 30 jours" />
        <Metric icon={<Landmark className="h-5 w-5" />} label="Comptes suivis" value={String(accounts.length)} detail="Banque, épargne, investissement" />
        <Metric icon={<ArrowUpRight className="h-5 w-5" />} label="Flux mensuel" value={currency(monthlyFlow)} detail="Entrées - sorties consolidées" />
        <Metric icon={<Target className="h-5 w-5" />} label="Objectifs actifs" value={String(goals.length)} detail="Projection d’épargne incluse" />
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
            {allocation.map((slice) => (
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
            {goals.map((goal) => {
              const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
              return (
                <div key={goal.name}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-slate-800">{goal.name}</h3>
                      <p className="text-sm text-slate-500">Échéance {goal.deadline}</p>
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
            {accounts.map((account) => (
              <div key={account.name} className="rounded-2xl border border-slate-200 p-4">
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
            {assets.map((asset) => (
              <div key={asset.name} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-slate-900">{asset.name}</h3>
                    <p className="text-sm text-slate-500">{asset.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{currency(asset.value)}</p>
                    <p className="text-sm text-emerald-600">+{asset.change}%</p>
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
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">{tx.label}</td>
                    <td className="px-4 py-3 text-slate-500">{tx.category}</td>
                    <td className="px-4 py-3 text-slate-500">{tx.date}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.amount >= 0 ? '+' : ''}{currency(tx.amount)}
                    </td>
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
