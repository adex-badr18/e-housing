"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Role } from '@/lib/mock-api/db';
import { 
  Home, 
  FileText, 
  LogOut, 
  Building,
  CheckSquare,
  ShieldCheck,
  KeyRound,
  Scroll,
  DoorOpen,
  MessageSquareDot,
  Activity,
} from 'lucide-react';

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const navItems = getNavItemsForRole(role);

  return (
    <div className="w-64 border-r border-oau-navy/10 bg-oau-navy flex flex-col h-full shadow-xl z-20">
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <Image
          src="/oaulogo.png"
          alt="OAU Logo"
          width={40}
          height={40}
          className="object-contain rounded-sm"
        />
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-oau-cream leading-tight">OAU E-Housing</h2>
          <p className="text-oau-gold text-xs font-medium tracking-wide">Portal Access</p>
        </div>
      </div>
      <div className="flex-1 py-6 flex flex-col gap-2 px-4 overflow-y-auto">
        <p className="px-2 text-xs font-semibold text-oau-cream/40 uppercase tracking-wider mb-2">Menu</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start transition-all duration-200 rounded-lg h-11",
                  isActive 
                    ? "bg-oau-gold/15 text-oau-gold hover:bg-oau-gold/25 hover:text-oau-gold font-semibold" 
                    : "text-oau-cream hover:text-oau-cream hover:bg-white/5 font-medium"
                )}
              >
                <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-oau-gold" : "text-oau-cream")} />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-white/10 flex flex-col gap-3">
        <Dialog>
          <DialogTrigger
            render={
              <button className={cn(
                "w-full flex items-center justify-start gap-3 px-3 rounded-lg h-11 font-medium text-sm",
                "text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all duration-200"
              )} />
            }
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Logout</DialogTitle>
              <DialogDescription>
                Are you sure you want to log out of your session?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/' })}>
                Log Out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <div className="rounded-xl bg-white/5 p-4 flex flex-col items-center text-center">
          <ShieldCheck className="h-6 w-6 text-oau-gold mb-2 opacity-80" />
          <p className="text-xs text-oau-cream leading-relaxed">
            Secure housing management platform
          </p>
        </div>
      </div>
    </div>
  );
}

function getNavItemsForRole(role: Role) {
  if (role === 'STAFF') {
    return [
      { href: '/staff', label: 'Dashboard', icon: Home },
      { href: '/staff/applications', label: 'Apply for Housing', icon: FileText },
      { href: '/staff/housing', label: 'Housing Offer', icon: KeyRound },
      { href: '/staff/tenancy', label: 'Tenancy Agreement', icon: Scroll },
      { href: '/staff/bq', label: 'BQ Management', icon: Building },
      { href: '/staff/profile', label: 'My Profile', icon: DoorOpen },
      { href: '/staff/exit', label: 'Housing Exit', icon: LogOut },
    ];
  }

  if (role === 'SUPER_ADMIN') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/management/applications', label: 'All Applications', icon: FileText },
      { href: '/admin/inventory', label: 'Housing Inventory', icon: Building },
      { href: '/management/exit', label: 'Exit Pipeline', icon: DoorOpen },
      { href: '/admin/audit', label: 'Audit Logs', icon: Activity },
      { href: '/admin/helpdesk', label: 'Helpdesk', icon: MessageSquareDot },
    ];
  }

  if (role === 'HOUSING_SECRETARY') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/management/applications', label: 'Review Queue', icon: CheckSquare },
      { href: '/management/exit', label: 'Exit Pipeline', icon: DoorOpen },
      { href: '/admin/inventory', label: 'Housing Inventory', icon: Building },
    ];
  }

  if (role === 'ESTATE_OFFICER') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/management/applications', label: 'Review Queue', icon: CheckSquare },
      { href: '/management/exit', label: 'Exit Pipeline', icon: DoorOpen },
      { href: '/admin/inventory', label: 'Housing Inventory', icon: Building },
    ];
  }

  if (role === 'ELECTRICAL_OFFICER') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/management/exit', label: 'Exit Pipeline', icon: ShieldCheck },
    ];
  }

  if (role === 'DVC_ADMIN') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/management/applications', label: 'Review Queue', icon: CheckSquare },
    ];
  }

  // Fallback
  return [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/management/applications', label: 'All Applications', icon: FileText },
    { href: '/admin/inventory', label: 'Housing Inventory', icon: Building },
  ];
}
