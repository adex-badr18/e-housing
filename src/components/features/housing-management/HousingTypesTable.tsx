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
import { ActiveBadge } from '@/components/shared/StatusBadge';
import { HousingTypeDialog } from './HousingTypeDialog';
import { HousingTypeDetailDialog } from './HousingTypeDetailDialog';
import { HousingTypeBulkUploadDialog } from './HousingTypeBulkUploadDialog';
import { deleteHousingTypeAction } from '@/app/actions/housing';
import type { HousingType } from '@/lib/mock-api/db';
import {
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Home,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type SortField = 'name' | 'allocationPoints' | 'annualRent';
type SortDir = 'asc' | 'desc';

interface HousingTypesTableProps {
  initialData: HousingType[];
  onDataChange?: (record: HousingType) => void;
}

function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
  return dir === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary" />
    : <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary" />;
}

export function HousingTypesTable({ initialData, onDataChange }: HousingTypesTableProps) {
  const [data, setData] = useState<HousingType[]>(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HousingType | null>(null);
  const [detailTarget, setDetailTarget] = useState<HousingType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HousingType | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // Propagate mutation upstream if needed
  const refresh = (record?: HousingType) => {
    onDataChange?.(record!);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    return data
      .filter((ht) => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || ht.name.toLowerCase().includes(q) || ht.parkingSpace.toLowerCase().includes(q);
        const matchActive =
          activeFilter === 'ALL' ||
          (activeFilter === 'ACTIVE' && ht.isActive) ||
          (activeFilter === 'INACTIVE' && !ht.isActive);
        return matchSearch && matchActive;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortField === 'allocationPoints') cmp = a.allocationPoints - b.allocationPoints;
        else if (sortField === 'annualRent') cmp = a.annualRent - b.annualRent;
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [data, searchQuery, activeFilter, sortField, sortDir]);

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleDelete = () => {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      const result = await deleteHousingTypeAction(deleteTarget.id);
      if (result.success) {
        toast.success(`"${deleteTarget.name}" deleted`);
        setData((prev) => prev.filter((ht) => ht.id !== deleteTarget.id));
        setDeleteTarget(null);
        refresh();
      } else {
        toast.error(result.error ?? 'Failed to delete housing type');
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
      <SortIcon field={field} active={sortField === field} dir={sortDir} />
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="ht-search"
            placeholder="Search housing types…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={activeFilter}
          onValueChange={(v) => v != null && setActiveFilter(v as typeof activeFilter)}
        >
          <SelectTrigger id="ht-active-filter" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Button
          id="ht-bulk-upload-btn"
          variant="outline"
          onClick={() => setBulkOpen(true)}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Bulk
        </Button>

        <Button
          id="ht-create-btn"
          onClick={() => setCreateOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Type
        </Button>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{' '}
        {data.length} housing types
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[28%]">{colHeader('name', 'Name')}</TableHead>
              <TableHead>Building</TableHead>
              <TableHead>Parking</TableHead>
              <TableHead>Rooms</TableHead>
              <TableHead>{colHeader('allocationPoints', 'Points')}</TableHead>
              <TableHead>{colHeader('annualRent', 'Annual Rent')}</TableHead>
              <TableHead>BQ</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Home className="h-8 w-8 opacity-20" />
                    No housing types match your filters.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((ht) => (
                <TableRow
                  key={ht.id}
                  className="hover:bg-muted/20 transition-colors group cursor-pointer"
                  onClick={() => setDetailTarget(ht)}
                >
                  <TableCell className="font-medium">{ht.name}</TableCell>
                  <TableCell className="capitalize text-sm text-muted-foreground">
                    {ht.buildingType.charAt(0) + ht.buildingType.slice(1).toLowerCase()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-medium">
                      {ht.parkingSpace}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="font-medium">{ht.numberOfBedrooms}</span>
                    <span className="text-muted-foreground"> bed / </span>
                    <span className="font-medium">{ht.numberOfBathrooms}</span>
                    <span className="text-muted-foreground"> bath</span>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold">
                      {ht.allocationPoints} pts
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    ₦{ht.annualRent.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {ht.hasBQ ? (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-medium">
                        BQ
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ActiveBadge isActive={ht.isActive} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button
                        id={`ht-edit-${ht.id}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditTarget(ht)}
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        id={`ht-delete-${ht.id}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(ht)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
            <span className="font-semibold text-foreground">{filtered.length}</span> types total
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

      {/* Detail Dialog — row click */}
      <HousingTypeDetailDialog
        open={!!detailTarget}
        onOpenChange={(o) => !o && setDetailTarget(null)}
        housingType={detailTarget}
        onEdit={(ht) => {
          setDetailTarget(null);
          setEditTarget(ht);
        }}
      />

      {/* Create Dialog */}
      <HousingTypeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSuccess={(newType) => {
          setData((prev) => [...prev, newType]);
          setCreateOpen(false);
          refresh(newType);
        }}
      />

      {/* Edit Dialog */}
      <HousingTypeDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        mode="edit"
        existing={editTarget ?? undefined}
        onSuccess={(updated) => {
          setData((prev) => prev.map((ht) => (ht.id === updated.id ? updated : ht)));
          setEditTarget(null);
          refresh(updated);
        }}
      />

      {/* Bulk Upload Dialog */}
      <HousingTypeBulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onSuccess={() => {
          // Trigger a page-level data refresh if onDataChange provided
          refresh();
        }}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Housing Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-foreground">&quot;{deleteTarget?.name}&quot;</span>?
              This action cannot be undone. Housing types with active units cannot be deleted.
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
    </div>
  );
}
