'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  CreditCard,
  HeartHandshake,
  Home,
  Landmark,
  Layers3,
  Pencil,
  PieChart,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  User2,
  Users,
  Wallet,
} from 'lucide-react';
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
const percent = (value: number, total: number) => total > 0 ? Math.round((value / total) * 100) : 0;

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

const viewLabels: Record<ViewMode, string> = { me: 'Moi', shared: 'Partagé', household: 'Foyer' };
const viewDescriptions: Record<ViewMode, string> = {
  me: 'Un pilotage individuel, net et sans bruit.',
  shared: 'Le périmètre commun, lisible en un coup d’œil.',
  household: 'La vue consolidée du foyer pour arbitrer ensemble.',
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
    return base.map((tx) => ({ ...tx, height: Math.max(18, Math.round((Math.abs(tx.amount) / peak) * 128)) }));
  }, [data]);

  const spotlightTransactions = useMemo(() => data?.transactions.slice(0, 4) ?? [], [data]);
  const progressGoals = useMemo(() => (data?.goals ?? []).map((goal) => ({ ...goal, progress: goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0 })), [data]);
  const topAccounts = useMemo(() => [...(data?.accounts ?? [])].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 4), [data]);

  if (error) return <main className="mx-auto max-w-5xl px-6 py-10"><div className="card p-6 text-rose-200">{error}</div></main>;
  if (!data) return <main className="mx-auto max-w-5xl px-6 py-10"><div className="card p-6 text-slate-300">Chargement du patrimoine…</div></main>;

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
    <main className="mx-auto max-w-[1520px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="card h-fit overflow-hidden p-4 sm:p-5">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(102,226,207,0.14),rgba(255,255,255,0.03))] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#66e2cf]">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <p className="eyebrow text-[#9fb1cf]">Foyer</p>
                <h2 className="mt-1 text-lg font-semibold text-white">{data.household.name}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">Un espace plus net pour séparer le perso, le partagé et la vision foyer sans perdre le détail opérationnel.</p>
          </div>

          <div className="mt-4 space-y-3">
            <SidebarStat icon={<User2 className="h-4 w-4" />} label="Mon patrimoine" value={currency(data.summary.personalNetWorth)} />
            <SidebarStat icon={<HeartHandshake className="h-4 w-4" />} label="Partagé" value={currency(data.summary.sharedNetWorth)} />
            <SidebarStat icon={<Layers3 className="h-4 w-4" />} label="Vue active" value={viewLabels[view]} />
          </div>

          <div className="mt-5 rounded-[28px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="eyebrow">Membres</p>
                <h3 className="mt-1 text-base font-semibold text-white">Répartition du foyer</h3>
              </div>
              <span className="status-pill">{data.household.members.length}</span>
            </div>
            <div className="mt-4 space-y-3">
              {data.household.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-black/10 px-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{member.name || member.email}</p>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{member.role}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.06] text-[#8ba8ff]">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-white/10 bg-white/5 p-4">
            <p className="eyebrow">Guidage</p>
            <div className="mt-3 space-y-3 text-sm text-slate-300">
              <SidebarNote icon={<ShieldCheck className="h-4 w-4 text-[#66e2cf]" />} text="Les formulaires gardent le CRUD intact avec un habillage plus premium." />
              <SidebarNote icon={<Sparkles className="h-4 w-4 text-[#9a8cff]" />} text="Le filtre Moi / Partagé / Foyer pilote toute la lecture du cockpit." />
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="card overflow-hidden p-5 sm:p-6 lg:p-8">
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow text-[#66e2cf]">Cockpit patrimoine</p>
                    <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl xl:text-5xl">Une lecture plus mature de votre patrimoine, à vivre seul, à deux ou en foyer complet.</h1>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-[15px]">Le tableau de bord met désormais en avant le patrimoine net, les flux et les zones d’action prioritaires, avec une hiérarchie plus claire, des surfaces cohérentes et des micro-états plus propres.</p>
                  </div>
                  <ViewTabs value={view} onChange={setView} />
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                  <Metric icon={<Wallet className="h-5 w-5" />} label="Patrimoine net" value={currency(data.summary.netWorth)} detail={viewDescriptions[view]} accent="teal" />
                  <Metric icon={<PieChart className="h-5 w-5" />} label="Allocation suivie" value={`${data.allocation.length} poches`} detail={`${data.summary.assetCount} actifs visibles`} accent="violet" />
                  <Metric icon={<TrendingUp className="h-5 w-5" />} label="Flux récents" value={currency(data.summary.monthlyFlow)} detail={`${data.summary.transactionCount} mouvements visibles`} accent="blue" />
                  <Metric icon={<Target className="h-5 w-5" />} label="Objectifs actifs" value={String(data.summary.goalCount)} detail={`${topAccounts.length} comptes clés mis en avant`} accent="gold" />
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">Focus vue</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">{viewLabels[view]}</h2>
                  </div>
                  <span className="status-pill bg-[rgba(102,226,207,0.1)] text-[#bff8ee]">8 derniers flux</span>
                </div>

                <div className="mt-5 rounded-[24px] border border-white/[0.08] bg-black/10 p-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Baromètre</p>
                      <p className="mt-1 text-3xl font-semibold text-white">{currency(data.summary.monthlyFlow)}</p>
                    </div>
                    <span className="text-sm text-slate-400">{viewDescriptions[view]}</span>
                  </div>

                  <div className="mt-6 flex h-40 items-end gap-2">
                    {monthlySeries.length > 0 ? monthlySeries.map((point) => (
                      <div key={point.id} className="group flex flex-1 flex-col items-center gap-2">
                        <div className={`w-full rounded-t-[20px] transition duration-200 group-hover:opacity-90 ${point.amount >= 0 ? 'bg-[linear-gradient(180deg,#82f2e2_0%,#3dd0b7_100%)] shadow-[0_16px_30px_rgba(61,208,183,0.18)]' : 'bg-[linear-gradient(180deg,#8798c1_0%,#394764_100%)] shadow-[0_16px_30px_rgba(17,24,39,0.24)]'}`} style={{ height: `${point.height}px` }} />
                        <span className="text-[11px] text-slate-500">{new Date(point.occurredAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                      </div>
                    )) : <EmptyState title="Aucune donnée" description="Ajoutez des transactions ou importez un OFX/QIF/CSV pour générer une tendance." compact />}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InsightTile label="Patrimoine perso" value={currency(data.summary.personalNetWorth)} />
                  <InsightTile label="Patrimoine partagé" value={currency(data.summary.sharedNetWorth)} />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <Panel title="Allocation du patrimoine" subtitle="Répartition de la vue sélectionnée" headerRight={<span className="status-pill">{data.allocation.length} classes</span>}>
              {data.allocation.length > 0 ? (
                <div className="space-y-4">
                  {data.allocation.map((slice, index) => (
                    <div key={slice.label} className="rounded-[24px] border border-white/[0.08] bg-black/10 p-4">
                      <div className="mb-3 flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium text-white">{slice.label}</span>
                        <span className="text-slate-400">{slice.value}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-white/[0.06]">
                        <div className={`h-3 rounded-full ${allocationGradient(index)}`} style={{ width: `${slice.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState title="Aucun actif" description="Créez un actif ou importez un fichier pour afficher votre allocation." />}
            </Panel>

            <Panel title="Synthèse exécutive" subtitle="Pilotage personnel, partagé et foyer" headerRight={<span className="status-pill">Vue {viewLabels[view]}</span>}>
              <div className="grid gap-4 sm:grid-cols-2">
                <SummaryCard label="Mon patrimoine" value={currency(data.summary.personalNetWorth)} icon={<User2 className="h-4 w-4" />} note="Vision individuelle" />
                <SummaryCard label="Partagé" value={currency(data.summary.sharedNetWorth)} icon={<HeartHandshake className="h-4 w-4" />} note="Espace commun" />
                <SummaryCard label="Flux récents" value={currency(data.summary.monthlyFlow)} icon={<TrendingUp className="h-4 w-4" />} note="Lecture dynamique" />
                <SummaryCard label="Membres actifs" value={String(data.household.members.length)} icon={<Users className="h-4 w-4" />} note="Structure foyer" />
              </div>
              <div className="mt-4 grid gap-3">
                {topAccounts.length > 0 ? topAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between gap-3 rounded-[22px] border border-white/[0.08] bg-black/10 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{account.name}</p>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{account.institution} · {ownerLabel(account)}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-200">{currency(account.balance)}</span>
                  </div>
                )) : <EmptyState title="Aucun compte clé" description="Les comptes les plus significatifs apparaîtront ici." compact />}
              </div>
            </Panel>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <Panel title="Objectifs du moment" subtitle="Progression personnelle ou commune" headerRight={<span className="status-pill">{progressGoals.length} suivi(s)</span>}>
              <div className="space-y-3">
                {progressGoals.length > 0 ? progressGoals.slice(0, 4).map((goal) => (
                  <div key={goal.id} className="rounded-[24px] border border-white/[0.08] bg-black/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{goal.name}</p>
                        <p className="mt-1 text-sm text-slate-400">{currency(goal.current)} / {currency(goal.target)} · {shortDate(goal.deadline)} · {ownerLabel(goal)}</p>
                      </div>
                      <span className="status-pill">{goal.progress}%</span>
                    </div>
                    <div className="mt-4 h-2.5 rounded-full bg-white/[0.06]">
                      <div className="h-2.5 rounded-full bg-[linear-gradient(90deg,#66e2cf_0%,#8ba8ff_100%)]" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>
                )) : <EmptyState title="Aucun objectif" description="Créez un objectif personnel ou commun pour suivre l’avancement." compact />}
              </div>
            </Panel>

            <Panel title="Transactions à surveiller" subtitle="Extrait rapide pour décider plus vite" headerRight={<span className="status-pill">{spotlightTransactions.length} en vue</span>}>
              <div className="space-y-3">
                {spotlightTransactions.length > 0 ? spotlightTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-3 rounded-[24px] border border-white/[0.08] bg-black/10 px-4 py-4 transition hover:border-white/14 hover:bg-white/[0.045]">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tx.amount >= 0 ? 'bg-emerald-500/12 text-emerald-300' : 'bg-white/[0.08] text-slate-200'}`}>
                        {tx.amount >= 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{tx.label}</p>
                        <p className="text-sm text-slate-400">{tx.category} · {shortDate(tx.occurredAt)} · {ownerLabel(tx)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-emerald-300' : 'text-white'}`}>{tx.amount >= 0 ? '+' : ''}{currency(tx.amount)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{tx.type}</p>
                    </div>
                  </div>
                )) : <EmptyState title="Aucune transaction" description="Le journal principal apparaîtra ici dès les premiers flux." compact />}
              </div>
            </Panel>
          </section>

          {error ? <div className="card border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}

          <section className="grid gap-6 2xl:grid-cols-2">
            <CrudPanel title="Comptes" subtitle="Comptes perso ou partagés" form={<>
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
              {data.transactions.length > 0 ? data.transactions.map((tx) => <RowCard key={tx.id} title={tx.label} subtitle={`${tx.category} · ${shortDate(tx.occurredAt)} · ${ownerLabel(tx)}`} value={`${tx.amount >= 0 ? '+' : ''}${currency(tx.amount)}`} valueClassName={tx.amount >= 0 ? 'text-emerald-300' : 'text-white'} badge={tx.visibility === 'SHARED' ? 'Commun' : 'Perso'} onEdit={() => startEdit('transactions', tx)} onDelete={() => handleDelete('transactions', tx.id)} pending={saving === `transactions-${tx.id}`} icon={tx.amount >= 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />} />) : <EmptyState title="Aucune transaction" description="Ajoutez une transaction ou importez OFX/QIF/CSV." />}
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

          <Panel title="Import multi-format" subtitle="CSV enrichi, OFX et QIF pour un usage réel à deux" headerRight={<span className="status-pill">Préview avant import</span>}>
            <CsvImportOnboarding entity={importEntity} format={importFormat} view={view} csvText={csvText} preview={importPreview} savingKey={saving} onEntityChange={(value) => { setImportEntity(value); setImportPreview(null); }} onFormatChange={(value) => { setImportFormat(value); setImportPreview(null); }} onCsvTextChange={setCsvText} onRun={runImport} />
          </Panel>
        </div>
      </section>
    </main>
  );
}

function ViewTabs({ value, onChange }: { value: ViewMode; onChange: (value: ViewMode) => void }) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-[26px] border border-white/10 bg-white/5 p-2">
      {(['me', 'shared', 'household'] as ViewMode[]).map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition duration-200 ${active ? 'bg-white text-slate-950 shadow-[0_16px_30px_rgba(255,255,255,0.18)]' : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'}`}
          >
            {option === 'me' ? <User2 className="h-4 w-4" /> : option === 'shared' ? <HeartHandshake className="h-4 w-4" /> : <Home className="h-4 w-4" />}
            {viewLabels[option]}
          </button>
        );
      })}
    </div>
  );
}

function ScopeSelect({ value, onChange }: { value: Visibility; onChange: (value: Visibility) => void }) {
  return <Select label="Portée" value={value} onChange={(next) => onChange(next as Visibility)} options={[{ label: 'Personnel / Moi', value: 'PERSONAL' }, { label: 'Partagé / Foyer', value: 'SHARED' }]} />;
}

function SidebarStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition duration-200 hover:border-white/16 hover:bg-white/[0.07]"><div className="flex items-center gap-2 text-sm text-slate-400">{icon}{label}</div><p className="mt-2 text-xl font-semibold text-white">{value}</p></div>;
}

function SidebarNote({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-black/10 px-3 py-3"><div className="mt-0.5">{icon}</div><p className="leading-6 text-slate-300">{text}</p></div>;
}

function Metric({ icon, label, value, detail, accent }: { icon: React.ReactNode; label: string; value: string; detail: string; accent: 'teal' | 'blue' | 'violet' | 'gold' }) {
  const accents = {
    teal: 'bg-[#66e2cf]/12 text-[#7ef0df]',
    blue: 'bg-[#8ba8ff]/12 text-[#b8c8ff]',
    violet: 'bg-[#9a8cff]/12 text-[#c7bfff]',
    gold: 'bg-amber-300/12 text-amber-200',
  } as const;

  return <div className="metric surface-hover"><div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${accents[accent]}`}>{icon}</div><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-semibold text-white">{value}</p><p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p></div>;
}

function InsightTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[22px] border border-white/[0.08] bg-black/10 px-4 py-3"><p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p><p className="mt-2 text-lg font-semibold text-white">{value}</p></div>;
}

function SummaryCard({ label, value, icon, note }: { label: string; value: string; icon: React.ReactNode; note: string }) {
  return <div className="rounded-[24px] border border-white/10 bg-white/5 p-4"><div className="flex items-center gap-2 text-sm text-slate-300">{icon}{label}</div><div className="mt-2 text-2xl font-semibold text-white">{value}</div><p className="mt-2 text-sm text-slate-500">{note}</p></div>;
}

function Panel({ title, subtitle, children, headerRight }: { title: string; subtitle: string; children: React.ReactNode; headerRight?: React.ReactNode }) {
  return <div className="card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">{subtitle}</p><h2 className="mt-2 section-title">{title}</h2></div>{headerRight}</div><div className="mt-5">{children}</div></div>;
}

function CrudPanel({ title, subtitle, form, children, onSubmit, onReset, isEditing, saving }: { title: string; subtitle: string; form: React.ReactNode; children: React.ReactNode; onSubmit: () => void; onReset: () => void; isEditing: boolean; saving: boolean }) {
  return <div className="card p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="eyebrow">{subtitle}</p><h2 className="mt-2 section-title">{title}</h2></div><div className="status-pill">{isEditing ? 'Édition' : 'Création'}</div></div><div className="mt-5 rounded-[28px] border border-white/10 bg-black/10 p-4 sm:p-5">{form}<div className="mt-4 flex flex-wrap gap-3"><button onClick={onSubmit} className="btn-primary">{isEditing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{saving ? 'Enregistrement…' : isEditing ? 'Mettre à jour' : 'Ajouter'}</button><button onClick={onReset} className="btn-secondary">Réinitialiser</button></div></div><div className="mt-5 space-y-3">{children}</div></div>;
}

function RowCard({ title, subtitle, value, onEdit, onDelete, pending, icon, valueClassName, badge }: { title: string; subtitle: string; value: string; onEdit: () => void; onDelete: () => void; pending?: boolean; icon: React.ReactNode; valueClassName?: string; badge?: string }) {
  return <div className="rounded-[26px] border border-white/10 bg-white/5 p-4 transition duration-200 hover:border-white/16 hover:bg-white/[0.07]"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-start gap-3"><div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-black/20 text-slate-200">{icon}</div><div><div className="flex items-center gap-2"><h3 className="font-medium text-white">{title}</h3>{badge ? <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-slate-300">{badge}</span> : null}</div><p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p></div></div><div className="flex items-center gap-2 sm:gap-3"><span className={`text-sm font-semibold ${valueClassName ?? 'text-white'}`}>{value}</span><button onClick={onEdit} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"><Pencil className="h-4 w-4" /></button><button onClick={onDelete} disabled={pending} className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-400/16 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button></div></div></div>;
}

function EmptyState({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return <div className={`rounded-[24px] border border-dashed border-white/16 bg-white/[0.03] text-center ${compact ? 'px-4 py-6' : 'px-6 py-10'}`}><p className="font-medium text-white">{title}</p><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></div>;
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="field-label">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="field-input" /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<string | { label: string; value: string }> }) {
  return <label className="field-label">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="field-input">{options.map((option) => typeof option === 'string' ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function allocationGradient(index: number) {
  const gradients = [
    'bg-[linear-gradient(90deg,#66e2cf_0%,#8ef4e5_100%)]',
    'bg-[linear-gradient(90deg,#8ba8ff_0%,#b8c8ff_100%)]',
    'bg-[linear-gradient(90deg,#9a8cff_0%,#c7bfff_100%)]',
    'bg-[linear-gradient(90deg,#f7c66d_0%,#f5e29a_100%)]',
  ];
  return gradients[index % gradients.length];
}
