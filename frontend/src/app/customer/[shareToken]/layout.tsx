'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { POC } from '@/lib/types';

const navTabs = [
  { segment: '', label: 'Overview' },
  { segment: '/value-framework', label: 'Value Framework' },
  { segment: '/action-plan', label: 'Action Plan' },
  { segment: '/phases', label: 'Phases' },
  { segment: '/success-criteria', label: 'Success Criteria' },
  { segment: '/tech-stack', label: 'Tech Stack' },
];

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams<{ shareToken: string }>();
  const shareToken = params.shareToken;
  const basePath = `/customer/${shareToken}`;

  const { data: poc } = useQuery<POC>({
    queryKey: ['customer-poc', shareToken],
    queryFn: () => api.get<POC>(`/customer/${shareToken}`),
    enabled: !!shareToken,
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Brand + Account */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  Sentry
                </span>
                <span className="text-sm text-slate-400">|</span>
                <span className="text-sm font-medium text-slate-600">
                  POC Portal
                </span>
              </div>
              {poc?.account_name && (
                <>
                  <div className="h-5 w-px bg-slate-200" />
                  <span className="text-sm font-medium text-slate-900">
                    {poc.account_name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {navTabs.map((tab) => {
              const href = `${basePath}${tab.segment}`;
              const isActive =
                tab.segment === ''
                  ? pathname === basePath
                  : pathname.startsWith(href);

              return (
                <Link
                  key={tab.segment}
                  href={href}
                  className={cn(
                    'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-violet-600 text-violet-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
