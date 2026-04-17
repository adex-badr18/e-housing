"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Role } from '@/lib/mock-api/db';
import { 
  Home, 
  FileText, 
  Settings, 
  LogOut, 
  Building,
  CheckSquare
} from 'lucide-react';

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const navItems = getNavItemsForRole(role);

  return (
    <div className="w-64 border-r bg-background flex flex-col h-full">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">OAU E-Housing</h2>
      </div>
      <div className="flex-1 py-4 flex flex-col gap-1 px-3">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={pathname?.startsWith(item.href) ? 'secondary' : 'ghost'}
              className={cn("w-full justify-start", pathname?.startsWith(item.href) && "font-semibold")}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}

function getNavItemsForRole(role: Role) {
  if (role === 'STAFF') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/applications', label: 'My Applications', icon: FileText },
      { href: '/housing', label: 'My Housing', icon: Building },
    ];
  }
  
  // Management Roles
  return [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/admin/applications', label: 'All Applications', icon: FileText },
    { href: '/admin/inventory', label: 'Housing Config & Inventory', icon: Building },
    { href: '/admin/inspections', label: 'Inspections', icon: CheckSquare },
  ];
}
