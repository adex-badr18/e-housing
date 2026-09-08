import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { StaffOnboardingForm } from './StaffOnboardingForm';

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // If user already completed onboarding, redirect to dashboard
  if (session.user.profileCompleted) {
    const dest = session.user.role === 'STAFF' ? '/staff' : '/dashboard';
    redirect(dest);
  }

  return (
    <div className="min-h-screen bg-[rgba(27,34,50,0.03)] py-10 px-4 flex flex-col items-center">
      {/* Top Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Image
            src="/oaulogo.png"
            alt="OAU Logo"
            width={160}
            height={40}
            className="h-12 w-auto object-contain"
          />
          <div>
            <h1 className="text-xl font-extrabold text-[rgb(27,34,50)]">OAU E-Housing Portal</h1>
            <p className="text-xs text-muted-foreground">Obafemi Awolowo University, Ile-Ife</p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            @oauife.edu.ng Verified
          </span>
        </div>
      </div>

      {/* Form Container */}
      <StaffOnboardingForm
        initialUser={{
          name: session.user.name,
          email: session.user.email,
        }}
      />
    </div>
  );
}
