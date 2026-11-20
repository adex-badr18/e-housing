import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMyIncidentTicketsAction } from '@/app/actions/audit';
import { StaffComplaintForm } from '@/components/features/complaints/StaffComplaintForm';
import { StaffComplaintsTableClient } from '@/components/features/complaints/StaffComplaintsTableClient';
import {
  MessageSquareDot,
  AlertCircle,
  Clock,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const metadata = {
  title: 'My Complaints & Helpdesk — OAU E-Housing',
  description: 'Submit a housing complaint and track the status of your previous requests.',
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function StaffComplaintsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STAFF') redirect('/staff');

  const sp = await searchParams;
  const search = sp.search ?? '';
  const status = sp.status ?? 'ALL';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const limit = [10, 20, 50].includes(parseInt(sp.limit ?? '10', 10))
    ? parseInt(sp.limit ?? '10', 10)
    : 10;

  const result = await getMyIncidentTicketsAction({ search, status, page, limit });

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          <h2 className="text-lg font-semibold">Error Loading Complaints</h2>
          <p className="text-sm mt-1">
            {result.error ?? 'An unexpected error occurred while fetching your complaints.'}
          </p>
        </div>
      </div>
    );
  }

  const data = result.data;

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Page Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <MessageSquareDot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-oau-navy">
            My Complaints & Helpdesk
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            Submit a housing complaint and track the status of your previous requests.
          </p>
        </div>
      </div>

      {/* 2. Blue Informational Alert if Open Complaints exist */}
      {data.myOpenCount > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 text-sm">
              You have {data.myOpenCount} open complaint{data.myOpenCount !== 1 ? 's' : ''} awaiting a response.
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              Our housing management team will review and update the status as action is taken.
            </p>
          </div>
        </div>
      )}

      {/* 3. Quick Stats Cards (3 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'My Open',
            value: data.myOpenCount,
            icon: AlertCircle,
            color: 'text-red-500',
            bg: 'bg-red-50',
          },
          {
            label: 'In Progress',
            value: data.myInProgressCount,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Resolved',
            value: data.myResolvedCount,
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border bg-card p-4 flex items-center gap-3 shadow-xs"
            >
              <div
                className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}
              >
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Form Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-oau-navy">Submit New Complaint</h2>
        <StaffComplaintForm />
      </div>

      {/* 5. Table Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-oau-navy">My Previous Complaints</h2>
        <StaffComplaintsTableClient
          initialData={data}
          initialSearch={search}
          initialStatus={status}
          initialPage={page}
          initialLimit={limit}
        />
      </div>
    </div>
  );
}

