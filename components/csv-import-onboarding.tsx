'use client';

import { CheckCircle2, ClipboardPaste, Download, FileSpreadsheet, Sparkles, Upload } from 'lucide-react';
import { importGuides, csvTemplates, type ImportEntity } from '@/lib/import-config';

type ImportPreview = {
  inserted: number;
  errors: Array<{ row: string; message: string }>;
  preview: Array<Record<string, unknown>>;
  pipeline: string;
};

type Props = {
  entity: ImportEntity;
  format: 'csv' | 'ofx' | 'qif';
  view: 'me' | 'shared' | 'household';
  csvText: string;
  preview: ImportPreview | null;
  savingKey: string | null;
  onEntityChange: (entity: ImportEntity) => void;
  onFormatChange: (format: 'csv' | 'ofx' | 'qif') => void;
  onCsvTextChange: (value: string) => void;
  onRun: (dryRun: boolean) => void;
};

export function CsvImportOnboarding({ entity, format, view, csvText, preview, savingKey, onEntityChange, onFormatChange, onCsvTextChange, onRun }: Props) {
  const guide = importGuides[entity];

  const loadTemplate = () => {
    if (format !== 'csv' && entity !== 'transactions') {
      onFormatChange('csv');
    }
    onCsvTextChange(format === 'csv' || entity !== 'transactions' ? csvTemplates[entity] : format === 'ofx'
      ? '<OFX>\n<BANKTRANLIST>\n<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260305<TRNAMT>-54.90<FITID>abc123<NAME>Supermarché<MEMO>Courses foyer</STMTTRN>\n</BANKTRANLIST>\n</OFX>'
      : '!Type:Bank\nD03/05/2026\nT-54.90\nPSupermarché\nMVie courante\n^');
  };
  const clear = () => onCsvTextChange('');
  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(format === 'csv' || entity !== 'transactions' ? csvTemplates[entity] : csvText);
    } catch {
      // no-op in non-browser/test env
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4 rounded-[28px] border border-white/10 bg-black/10 p-5">
        <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#66e2cf]/12 text-[#7ef0df]"><Sparkles className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-semibold text-white">Import guidé</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">Prévisualisez avant import, attribuez au bon périmètre et évitez les doublons évidents.</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-300">Étape 1 · Choisir le jeu à importer</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(['transactions', 'accounts', 'assets'] as ImportEntity[]).map((option) => {
              const active = option === entity;
              return (
                <button key={option} type="button" onClick={() => onEntityChange(option)} className={`rounded-3xl border p-4 text-left transition ${active ? 'border-white/20 bg-white text-slate-950 shadow-[0_18px_40px_rgba(255,255,255,0.12)]' : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{importGuides[option].title}</p>
                      <p className={`mt-2 text-sm leading-5 ${active ? 'text-slate-600' : 'text-slate-400'}`}>{importGuides[option].description}</p>
                    </div>
                    {active ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <FileSpreadsheet className="h-5 w-5 text-slate-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-slate-300">Étape 2 · Format et périmètre</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-300">Format
              <select value={format} onChange={(event) => onFormatChange(event.target.value as 'csv' | 'ofx' | 'qif')} className="field-input" disabled={entity !== 'transactions'}>
                <option value="csv">CSV enrichi</option>
                <option value="ofx">OFX</option>
                <option value="qif">QIF</option>
              </select>
            </label>
            <div className="rounded-2xl bg-black/10 px-4 py-3 text-sm text-slate-300">
              <p className="font-medium text-white">Vue cible</p>
              <p className="mt-1">{view === 'me' ? 'Moi' : view === 'shared' ? 'Partagé' : 'Foyer'}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">En CSV, <code>visibility</code> et <code>owner_email</code> peuvent surcharger ce défaut.</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={loadTemplate} className="btn-secondary"><Download className="h-4 w-4" /> Charger un exemple</button>
            <button type="button" onClick={copyTemplate} className="btn-secondary"><ClipboardPaste className="h-4 w-4" /> Copier</button>
            <button type="button" onClick={clear} className="btn-secondary">Vider</button>
          </div>
          <div className="mt-4 rounded-2xl bg-black/10 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Champs attendus</p>
            <p className="mt-2 font-mono text-xs text-slate-400">{guide.acceptedHeaders.join(', ')}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-400">
              {guide.tips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-300">Étape 3 · Coller le contenu brut
          <textarea aria-label="CSV brut" value={csvText} onChange={(event) => onCsvTextChange(event.target.value)} placeholder={csvTemplates[entity]} className="field-input mt-2 h-64 rounded-3xl font-mono text-xs shadow-inner" />
        </label>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => onRun(true)} className="btn-primary" disabled={savingKey === 'import-preview' || savingKey === 'import-commit'}><Upload className="h-4 w-4" /> {savingKey === 'import-preview' ? 'Prévisualisation…' : 'Prévisualiser'}</button>
          <button type="button" onClick={() => onRun(false)} className="btn-secondary" disabled={savingKey === 'import-preview' || savingKey === 'import-commit'}><Download className="h-4 w-4" /> {savingKey === 'import-commit' ? 'Import en cours…' : 'Importer en base'}</button>
        </div>
      </div>

      <div className="space-y-4">
        {preview ? <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-[#66e2cf]/12 px-3 py-1 text-sm text-[#bff8ee]">Pipeline {preview.pipeline}</span><span className="rounded-full bg-white/[0.08] px-3 py-1 text-sm text-slate-200">{preview.inserted} ligne(s) insérées</span><span className="rounded-full bg-amber-400/10 px-3 py-1 text-sm text-amber-200">{preview.errors.length} erreur(s)</span></div>
          <div className="mt-4 rounded-3xl bg-black/10 p-4">
            <p className="text-sm font-medium text-white">Étape 4 · Contrôler l’aperçu</p>
            <pre className="mt-3 overflow-auto rounded-2xl bg-[#050814] p-4 text-xs text-slate-100">{JSON.stringify(preview.preview, null, 2)}</pre>
          </div>
          {preview.errors.length > 0 ? <div className="mt-4 space-y-2">{preview.errors.map((issue) => <div key={`${issue.row}-${issue.message}`} className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">Ligne {issue.row}: {issue.message}</div>)}</div> : null}
        </div> : <div className="rounded-[28px] border border-dashed border-white/16 bg-white/[0.03] p-5"><p className="text-sm font-medium text-white">Étape 4 · Contrôler l’aperçu</p><p className="mt-2 text-sm leading-6 text-slate-400">Lancez une preview avant import pour voir les lignes reconnues, la portée et les éventuels doublons déjà écartés.</p></div>}
      </div>
    </div>
  );
}
