'use client';

import { useState } from 'react';
import { HousingTypesTable } from './HousingTypesTable';
import { HousingUnitsTable } from './HousingUnitsTable';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { HousingType, HousingUnit } from '@/lib/mock-api/db';
import { Home, Building2, LayoutGrid } from 'lucide-react';

interface HousingManagementClientProps {
  housingTypes: HousingType[];
  housingUnits: HousingUnit[];
}

type Tab = 'types' | 'units';

const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'types', label: 'Housing Types', icon: Home },
  { id: 'units', label: 'Housing Units', icon: Building2 },
];

export function HousingManagementClient({
  housingTypes,
  housingUnits,
}: HousingManagementClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('types');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <LayoutGrid className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Housing Configuration & Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage housing types (categories, amenities, allocation points) and the physical unit inventory.
          </p>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Types',
            value: housingTypes.length,
            sub: `${housingTypes.filter((t) => t.isActive).length} active`,
            color: 'text-primary',
            bg: 'bg-primary/5 border-primary/20',
          },
          {
            label: 'Total Units',
            value: housingUnits.length,
            sub: 'in inventory',
            color: 'text-foreground',
            bg: 'bg-muted border-border',
          },
          {
            label: 'Vacant',
            value: housingUnits.filter((u) => u.status === 'VACANT').length,
            sub: 'available now',
            color: 'text-emerald-700',
            bg: 'bg-emerald-50 border-emerald-200',
          },
          {
            label: 'Occupied',
            value: housingUnits.filter((u) => u.status === 'OCCUPIED').length,
            sub: 'currently in use',
            color: 'text-blue-700',
            bg: 'bg-blue-50 border-blue-200',
          },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <Separator />

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit border border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === id
                ? 'bg-background text-primary shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <Icon className={cn('h-4 w-4', activeTab === id ? 'text-primary' : '')} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'types' && (
          <HousingTypesTable initialData={housingTypes} />
        )}
        {activeTab === 'units' && (
          <HousingUnitsTable
            initialUnits={housingUnits}
            housingTypes={housingTypes}
          />
        )}
      </div>
    </div>
  );
}
