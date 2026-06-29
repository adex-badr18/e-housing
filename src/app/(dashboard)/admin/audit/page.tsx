import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllAuditLogs } from '@/lib/mock-api/endpoints/audit';
import { mockDB } from '@/lib/mock-api/db';
import { AuditLogTable } from '@/components/features/audit/AuditLogTable';
import { ViolationTracker } from '@/components/features/audit/ViolationTracker';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Activity,
} from 'lucide-react';

export const metadata = { title: 'Audit Logs — OAU E-Housing' };

export default async function AuditLogsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const logs = await getAllAuditLogs();
  const users = mockDB.users;

  const failureCount = logs.filter(l => l.status === 'FAILURE').length;
  const successCount = logs.filter(l => l.status === 'SUCCESS').length;
  const uniqueActors = new Set(logs.map(l => l.actorId)).size;

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-oau-navy">System Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read-only log of all security-relevant and system actions. Super Admin access only.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: logs.length, icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Successful', value: successCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Failed', value: failureCount, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Unique Actors', value: uniqueActors, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
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

      {/* Violation Tracker */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h2 className="font-semibold">Violation Tracker</h2>
          {failureCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
              {failureCount}
            </span>
          )}
        </div>
        <ViolationTracker logs={logs} users={users} />
      </div>

      {/* Full Audit Log Table */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">All System Events</h2>
        </div>
        <AuditLogTable logs={logs} users={users} />
      </div>
    </div>
  );
}
