'use client';

import { useParams } from 'next/navigation';
import { Sparkles, FileText } from 'lucide-react';
import { useCustomerValueFramework } from '@/hooks/useCustomerPortal';
import { VALUE_FRAMEWORK_FIELDS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ValueFramework } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Single value framework field card                                  */
/* ------------------------------------------------------------------ */

function ValueFieldCard({
  label,
  description,
  content,
  aiGenerated,
}: {
  label: string;
  description: string;
  content: string | null;
  aiGenerated: boolean;
}) {
  const hasContent = content && content.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-slate-900">{label}</CardTitle>
        <p className="text-xs text-slate-400">{description}</p>
      </CardHeader>
      <CardContent>
        {hasContent ? (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {content}
            </p>
            {aiGenerated && (
              <div className="flex items-center gap-1.5 text-xs text-violet-500">
                <Sparkles className="size-3.5" />
                <span>Extracted from discovery calls</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 justify-center">
            <FileText className="size-4 text-slate-300" />
            <p className="text-sm text-slate-400">
              Your Sentry team is working on this
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function CustomerValueFrameworkPage() {
  const params = useParams<{ shareToken: string }>();
  const shareToken = params.shareToken;

  const { data: vf, isLoading, error } = useCustomerValueFramework(shareToken);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Value Framework
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Understanding the business value driving this POC.
          </p>
        </div>
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
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Failed to load value framework.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Value Framework
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Understanding the business value driving this POC.
        </p>
      </div>

      {VALUE_FRAMEWORK_FIELDS.map((field) => {
        const content = vf
          ? (vf[field.key as keyof ValueFramework] as string | null)
          : null;

        return (
          <ValueFieldCard
            key={field.key}
            label={field.label}
            description={field.description}
            content={content}
            aiGenerated={vf?.ai_generated ?? false}
          />
        );
      })}
    </div>
  );
}
