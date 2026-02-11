'use client';

import { cn } from '@/lib/utils';
import { TASK_STATUSES } from '@/lib/constants';
import type { TaskStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: TaskStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = TASK_STATUSES.find((s) => s.value === status);

  if (!statusConfig) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
        {status}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusConfig.color
      )}
    >
      {statusConfig.label}
    </span>
  );
}
