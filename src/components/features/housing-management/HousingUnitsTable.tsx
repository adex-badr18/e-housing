'use client';

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UnitStatusBadge, CategoryBadge } from '@/components/shared/StatusBadge';
import { HousingUnitDialog } from './HousingUnitDialog';
import { updateHousingUnitStatusAction } from '@/app/actions/housing';
import type { HousingUnit, HousingType, UnitStatus } from '@/lib/mock-api/db';
import {
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  RefreshCw,
} from 'lucide-react';

type SortField = 'name' | 'status' | 'type';
type SortDir = 'asc' | 'desc';

interface HousingUnitsTableProps {
  initialUnits: HousingUnit[];
  housingTypes: HousingType[];
  onDataChange?: () => void;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
  return dir === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary" />
    : <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary" />;
}

const STATUS_OPTIONS: Array<{ value: UnitStatus; label: string }> = [
  { value: 'VACANT', label: 'Vacant' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
];

export function HousingUnitsTable({
  initialUnits,
  housingTypes,
  onDataChange,
}: HousingUnitsTableProps) {
  const [units, setUnits] = useState<HousingUnit[]>(initialUnits);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UnitStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [createOpen, setCreateOpen] = useState(false);
  const [statusEditTarget, setStatusEditTarget] = useState<HousingUnit | null>(null);
  const [newStatus, setNewStatus] = useState<UnitStatus>('VACANT');
  const [isPendingStatus, startStatusTransition] = useTransition();

  const typeMap = useMemo(
    () => new Map(housingTypes.map((ht) => [ht.id, ht])),
    [housingTypes]
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    return units
      .filter((u) => {
        const q = searchQuery.toLowerCase();
        const ht = typeMap.get(u.housingTypeId);
        const matchSearch =
          !q ||
          u.name.toLowerCase().includes(q) ||
          ht?.name.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
        const matchType = typeFilter === 'ALL' || u.housingTypeId === typeFilter;
        return matchSearch && matchStatus && matchType;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
        else if (sortField === 'type') {
          const ta = typeMap.get(a.housingTypeId)?.name ?? '';
          const tb = typeMap.get(b.housingTypeId)?.name ?? '';
          cmp = ta.localeCompare(tb);
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [units, searchQuery, statusFilter, typeFilter, sortField, sortDir, typeMap]);

  const openStatusEdit = (unit: HousingUnit) => {
    setStatusEditTarget(unit);
    setNewStatus(unit.status);
  };

  const handleStatusUpdate = () => {
    if (!statusEditTarget) return;
    startStatusTransition(async () => {
      const result = await updateHousingUnitStatusAction(statusEditTarget.id, newStatus);
      if (result.success) {
        toast.success(`Status updated to "${newStatus.replace('_', ' ')}"`);
        setUnits((prev) =>
          prev.map((u) => (u.id === statusEditTarget.id ? { ...u, status: newStatus } : u))
        );
        setStatusEditTarget(null);
        onDataChange?.();
      } else {
        toast.error(result.error ?? 'Failed to update status');
      }
    });
  };

  const colHeader = (field: SortField, label: string) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className="flex items-center font-semibold hover:text-primary transition-colors"
    >
      {label}
      <SortIcon active={sortField === field} dir={sortDir} />
    </button>
  );

  // Aggregate stats
  const vacantCount = units.filter((u) => u.status === 'VACANT').length;
  const occupiedCount = units.filter((u) => u.status === 'OCCUPIED').length;
  const maintenanceCount = units.filter((u) => u.status === 'UNDER_MAINTENANCE').length;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Total', count: units.length, cls: 'bg-muted text-foreground border-border' },
          { label: 'Vacant', count: vacantCount, cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
          { label: 'Occupied', count: occupiedCount, cls: 'bg-blue-50 text-blue-800 border-blue-200' },
          { label: 'Maintenance', count: maintenanceCount, cls: 'bg-amber-50 text-amber-800 border-amber-200' },
        ].map(({ label, count, cls }) => (
          <div
            key={label}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${cls}`}
          >
            <span className="text-lg font-bold">{count}</span>
            <span className="opacity-75">{label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="hu-search"
            placeholder="Search units or types…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => v != null && setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger id="hu-status-filter" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="VACANT">Vacant</SelectItem>
            <SelectItem value="OCCUPIED">Occupied</SelectItem>
            <SelectItem value="UNDER_MAINTENANCE">Maintenance</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => v != null && setTypeFilter(v)}
        >
          <SelectTrigger id="hu-type-filter" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {housingTypes.map((ht) => (
              <SelectItem key={ht.id} value={ht.id}>
                {ht.name.length > 30 ? ht.name.slice(0, 28) + '…' : ht.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          id="hu-create-btn"
          onClick={() => setCreateOpen(true)}
          className="ml-auto gap-2"
        >
          <Plus className="h-4 w-4" />
          New Unit
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{' '}
        {units.length} units
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>{colHeader('name', 'Unit Name')}</TableHead>
              <TableHead>{colHeader('type', 'Housing Type')}</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>BQ Units</TableHead>
              <TableHead>{colHeader('status', 'Status')}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-8 w-8 opacity-20" />
                    No units match your filters.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((unit) => {
                const ht = typeMap.get(unit.housingTypeId);
                return (
                  <TableRow key={unit.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell className="font-semibold">{unit.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {ht?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      {ht ? <CategoryBadge category={ht.category} /> : '—'}
                    </TableCell>
                    <TableCell>
                      {ht?.hasBQ ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                          {ht.numberOfBQ} BQ{ht.numberOfBQ !== 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <UnitStatusBadge status={unit.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        id={`hu-status-${unit.id}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => openStatusEdit(unit)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity gap-1.5 h-8 text-xs hover:bg-primary/10 hover:text-primary"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Change Status
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Unit Dialog */}
      <HousingUnitDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        housingTypes={housingTypes}
        onSuccess={() => onDataChange?.()}
      />

      {/* Status Update Dialog */}
      <Dialog open={!!statusEditTarget} onOpenChange={(o) => !o && setStatusEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Unit Status</DialogTitle>
            <DialogDescription>
              Change the status for{' '}
              <span className="font-semibold">{statusEditTarget?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Select value={newStatus} onValueChange={(v) => v != null && setNewStatus(v as UnitStatus)}>
              <SelectTrigger id="hu-status-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose render={<Button variant="outline" disabled={isPendingStatus} />}>
              Cancel
            </DialogClose>
            <Button onClick={handleStatusUpdate} disabled={isPendingStatus}>
              {isPendingStatus ? 'Saving…' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
