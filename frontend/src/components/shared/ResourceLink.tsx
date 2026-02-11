'use client';

import { ExternalLink } from 'lucide-react';

interface ResourceLinkProps {
  url: string | null;
  label: string | null;
}

export function ResourceLink({ url, label }: ResourceLinkProps) {
  if (!url) {
    return (
      <span className="text-sm text-slate-300">--</span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-50 hover:text-violet-700"
    >
      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label || 'View resource'}</span>
    </a>
  );
}
