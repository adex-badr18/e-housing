'use client';

import { useState, useTransition, useRef, useCallback, Fragment } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { bulkCreateHousingUnitsAction } from '@/app/actions/housing';
import type { HousingUnit, HousingType, UnitStatus } from '@/lib/mock-api/db';
import {
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type RowError = { field: string; message: string };

interface PreviewRow {
  _id: string; // local key only
  name: string;
  houseNumber: string;
  roadNumber: string;
  housingTypeId: string;
  status: UnitStatus;
  errors: RowError[];
}

type ResultRow = {
  name: string;
  outcome: 'created' | 'updated' | 'error';
  message?: string;
};

interface HousingUnitBulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  housingTypes: HousingType[];
  onSuccess?: (data: { created: HousingUnit[]; duplicatesUpdated: HousingUnit[] }) => void;
}

// ─── Template download ─────────────────────────────────────────────────────

function downloadTemplate(housingTypes: HousingType[]) {
  const headers = ['unitName', 'houseNumber', 'roadNumber', 'housingType', 'status'];
  const sampleTypeName = housingTypes[0]?.name ?? 'A1';
  const example = ['Qtrs 20', '20', 'Road 1', sampleTypeName, 'Vacant'];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  XLSX.utils.book_append_sheet(wb, ws, 'Housing Units');
  XLSX.writeFile(wb, 'housing_units_template.xlsx');
}

// ─── Row validation ────────────────────────────────────────────────────────

function validateRow(row: PreviewRow, housingTypes: HousingType[]): RowError[] {
  const errs: RowError[] = [];
  if (!row.name || row.name.trim().length < 1)
    errs.push({ field: 'name', message: 'Unit name is required' });
  if (!row.houseNumber || row.houseNumber.trim().length < 1)
    errs.push({ field: 'houseNumber', message: 'House number is required' });
  if (!row.roadNumber || row.roadNumber.trim().length < 1)
    errs.push({ field: 'roadNumber', message: 'Road number is required' });
  if (!row.housingTypeId)
    errs.push({ field: 'housingTypeId', message: 'Housing type is required' });
  else if (!housingTypes.some((ht) => ht.id === row.housingTypeId))
    errs.push({ field: 'housingTypeId', message: 'Invalid housing type selected' });
  if (!['VACANT', 'OCCUPIED', 'UNDER_MAINTENANCE'].includes(row.status))
    errs.push({ field: 'status', message: 'Status must be Vacant, Occupied, or Under Maintenance' });
  return errs;
}

// ─── Excel parser ─────────────────────────────────────────────────────────

function parseStatus(v: unknown): UnitStatus {
  const s = String(v ?? '').toUpperCase().trim();
  if (s === 'OCCUPIED') return 'OCCUPIED';
  if (s === 'UNDER_MAINTENANCE' || s === 'MAINTENANCE') return 'UNDER_MAINTENANCE';
  return 'VACANT';
}

