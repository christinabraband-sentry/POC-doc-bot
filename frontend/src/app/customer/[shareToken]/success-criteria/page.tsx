'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ClipboardCheck } from 'lucide-react';
import {
  useCustomerSuccessCriteria,
  useCustomerUpdateCriterion,
} from '@/hooks/useCustomerPortal';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { NotesCell } from '@/components/shared/NotesCell';

/* ------------------------------------------------------------------ */
/*  Editable text cell (for Current State)                             */
/* ------------------------------------------------------------------ */

function EditableTextCell({
  value,
  onChange,
  placeholder,
}: {
  value: string | null;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    const trimmed = localValue.trim();
    if (trimmed !== (value ?? '')) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(trimmed);
      }, 300);
    }
  }, [localValue, value, onChange]);

  if (isEditing) {
    return (
      <Textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setLocalValue(value ?? '');
            setIsEditing(false);
          }
        }}
        placeholder={placeholder}
        className="min-h-[70px] text-sm"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-slate-50"
    >
      {value ? (
        <span className="text-slate-700 line-clamp-3">{value}</span>
      ) : (
        <span className="text-slate-400">{placeholder}</span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Success Criteria Page                                         */
/* ------------------------------------------------------------------ */

export default function CustomerSuccessCriteriaPage() {
  const params = useParams<{ shareToken: string }>();
  const shareToken = params.shareToken;

  const {
    data: criteria,
    isLoading,
    error,
  } = useCustomerSuccessCriteria(shareToken);
  const updateCriterion = useCustomerUpdateCriterion(shareToken);

  const handleCurrentStateChange = (criterionId: string, val: string) => {
    updateCriterion.mutate({
      criterionId,
      data: { current_state: val },
    });
  };

  const handleNotesChange = (criterionId: string, notes: string) => {
    updateCriterion.mutate({
      criterionId,
      data: { notes },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Success Criteria
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Define what success looks like for each feature area.
          </p>
        </div>
        <Card className="animate-pulse">
          <CardContent className="h-60" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Failed to load success criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Success Criteria
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Define what success looks like for each feature area. You can describe
          your current state and add notes.
        </p>
      </div>

      <Card>
        <CardContent>
          {!criteria || criteria.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="size-8 text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">
                No success criteria have been defined yet. Your Sentry team will
                set these up.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Feature</TableHead>
                    <TableHead className="w-[100px]">Priority</TableHead>
                    <TableHead>Criteria</TableHead>
                    <TableHead className="w-[220px]">Current State</TableHead>
                    <TableHead className="w-[200px]">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criteria.map((criterion) => (
                    <TableRow key={criterion.id}>
                      {/* Feature -- read-only */}
                      <TableCell className="font-medium text-sm text-slate-900 align-top">
                        {criterion.feature}
                      </TableCell>

                      {/* Priority -- read-only badge */}
                      <TableCell className="align-top">
                        <PriorityBadge priority={criterion.priority} />
                      </TableCell>

                      {/* Criteria -- read-only */}
                      <TableCell className="text-sm text-slate-600 align-top">
                        {criterion.criteria || (
                          <span className="text-slate-300">--</span>
                        )}
                      </TableCell>

                      {/* Current State -- EDITABLE */}
                      <TableCell className="align-top">
                        <EditableTextCell
                          value={criterion.current_state}
                          onChange={(val) =>
                            handleCurrentStateChange(criterion.id, val)
                          }
                          placeholder="Describe your current state..."
                        />
                      </TableCell>

                      {/* Notes -- EDITABLE */}
                      <TableCell className="align-top">
                        <NotesCell
                          value={criterion.notes}
                          onChange={(notes) =>
                            handleNotesChange(criterion.id, notes)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
