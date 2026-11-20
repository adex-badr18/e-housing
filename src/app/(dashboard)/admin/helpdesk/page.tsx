import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPaginatedIncidentTickets } from '@/lib/mock-api/endpoints/audit';
import { HelpdeskTicketsTableClient } from '@/components/features/audit/HelpdeskTicketsTableClient';
import {
  MessageSquareDot, AlertCircle, Clock, CheckCircle2,
} from 'lucide-react';

export const metadata = { title: 'Helpdesk & Complaints — OAU E-Housing' };

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function HelpdeskPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const sp = await searchParams;
  const search = sp.search ?? '';
  const status = sp.status ?? 'ALL';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const limit = [10, 20, 50].includes(parseInt(sp.limit ?? '10', 10))
    ? parseInt(sp.limit ?? '10', 10)
    : 10;

  const result = await getPaginatedIncidentTickets({
    search,
    status,
    page,
    limit,
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <MessageSquareDot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-oau-navy">Helpdesk & Complaints</h1>
          <p className="text-base text-muted-foreground mt-1">
            Manage and resolve staff housing complaints and incident reports with server-side search, filtering, and pagination.
          </p>
        </div>
      </div>

      {/* Alert if open tickets */}
      {result.openCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-base">
              {result.openCount} Open Ticket{result.openCount !== 1 ? 's' : ''} Require Attention
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              Staff have reported issues that are yet to be picked up. Please assign and action them promptly.
            </p>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open', value: result.openCount, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'In Progress', value: result.inProgressCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Resolved', value: result.resolvedCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border bg-card p-4 flex items-center gap-3 shadow-xs">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
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

      {/* Tabular Tickets Table */}
      <HelpdeskTicketsTableClient
        initialData={result}
        initialSearch={search}
        initialStatus={status}
        initialPage={page}
        initialLimit={limit}
      />
    </div>
  );
}
