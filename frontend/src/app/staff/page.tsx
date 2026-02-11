'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus, FolderOpen } from 'lucide-react';
import { usePocs } from '@/hooks/usePoc';
import { POC_STATUSES } from '@/lib/constants';
import type { PocStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
] as const;

function getStatusConfig(status: PocStatus) {
  return POC_STATUSES.find((s) => s.value === status) ?? POC_STATUSES[0];
}

export default function StaffDashboardPage() {
  const [filter, setFilter] = useState<string>('all');
  const { data: pocs, isLoading, error } = usePocs(filter === 'all' ? undefined : filter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">POC Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your proof-of-concept engagements
          </p>
        </div>
        <Button asChild>
          <Link href="/staff/new">
            <Plus className="size-4" />
            New POC
          </Link>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 rounded-lg bg-muted p-1 w-fit">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="space-y-4">
                <div className="h-5 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="h-2 w-full rounded bg-muted" />
                <div className="h-4 w-1/3 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent>
            <p className="text-destructive">
              Failed to load POCs. Please try again later.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && pocs && pocs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No POCs yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first POC to get started.
            </p>
            <Button asChild>
              <Link href="/staff/new">
                <Plus className="size-4" />
                New POC
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* POC Grid */}
      {!isLoading && pocs && pocs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pocs.map((poc) => {
            const statusConfig = getStatusConfig(poc.status);
            return (
              <Link key={poc.id} href={`/staff/${poc.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                  <CardContent className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-lg leading-tight truncate">
                        {poc.account_name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={statusConfig.color}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {poc.account_domain && (
                      <p className="text-sm text-muted-foreground truncate">
                        {poc.account_domain}
                      </p>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {poc.progress.completion_pct}%
                        </span>
                      </div>
                      <Progress value={poc.progress.completion_pct} />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Created {format(new Date(poc.created_at), 'MMM d, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
