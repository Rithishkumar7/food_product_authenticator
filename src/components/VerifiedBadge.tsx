import { CheckCircle, Shield, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  isAdminVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function VerifiedBadge({ isAdminVerified, size = 'md', showLabel = true }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2'
  };

  const iconSize = {
    sm: 14,
    md: 18,
    lg: 22
  };

  if (!isAdminVerified) {
    return (
      <div className={cn(
        "inline-flex items-center text-muted-foreground",
        sizeClasses[size]
      )}>
        <Shield size={iconSize[size]} />
        {showLabel && <span>System Verified</span>}
      </div>
    );
  }

  return (
    <div className={cn(
      "inline-flex items-center text-verified font-medium",
      sizeClasses[size]
    )}>
      <ShieldCheck size={iconSize[size]} className="fill-verified/20" />
      {showLabel && <span>Admin Verified</span>}
    </div>
  );
}
