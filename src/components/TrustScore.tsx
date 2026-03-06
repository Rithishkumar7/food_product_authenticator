import { cn } from '@/lib/utils';

interface TrustScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function TrustScore({ score, size = 'md', showLabel = true }: TrustScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'trust-high';
    if (score >= 50) return 'trust-medium';
    return 'trust-low';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Trusted';
    if (score >= 50) return 'Caution';
    return 'Risk';
  };

  const getBgColor = (score: number) => {
    if (score >= 80) return 'bg-trust-high';
    if (score >= 50) return 'bg-trust-medium';
    return 'bg-trust-low';
  };

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-20 h-20 text-xl',
    lg: 'w-28 h-28 text-3xl'
  };

  const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 6 : 8;
  const radius = size === 'sm' ? 20 : size === 'md' ? 35 : 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        {/* Background circle */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn("transition-all duration-1000 ease-out", getScoreColor(score))}
          />
        </svg>
        
        {/* Score number */}
        <span className={cn("font-bold z-10", getScoreColor(score))}>
          {score}
        </span>
      </div>
      
      {showLabel && (
        <span className={cn(
          "text-xs font-semibold px-2 py-1 rounded-full text-white",
          getBgColor(score)
        )}>
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}
