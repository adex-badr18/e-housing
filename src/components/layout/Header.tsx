import { LogOut, User as UserIcon, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, signOut } from '@/lib/auth';

export async function Header() {
  const session = await auth();

  return (
    <header className="h-16 border-b border-gray-100 bg-white shadow-sm flex items-center justify-between px-6 z-10">
      <div className="flex-1">
        {/* Placeholder for future breadcrumbs or title */}
      </div>
      
      <div className="flex items-center gap-5">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-oau-navy/5 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500"></span>
        </Button>
        
        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{session?.user?.name}</p>
            <p className="text-xs text-gray-500 font-medium tracking-wide">{session?.user?.role?.replace('_', ' ')}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-oau-navy/5 border border-oau-navy/10 flex items-center justify-center text-oau-navy">
            <UserIcon className="h-4.5 w-4.5" />
          </div>
        </div>

        <form action={async () => {
          "use server";
          await signOut();
        }}>
          <Button variant="ghost" size="icon" type="submit" title="Logout" className="hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors ml-1">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
