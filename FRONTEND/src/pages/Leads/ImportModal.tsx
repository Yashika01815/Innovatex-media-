import { useState } from 'react';
import { Upload, CheckCircle2, XCircle, SkipForward } from 'lucide-react';
import { Modal, Button, Field } from '@/components/ui';
import { toast } from '@/store/toastStore';
import { leadsApi } from '@/lib/leadsApi';
import { ApiError } from '@/lib/apiClient';
import type { ImportSummary } from '@/types/lead';

const RECOGNIZED_COLUMNS = 'name, email, phone, whatsapp, company, source, medium, campaign, status, temperature, segment, value';

interface ImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

export function ImportModal({ onClose, onImported }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const submit = async () => {
    if (!file) return toast.error('Choose a CSV file first');
    setImporting(true);
    try {
      const result = await leadsApi.importCsv(file, skipDuplicates);
      setSummary(result);
      if (result.created > 0) onImported();
    } catch (err) {
      toast.error('Import failed', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Import Leads from CSV"
      size="lg"
      footer={
        summary ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={importing}>Cancel</Button>
            <Button onClick={() => void submit()} disabled={importing || !file}>
              {importing ? 'Importing…' : 'Import'}
            </Button>
          </>
        )
      }
    >
      {!summary ? (
        <div className="space-y-4">
          <Field label="CSV file">
            <label className="input flex cursor-pointer items-center gap-2 text-ink-500">
              <Upload size={16} />
              {file ? file.name : 'Choose a .csv file…'}
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </Field>

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300"
            />
            Skip rows that match an existing lead's email or phone
          </label>

          <div className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
            <p className="mb-1 font-semibold text-ink-700">Recognized columns (case-insensitive):</p>
            <p className="font-mono">{RECOGNIZED_COLUMNS}</p>
            <p className="mt-2">Only <span className="font-semibold">name</span> and <span className="font-semibold">phone</span> are required per row. Max file size 5MB.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg border border-ink-100 p-3">
              <p className="text-lg font-bold text-ink-900">{summary.total}</p>
              <p className="text-xs text-ink-500">Total rows</p>
            </div>
            <div className="rounded-lg border border-green-100 bg-green-50 p-3">
              <p className="flex items-center justify-center gap-1 text-lg font-bold text-green-700"><CheckCircle2 size={16} /> {summary.created}</p>
              <p className="text-xs text-green-700">Created</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
              <p className="flex items-center justify-center gap-1 text-lg font-bold text-amber-700"><SkipForward size={16} /> {summary.skipped}</p>
              <p className="text-xs text-amber-700">Skipped (duplicate)</p>
            </div>
            <div className="rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="flex items-center justify-center gap-1 text-lg font-bold text-red-700"><XCircle size={16} /> {summary.failed}</p>
              <p className="text-xs text-red-700">Failed</p>
            </div>
          </div>

          {summary.errors.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-red-100">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-red-50 text-red-700">
                  <tr><th className="px-3 py-1.5">Line</th><th className="px-3 py-1.5">Error</th></tr>
                </thead>
                <tbody>
                  {summary.errors.map((e, i) => (
                    <tr key={i} className="border-t border-red-50">
                      <td className="px-3 py-1.5 text-ink-500">{e.line}</td>
                      <td className="px-3 py-1.5 text-ink-700">{e.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
