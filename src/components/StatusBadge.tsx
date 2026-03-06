import { cn } from '@/lib/utils';
import { ProductStatus } from '@/types/product';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: ProductStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = {
    genuine: {
      label: 'Genuine',
      icon: CheckCircle,
      className: 'bg-success/10 text-success border-success/20'
    },
    suspicious: {
      label: 'Suspicious',
      icon: AlertTriangle,
      className: 'bg-warning/10 text-warning border-warning/20'
    },
    fake: {
      label: 'Fake',
      icon: XCircle,
      className: 'bg-danger/10 text-danger border-danger/20'
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-muted text-muted-foreground border-muted'
    }
  };

  const { label, icon: Icon, className } = config[status];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2'
  };

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <span className={cn(
      "inline-flex items-center font-medium rounded-full border",
      className,
      sizeClasses[size]
    )}>
      <Icon size={iconSize[size]} />
      {label}
    </span>
  );
}
