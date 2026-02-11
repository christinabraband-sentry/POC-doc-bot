'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, FileAudio, Loader2 } from 'lucide-react';
import { useValueFramework, useUpdateValueFramework } from '@/hooks/useValueFramework';
import { VALUE_FRAMEWORK_FIELDS } from '@/lib/constants';
import type { ValueFramework } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ValueFrameworkPage() {
  const params = useParams<{ pocId: string }>();
  const pocId = params.pocId;

  const { data: framework, isLoading, error } = useValueFramework(pocId);
  const updateFramework = useUpdateValueFramework(pocId);

  const [savingField, setSavingField] = useState<string | null>(null);

  const handleBlur = useCallback(
    async (key: string, value: string) => {
      if (!framework) return;

      const currentValue =
        framework[key as keyof ValueFramework] as string | null;
      if (value === (currentValue ?? '')) return;

      setSavingField(key);
      try {
        await updateFramework.mutateAsync({
          [key]: value || null,
        });
      } finally {
        setSavingField(null);
      }
    },
    [framework, updateFramework]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-destructive">Failed to load value framework.</p>
        </CardContent>
      </Card>
    );
  }

  const isEmpty = VALUE_FRAMEWORK_FIELDS.every(
    (field) =>
      !framework?.[field.key as keyof ValueFramework]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Value Framework</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Capture the customer&apos;s challenges, goals, and requirements.
          </p>
        </div>
        {framework?.ai_generated && (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 gap-1.5">
            <Sparkles className="size-3" />
            AI Generated
            {framework.ai_confidence_score != null && (
              <span className="ml-1">
                ({Math.round(framework.ai_confidence_score * 100)}% confidence)
              </span>
            )}
          </Badge>
        )}
      </div>

      {/* Empty state prompt */}
      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <FileAudio className="size-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">No value framework data yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              You can fill in the fields manually below, or go to the{' '}
              <Link
                href={`/staff/${pocId}/gong`}
                className="text-primary hover:underline font-medium"
              >
                Gong Calls tab
              </Link>{' '}
              to analyze transcripts and auto-populate this framework with AI.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Framework Fields */}
      {VALUE_FRAMEWORK_FIELDS.map((field) => {
        const value =
          (framework?.[field.key as keyof ValueFramework] as string | null) ??
          '';

        return (
          <FrameworkField
            key={field.key}
            fieldKey={field.key}
            label={field.label}
            description={field.description}
            defaultValue={value}
            isSaving={savingField === field.key}
            onBlur={handleBlur}
          />
        );
      })}
    </div>
  );
}

function FrameworkField({
  fieldKey,
  label,
  description,
  defaultValue,
  isSaving,
  onBlur,
}: {
  fieldKey: string;
  label: string;
  description: string;
  defaultValue: string;
  isSaving: boolean;
  onBlur: (key: string, value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{label}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {isSaving && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Saving...
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => onBlur(fieldKey, value)}
          placeholder={`Enter ${label.toLowerCase()}...`}
          className="min-h-[120px] resize-y"
        />
      </CardContent>
    </Card>
  );
}
