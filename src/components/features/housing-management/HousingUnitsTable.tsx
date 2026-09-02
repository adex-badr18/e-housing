'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
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
import { UnitStatusBadge } from '@/components/shared/StatusBadge';
import { HousingUnitDialog } from './HousingUnitDialog';
import { HousingUnitDetailDialog } from './HousingUnitDetailDialog';
import { HousingUnitBulkUploadDialog } from './HousingUnitBulkUploadDialog';
import { updateHousingUnitStatusAction, deleteHousingUnitAction } from '@/app/actions/housing';
import type { HousingUnit, HousingType, UnitStatus } from '@/lib/mock-api/db';
import {
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  RefreshCw,
  Pencil,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type SortField = 'name' | 'status' | 'type';
type SortDir = 'asc' | 'desc';

interface HousingUnitsTableProps {
  initialUnits: HousingUnit[];
  housingTypes: HousingType[];
  onDataChange?: (record?: HousingUnit) => void;
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
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // Sync if parent re-fetches (e.g., after server revalidation)
  useEffect(() => {
    setUnits(initialUnits);
  }, [initialUnits]);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<HousingUnit | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [statusEditTarget, setStatusEditTarget] = useState<HousingUnit | null>(null);
  const [newStatus, setNewStatus] = useState<UnitStatus>('VACANT');
  const [isPendingStatus, startStatusTransition] = useTransition();

  const [editTarget, setEditTarget] = useState<HousingUnit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HousingUnit | null>(null);
  const [isPendingDelete, startDeleteTransition] = useTransition();

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
          (u.houseNumber && u.houseNumber.toLowerCase().includes(q)) ||
          (u.roadNumber && u.roadNumber.toLowerCase().includes(q)) ||
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

  // Reset to first page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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

  const handleDelete = () => {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      const result = await deleteHousingUnitAction(deleteTarget.id);
      if (result.success) {
        toast.success(`Unit "${deleteTarget.name}" deleted successfully`);
        setUnits((prev) => prev.filter((u) => u.id !== deleteTarget.id));
        setDeleteTarget(null);
        onDataChange?.();
      } else {
        toast.error(result.error ?? 'Failed to delete unit');
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
          id="hu-bulk-upload-btn"
          variant="outline"
          onClick={() => setBulkOpen(true)}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Bulk
        </Button>

        <Button
          id="hu-create-btn"
          onClick={() => setCreateOpen(true)}
          className="gap-2"
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
              <TableHead>House No</TableHead>
              <TableHead>Road No</TableHead>
              <TableHead>{colHeader('type', 'Housing Type')}</TableHead>
              <TableHead>Building</TableHead>
              <TableHead>BQ Units</TableHead>
              <TableHead>{colHeader('status', 'Status')}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-8 w-8 opacity-20" />
                    No units match your filters.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((unit) => {
                const ht = typeMap.get(unit.housingTypeId);
                return (
                  <TableRow
                    key={unit.id}
                    className="hover:bg-muted/20 transition-colors group cursor-pointer"
                    onClick={() => setDetailTarget(unit)}
                  >
                    <TableCell className="font-semibold">{unit.name}</TableCell>
                    <TableCell className="text-sm font-medium">{unit.houseNumber ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{unit.roadNumber ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                      {ht?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">
                      {ht ? ht.buildingType.charAt(0) + ht.buildingType.slice(1).toLowerCase() : '—'}
                    </TableCell>
                    <TableCell>
                      {ht?.hasBQ ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-medium">
                          1 BQ
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <UnitStatusBadge status={unit.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          id={`hu-status-${unit.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => openStatusEdit(unit)}
                          className="gap-1.5 h-8 text-xs hover:bg-primary/10 hover:text-primary"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Status
                        </Button>
                        <Button
                          id={`hu-edit-${unit.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditTarget(unit)}
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          id={`hu-delete-${unit.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(unit)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-semibold text-foreground">{page + 1}</span> of{' '}
            <span className="font-semibold text-foreground">{totalPages}</span>
            {' '}·{' '}
            <span className="font-semibold text-foreground">{filtered.length}</span> units total
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNum = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-8 w-8 rounded-lg border text-xs font-medium transition ${
                    pageNum === page
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* Detail Unit Dialog */}
      <HousingUnitDetailDialog
        open={!!detailTarget}
        onOpenChange={(o) => !o && setDetailTarget(null)}
        unit={detailTarget}
        housingTypes={housingTypes}
        onEdit={(unit) => {
          setDetailTarget(null);
          setEditTarget(unit);
        }}
      />

      {/* Bulk Upload Dialog */}
      <HousingUnitBulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        housingTypes={housingTypes}
        onSuccess={({ created, duplicatesUpdated }) => {
          setUnits((prev) => {
            const updated = [...prev];
            // Apply updates to existing records
            for (const u of duplicatesUpdated) {
              const idx = updated.findIndex((x) => x.id === u.id);
              if (idx !== -1) updated[idx] = u;
            }
            // Append brand-new records
            const existingIds = new Set(updated.map((x) => x.id));
            for (const u of created) {
              if (!existingIds.has(u.id)) updated.push(u);
            }
            return updated;
          });
          setBulkOpen(false);
          onDataChange?.();
        }}
      />

      {/* Create Unit Dialog */}
      <HousingUnitDialog
        key={createOpen ? 'create-open' : 'create-closed'}
        open={createOpen}
        onOpenChange={setCreateOpen}
        housingTypes={housingTypes}
        mode="create"
        onSuccess={(newUnit) => {
          setUnits((prev) => [...prev, newUnit]);
          setCreateOpen(false);
          onDataChange?.(newUnit);
        }}
      />

      {/* Edit Unit Dialog */}
      <HousingUnitDialog
        key={editTarget ? `edit-${editTarget.id}` : 'edit-none'}
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        housingTypes={housingTypes}
        mode="edit"
        existing={editTarget ?? undefined}
        onSuccess={(updated) => {
          setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
          setEditTarget(null);
          onDataChange?.(updated);
        }}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Housing Unit</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-foreground">&quot;{deleteTarget?.name}&quot;</span>?
              This action cannot be undone. Occupied units cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <DialogClose render={<Button variant="outline" disabled={isPendingDelete} />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPendingDelete}
              className="min-w-[100px]"
            >
              {isPendingDelete ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
