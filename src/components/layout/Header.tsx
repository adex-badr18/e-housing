import { LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, signOut } from '@/lib/auth';

export async function Header() {
  const session = await auth();

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6">
      <div className="flex-1" />
      
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">{session?.user?.name}</p>
          <p className="text-xs text-muted-foreground">{session?.user?.role?.replace('_', ' ')}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
          <UserIcon className="h-4 w-4" />
        </div>
        <form action={async () => {
          "use server";
          await signOut();
        }}>
          <Button variant="ghost" size="icon" type="submit" title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
