import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllIncidentTickets } from '@/lib/mock-api/endpoints/audit';
import { mockDB } from '@/lib/mock-api/db';
import { HelpdeskPanel } from '@/components/features/audit/HelpdeskPanel';
import {
  MessageSquareDot, AlertCircle, Clock, CheckCircle2,
} from 'lucide-react';

export const metadata = { title: 'Helpdesk — OAU E-Housing' };

export default async function HelpdeskPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const tickets = await getAllIncidentTickets();
  const users = mockDB.users;

  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <MessageSquareDot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-oau-navy">Helpdesk & Complaints</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and resolve staff housing complaints and incident reports.
          </p>
        </div>
      </div>

      {/* Alert if open tickets */}
      {openCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">
              {openCount} Open Ticket{openCount !== 1 ? 's' : ''} Require Attention
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Staff have reported issues that are yet to be picked up. Please assign and action them promptly.
            </p>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open', value: openCount, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'In Progress', value: inProgressCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Resolved', value: resolvedCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban panel */}
      <div className="rounded-xl border bg-card p-6">
        <HelpdeskPanel tickets={tickets} users={users} />
      </div>
    </div>
  );
}
