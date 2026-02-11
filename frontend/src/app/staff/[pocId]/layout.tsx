'use client';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { usePoc } from '@/hooks/usePoc';
import { POC_STATUSES } from '@/lib/constants';
import type { PocStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const TABS = [
  { label: 'Overview', href: '' },
  { label: 'Value Framework', href: '/value-framework' },
  { label: 'Mutual Action Plan', href: '/mutual-action-plan' },
  { label: 'POC Phases', href: '/phases' },
  { label: 'Success Criteria', href: '/success-criteria' },
  { label: 'Team', href: '/team' },
  { label: 'Gong Calls', href: '/gong' },
  { label: 'Settings', href: '/settings' },
] as const;

function getStatusConfig(status: PocStatus) {
  return POC_STATUSES.find((s) => s.value === status) ?? POC_STATUSES[0];
}

export default function PocDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ pocId: string }>();
  const pathname = usePathname();
  const pocId = params.pocId;
  const { data: poc, isLoading, error } = usePoc(pocId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !poc) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-destructive">
          Failed to load POC. It may not exist or you may not have access.
        </p>
        <Link
          href="/staff"
          className="text-sm text-primary hover:underline mt-2 inline-block"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(poc.status);
  const basePath = `/staff/${pocId}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/staff"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="size-4" />
        All POCs
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {poc.account_name}
        </h1>
        <Badge variant="secondary" className={statusConfig.color}>
          {statusConfig.label}
        </Badge>
      </div>

      {/* Tab Navigation */}
      <div className="border-b mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <nav className="flex gap-0 overflow-x-auto" aria-label="POC sections">
          {TABS.map((tab) => {
            const tabPath = `${basePath}${tab.href}`;
            const isActive =
              tab.href === ''
                ? pathname === basePath
                : pathname.startsWith(tabPath);

            return (
              <Link
                key={tab.href}
                href={tabPath}
                className={`relative shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
