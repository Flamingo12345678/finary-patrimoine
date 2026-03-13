'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Briefcase, Building2, CreditCard, Download, Landmark, Pencil, PieChart, Plus, Target, Trash2, TrendingUp, Upload, Wallet } from 'lucide-react';

type Account = { id: string; name: string; institution: string; balance: number; currency: string; type: string };
type Asset = { id: string; name: string; category: string; value: number; costBasis: number | null; performancePct: number | null; accountId: string | null };
type Transaction = { id: string; label: string; category: string; occurredAt: string; amount: number; type: string; note: string | null; accountId: string | null };
type Goal = { id: string; name: string; target: number; current: number; deadline: string | null };
type DashboardPayload = {
  summary: { netWorth: number; monthlyFlow: number; accountCount: number; goalCount: number; assetCount: number; transactionCount: number };
  allocation: { label: string; value: number }[];
  accounts: Account[];
  assets: Asset[];
  transactions: Transaction[];
  goals: Goal[];
};

type ImportEntity = 'accounts' | 'assets' | 'transactions';
type SectionKey = 'accounts' | 'assets' | 'transactions' | 'goals';

const currency = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
const shortDate = (value: string | null) => value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) : 'Sans échéance';
const isoDate = (value: string | null) => value ? new Date(value).toISOString().slice(0, 10) : '';

const sectionMeta: Record<SectionKey, { label: string; endpoint: string }> = {
  accounts: { label: 'Comptes', endpoint: '/api/accounts' },
  assets: { label: 'Actifs', endpoint: '/api/assets' },
  transactions: { label: 'Transactions', endpoint: '/api/transactions' },
  goals: { label: 'Objectifs', endpoint: '/api/goals' },
};

const initialForms = {
  accounts: { name: '', institution: '', type: 'CHECKING', balance: '0', currency: 'EUR' },
  assets: { accountId: '', name: '', category: 'EQUITY', value: '0', costBasis: '', performancePct: '' },
  transactions: { accountId: '', label: '', amount: '0', type: 'EXPENSE', category: '', occurredAt: new Date().toISOString().slice(0, 10), note: '' },
  goals: { name: '', target: '0', current: '0', deadline: '' },
};

