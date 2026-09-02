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
import { bulkCreateHousingTypesAction } from '@/app/actions/housing';
import type { HousingType, ParkingSpace, BuildingType } from '@/lib/mock-api/db';
import {
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type RowError = { field: string; message: string };

interface PreviewRow {
  _id: string; // local key only
  name: string;
  buildingType: BuildingType;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  numberOfToilets: number;
  hasStudyRoom: boolean;
  parkingSpace: ParkingSpace;
  hasBQ: boolean;
  hasCourtyard: boolean;
  allocationPoints: number;
  annualRent: number;
  isActive: boolean;
  errors: RowError[];
}

type ResultRow = {
  name: string;
  outcome: 'created' | 'updated' | 'error';
  message?: string;
};

// ─── Template download ─────────────────────────────────────────────────────

function downloadTemplate() {
  const headers = [
    'houseTypeName', 'numOfBedrooms', 'numOfBath', 'numOfToilets',
    'studyRoom', 'parkingSpace', 'boyQuarters',
    'courtyard', 'buildingType', 'points', 'annualRent', 'status',
  ];
  const example = [
    'A1', 4, 3, 4, 'TRUE', 'Garage', 'TRUE', 'TRUE', 'Bungalow', 70, 220000, 'Active',
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  XLSX.utils.book_append_sheet(wb, ws, 'Housing Types');
  XLSX.writeFile(wb, 'housing_types_template.xlsx');
}

// ─── Row validation ────────────────────────────────────────────────────────

function validateRow(row: PreviewRow): RowError[] {
  const errs: RowError[] = [];
  if (!row.name || row.name.trim().length < 2)
    errs.push({ field: 'name', message: 'Name must be at least 2 characters' });
  if (row.numberOfBedrooms < 1)
    errs.push({ field: 'numberOfBedrooms', message: 'At least 1 bedroom required' });
  if (row.numberOfBathrooms < 0)
    errs.push({ field: 'numberOfBathrooms', message: 'Cannot be negative' });
  if (row.numberOfToilets < 0)
    errs.push({ field: 'numberOfToilets', message: 'Cannot be negative' });
  if (!['Garage', 'Car Park', 'Nil'].includes(row.parkingSpace))
    errs.push({ field: 'parkingSpace', message: 'Must be Garage, Car Park, or Nil' });
  if (!['BUNGALOW', 'STOREY'].includes(row.buildingType))
    errs.push({ field: 'buildingType', message: 'Must be BUNGALOW or STOREY' });
  if (row.allocationPoints < 1)
    errs.push({ field: 'allocationPoints', message: 'Points must be ≥ 1' });
  if (row.annualRent < 0)
    errs.push({ field: 'annualRent', message: 'Rent cannot be negative' });
  return errs;
}

// ─── Excel parser ─────────────────────────────────────────────────────────

function parseBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  const s = String(v).toUpperCase().trim();
  return s === 'TRUE' || s === '1' || s === 'YES';
}

function parseParkingSpace(v: unknown): ParkingSpace {
  const s = String(v ?? '').trim();
  if (s === 'Garage' || s === 'Car Park' || s === 'Nil') return s;
  return 'Nil';
}

function parseBuildingType(v: unknown): BuildingType {
  const s = String(v ?? '').toUpperCase().trim();
  return s === 'STOREY' ? 'STOREY' : 'BUNGALOW';
}

function parseExcel(file: File): Promise<PreviewRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const rows: PreviewRow[] = raw.map((r, i) => {
          const row: PreviewRow = {
            _id: `row-${i}-${Date.now()}`,
            name: String(r.houseTypeName ?? r.name ?? '').trim(),
            buildingType: parseBuildingType(r.buildingType),
            numberOfBedrooms: Number(r.numOfBedrooms ?? r.numberOfBedrooms ?? 1),
            numberOfBathrooms: Number(r.numOfBath ?? r.numberOfBathrooms ?? 0),
            numberOfToilets: Number(r.numOfToilets ?? r.numberOfToilets ?? 0),
            hasStudyRoom: parseBool(r.studyRoom ?? r.hasStudyRoom),
            parkingSpace: parseParkingSpace(r.parkingSpace),
            hasBQ: parseBool(r.boyQuarters ?? r.hasBQ),
            hasCourtyard: parseBool(r.courtyard ?? r.hasCourtyard),
            allocationPoints: Number(r.points ?? r.allocationPoints ?? 1),
            annualRent: Number(r.annualRent ?? 0),
            isActive: String(r.status ?? 'Active').toLowerCase() !== 'inactive',
            errors: [],
          };
          row.errors = validateRow(row);
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
    { n: 2, label: 'Preview' },
    { n: 3, label: 'Result' },
  ] as const;
  return (
    <div className="flex items-center gap-1 mb-4">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-1">
          <div className={cn(
            'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border transition-colors',
            current === s.n
              ? 'bg-primary text-primary-foreground border-primary'
              : current > s.n
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-muted text-muted-foreground border-border',
          )}>
            {current > s.n ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
          </div>
          <span className={cn(
            'text-xs font-medium',
            current === s.n ? 'text-foreground' : 'text-muted-foreground',
          )}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

interface HousingTypeBulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function HousingTypeBulkUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: HousingTypeBulkUploadDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep(1);
    setRows([]);
    setResults([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = useCallback(async (file: File) => {
    setIsParsing(true);
    try {
      const parsed = await parseExcel(file);
      if (parsed.length === 0) {
        toast.error('No data rows found in the file');
        return;
      }
      setRows(parsed);
      setStep(2);
    } catch {
      toast.error('Failed to parse file. Make sure it is a valid .xlsx or .xls file');
    } finally {
      setIsParsing(false);
    }
  }, []);

  const updateCell = (id: string, field: keyof PreviewRow, value: unknown) => {
    setRows(prev => prev.map(r => {
      if (r._id !== id) return r;
      const updated = { ...r, [field]: value } as PreviewRow;
      updated.errors = validateRow(updated);
      return updated;
    }));
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r._id !== id));
  };

  const allValid = rows.length > 0 && rows.every(r => r.errors.length === 0);
  const errorCount = rows.reduce((acc, r) => acc + r.errors.length, 0);

  const handleSubmit = () => {
    const payload = rows.map(({ _id, errors, ...rest }) => rest);
    startTransition(async () => {
      const result = await bulkCreateHousingTypesAction(payload);
      if (!result.success) {
        toast.error(result.error ?? 'Bulk upload failed');
        return;
      }
      const { created, duplicatesUpdated, errors } = result.data!;
      const res: ResultRow[] = [
        ...created.map(t => ({ name: t.name, outcome: 'created' as const })),
        ...duplicatesUpdated.map(t => ({ name: t.name, outcome: 'updated' as const })),
        ...errors.map(e => ({ name: `Row ${e.row}`, outcome: 'error' as const, message: e.message })),
      ];
      setResults(res);
      setStep(3);
      onSuccess?.();
    });
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Bulk Upload Housing Types</DialogTitle>
              <DialogDescription>Upload an Excel file to create or update multiple housing types at once.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 min-h-0">
          <StepIndicator current={step} />

          {/* ── Step 1: Upload ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
              >
                <div className="p-4 rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Drop your Excel file here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-2">Supports .xlsx and .xls</p>
                </div>
                {isParsing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Parsing file…
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/20">
                <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Need a template?</p>
                  <p className="text-xs text-muted-foreground">Download our pre-formatted Excel template with a sample row</p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5 shrink-0">
                  <Download className="h-3.5 w-3.5" />
                  Download Template
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Editable Preview ── */}
          {step === 2 && (
            <div className="space-y-3">
              {errorCount > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span><strong>{errorCount}</strong> validation error{errorCount !== 1 ? 's' : ''} across {rows.filter(r => r.errors.length > 0).length} row{rows.filter(r => r.errors.length > 0).length !== 1 ? 's' : ''}. Fix them before submitting.</span>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-44 min-w-[150px]">Name *</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-32 shrink-0">Building</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground w-16 shrink-0">Beds</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground w-16 shrink-0">Bath</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground w-16 shrink-0">WC</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-28 shrink-0">Parking</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground w-20 shrink-0">BQ</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground w-20 shrink-0">Points</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground w-28 shrink-0">Rent (₦)</th>
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
                              hasErr ? 'bg-red-50/60 dark:bg-red-950/20' : 'bg-background hover:bg-muted/20',
                            )}
                          >
                            {/* Name */}
                            <td className="px-2 py-1.5 w-44 min-w-[150px]">
                              <Input
                                value={row.name}
                                onChange={e => updateCell(row._id, 'name', e.target.value)}
                                className={cn('h-7 text-xs w-full', row.errors.find(e => e.field === 'name') ? 'border-destructive' : '')}
                              />
                            </td>
                            {/* Building */}
                            <td className="px-2 py-1.5 w-32">
                              <Select
                                value={row.buildingType}
                                onValueChange={v => updateCell(row._id, 'buildingType', v)}
                              >
                                <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="BUNGALOW">Bungalow</SelectItem>
                                  <SelectItem value="STOREY">Storey</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            {/* Beds */}
                            <td className="px-2 py-1.5 text-center w-16">
                              <Input
                                type="number" min={1} value={row.numberOfBedrooms}
                                onChange={e => updateCell(row._id, 'numberOfBedrooms', Number(e.target.value))}
                                className={cn('h-7 text-xs w-full text-center', row.errors.find(e => e.field === 'numberOfBedrooms') ? 'border-destructive' : '')}
                              />
                            </td>
                            {/* Bath */}
                            <td className="px-2 py-1.5 text-center w-16">
                              <Input type="number" min={0} value={row.numberOfBathrooms}
                                onChange={e => updateCell(row._id, 'numberOfBathrooms', Number(e.target.value))}
                                className="h-7 text-xs w-full text-center"
                              />
                            </td>
                            {/* WC */}
                            <td className="px-2 py-1.5 text-center w-16">
                              <Input type="number" min={0} value={row.numberOfToilets}
                                onChange={e => updateCell(row._id, 'numberOfToilets', Number(e.target.value))}
                                className="h-7 text-xs w-full text-center"
                              />
                            </td>
                            {/* Parking */}
                            <td className="px-2 py-1.5 w-28">
                              <Select
                                value={row.parkingSpace}
                                onValueChange={v => updateCell(row._id, 'parkingSpace', v)}
                              >
                                <SelectTrigger className={cn('h-7 text-xs w-full', row.errors.find(e => e.field === 'parkingSpace') ? 'border-destructive' : '')}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Garage">Garage</SelectItem>
                                  <SelectItem value="Car Park">Car Park</SelectItem>
                                  <SelectItem value="Nil">Nil</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            {/* BQ toggle */}
                            <td className="px-2 py-1.5 text-center w-20">
                              <Select
                                value={row.hasBQ ? 'yes' : 'no'}
                                onValueChange={v => updateCell(row._id, 'hasBQ', v === 'yes')}
                              >
                                <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            {/* Points */}
                            <td className="px-2 py-1.5 text-center w-20">
                              <Input
                                type="number" min={1} value={row.allocationPoints}
                                onChange={e => updateCell(row._id, 'allocationPoints', Number(e.target.value))}
                                className={cn('h-7 text-xs w-full text-center', row.errors.find(e => e.field === 'allocationPoints') ? 'border-destructive' : '')}
                              />
                            </td>
                            {/* Rent */}
                            <td className="px-2 py-1.5 text-right w-28">
                              <Input
                                type="number" min={0} value={row.annualRent}
                                onChange={e => updateCell(row._id, 'annualRent', Number(e.target.value))}
                                className={cn('h-7 text-xs w-full text-right', row.errors.find(e => e.field === 'annualRent') ? 'border-destructive' : '')}
                              />
                            </td>
                            {/* Delete */}
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
                              <td colSpan={10} className="px-3 py-1.5">
                                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                                  {row.errors.map(e => (
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

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{rows.length} row{rows.length !== 1 ? 's' : ''} total</span>
                <button type="button" onClick={() => { reset(); }} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <RotateCcw className="h-3 w-3" />
                  Start over
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Result ── */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Created', count: results.filter(r => r.outcome === 'created').length, className: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                  { label: 'Updated', count: results.filter(r => r.outcome === 'updated').length, className: 'text-blue-700 bg-blue-50 border-blue-200' },
                  { label: 'Failed', count: results.filter(r => r.outcome === 'error').length, className: 'text-red-700 bg-red-50 border-red-200' },
                ].map(s => (
                  <div key={s.label} className={cn('rounded-xl border p-4 text-center', s.className)}>
                    <p className="text-2xl font-bold">{s.count}</p>
                    <p className="text-xs font-medium mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Row-by-row table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Housing Type</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {results.map((r, i) => (
                      <tr key={i} className="bg-background">
                        <td className="px-4 py-2.5 font-medium">{r.name}</td>
                        <td className="px-4 py-2.5">
                          {r.outcome === 'created' && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1 text-xs">
                              <CheckCircle2 className="h-3 w-3" /> Created
                            </Badge>
                          )}
                          {r.outcome === 'updated' && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1 text-xs">
                              <RefreshCw className="h-3 w-3" /> Updated
                            </Badge>
                          )}
                          {r.outcome === 'error' && (
                            <span className="flex items-center gap-1.5 text-xs text-destructive">
                              <XCircle className="h-3.5 w-3.5" />
                              {r.message ?? 'Failed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 mt-4 gap-2">
          {step === 1 && (
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => { reset(); }}>
                Back
              </Button>
              <Button
                id="ht-bulk-submit"
                onClick={handleSubmit}
                disabled={!allValid || isPending}
                className="gap-1.5 min-w-[120px]"
              >
                {isPending ? (
                  <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Submitting…</>
                ) : (
                  <>Submit {rows.length} Row{rows.length !== 1 ? 's' : ''}</>
                )}
              </Button>
            </>
          )}
          {step === 3 && (
            <Button onClick={() => handleClose(false)} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
