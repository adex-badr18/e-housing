import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type MetricVariant = 'default' | 'warning' | 'danger' | 'success';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: MetricVariant;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const variantStyles: Record<MetricVariant, { border: string; iconBg: string; iconColor: string }> = {
  default:  { border: 'border-t-oau-gold',    iconBg: 'bg-oau-navy/5',    iconColor: 'text-oau-gold'    },
  warning:  { border: 'border-t-amber-400',   iconBg: 'bg-amber-50',      iconColor: 'text-amber-500'   },
  danger:   { border: 'border-t-red-400',     iconBg: 'bg-red-50',        iconColor: 'text-red-500'     },
  success:  { border: 'border-t-emerald-400', iconBg: 'bg-emerald-50',    iconColor: 'text-emerald-600' },
};

export function MetricCard({ title, value, description, icon: Icon, variant = 'default', trend }: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn('border-t-[3px] shadow-sm hover:shadow-md transition-shadow', styles.border)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-oau-navy">
          {title}
        </CardTitle>
        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', styles.iconBg)}>
          <Icon className={cn('h-4 w-4', styles.iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value} from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