export function Dashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ section: SectionKey; id: string } | null>(null);
  const [forms, setForms] = useState(initialForms);
  const [importEntity, setImportEntity] = useState<ImportEntity>('transactions');
  const [csvText, setCsvText] = useState('label,amount,type,category,date,account,note\nDividendes,126,INCOME,Revenu,2026-03-02,PEA long terme,Paiement trimestriel');
  const [importPreview, setImportPreview] = useState<{ inserted: number; errors: Array<{ row: string; message: string }>; preview: Array<Record<string, unknown>>; pipeline: string } | null>(null);

  const refresh = async () => {
    const response = await fetch('/api/dashboard', { cache: 'no-store' });
    if (!response.ok) throw new Error('Impossible de charger les données.');
    setData(await response.json());
  };

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message));
  }, []);

  const monthlySeries = useMemo(() => {
    const base = data?.transactions.slice(0, 8).reverse() ?? [];
    const peak = Math.max(...base.map((tx) => Math.abs(tx.amount)), 1);
    return base.map((tx) => ({ ...tx, height: Math.max(14, Math.round((Math.abs(tx.amount) / peak) * 88)) }));
  }, [data]);

  if (error) return <main className="mx-auto max-w-5xl px-6 py-10"><div className="card p-6 text-red-600">{error}</div></main>;
  if (!data) return <main className="mx-auto max-w-5xl px-6 py-10"><div className="card p-6 text-slate-500">Chargement du patrimoine…</div></main>;

  const handleDelete = async (section: SectionKey, id: string) => {
    if (!confirm(`Supprimer cet élément de ${sectionMeta[section].label.toLowerCase()} ?`)) return;
    setSaving(`${section}-${id}`);
    const response = await fetch(`${sectionMeta[section].endpoint}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? 'Suppression impossible');
      setSaving(null);
      return;
    }
    await refresh();
    setSaving(null);
  };

  const submitSection = async (section: SectionKey) => {
    setError(null);
    setSaving(section);
    const isEdit = editing?.section === section;
    const endpoint = isEdit ? `${sectionMeta[section].endpoint}/${editing.id}` : sectionMeta[section].endpoint;
    const method = isEdit ? 'PATCH' : 'POST';

    let payload: Record<string, string | number | null>;
    if (section === 'accounts') {
      const current = forms.accounts;
      payload = { ...current, balance: Number(current.balance) };
    } else if (section === 'assets') {
      const current = forms.assets;
      payload = { ...current, accountId: current.accountId || null, value: Number(current.value), costBasis: current.costBasis ? Number(current.costBasis) : null, performancePct: current.performancePct ? Number(current.performancePct) : null };
    } else if (section === 'transactions') {
      const current = forms.transactions;
      payload = { ...current, accountId: current.accountId || null, amount: Number(current.amount) };
    } else {
      const current = forms.goals;
      payload = { ...current, target: Number(current.target), current: Number(current.current), deadline: current.deadline || null };
    }

    const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? 'Enregistrement impossible');
      setSaving(null);
      return;
    }

    setEditing(null);
    setForms((prev) => ({ ...prev, [section]: initialForms[section] }));
    await refresh();
    setSaving(null);
  };

  const startEdit = (section: SectionKey, item: Account | Asset | Transaction | Goal) => {
    setEditing({ section, id: item.id });
    if (section === 'accounts') setForms((prev) => ({ ...prev, accounts: { name: (item as Account).name, institution: (item as Account).institution, type: (item as Account).type, balance: String((item as Account).balance), currency: (item as Account).currency } }));
    if (section === 'assets') setForms((prev) => ({ ...prev, assets: { accountId: (item as Asset).accountId ?? '', name: (item as Asset).name, category: (item as Asset).category, value: String((item as Asset).value), costBasis: (item as Asset).costBasis == null ? '' : String((item as Asset).costBasis), performancePct: (item as Asset).performancePct == null ? '' : String((item as Asset).performancePct) } }));
    if (section === 'transactions') setForms((prev) => ({ ...prev, transactions: { accountId: (item as Transaction).accountId ?? '', label: (item as Transaction).label, amount: String((item as Transaction).amount), type: (item as Transaction).type, category: (item as Transaction).category, occurredAt: isoDate((item as Transaction).occurredAt), note: (item as Transaction).note ?? '' } }));
    if (section === 'goals') setForms((prev) => ({ ...prev, goals: { name: (item as Goal).name, target: String((item as Goal).target), current: String((item as Goal).current), deadline: isoDate((item as Goal).deadline) } }));
  };

  const runImport = async (dryRun: boolean) => {
    setSaving(dryRun ? 'import-preview' : 'import-commit');
    const response = await fetch('/api/import/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: importEntity, delimiter: csvText.includes(';') ? ';' : ',', dryRun, csv: csvText }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body?.error ?? 'Import impossible');
      setSaving(null);
      return;
    }
    setImportPreview(body);
    if (!dryRun) await refresh();
    setSaving(null);
  };

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <section className="premium-shell overflow-hidden rounded-[32px] border border-white/60 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.96))] p-6 shadow-[0_25px_90px_rgba(15,23,42,0.12)] sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-slate-200/70 bg-slate-950 p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950"><PieChart className="h-6 w-6" /></div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-teal-300">Patrimoine</p>
                <h2 className="text-lg font-semibold">Pilotage premium</h2>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <SidebarBlurb icon={<Wallet className="h-4 w-4" />} label="Patrimoine net" value={currency(data.summary.netWorth)} />
              <SidebarBlurb icon={<Building2 className="h-4 w-4" />} label="Comptes" value={String(data.summary.accountCount)} />
              <SidebarBlurb icon={<Briefcase className="h-4 w-4" />} label="Actifs" value={String(data.summary.assetCount)} />
              <SidebarBlurb icon={<Target className="h-4 w-4" />} label="Objectifs" value={String(data.summary.goalCount)} />
            </div>

            <div className="mt-8 rounded-3xl bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Flux d’import</p>
              <p className="mt-2 text-slate-400">Pipeline prévu pour évoluer vers des connecteurs externes type Budget Insight / Plaid-like sans recoder l’interface.</p>
            </div>
          </aside>

          <div className="space-y-6">
            <section className="grid gap-4 lg:grid-cols-[1.25fr_0.95fr]">
              <div className="card overflow-hidden p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-teal-700">Vue d’ensemble</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Votre cockpit patrimonial</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Suivi consolidé des comptes, actifs, objectifs et flux. CRUD complet, import CSV et édition rapide dans la même interface.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500"><TrendingUp className="h-4 w-4 text-emerald-500" /> Flux récents</div>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{currency(data.summary.monthlyFlow)}</p>
                  </div>
                </div>
                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Metric icon={<Wallet className="h-5 w-5" />} label="Patrimoine net" value={currency(data.summary.netWorth)} detail="Comptes + actifs" />
                  <Metric icon={<Landmark className="h-5 w-5" />} label="Comptes suivis" value={String(data.summary.accountCount)} detail="Banque, épargne, investissement" />
                  <Metric icon={<ArrowUpRight className="h-5 w-5" />} label="Transactions visibles" value={String(data.summary.transactionCount)} detail="Derniers flux consolidés" />
                  <Metric icon={<Target className="h-5 w-5" />} label="Objectifs actifs" value={String(data.summary.goalCount)} detail="Progression suivie" />
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Mini tendance</p>
                    <h2 className="text-2xl font-semibold text-slate-950">Baromètre des flux</h2>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">8 derniers mouvements</div>
                </div>
                <div className="mt-6 flex h-36 items-end gap-3">
                  {monthlySeries.length > 0 ? monthlySeries.map((point) => (
                    <div key={point.id} className="flex flex-1 flex-col items-center gap-2">
                      <div className={`w-full rounded-t-2xl ${point.amount >= 0 ? 'bg-gradient-to-t from-emerald-500 to-teal-400' : 'bg-gradient-to-t from-slate-900 to-slate-600'}`} style={{ height: `${point.height}px` }} />
                      <span className="text-[11px] text-slate-400">{new Date(point.occurredAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                  )) : <EmptyState title="Aucune donnée" description="Ajoutez des transactions ou importez un CSV pour générer une tendance." compact />}
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Panel title="Allocation du patrimoine" subtitle="Répartition des actifs">
                {data.allocation.length > 0 ? <div className="space-y-4">{data.allocation.map((slice) => (
                  <div key={slice.label}>
                    <div className="mb-2 flex justify-between text-sm"><span className="font-medium text-slate-700">{slice.label}</span><span className="text-slate-500">{slice.value}%</span></div>
                    <div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" style={{ width: `${slice.value}%` }} /></div>
                  </div>
                ))}</div> : <EmptyState title="Aucun actif" description="Créez un actif ou importez un fichier CSV pour afficher votre allocation." />}
              </Panel>

              <Panel title="Objectifs" subtitle="Cap à tenir">
                <div className="space-y-4">
                  {data.goals.length > 0 ? data.goals.map((goal) => {
                    const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
                    return <div key={goal.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-4"><div><h3 className="font-medium text-slate-900">{goal.name}</h3><p className="text-sm text-slate-500">Échéance {shortDate(goal.deadline)}</p></div><span className="text-sm font-semibold text-slate-600">{progress}%</span></div>
                      <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-950" style={{ width: `${progress}%` }} /></div>
                      <p className="mt-2 text-sm text-slate-500">{currency(goal.current)} / {currency(goal.target)}</p>
                    </div>;
                  }) : <EmptyState title="Aucun objectif" description="Ajoutez un objectif d’épargne ou d’investissement pour suivre votre progression." />}
                </div>
              </Panel>
            </section>

            <section className="grid gap-6 2xl:grid-cols-2">
              <CrudPanel
                title="Comptes"
                subtitle="Création, édition et suppression"
                form={
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input label="Nom" value={forms.accounts.name} onChange={(value) => setForms((prev) => ({ ...prev, accounts: { ...prev.accounts, name: value } }))} />
                    <Input label="Établissement" value={forms.accounts.institution} onChange={(value) => setForms((prev) => ({ ...prev, accounts: { ...prev.accounts, institution: value } }))} />
                    <Select label="Type" value={forms.accounts.type} onChange={(value) => setForms((prev) => ({ ...prev, accounts: { ...prev.accounts, type: value } }))} options={['CHECKING', 'SAVINGS', 'INVESTMENT', 'RETIREMENT', 'CREDIT']} />
                    <Input label="Solde" type="number" value={forms.accounts.balance} onChange={(value) => setForms((prev) => ({ ...prev, accounts: { ...prev.accounts, balance: value } }))} />
                    <Input label="Devise" value={forms.accounts.currency} onChange={(value) => setForms((prev) => ({ ...prev, accounts: { ...prev.accounts, currency: value } }))} />
                  </div>
                }
                onSubmit={() => submitSection('accounts')}
                onReset={() => { setEditing(null); setForms((prev) => ({ ...prev, accounts: initialForms.accounts })); }}
                isEditing={editing?.section === 'accounts'}
                saving={saving === 'accounts'}
              >
                {data.accounts.length > 0 ? data.accounts.map((account) => <RowCard key={account.id} title={account.name} subtitle={`${account.institution} · ${account.type}`} value={currency(account.balance)} onEdit={() => startEdit('accounts', account)} onDelete={() => handleDelete('accounts', account.id)} pending={saving === `accounts-${account.id}`} icon={<CreditCard className="h-4 w-4" />} />) : <EmptyState title="Aucun compte" description="Ajoutez un compte manuellement ou importez votre portefeuille depuis un CSV." />}
              </CrudPanel>

              <CrudPanel
                title="Actifs"
                subtitle="Positions et poche d’investissement"
                form={
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input label="Nom" value={forms.assets.name} onChange={(value) => setForms((prev) => ({ ...prev, assets: { ...prev.assets, name: value } }))} />
                    <Select label="Catégorie" value={forms.assets.category} onChange={(value) => setForms((prev) => ({ ...prev, assets: { ...prev.assets, category: value } }))} options={['CASH', 'EQUITY', 'BOND', 'REAL_ESTATE', 'CRYPTO', 'OTHER']} />
                    <Input label="Valeur" type="number" value={forms.assets.value} onChange={(value) => setForms((prev) => ({ ...prev, assets: { ...prev.assets, value: value } }))} />
                    <Input label="Prix de revient" type="number" value={forms.assets.costBasis} onChange={(value) => setForms((prev) => ({ ...prev, assets: { ...prev.assets, costBasis: value } }))} />
                    <Input label="Perf. %" type="number" value={forms.assets.performancePct} onChange={(value) => setForms((prev) => ({ ...prev, assets: { ...prev.assets, performancePct: value } }))} />
                    <Select label="Compte lié" value={forms.assets.accountId} onChange={(value) => setForms((prev) => ({ ...prev, assets: { ...prev.assets, accountId: value } }))} options={[{ label: 'Aucun', value: '' }, ...data.accounts.map((account) => ({ label: account.name, value: account.id }))]} />
                  </div>
                }
                onSubmit={() => submitSection('assets')}
                onReset={() => { setEditing(null); setForms((prev) => ({ ...prev, assets: initialForms.assets })); }}
                isEditing={editing?.section === 'assets'}
                saving={saving === 'assets'}
              >
                {data.assets.length > 0 ? data.assets.map((asset) => <RowCard key={asset.id} title={asset.name} subtitle={`${asset.category}${asset.performancePct != null ? ` · ${asset.performancePct > 0 ? '+' : ''}${asset.performancePct}%` : ''}`} value={currency(asset.value)} onEdit={() => startEdit('assets', asset)} onDelete={() => handleDelete('assets', asset.id)} pending={saving === `assets-${asset.id}`} icon={<Briefcase className="h-4 w-4" />} />) : <EmptyState title="Aucun actif" description="Ajoutez une ligne d’actif pour construire votre allocation." />}
              </CrudPanel>
            </section>

            <section className="grid gap-6 2xl:grid-cols-2">
              <CrudPanel
                title="Transactions"
                subtitle="Journal consolidé"
                form={
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input label="Libellé" value={forms.transactions.label} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, label: value } }))} />
                    <Input label="Catégorie" value={forms.transactions.category} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, category: value } }))} />
                    <Input label="Montant" type="number" value={forms.transactions.amount} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, amount: value } }))} />
                    <Select label="Type" value={forms.transactions.type} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, type: value } }))} options={['INCOME', 'EXPENSE', 'TRANSFER', 'INVESTMENT']} />
                    <Input label="Date" type="date" value={forms.transactions.occurredAt} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, occurredAt: value } }))} />
                    <Select label="Compte lié" value={forms.transactions.accountId} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, accountId: value } }))} options={[{ label: 'Aucun', value: '' }, ...data.accounts.map((account) => ({ label: account.name, value: account.id }))]} />
                    <div className="md:col-span-2"><Input label="Note" value={forms.transactions.note} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, note: value } }))} /></div>
                  </div>
                }
                onSubmit={() => submitSection('transactions')}
                onReset={() => { setEditing(null); setForms((prev) => ({ ...prev, transactions: initialForms.transactions })); }}
                isEditing={editing?.section === 'transactions'}
                saving={saving === 'transactions'}
              >
                {data.transactions.length > 0 ? data.transactions.map((tx) => <RowCard key={tx.id} title={tx.label} subtitle={`${tx.category} · ${shortDate(tx.occurredAt)}`} value={`${tx.amount >= 0 ? '+' : ''}${currency(tx.amount)}`} valueClassName={tx.amount >= 0 ? 'text-emerald-600' : 'text-slate-950'} onEdit={() => startEdit('transactions', tx)} onDelete={() => handleDelete('transactions', tx.id)} pending={saving === `transactions-${tx.id}`} icon={tx.amount >= 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />} />) : <EmptyState title="Aucune transaction" description="Ajoutez une transaction ou utilisez l’import CSV pour alimenter l’historique." />}
              </CrudPanel>

              <CrudPanel
                title="Objectifs"
                subtitle="Suivi d’épargne et de projets"
                form={
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input label="Nom" value={forms.goals.name} onChange={(value) => setForms((prev) => ({ ...prev, goals: { ...prev.goals, name: value } }))} />
                    <Input label="Cible" type="number" value={forms.goals.target} onChange={(value) => setForms((prev) => ({ ...prev, goals: { ...prev.goals, target: value } }))} />
                    <Input label="Actuel" type="number" value={forms.goals.current} onChange={(value) => setForms((prev) => ({ ...prev, goals: { ...prev.goals, current: value } }))} />
                    <Input label="Échéance" type="date" value={forms.goals.deadline} onChange={(value) => setForms((prev) => ({ ...prev, goals: { ...prev.goals, deadline: value } }))} />
                  </div>
                }
                onSubmit={() => submitSection('goals')}
                onReset={() => { setEditing(null); setForms((prev) => ({ ...prev, goals: initialForms.goals })); }}
                isEditing={editing?.section === 'goals'}
                saving={saving === 'goals'}
              >
                {data.goals.length > 0 ? data.goals.map((goal) => <RowCard key={goal.id} title={goal.name} subtitle={`${currency(goal.current)} / ${currency(goal.target)} · ${shortDate(goal.deadline)}`} value={`${Math.round((goal.current / goal.target) * 100)}%`} onEdit={() => startEdit('goals', goal)} onDelete={() => handleDelete('goals', goal.id)} pending={saving === `goals-${goal.id}`} icon={<Target className="h-4 w-4" />} />) : <EmptyState title="Aucun objectif" description="Créez un objectif pour rythmer la progression du patrimoine." />}
              </CrudPanel>
            </section>

            <Panel title="Import CSV & synchronisation" subtitle="Flux exploitable pour comptes, actifs et transactions">
              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <Select label="Jeu à importer" value={importEntity} onChange={(value) => setImportEntity(value as ImportEntity)} options={[{ label: 'Transactions', value: 'transactions' }, { label: 'Comptes', value: 'accounts' }, { label: 'Actifs', value: 'assets' }]} />
                  <label className="block text-sm font-medium text-slate-600">CSV brut
                    <textarea value={csvText} onChange={(event) => setCsvText(event.target.value)} className="mt-2 h-64 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs text-slate-700 shadow-inner outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100" />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => runImport(true)} className="btn-primary"><Upload className="h-4 w-4" /> Prévisualiser</button>
                    <button onClick={() => runImport(false)} className="btn-secondary"><Download className="h-4 w-4" /> Importer en base</button>
                  </div>
                  <p className="text-xs leading-5 text-slate-500">Détection simple de `,` ou `;`, mapping de colonnes usuelles, persistance en base et pipeline identifié en `csv/manual-upload/v1` pour faire évoluer la synchro plus tard.</p>
                </div>
                <div className="space-y-4">
                  {importPreview ? <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-700">Pipeline {importPreview.pipeline}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{importPreview.inserted} ligne(s) insérées</span><span className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700">{importPreview.errors.length} erreur(s)</span></div>
                    <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-700">Aperçu</p>
                      <pre className="mt-3 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(importPreview.preview, null, 2)}</pre>
                    </div>
                    {importPreview.errors.length > 0 ? <div className="mt-4 space-y-2">{importPreview.errors.map((issue) => <div key={`${issue.row}-${issue.message}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Ligne {issue.row}: {issue.message}</div>)}</div> : null}
                  </div> : <EmptyState title="Prévisualisation vide" description="Lancez une preview avant import pour contrôler le mapping et les erreurs éventuelles." />}
                  <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
                    <p className="font-medium text-slate-700">Formats attendus</p>
                    <ul className="mt-3 list-disc space-y-2 pl-5">
                      <li>Accounts: <code>name,institution,type,balance,currency</code></li>
                      <li>Assets: <code>name,category,value,cost_basis,performance_pct,account</code></li>
                      <li>Transactions: <code>label,amount,type,category,date,account,note</code></li>
                    </ul>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </section>
    </main>
  );
}

