'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Briefcase, CreditCard, HeartHandshake, Home, Landmark, Pencil, PieChart, Plus, Target, Trash2, TrendingUp, User2, Users, Wallet } from 'lucide-react';
import { CsvImportOnboarding } from '@/components/csv-import-onboarding';

type ViewMode = 'me' | 'shared' | 'household';
type Visibility = 'PERSONAL' | 'SHARED';
type Owner = { id: string; name: string | null; email: string } | null;
type Account = { id: string; name: string; institution: string; balance: number; currency: string; type: string; visibility: Visibility; ownerUserId: string | null; ownerUser: Owner };
type Asset = { id: string; name: string; category: string; value: number; costBasis: number | null; performancePct: number | null; accountId: string | null; visibility: Visibility; ownerUserId: string | null; ownerUser: Owner };
type Transaction = { id: string; label: string; category: string; occurredAt: string; amount: number; type: string; note: string | null; accountId: string | null; visibility: Visibility; ownerUserId: string | null; ownerUser: Owner };
type Goal = { id: string; name: string; target: number; current: number; deadline: string | null; visibility: Visibility; ownerUserId: string | null; ownerUser: Owner };
type DashboardPayload = {
  household: { id: string; name: string; members: Array<{ id: string; name: string | null; email: string; role: string }> };
  view: ViewMode;
  summary: { netWorth: number; personalNetWorth: number; sharedNetWorth: number; monthlyFlow: number; accountCount: number; goalCount: number; assetCount: number; transactionCount: number };
  allocation: { label: string; value: number }[];
  accounts: Account[];
  assets: Asset[];
  transactions: Transaction[];
  goals: Goal[];
};

type ImportEntity = 'accounts' | 'assets' | 'transactions';
type ImportFormat = 'csv' | 'ofx' | 'qif';
type SectionKey = 'accounts' | 'assets' | 'transactions' | 'goals';

const currency = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
const shortDate = (value: string | null) => value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) : 'Sans échéance';
const isoDate = (value: string | null) => value ? new Date(value).toISOString().slice(0, 10) : '';
const ownerLabel = (item: { visibility: Visibility; ownerUser: Owner }) => item.visibility === 'SHARED' ? 'Partagé' : item.ownerUser?.name || item.ownerUser?.email || 'Moi';

const sectionMeta: Record<SectionKey, { label: string; endpoint: string }> = {
  accounts: { label: 'Comptes', endpoint: '/api/accounts' },
  assets: { label: 'Actifs', endpoint: '/api/assets' },
  transactions: { label: 'Transactions', endpoint: '/api/transactions' },
  goals: { label: 'Objectifs', endpoint: '/api/goals' },
};

const initialForms = {
  accounts: { name: '', institution: '', type: 'CHECKING', balance: '0', currency: 'EUR', visibility: 'PERSONAL' as Visibility },
  assets: { accountId: '', name: '', category: 'EQUITY', value: '0', costBasis: '', performancePct: '', visibility: 'PERSONAL' as Visibility },
  transactions: { accountId: '', label: '', amount: '0', type: 'EXPENSE', category: '', occurredAt: new Date().toISOString().slice(0, 10), note: '', visibility: 'PERSONAL' as Visibility },
  goals: { name: '', target: '0', current: '0', deadline: '', visibility: 'PERSONAL' as Visibility },
};

