'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Circle,
  Code2,
  BookOpen,
  Cpu,
  Layers,
} from 'lucide-react';
import {
  useCustomerTechStack,
  useCustomerDocLinks,
  useCustomerConfirmTechStack,
  useCustomerAddTechStack,
} from '@/hooks/useCustomerPortal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TechStackEntry, DocLink } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TECH_CATEGORIES = [
  { value: 'language', label: 'Language' },
  { value: 'framework', label: 'Framework' },
  { value: 'platform', label: 'Platform' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'other', label: 'Other' },
] as const;

function categoryIcon(category: string) {
  switch (category) {
    case 'language':
      return <Code2 className="size-4" />;
    case 'framework':
      return <Layers className="size-4" />;
    case 'platform':
      return <Cpu className="size-4" />;
    case 'mobile':
      return <Cpu className="size-4" />;
    default:
      return <Code2 className="size-4" />;
  }
}

function categoryLabel(category: string) {
  return (
    TECH_CATEGORIES.find((c) => c.value === category)?.label ?? category
  );
}

/* ------------------------------------------------------------------ */
/*  Add Tech Stack Entry Form                                          */
/* ------------------------------------------------------------------ */

function AddTechStackForm({ shareToken }: { shareToken: string }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const addTech = useCustomerAddTechStack(shareToken);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category) return;

    try {
      await addTech.mutateAsync({
        name: name.trim(),
        category,
      });
      setName('');
      setCategory('');
    } catch {
      // handled by react-query
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="tech-name" className="text-xs text-slate-500">
          Technology Name
        </Label>
        <Input
          id="tech-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. React, Python, AWS..."
          className="h-9"
        />
      </div>
      <div className="w-[160px] space-y-1.5">
        <Label htmlFor="tech-category" className="text-xs text-slate-500">
          Category
        </Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {TECH_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={!name.trim() || !category || addTech.isPending}
        className="h-9 bg-violet-600 hover:bg-violet-700"
      >
        {addTech.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        Add
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Tech Stack Entry Row                                               */
/* ------------------------------------------------------------------ */

function TechStackRow({
  entry,
  shareToken,
}: {
  entry: TechStackEntry;
  shareToken: string;
}) {
  const confirmTech = useCustomerConfirmTechStack(shareToken);

  const handleToggle = () => {
    confirmTech.mutate({
      entryId: entry.id,
      confirmed: !entry.confirmed_by_customer,
    });
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border border-slate-100 bg-white px-4 py-3 transition-colors hover:border-slate-200">
      {/* Confirm toggle */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={confirmTech.isPending}
        className="shrink-0 transition-colors"
        title={
          entry.confirmed_by_customer
            ? 'Click to unconfirm'
            : 'Click to confirm'
        }
      >
        {entry.confirmed_by_customer ? (
          <CheckCircle2 className="size-5 text-green-500" />
        ) : (
          <Circle className="size-5 text-slate-300 hover:text-slate-400" />
        )}
      </button>

      {/* Icon + Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          {categoryIcon(entry.category)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {entry.name}
          </p>
          <p className="text-xs text-slate-400">{categoryLabel(entry.category)}</p>
        </div>
      </div>

      {/* Status badge */}
      {entry.confirmed_by_customer ? (
        <Badge className="bg-green-50 text-green-700 border-green-200 shrink-0">
          Confirmed
        </Badge>
      ) : (
        <Badge
          variant="secondary"
          className="text-slate-500 shrink-0"
        >
          Unconfirmed
        </Badge>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Doc Link Card                                                      */
/* ------------------------------------------------------------------ */

function DocLinkCard({ docLink }: { docLink: DocLink }) {
  return (
    <a
      href={docLink.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-4 transition-all hover:border-violet-200 hover:shadow-sm hover:bg-violet-50/30"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-200">
        <BookOpen className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-900 group-hover:text-violet-700 truncate">
            {docLink.title}
          </p>
          <ExternalLink className="size-3.5 shrink-0 text-slate-400 group-hover:text-violet-500" />
        </div>
        <p className="mt-0.5 text-xs text-slate-400 truncate">{docLink.url}</p>
        {docLink.relevance_note && (
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
            {docLink.relevance_note}
          </p>
        )}
      </div>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/*  Doc Links grouped by technology                                    */
/* ------------------------------------------------------------------ */

function DocLinksSection({
  techStack,
  docLinks,
}: {
  techStack: TechStackEntry[];
  docLinks: DocLink[];
}) {
  // Group doc links by tech_stack_entry_id
  const grouped = new Map<string, { tech: TechStackEntry; links: DocLink[] }>();
  const ungrouped: DocLink[] = [];

  for (const link of docLinks) {
    if (link.tech_stack_entry_id) {
      const existing = grouped.get(link.tech_stack_entry_id);
      if (existing) {
        existing.links.push(link);
      } else {
        const tech = techStack.find((t) => t.id === link.tech_stack_entry_id);
        if (tech) {
          grouped.set(link.tech_stack_entry_id, { tech, links: [link] });
        } else {
          ungrouped.push(link);
        }
      }
    } else {
      ungrouped.push(link);
    }
  }

  const groups = Array.from(grouped.values());

  if (groups.length === 0 && ungrouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
        <BookOpen className="size-8 text-slate-300 mb-3" />
        <p className="text-sm text-slate-500 font-medium">
          Documentation links will be generated after your tech stack is
          confirmed
        </p>
        <p className="mt-1 text-xs text-slate-400 max-w-md">
          Confirm the technologies above, and your Sentry team will provide
          relevant documentation and setup guides.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(({ tech, links }) => (
        <div key={tech.id}>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex size-6 items-center justify-center rounded-md bg-violet-100 text-violet-600">
              {categoryIcon(tech.category)}
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              {tech.name}
            </h4>
            <Badge variant="secondary" className="text-[10px]">
              {links.length} {links.length === 1 ? 'link' : 'links'}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {links
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((link) => (
                <DocLinkCard key={link.id} docLink={link} />
              ))}
          </div>
        </div>
      ))}

      {ungrouped.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">
            Additional Resources
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {ungrouped.map((link) => (
              <DocLinkCard key={link.id} docLink={link} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Tech Stack Page                                               */
/* ------------------------------------------------------------------ */

export default function CustomerTechStackPage() {
  const params = useParams<{ shareToken: string }>();
  const shareToken = params.shareToken;

  const {
    data: techStack,
    isLoading: tsLoading,
    error: tsError,
  } = useCustomerTechStack(shareToken);
  const {
    data: docLinks,
    isLoading: dlLoading,
  } = useCustomerDocLinks(shareToken);

  if (tsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Tech Stack</h2>
          <p className="mt-1 text-sm text-slate-500">
            Confirm your technologies and access Sentry documentation.
          </p>
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-40" />
          </Card>
        ))}
      </div>
    );
  }

  if (tsError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Failed to load tech stack.
          </p>
        </CardContent>
      </Card>
    );
  }

  const confirmedCount =
    techStack?.filter((t) => t.confirmed_by_customer).length ?? 0;
  const totalCount = techStack?.length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Tech Stack</h2>
        <p className="mt-1 text-sm text-slate-500">
          Confirm your technologies and access Sentry documentation tailored to
          your stack.
        </p>
      </div>

      {/* Section 1: Your Tech Stack */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-slate-900">
                Your Tech Stack
              </CardTitle>
              <p className="mt-1 text-xs text-slate-400">
                Add technologies you use and confirm them to generate relevant
                documentation.
              </p>
            </div>
            {totalCount > 0 && (
              <Badge
                variant="secondary"
                className="text-xs"
              >
                {confirmedCount}/{totalCount} confirmed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add form */}
          <AddTechStackForm shareToken={shareToken} />

          <Separator />

          {/* Tech stack list */}
          {!techStack || techStack.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Cpu className="size-8 text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">
                No technologies added yet. Add your first technology above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {techStack.map((entry) => (
                <TechStackRow
                  key={entry.id}
                  entry={entry}
                  shareToken={shareToken}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Sentry Documentation Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-slate-900 flex items-center gap-2">
            <BookOpen className="size-5 text-violet-600" />
            Sentry Documentation Resources
          </CardTitle>
          <p className="text-xs text-slate-400">
            Curated Sentry documentation based on your tech stack. Click any
            link to open in a new tab.
          </p>
        </CardHeader>
        <CardContent>
          {dlLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : (
            <DocLinksSection
              techStack={techStack ?? []}
              docLinks={docLinks ?? []}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
