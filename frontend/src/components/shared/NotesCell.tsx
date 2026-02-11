'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface NotesCellProps {
  value: string | null;
  onChange: (notes: string) => void;
  disabled?: boolean;
}

export function NotesCell({
  value,
  onChange,
  disabled = false,
}: NotesCellProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isExpanded]);

  const handleSave = useCallback(() => {
    setIsExpanded(false);
    const trimmed = localValue.trim();
    if (trimmed !== (value ?? '')) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(trimmed);
      }, 300);
    }
  }, [localValue, value, onChange]);

  const truncated =
    value && value.length > 80 ? value.slice(0, 80) + '...' : value;

  if (disabled) {
    return (
      <span className="text-sm text-slate-600">
        {value || <span className="text-slate-300">No notes</span>}
      </span>
    );
  }

  if (isExpanded) {
    return (
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setLocalValue(value ?? '');
              setIsExpanded(false);
            }
          }}
          placeholder="Add notes..."
          className="min-h-[80px] text-sm"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsExpanded(true)}
      className={cn(
        'flex items-start gap-1.5 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-slate-50',
        !value && 'text-slate-400'
      )}
    >
      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span className="line-clamp-2">{truncated || 'Add notes...'}</span>
    </button>
  );
}
