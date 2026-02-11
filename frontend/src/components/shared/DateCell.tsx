'use client';

import { useState, useRef, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DateCellProps {
  value: string | null;
  onChange: (date: string | null) => void;
  disabled?: boolean;
}

export function DateCell({ value, onChange, disabled = false }: DateCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.showPicker?.();
      inputRef.current.focus();
    }
  }, [isEditing]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue || null);
    setIsEditing(false);
  };

  if (disabled) {
    return (
      <span className="text-sm text-slate-600">
        {formatDate(value) || (
          <span className="text-slate-300">No date</span>
        )}
      </span>
    );
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="date"
        defaultValue={value ?? ''}
        onChange={handleChange}
        onBlur={() => setIsEditing(false)}
        className="h-8 w-[160px] text-sm"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-slate-50',
        !value && 'text-slate-400'
      )}
    >
      <Calendar className="h-3.5 w-3.5 text-slate-400" />
      {formatDate(value) || 'Set date'}
    </button>
  );
}
