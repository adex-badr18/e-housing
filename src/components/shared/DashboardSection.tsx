import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface DashboardSectionProps {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
}

/**
 * DashboardSection — a lightweight section wrapper for dashboard panels.
 * Renders a heading row with an optional "View all" link, then a child slot.
 */
export function DashboardSection({
  title,
  description,
  href,
  hrefLabel = 'View all',
  children,
}: DashboardSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-base font-semibold text-oau-navy leading-tight">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-xs font-medium text-oau-navy/70 hover:text-oau-navy transition-colors"
          >
            {hrefLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
