'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Search,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileAudio,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  useGongCalls,
  useSearchGongCalls,
  useFetchTranscript,
  useToggleCallSelection,
} from '@/hooks/useGong';
import {
  useAiAnalyses,
  useTriggerAnalysis,
  useApplyAnalysis,
} from '@/hooks/useAiAnalysis';
import { usePoc } from '@/hooks/usePoc';
import { VALUE_FRAMEWORK_FIELDS } from '@/lib/constants';
import type { GongCall, AIAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// ---- Search Panel ----
function GongSearchPanel({
  pocId,
  defaultDomain,
}: {
  pocId: string;
  defaultDomain: string;
}) {
  const [domain, setDomain] = useState(defaultDomain);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const searchCalls = useSearchGongCalls(pocId);

  const handleSearch = () => {
    if (!domain.trim()) return;
    searchCalls.mutate({
      account_domain: domain.trim(),
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="size-5" />
          Search Gong Calls
        </CardTitle>
        <CardDescription>
          Search for recorded calls associated with this account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="gong-domain">Account Domain</Label>
            <Input
              id="gong-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="acme.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gong-from">From Date</Label>
            <Input
              id="gong-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gong-to">To Date</Label>
            <Input
              id="gong-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button
            onClick={handleSearch}
            disabled={!domain.trim() || searchCalls.isPending}
          >
            {searchCalls.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Search Gong
          </Button>
          {searchCalls.isError && (
            <p className="text-sm text-destructive">
              Search failed. Please try again.
            </p>
          )}
          {searchCalls.isSuccess && (
            <p className="text-sm text-muted-foreground">
              Found {searchCalls.data?.length ?? 0} calls.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Call Card ----
function CallCard({
  call,
  pocId,
}: {
  call: GongCall;
  pocId: string;
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const fetchTranscript = useFetchTranscript(pocId);
  const toggleSelection = useToggleCallSelection(pocId);

  const duration = call.duration_seconds
    ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
    : 'Unknown';

  const participantCount = call.participant_emails?.length ?? 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <div className="pt-0.5">
            <input
              type="checkbox"
              checked={call.selected_for_analysis}
              onChange={(e) =>
                toggleSelection.mutate({
                  callId: call.id,
                  selected: e.target.checked,
                })
              }
              className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>

          {/* Call info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-sm leading-tight">
                  {call.title || 'Untitled Call'}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                  {call.started_at && (
                    <span>
                      {format(new Date(call.started_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  )}
                  <span>{duration}</span>
                  <span>
                    {participantCount} participant{participantCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {call.transcript_text ? (
                  <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800">
                    Transcript Ready
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => fetchTranscript.mutate(call.id)}
                    disabled={fetchTranscript.isPending}
                  >
                    {fetchTranscript.isPending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <FileAudio className="size-3" />
                    )}
                    Fetch Transcript
                  </Button>
                )}
              </div>
            </div>

            {/* Transcript viewer toggle */}
            {call.transcript_text && (
              <div className="mt-2">
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {showTranscript ? (
                    <ChevronDown className="size-3" />
                  ) : (
                    <ChevronRight className="size-3" />
                  )}
                  {showTranscript ? 'Hide' : 'Show'} Transcript
                </button>
                {showTranscript && (
                  <div className="mt-2 max-h-64 overflow-y-auto rounded-md border bg-muted/50 p-3 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                    {call.transcript_text}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Analysis Status Badge ----
function AnalysisStatusBadge({ status }: { status: AIAnalysis['status'] }) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 gap-1">
          <Clock className="size-3" />
          Pending
        </Badge>
      );
    case 'processing':
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 gap-1">
          <Loader2 className="size-3 animate-spin" />
          Processing
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 gap-1">
          <CheckCircle2 className="size-3" />
          Completed
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 gap-1">
          <XCircle className="size-3" />
          Failed
        </Badge>
      );
  }
}

// ---- Analysis Result Card ----
function AnalysisResultCard({
  analysis,
  pocId,
  isLatest,
}: {
  analysis: AIAnalysis;
  pocId: string;
  isLatest: boolean;
}) {
  const [expanded, setExpanded] = useState(isLatest);
  const applyAnalysis = useApplyAnalysis(pocId);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-sm">
                Analysis{' '}
                {analysis.created_at &&
                  format(new Date(analysis.created_at), 'MMM d, yyyy h:mm a')}
              </CardTitle>
              <CardDescription className="text-xs">
                {analysis.input_call_ids.length} call
                {analysis.input_call_ids.length !== 1 ? 's' : ''} analyzed
                {analysis.model_used && ` with ${analysis.model_used}`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AnalysisStatusBadge status={analysis.status} />
          </div>
        </div>
      </CardHeader>

      {expanded && analysis.status === 'completed' && analysis.extracted_data && (
        <CardContent className="space-y-4">
          {/* Confidence */}
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-purple-600" />
            <span className="text-sm font-medium">
              Confidence Score:{' '}
              {Math.round(analysis.extracted_data.confidence_score * 100)}%
            </span>
          </div>

          {/* Extracted fields */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {VALUE_FRAMEWORK_FIELDS.map((field) => {
              const value =
                analysis.extracted_data?.[
                  field.key as keyof typeof analysis.extracted_data
                ];
              const evidence =
                analysis.extracted_data?.evidence?.[field.key];

              if (typeof value !== 'string') return null;

              return (
                <div
                  key={field.key}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {field.label}
                  </h5>
                  <p className="text-sm">{value}</p>
                  {evidence && evidence.length > 0 && (
                    <div className="pt-1 border-t">
                      <p className="text-[10px] font-medium text-muted-foreground mb-1">
                        Evidence:
                      </p>
                      <ul className="space-y-1">
                        {evidence.slice(0, 2).map((e, i) => (
                          <li
                            key={i}
                            className="text-[11px] text-muted-foreground italic leading-snug"
                          >
                            &ldquo;{e}&rdquo;
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Apply button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                applyAnalysis.mutate(analysis.id);
              }}
              disabled={applyAnalysis.isPending}
            >
              {applyAnalysis.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              Apply to Value Framework
            </Button>
          </div>
        </CardContent>
      )}

      {expanded && analysis.status === 'failed' && (
        <CardContent>
          <p className="text-sm text-destructive">
            {analysis.error_message || 'Analysis failed. Please try again.'}
          </p>
        </CardContent>
      )}

      {expanded &&
        (analysis.status === 'pending' || analysis.status === 'processing') && (
          <CardContent>
            <div className="flex items-center gap-3 py-4 justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Analysis is {analysis.status}. This may take a minute...
              </p>
            </div>
          </CardContent>
        )}
    </Card>
  );
}

// ---- Main Page ----
export default function GongPage() {
  const params = useParams<{ pocId: string }>();
  const pocId = params.pocId;

  const { data: poc } = usePoc(pocId);
  const { data: calls, isLoading: callsLoading } = useGongCalls(pocId);
  const { data: analyses, isLoading: analysesLoading } = useAiAnalyses(pocId);
  const triggerAnalysis = useTriggerAnalysis(pocId);

  const selectedCount = useMemo(
    () => calls?.filter((c) => c.selected_for_analysis).length ?? 0,
    [calls]
  );

  const sortedAnalyses = useMemo(
    () =>
      analyses
        ? [...analyses].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        : [],
    [analyses]
  );

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <GongSearchPanel
        pocId={pocId}
        defaultDomain={poc?.account_domain ?? ''}
      />

      {/* Calls List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Call Results</h3>
            <p className="text-sm text-muted-foreground">
              {calls?.length ?? 0} calls found. Select calls for AI analysis.
            </p>
          </div>
          {selectedCount > 0 && (
            <Badge variant="secondary">
              {selectedCount} selected
            </Badge>
          )}
        </div>

        {callsLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-16" />
              </Card>
            ))}
          </div>
        )}

        {!callsLoading && (!calls || calls.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <FileAudio className="size-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No Gong calls found yet. Use the search above to find calls for
                this account.
              </p>
            </CardContent>
          </Card>
        )}

        {calls && calls.length > 0 && (
          <div className="space-y-3">
            {calls.map((call) => (
              <CallCard key={call.id} call={call} pocId={pocId} />
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* AI Analysis Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="size-5" />
              AI Analysis
            </h3>
            <p className="text-sm text-muted-foreground">
              Analyze selected calls to extract value framework insights.
            </p>
          </div>
          <Button
            onClick={() => triggerAnalysis.mutate()}
            disabled={selectedCount === 0 || triggerAnalysis.isPending}
          >
            {triggerAnalysis.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Analyze Selected Calls
            {selectedCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedCount}
              </Badge>
            )}
          </Button>
        </div>

        {triggerAnalysis.isError && (
          <p className="text-sm text-destructive">
            Failed to trigger analysis. Please try again.
          </p>
        )}

        {analysesLoading && (
          <Card className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        )}

        {sortedAnalyses.length === 0 && !analysesLoading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="size-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No analyses yet. Select calls above and click &ldquo;Analyze
                Selected Calls&rdquo; to get AI-generated insights.
              </p>
            </CardContent>
          </Card>
        )}

        {sortedAnalyses.length > 0 && (
          <div className="space-y-4">
            {sortedAnalyses.map((analysis, index) => (
              <AnalysisResultCard
                key={analysis.id}
                analysis={analysis}
                pocId={pocId}
                isLatest={index === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
