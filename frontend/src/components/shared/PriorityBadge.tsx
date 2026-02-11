'use client';

import { cn } from '@/lib/utils';
import { PRIORITIES } from '@/lib/constants';
import type { Priority } from '@/lib/types';

interface PriorityBadgeProps {
  priority: Priority | null;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (!priority) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-400">
        --
      </span>
    );
  }

  const config = PRIORITIES.find((p) => p.value === priority);

  if (!config) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
        {priority}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
