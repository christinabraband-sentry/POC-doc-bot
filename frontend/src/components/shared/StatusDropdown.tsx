'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TASK_STATUSES } from '@/lib/constants';
import type { TaskStatus } from '@/lib/types';

interface StatusDropdownProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
}

export function StatusDropdown({
  value,
  onChange,
  disabled = false,
}: StatusDropdownProps) {
  const currentStatus = TASK_STATUSES.find((s) => s.value === value);

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as TaskStatus)}
      disabled={disabled}
    >
      <SelectTrigger
        className="h-8 w-[140px] text-xs"
        aria-label="Change status"
      >
        <SelectValue>
          {currentStatus && (
            <span className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  value === 'not_started'
                    ? 'bg-gray-400'
                    : value === 'in_progress'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
              />
              {currentStatus.label}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {TASK_STATUSES.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            <span className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  status.value === 'not_started'
                    ? 'bg-gray-400'
                    : status.value === 'in_progress'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
              />
              {status.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