export function Dashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [view, setView] = useState<ViewMode>('household');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ section: SectionKey; id: string } | null>(null);
  const [forms, setForms] = useState(initialForms);
  const [importEntity, setImportEntity] = useState<ImportEntity>('transactions');
  const [importFormat, setImportFormat] = useState<ImportFormat>('csv');
  const [csvText, setCsvText] = useState('label,amount,type,category,date,account,note,visibility,owner_email\nCourses,-128,EXPENSE,Vie courante,2026-03-06,Compte joint,Dîner et courses,SHARED,');
  const [importPreview, setImportPreview] = useState<{ inserted: number; errors: Array<{ row: string; message: string }>; preview: Array<Record<string, unknown>>; pipeline: string } | null>(null);

  const refresh = useCallback(async (nextView = view) => {
    const response = await fetch(`/api/dashboard?view=${nextView}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Impossible de charger les données.');
    const payload = await response.json();
    setData(payload);
    setView(payload.view);
  }, [view]);

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message));
  }, [refresh]);

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
      payload = { ...current, balance: Number(current.balance), view: current.visibility === 'SHARED' ? 'shared' : 'me' };
    } else if (section === 'assets') {
      const current = forms.assets;
      payload = { ...current, accountId: current.accountId || null, value: Number(current.value), costBasis: current.costBasis ? Number(current.costBasis) : null, performancePct: current.performancePct ? Number(current.performancePct) : null, view: current.visibility === 'SHARED' ? 'shared' : 'me' };
    } else if (section === 'transactions') {
      const current = forms.transactions;
      payload = { ...current, accountId: current.accountId || null, amount: Number(current.amount), view: current.visibility === 'SHARED' ? 'shared' : 'me' };
    } else {
      const current = forms.goals;
      payload = { ...current, target: Number(current.target), current: Number(current.current), deadline: current.deadline || null, view: current.visibility === 'SHARED' ? 'shared' : 'me' };
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
    if (section === 'accounts') setForms((prev) => ({ ...prev, accounts: { name: (item as Account).name, institution: (item as Account).institution, type: (item as Account).type, balance: String((item as Account).balance), currency: (item as Account).currency, visibility: (item as Account).visibility } }));
    if (section === 'assets') setForms((prev) => ({ ...prev, assets: { accountId: (item as Asset).accountId ?? '', name: (item as Asset).name, category: (item as Asset).category, value: String((item as Asset).value), costBasis: (item as Asset).costBasis == null ? '' : String((item as Asset).costBasis), performancePct: (item as Asset).performancePct == null ? '' : String((item as Asset).performancePct), visibility: (item as Asset).visibility } }));
    if (section === 'transactions') setForms((prev) => ({ ...prev, transactions: { accountId: (item as Transaction).accountId ?? '', label: (item as Transaction).label, amount: String((item as Transaction).amount), type: (item as Transaction).type, category: (item as Transaction).category, occurredAt: isoDate((item as Transaction).occurredAt), note: (item as Transaction).note ?? '', visibility: (item as Transaction).visibility } }));
    if (section === 'goals') setForms((prev) => ({ ...prev, goals: { name: (item as Goal).name, target: String((item as Goal).target), current: String((item as Goal).current), deadline: isoDate((item as Goal).deadline), visibility: (item as Goal).visibility } }));
  };

  const runImport = async (dryRun: boolean) => {
    setSaving(dryRun ? 'import-preview' : 'import-commit');
    const response = await fetch('/api/import/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: importEntity, format: importFormat, view, delimiter: csvText.includes(';') ? ';' : ',', dryRun, csv: csvText }),
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
    <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
      <section className="premium-shell overflow-hidden rounded-[32px] border border-white/60 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.96))] p-6 shadow-[0_25px_90px_rgba(15,23,42,0.12)] sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-slate-200/70 bg-slate-950 p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950"><PieChart className="h-6 w-6" /></div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-teal-300">Foyer</p>
                <h2 className="text-lg font-semibold">{data.household.name}</h2>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Membres</p>
              <div className="mt-3 space-y-2">{data.household.members.map((member) => <div key={member.id} className="flex items-center gap-2"><Users className="h-4 w-4 text-teal-300" /><span>{member.name || member.email}</span></div>)}</div>
            </div>

            <div className="mt-6 space-y-3">
              <SidebarBlurb icon={<User2 className="h-4 w-4" />} label="Mon patrimoine" value={currency(data.summary.personalNetWorth)} />
              <SidebarBlurb icon={<HeartHandshake className="h-4 w-4" />} label="Patrimoine partagé" value={currency(data.summary.sharedNetWorth)} />
              <SidebarBlurb icon={<Home className="h-4 w-4" />} label="Vue actuelle" value={viewLabels[view]} />
            </div>
          </aside>

          <div className="space-y-6">
            <section className="grid gap-4 lg:grid-cols-[1.25fr_0.95fr]">
              <div className="card overflow-hidden p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-teal-700">Cockpit duo</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Moi, partagé ou foyer complet</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Le dashboard sépare désormais le personnel du commun, tout en gardant un consolidé foyer pour piloter la trajectoire à deux.</p>
                  </div>
                  <ViewTabs value={view} onChange={setView} />
                </div>
                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Metric icon={<Wallet className="h-5 w-5" />} label="Patrimoine net" value={currency(data.summary.netWorth)} detail={viewLabels[view]} />
                  <Metric icon={<Landmark className="h-5 w-5" />} label="Comptes suivis" value={String(data.summary.accountCount)} detail="Perso + commun selon filtre" />
                  <Metric icon={<ArrowUpRight className="h-5 w-5" />} label="Transactions visibles" value={String(data.summary.transactionCount)} detail="Derniers flux" />
                  <Metric icon={<Target className="h-5 w-5" />} label="Objectifs actifs" value={String(data.summary.goalCount)} detail="Perso et/ou foyer" />
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
                  )) : <EmptyState title="Aucune donnée" description="Ajoutez des transactions ou importez un OFX/QIF/CSV pour générer une tendance." compact />}
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Panel title="Allocation du patrimoine" subtitle="Répartition sur la vue sélectionnée">
                {data.allocation.length > 0 ? <div className="space-y-4">{data.allocation.map((slice) => (
                  <div key={slice.label}>
                    <div className="mb-2 flex justify-between text-sm"><span className="font-medium text-slate-700">{slice.label}</span><span className="text-slate-500">{slice.value}%</span></div>
                    <div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" style={{ width: `${slice.value}%` }} /></div>
                  </div>
                ))}</div> : <EmptyState title="Aucun actif" description="Créez un actif ou importez un fichier pour afficher votre allocation." />}
              </Panel>

              <Panel title="Synthèse couple" subtitle="Résumé premium foyer">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SummaryCard label="Mon patrimoine" value={currency(data.summary.personalNetWorth)} icon={<User2 className="h-4 w-4" />} />
                  <SummaryCard label="Partagé" value={currency(data.summary.sharedNetWorth)} icon={<HeartHandshake className="h-4 w-4" />} />
                  <SummaryCard label="Flux récents" value={currency(data.summary.monthlyFlow)} icon={<TrendingUp className="h-4 w-4" />} />
                  <SummaryCard label="Membres actifs" value={String(data.household.members.length)} icon={<Users className="h-4 w-4" />} />
                </div>
              </Panel>
            </section>

            <section className="grid gap-6 2xl:grid-cols-2">
              <CrudPanel title="Comptes" subtitle="Perso ou partagés" form={<>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Nom" value={forms.accounts.name} onChange={(value) => setForms((prev) => ({ ...prev, accounts: { ...prev.accounts, name: value } }))} />
                  <Input label="Établissement" value={forms.accounts.institution} onChange={(value) => setForms((prev) => ({ ...prev, accounts: { ...prev.accounts, institution: value } }))} />
                  <Select label="Type" value={forms.accounts.type} onChange={(value) => setForms((prev) => ({ ...prev, accounts: { ...prev.accounts, type: value } }))} options={['CHECKING', 'SAVINGS', 'INVESTMENT', 'RETIREMENT', 'CREDIT']} />
                  <Input label="Solde" type="number" value={forms.accounts.balance} onChange={(value) => setForms((prev) => ({ ...prev, accounts: { ...prev.accounts, balance: value } }))} />
                  <Input label="Devise" value={forms.accounts.currency} onChange={(value) => setForms((prev) => ({ ...prev, accounts: { ...prev.accounts, currency: value } }))} />
                  <ScopeSelect value={forms.accounts.visibility} onChange={(value) => setForms((prev) => ({ ...prev, accounts: { ...prev.accounts, visibility: value } }))} />
                </div>
              </>} onSubmit={() => submitSection('accounts')} onReset={() => { setEditing(null); setForms((prev) => ({ ...prev, accounts: initialForms.accounts })); }} isEditing={editing?.section === 'accounts'} saving={saving === 'accounts'}>
                {data.accounts.length > 0 ? data.accounts.map((account) => <RowCard key={account.id} title={account.name} subtitle={`${account.institution} · ${account.type} · ${ownerLabel(account)}`} value={currency(account.balance)} badge={account.visibility === 'SHARED' ? 'Partagé' : 'Moi'} onEdit={() => startEdit('accounts', account)} onDelete={() => handleDelete('accounts', account.id)} pending={saving === `accounts-${account.id}`} icon={<CreditCard className="h-4 w-4" />} />) : <EmptyState title="Aucun compte" description="Ajoutez un compte perso ou commun." />}
              </CrudPanel>

              <CrudPanel title="Actifs" subtitle="Poches perso ou foyer" form={<div className="grid gap-3 md:grid-cols-2">
                <Input label="Nom" value={forms.assets.name} onChange={(value) => setForms((prev) => ({ ...prev, assets: { ...prev.assets, name: value } }))} />
                <Select label="Catégorie" value={forms.assets.category} onChange={(value) => setForms((prev) => ({ ...prev, assets: { ...prev.assets, category: value } }))} options={['CASH', 'EQUITY', 'BOND', 'REAL_ESTATE', 'CRYPTO', 'OTHER']} />
                <Input label="Valeur" type="number" value={forms.assets.value} onChange={(value) => setForms((prev) => ({ ...prev, assets: { ...prev.assets, value } }))} />
                <Input label="Prix de revient" type="number" value={forms.assets.costBasis} onChange={(value) => setForms((prev) => ({ ...prev, assets: { ...prev.assets, costBasis: value } }))} />
                <Input label="Perf. %" type="number" value={forms.assets.performancePct} onChange={(value) => setForms((prev) => ({ ...prev, assets: { ...prev.assets, performancePct: value } }))} />
                <Select label="Compte lié" value={forms.assets.accountId} onChange={(value) => setForms((prev) => ({ ...prev, assets: { ...prev.assets, accountId: value } }))} options={[{ label: 'Aucun', value: '' }, ...data.accounts.map((account) => ({ label: account.name, value: account.id }))]} />
                <div className="md:col-span-2"><ScopeSelect value={forms.assets.visibility} onChange={(value) => setForms((prev) => ({ ...prev, assets: { ...prev.assets, visibility: value } }))} /></div>
              </div>} onSubmit={() => submitSection('assets')} onReset={() => { setEditing(null); setForms((prev) => ({ ...prev, assets: initialForms.assets })); }} isEditing={editing?.section === 'assets'} saving={saving === 'assets'}>
                {data.assets.length > 0 ? data.assets.map((asset) => <RowCard key={asset.id} title={asset.name} subtitle={`${asset.category} · ${ownerLabel(asset)}`} value={currency(asset.value)} badge={asset.visibility === 'SHARED' ? 'Foyer' : 'Perso'} onEdit={() => startEdit('assets', asset)} onDelete={() => handleDelete('assets', asset.id)} pending={saving === `assets-${asset.id}`} icon={<Briefcase className="h-4 w-4" />} />) : <EmptyState title="Aucun actif" description="Ajoutez une ligne d’actif pour construire l’allocation." />}
              </CrudPanel>
            </section>

            <section className="grid gap-6 2xl:grid-cols-2">
              <CrudPanel title="Transactions" subtitle="Journal consolidé" form={<div className="grid gap-3 md:grid-cols-2">
                <Input label="Libellé" value={forms.transactions.label} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, label: value } }))} />
                <Input label="Catégorie" value={forms.transactions.category} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, category: value } }))} />
                <Input label="Montant" type="number" value={forms.transactions.amount} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, amount: value } }))} />
                <Select label="Type" value={forms.transactions.type} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, type: value } }))} options={['INCOME', 'EXPENSE', 'TRANSFER', 'INVESTMENT']} />
                <Input label="Date" type="date" value={forms.transactions.occurredAt} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, occurredAt: value } }))} />
                <Select label="Compte lié" value={forms.transactions.accountId} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, accountId: value } }))} options={[{ label: 'Aucun', value: '' }, ...data.accounts.map((account) => ({ label: account.name, value: account.id }))]} />
                <ScopeSelect value={forms.transactions.visibility} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, visibility: value } }))} />
                <div className="md:col-span-2"><Input label="Note" value={forms.transactions.note} onChange={(value) => setForms((prev) => ({ ...prev, transactions: { ...prev.transactions, note: value } }))} /></div>
              </div>} onSubmit={() => submitSection('transactions')} onReset={() => { setEditing(null); setForms((prev) => ({ ...prev, transactions: initialForms.transactions })); }} isEditing={editing?.section === 'transactions'} saving={saving === 'transactions'}>
                {data.transactions.length > 0 ? data.transactions.map((tx) => <RowCard key={tx.id} title={tx.label} subtitle={`${tx.category} · ${shortDate(tx.occurredAt)} · ${ownerLabel(tx)}`} value={`${tx.amount >= 0 ? '+' : ''}${currency(tx.amount)}`} valueClassName={tx.amount >= 0 ? 'text-emerald-600' : 'text-slate-950'} badge={tx.visibility === 'SHARED' ? 'Commun' : 'Perso'} onEdit={() => startEdit('transactions', tx)} onDelete={() => handleDelete('transactions', tx.id)} pending={saving === `transactions-${tx.id}`} icon={tx.amount >= 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />} />) : <EmptyState title="Aucune transaction" description="Ajoutez une transaction ou importez OFX/QIF/CSV." />}
              </CrudPanel>

              <CrudPanel title="Objectifs" subtitle="Perso et projets de foyer" form={<div className="grid gap-3 md:grid-cols-2">
                <Input label="Nom" value={forms.goals.name} onChange={(value) => setForms((prev) => ({ ...prev, goals: { ...prev.goals, name: value } }))} />
                <Input label="Cible" type="number" value={forms.goals.target} onChange={(value) => setForms((prev) => ({ ...prev, goals: { ...prev.goals, target: value } }))} />
                <Input label="Actuel" type="number" value={forms.goals.current} onChange={(value) => setForms((prev) => ({ ...prev, goals: { ...prev.goals, current: value } }))} />
                <Input label="Échéance" type="date" value={forms.goals.deadline} onChange={(value) => setForms((prev) => ({ ...prev, goals: { ...prev.goals, deadline: value } }))} />
                <div className="md:col-span-2"><ScopeSelect value={forms.goals.visibility} onChange={(value) => setForms((prev) => ({ ...prev, goals: { ...prev.goals, visibility: value } }))} /></div>
              </div>} onSubmit={() => submitSection('goals')} onReset={() => { setEditing(null); setForms((prev) => ({ ...prev, goals: initialForms.goals })); }} isEditing={editing?.section === 'goals'} saving={saving === 'goals'}>
                {data.goals.length > 0 ? data.goals.map((goal) => <RowCard key={goal.id} title={goal.name} subtitle={`${currency(goal.current)} / ${currency(goal.target)} · ${shortDate(goal.deadline)} · ${ownerLabel(goal)}`} value={`${Math.round((goal.current / goal.target) * 100)}%`} badge={goal.visibility === 'SHARED' ? 'Foyer' : 'Perso'} onEdit={() => startEdit('goals', goal)} onDelete={() => handleDelete('goals', goal.id)} pending={saving === `goals-${goal.id}`} icon={<Target className="h-4 w-4" />} />) : <EmptyState title="Aucun objectif" description="Créez un objectif personnel ou commun." />}
              </CrudPanel>
            </section>

            <Panel title="Import multi-format" subtitle="CSV enrichi, OFX et QIF pour un usage réel à deux">
              <CsvImportOnboarding entity={importEntity} format={importFormat} view={view} csvText={csvText} preview={importPreview} savingKey={saving} onEntityChange={(value) => { setImportEntity(value); setImportPreview(null); }} onFormatChange={(value) => { setImportFormat(value); setImportPreview(null); }} onCsvTextChange={setCsvText} onRun={runImport} />
            </Panel>
          </div>
        </div>
      </section>
    </main>
  );
}

const viewLabels: Record<ViewMode, string> = { me: 'Moi', shared: 'Partagé', household: 'Foyer' };

function ViewTabs({ value, onChange }: { value: ViewMode; onChange: (value: ViewMode) => void }) {
  return <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2">{(['me', 'shared', 'household'] as ViewMode[]).map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${value === option ? 'bg-slate-950 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>{viewLabels[option]}</button>)}</div>;
}

function ScopeSelect({ value, onChange }: { value: Visibility; onChange: (value: Visibility) => void }) {
  return <Select label="Portée" value={value} onChange={(next) => onChange(next as Visibility)} options={[{ label: 'Personnel / Moi', value: 'PERSONAL' }, { label: 'Partagé / Foyer', value: 'SHARED' }]} />;
}

function SidebarBlurb({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-4"><div className="flex items-center gap-2 text-sm text-slate-400">{icon}{label}</div><p className="mt-2 text-xl font-semibold text-white">{value}</p></div>;
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="metric"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">{icon}</div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></div>;
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-sm text-slate-500">{icon}{label}</div><div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div></div>;
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="card p-6"><p className="text-sm text-slate-500">{subtitle}</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h2><div className="mt-5">{children}</div></div>;
}

function CrudPanel({ title, subtitle, form, children, onSubmit, onReset, isEditing, saving }: { title: string; subtitle: string; form: React.ReactNode; children: React.ReactNode; onSubmit: () => void; onReset: () => void; isEditing: boolean; saving: boolean }) {
  return <div className="card p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-slate-500">{subtitle}</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h2></div><div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{isEditing ? 'Édition' : 'Création'}</div></div><div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-4">{form}<div className="mt-4 flex flex-wrap gap-3"><button onClick={onSubmit} className="btn-primary">{isEditing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{saving ? 'Enregistrement…' : isEditing ? 'Mettre à jour' : 'Ajouter'}</button><button onClick={onReset} className="btn-secondary">Réinitialiser</button></div></div><div className="mt-5 space-y-3">{children}</div></div>;
}

function RowCard({ title, subtitle, value, onEdit, onDelete, pending, icon, valueClassName, badge }: { title: string; subtitle: string; value: string; onEdit: () => void; onDelete: () => void; pending?: boolean; icon: React.ReactNode; valueClassName?: string; badge?: string }) {
  return <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-start gap-3"><div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">{icon}</div><div><div className="flex items-center gap-2"><h3 className="font-medium text-slate-950">{title}</h3>{badge ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">{badge}</span> : null}</div><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div></div><div className="flex items-center gap-3"><span className={`text-sm font-semibold ${valueClassName ?? 'text-slate-950'}`}>{value}</span><button onClick={onEdit} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><Pencil className="h-4 w-4" /></button><button onClick={onDelete} disabled={pending} className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button></div></div></div>;
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
