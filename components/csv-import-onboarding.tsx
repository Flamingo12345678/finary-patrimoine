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
  csvText: string;
  preview: ImportPreview | null;
  savingKey: string | null;
  onEntityChange: (entity: ImportEntity) => void;
  onCsvTextChange: (value: string) => void;
  onRun: (dryRun: boolean) => void;
};

export function CsvImportOnboarding({ entity, csvText, preview, savingKey, onEntityChange, onCsvTextChange, onRun }: Props) {
  const guide = importGuides[entity];

  const loadTemplate = () => onCsvTextChange(csvTemplates[entity]);
  const clear = () => onCsvTextChange('');
  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(csvTemplates[entity]);
    } catch {
      // no-op in non-browser/test env
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-3 rounded-3xl border border-teal-100 bg-white p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Sparkles className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Import guidé</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Choisissez un type de données, chargez le modèle conseillé, prévisualisez puis importez seulement quand le mapping vous paraît propre.</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-600">Étape 1 · Choisir le jeu à importer</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(['transactions', 'accounts', 'assets'] as ImportEntity[]).map((option) => {
              const active = option === entity;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onEntityChange(option)}
                  className={`rounded-3xl border p-4 text-left transition ${active ? 'border-slate-950 bg-slate-950 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/40'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{importGuides[option].title}</p>
                      <p className={`mt-2 text-sm leading-5 ${active ? 'text-slate-300' : 'text-slate-500'}`}>{importGuides[option].description}</p>
                    </div>
                    {active ? <CheckCircle2 className="h-5 w-5 text-teal-300" /> : <FileSpreadsheet className="h-5 w-5 text-slate-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-600">Étape 2 · Préparer le CSV</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={loadTemplate} className="btn-secondary"><Download className="h-4 w-4" /> Charger l’exemple</button>
            <button type="button" onClick={copyTemplate} className="btn-secondary"><ClipboardPaste className="h-4 w-4" /> Copier le modèle</button>
            <button type="button" onClick={clear} className="btn-secondary">Vider</button>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">En-têtes attendus</p>
            <p className="mt-2 font-mono text-xs text-slate-500">{guide.acceptedHeaders.join(', ')}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-500">
              {guide.tips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-600">Étape 3 · Coller ou ajuster le contenu CSV
          <textarea
            aria-label="CSV brut"
            value={csvText}
            onChange={(event) => onCsvTextChange(event.target.value)}
            placeholder={csvTemplates[entity]}
            className="mt-2 h-64 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs text-slate-700 shadow-inner outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => onRun(true)} className="btn-primary" disabled={savingKey === 'import-preview' || savingKey === 'import-commit'}><Upload className="h-4 w-4" /> {savingKey === 'import-preview' ? 'Prévisualisation…' : 'Prévisualiser'}</button>
          <button type="button" onClick={() => onRun(false)} className="btn-secondary" disabled={savingKey === 'import-preview' || savingKey === 'import-commit'}><Download className="h-4 w-4" /> {savingKey === 'import-commit' ? 'Import en cours…' : 'Importer en base'}</button>
        </div>
        <p className="text-xs leading-5 text-slate-500">Détection simple de <code>,</code> ou <code>;</code>, preview avant import, pipeline identifié en <code>csv/manual-upload/v1</code>.</p>
      </div>

      <div className="space-y-4">
        {preview ? <div className="rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-700">Pipeline {preview.pipeline}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{preview.inserted} ligne(s) insérées</span><span className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700">{preview.errors.length} erreur(s)</span></div>
          <div className="mt-4 rounded-3xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Étape 4 · Contrôler l’aperçu</p>
            <pre className="mt-3 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(preview.preview, null, 2)}</pre>
          </div>
          {preview.errors.length > 0 ? <div className="mt-4 space-y-2">{preview.errors.map((issue) => <div key={`${issue.row}-${issue.message}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Ligne {issue.row}: {issue.message}</div>)}</div> : null}
        </div> : <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-5">
          <p className="text-sm font-medium text-slate-700">Étape 4 · Contrôler l’aperçu</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Lancez une preview avant import pour voir les lignes reconnues, les champs mappés et les erreurs à corriger.</p>
        </div>}

        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
          <p className="font-medium text-slate-700">Checklist avant import réel</p>
          <ul className="mt-3 space-y-3">
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-600" /><span>La prévisualisation montre bien le bon nombre de lignes utiles.</span></li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-600" /><span>Les colonnes critiques ({guide.acceptedHeaders.slice(0, 4).join(', ')}) sont correctement remplies.</span></li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-600" /><span>Les erreurs restantes sont comprises ou corrigées avant l’import final.</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
