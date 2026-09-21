import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { mockDB } from '@/lib/mock-api/db';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Determine whether the Tenancy Agreement link should be shown
  // It is only visible to STAFF with an application in OFFER_ACCEPTED status
  let showTenancyLink = false;
  if (session.user.role === 'STAFF') {
    const activeApp = mockDB.housingApplications.find(
      a => a.userId === session.user.id && a.status === 'OFFER_ACCEPTED'
    );
    showTenancyLink = !!activeApp;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/30">
      <Sidebar role={session.user.role} showTenancyLink={showTenancyLink} />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