function SidebarBlurb({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-4"><div className="flex items-center gap-2 text-sm text-slate-400">{icon}{label}</div><p className="mt-2 text-xl font-semibold text-white">{value}</p></div>;
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="metric"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">{icon}</div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></div>;
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="card p-6"><p className="text-sm text-slate-500">{subtitle}</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h2><div className="mt-5">{children}</div></div>;
}

function CrudPanel({ title, subtitle, form, children, onSubmit, onReset, isEditing, saving }: { title: string; subtitle: string; form: React.ReactNode; children: React.ReactNode; onSubmit: () => void; onReset: () => void; isEditing: boolean; saving: boolean }) {
  return <div className="card p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-slate-500">{subtitle}</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h2></div><div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{isEditing ? 'Édition' : 'Création'}</div></div><div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-4">{form}<div className="mt-4 flex flex-wrap gap-3"><button onClick={onSubmit} className="btn-primary">{isEditing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{saving ? 'Enregistrement…' : isEditing ? 'Mettre à jour' : 'Ajouter'}</button><button onClick={onReset} className="btn-secondary">Réinitialiser</button></div></div><div className="mt-5 space-y-3">{children}</div></div>;
}

function RowCard({ title, subtitle, value, onEdit, onDelete, pending, icon, valueClassName }: { title: string; subtitle: string; value: string; onEdit: () => void; onDelete: () => void; pending?: boolean; icon: React.ReactNode; valueClassName?: string }) {
  return <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-start gap-3"><div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">{icon}</div><div><h3 className="font-medium text-slate-950">{title}</h3><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div></div><div className="flex items-center gap-3"><span className={`text-sm font-semibold ${valueClassName ?? 'text-slate-950'}`}>{value}</span><button onClick={onEdit} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><Pencil className="h-4 w-4" /></button><button onClick={onDelete} disabled={pending} className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button></div></div></div>;
}

function EmptyState({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return <div className={`rounded-[24px] border border-dashed border-slate-300 bg-slate-50 text-center ${compact ? 'px-4 py-6' : 'px-6 py-10'}`}><p className="font-medium text-slate-700">{title}</p><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>;
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block text-sm font-medium text-slate-600">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100" /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<string | { label: string; value: string }> }) {
  return <label className="block text-sm font-medium text-slate-600">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100">{options.map((option) => typeof option === 'string' ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
