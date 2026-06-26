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
import { CategoryBadge, ActiveBadge } from '@/components/shared/StatusBadge';
import { HousingTypeDialog } from './HousingTypeDialog';
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
  ChevronDown,
  Home,
} from 'lucide-react';

type SortField = 'name' | 'category' | 'allocationPoints' | 'annualRent';
type SortDir = 'asc' | 'desc';

interface HousingTypesTableProps {
  initialData: HousingType[];
  onDataChange?: () => void;
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
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SENIOR' | 'JUNIOR'>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HousingType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HousingType | null>(null);
  const [isPendingDelete, startDeleteTransition] = useTransition();

  // Refresh local data after mutation
  const refresh = async () => {
    // Optimistically pull fresh data from server — page will revalidate
    onDataChange?.();
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
        const matchSearch =
          !q || ht.name.toLowerCase().includes(q) || ht.category.toLowerCase().includes(q);
        const matchCategory = categoryFilter === 'ALL' || ht.category === categoryFilter;
        const matchActive =
          activeFilter === 'ALL' ||
          (activeFilter === 'ACTIVE' && ht.isActive) ||
          (activeFilter === 'INACTIVE' && !ht.isActive);
        return matchSearch && matchCategory && matchActive;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
        else if (sortField === 'allocationPoints') cmp = a.allocationPoints - b.allocationPoints;
        else if (sortField === 'annualRent') cmp = a.annualRent - b.annualRent;
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [data, searchQuery, categoryFilter, activeFilter, sortField, sortDir]);

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
          value={categoryFilter}
          onValueChange={(v) => v != null && setCategoryFilter(v as typeof categoryFilter)}
        >
          <SelectTrigger id="ht-cat-filter" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            <SelectItem value="SENIOR">Senior</SelectItem>
            <SelectItem value="JUNIOR">Junior</SelectItem>
          </SelectContent>
        </Select>

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
          id="ht-create-btn"
          onClick={() => setCreateOpen(true)}
          className="ml-auto gap-2"
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
              <TableHead className="w-[30%]">{colHeader('name', 'Name')}</TableHead>
              <TableHead>{colHeader('category', 'Category')}</TableHead>
              <TableHead>Building</TableHead>
              <TableHead>Rooms</TableHead>
              <TableHead>{colHeader('allocationPoints', 'Points')}</TableHead>
              <TableHead>{colHeader('annualRent', 'Annual Rent')}</TableHead>
              <TableHead>BQ</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
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
              filtered.map((ht) => (
                <TableRow
                  key={ht.id}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  <TableCell className="font-medium">{ht.name}</TableCell>
                  <TableCell>
                    <CategoryBadge category={ht.category} />
                  </TableCell>
                  <TableCell className="capitalize text-sm text-muted-foreground">
                    {ht.buildingType.charAt(0) + ht.buildingType.slice(1).toLowerCase()}
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
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                        {ht.numberOfBQ} BQ{ht.numberOfBQ !== 1 ? 's' : ''}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ActiveBadge isActive={ht.isActive} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

      {/* Create Dialog */}
      <HousingTypeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSuccess={() => {
          // Re-fetch would happen here; for now update optimistically from server component revalidation
          refresh();
        }}
      />

      {/* Edit Dialog */}
      <HousingTypeDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        mode="edit"
        existing={editTarget ?? undefined}
        onSuccess={() => {
          if (editTarget) {
            setEditTarget(null);
            refresh();
          }
        }}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Housing Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>?
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
