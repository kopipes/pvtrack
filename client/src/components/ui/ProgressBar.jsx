import { cn } from '../../lib/utils';

export function ProgressBar({ value = 0, className, showLabel = false, size = 'md' }) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };

  const getColor = (v) => {
    if (v >= 100) return 'bg-emerald-500';
    if (v >= 75) return 'bg-blue-500';
    if (v >= 50) return 'bg-indigo-500';
    if (v >= 25) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 overflow-hidden rounded-full bg-muted', heights[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', getColor(clampedValue))}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground w-9 text-right">
          {clampedValue}%
        </span>
      )}
    </div>
  );
}
