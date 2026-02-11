'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        {label && (
          <span className="text-xs font-medium text-slate-600">{label}</span>
        )}
        <span className="text-xs font-semibold text-slate-900">
          {Math.round(clampedValue)}%
        </span>
      </div>
      <Progress value={clampedValue} className="h-2" />
    </div>
  );
}