function parseExcel(file: File, housingTypes: HousingType[]): Promise<PreviewRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const rows: PreviewRow[] = raw.map((r, i) => {
          const typeInput = String(r.housingType ?? r.type ?? r.housingTypeId ?? '').trim();
          const matchedType = housingTypes.find(
            (ht) =>
              ht.name.toLowerCase() === typeInput.toLowerCase() ||
              ht.id.toLowerCase() === typeInput.toLowerCase()
          );

          const row: PreviewRow = {
            _id: `row-${i}-${Date.now()}`,
            name: String(r.unitName ?? r.name ?? r.unitCode ?? '').trim(),
            houseNumber: String(r.houseNumber ?? r.houseNo ?? '').trim(),
            roadNumber: String(r.roadNumber ?? r.roadNo ?? '').trim(),
            housingTypeId: matchedType?.id ?? '',
            status: parseStatus(r.status),
            errors: [],
          };
          row.errors = validateRow(row, housingTypes);
          return row;
        });

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Step indicator ────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Upload' },
    { n: 2, label: 'Preview & Edit' },
    { n: 3, label: 'Result' },
  ] as const;

  return (
    <div className="flex items-center justify-center gap-2 my-2">
      {steps.map((s, idx) => (
        <div key={s.n} className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
              current === s.n
                ? 'bg-primary text-primary-foreground border-primary'
                : current > s.n
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-muted text-muted-foreground border-border'
            )}
          >
            {current > s.n ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
            <span>{s.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                'h-0.5 w-8 rounded transition-colors',
                current > s.n ? 'bg-emerald-500' : 'bg-border'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export function HousingUnitBulkUploadDialog({
  open,
  onOpenChange,
  housingTypes,
  onSuccess,
}: HousingUnitBulkUploadDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [parseError, setParseError] = useState('');

  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [isPending, startTransition] = useTransition();

  const [results, setResults] = useState<{
    created: number;
    updated: number;
    errors: ResultRow[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep(1);
    setFile(null);
    setParseError('');
    setRows([]);
    setResults(null);
  }, []);

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const processFile = async (f: File) => {
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setParseError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }
    setFile(f);
    setParseError('');
    try {
      const parsedRows = await parseExcel(f, housingTypes);
      if (parsedRows.length === 0) {
        setParseError('The uploaded sheet contains no data rows.');
        return;
      }
      setRows(parsedRows);
      setStep(2);
    } catch {
      setParseError('Failed to parse Excel file. Check formatting and try again.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const updateCell = <K extends keyof PreviewRow>(
    id: string,
    field: K,
    val: PreviewRow[K]
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._id !== id) return r;
        const updated = { ...r, [field]: val };
        updated.errors = validateRow(updated, housingTypes);
        return updated;
      })
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r._id !== id));
  };

  const errorCount = rows.reduce((acc, r) => acc + r.errors.length, 0);

  const handleFinalSubmit = () => {
    if (errorCount > 0) {
      toast.error('Please fix all validation errors before submitting.');
      return;
    }
    if (rows.length === 0) {
      toast.error('No rows to upload.');
      return;
    }

    startTransition(async () => {
      const payload = rows.map((r) => ({
        name: r.name,
        houseNumber: r.houseNumber,
        roadNumber: r.roadNumber,
        housingTypeId: r.housingTypeId,
        status: r.status,
      }));

      const res = await bulkCreateHousingUnitsAction(payload);
      if (res.success && res.data) {
        const { created, duplicatesUpdated, errors: serverErrs } = res.data;
        const errRows: ResultRow[] = serverErrs.map((e) => ({
          name: e.name,
          outcome: 'error',
          message: e.message,
        }));
        setResults({
          created: created.length,
          updated: duplicatesUpdated.length,
          errors: errRows,
        });
        setStep(3);
        toast.success(
          `Bulk import complete: ${created.length} created, ${duplicatesUpdated.length} updated.`
        );
        onSuccess?.({ created, duplicatesUpdated });
      } else {
        toast.error(res.error ?? 'Bulk upload failed');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Bulk Upload Housing Units</DialogTitle>
              <DialogDescription>
                Import multiple housing units at once from an Excel sheet (.xlsx).
              </DialogDescription>
            </div>
          </div>
          <StepIndicator current={step} />
        </DialogHeader>

        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="space-y-6 py-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Excel Template
                </p>
                <p className="text-xs text-muted-foreground">
                  Use our standardized template pre-formatted with unit headers.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate(housingTypes)}
                className="gap-2 shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                Download Template
              </Button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3',
                isDragOver
                  ? 'border-primary bg-primary/5 scale-[0.99]'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) processFile(f);
                }}
              />
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-semibold">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Excel files only (.xlsx, .xls)
                </p>
              </div>
              {file && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  {file.name}
                </Badge>
              )}
            </div>

            {parseError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Editable Preview */}
        {step === 2 && (
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col py-2">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <p className="text-xs text-muted-foreground">
                Review and edit rows below. Inline errors are highlighted in red.
              </p>
              {errorCount > 0 && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errorCount} Error{errorCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {errorCount > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 shrink-0">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>{errorCount}</strong> validation error{errorCount !== 1 ? 's' : ''} across{' '}
                  {rows.filter((r) => r.errors.length > 0).length} row
                  {rows.filter((r) => r.errors.length > 0).length !== 1 ? 's' : ''}. Fix them before submitting.
                </span>
              </div>
            )}

            <div className="flex-1 overflow-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-44 min-w-[140px]">Unit Name *</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-28">House No *</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-32">Road No *</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-44">Housing Type *</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-36">Status</th>
                    <th className="w-10 px-2 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {rows.map((row) => {
                    const hasErr = row.errors.length > 0;
                    return (
                      <Fragment key={row._id}>
                        <tr
                          className={cn(
                            'group transition-colors',
                            hasErr ? 'bg-red-50/60 dark:bg-red-950/20' : 'bg-background hover:bg-muted/20'
                          )}
                        >
                          {/* Unit Name */}
                          <td className="px-2 py-1.5 w-44">
                            <Input
                              value={row.name}
                              onChange={(e) => updateCell(row._id, 'name', e.target.value)}
                              className={cn(
                                'h-7 text-xs w-full',
                                row.errors.find((e) => e.field === 'name') ? 'border-destructive' : ''
                              )}
                            />
                          </td>
                          {/* House Number */}
                          <td className="px-2 py-1.5 w-28">
                            <Input
                              value={row.houseNumber}
                              onChange={(e) => updateCell(row._id, 'houseNumber', e.target.value)}
                              className={cn(
                                'h-7 text-xs w-full',
                                row.errors.find((e) => e.field === 'houseNumber') ? 'border-destructive' : ''
                              )}
                            />
                          </td>
                          {/* Road Number */}
                          <td className="px-2 py-1.5 w-32">
                            <Input
                              value={row.roadNumber}
                              onChange={(e) => updateCell(row._id, 'roadNumber', e.target.value)}
                              className={cn(
                                'h-7 text-xs w-full',
                                row.errors.find((e) => e.field === 'roadNumber') ? 'border-destructive' : ''
                              )}
                            />
                          </td>
                          {/* Housing Type */}
                          <td className="px-2 py-1.5 w-44">
                            <Select
                              value={row.housingTypeId}
                              onValueChange={(v) => v != null && updateCell(row._id, 'housingTypeId', v)}
                            >
                              <SelectTrigger
                                className={cn(
                                  'h-7 text-xs w-full',
                                  row.errors.find((e) => e.field === 'housingTypeId') ? 'border-destructive' : ''
                                )}
                              >
                                <SelectValue placeholder="Select type…">
                                  {housingTypes.find((ht) => ht.id === row.housingTypeId)?.name}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {housingTypes.map((ht) => (
                                  <SelectItem key={ht.id} value={ht.id}>
                                    {ht.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          {/* Status */}
                          <td className="px-2 py-1.5 w-36">
                            <Select
                              value={row.status}
                              onValueChange={(v) => updateCell(row._id, 'status', v as UnitStatus)}
                            >
                              <SelectTrigger className="h-7 text-xs w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VACANT">Vacant</SelectItem>
                                <SelectItem value="OCCUPIED">Occupied</SelectItem>
                                <SelectItem value="UNDER_MAINTENANCE">Maintenance</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          {/* Action */}
                          <td className="px-2 py-1.5 w-10 text-center">
                            <button
                              type="button"
                              onClick={() => removeRow(row._id)}
                              className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 p-1 rounded"
                              title="Remove row"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                        {/* Inline error row */}
                        {hasErr && (
                          <tr className="bg-red-50/40 dark:bg-red-950/10">
                            <td colSpan={6} className="px-3 py-1.5">
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                                {row.errors.map((e) => (
                                  <span key={e.field} className="text-[10px] text-destructive flex items-center gap-1">
                                    <XCircle className="h-3 w-3 shrink-0" />
                                    <strong className="capitalize">{e.field}:</strong> {e.message}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground shrink-0 pt-1">
              <span>{rows.length} row{rows.length !== 1 ? 's' : ''} total</span>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Upload different file
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Results */}
        {step === 3 && results && (
          <div className="space-y-6 py-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-3xl font-extrabold text-emerald-700">{results.created}</p>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mt-1">Created</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-3xl font-extrabold text-blue-700">{results.updated}</p>
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mt-1">Updated</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-3xl font-extrabold text-red-700">{results.errors.length}</p>
                <p className="text-xs font-semibold text-red-800 uppercase tracking-wider mt-1">Errors</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-destructive uppercase tracking-wider">Failed Rows</p>
                <div className="rounded-xl border border-destructive/20 divide-y divide-destructive/10 text-xs">
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <span className="font-semibold">{err.name}</span>
                      <span className="text-destructive">{err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 shrink-0 pt-2 border-t border-border">
          {step === 1 && (
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)} disabled={isPending}>
                Back
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={isPending || errorCount > 0 || rows.length === 0}
                className="min-w-[140px] gap-2"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  `Submit ${rows.length} Unit${rows.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </>
          )}
          {step === 3 && (
            <Button onClick={() => handleClose(false)} className="min-w-[100px]">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
