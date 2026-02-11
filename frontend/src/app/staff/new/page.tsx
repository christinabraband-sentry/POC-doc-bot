'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCreatePoc } from '@/hooks/usePoc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function NewPocPage() {
  const router = useRouter();
  const createPoc = useCreatePoc();

  const [accountName, setAccountName] = useState('');
  const [accountDomain, setAccountDomain] = useState('');
  const [opportunityName, setOpportunityName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    try {
      const poc = await createPoc.mutateAsync({
        account_name: accountName.trim(),
        account_domain: accountDomain.trim() || undefined,
        opportunity_name: opportunityName.trim() || undefined,
      });
      router.push(`/staff/${poc.id}`);
    } catch {
      // Error is handled by react-query
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/staff">
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New POC</CardTitle>
          <CardDescription>
            Set up a new proof-of-concept engagement for a customer account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accountName">
                Account Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountName"
                placeholder="e.g. Acme Corporation"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountDomain">Account Domain</Label>
              <Input
                id="accountDomain"
                placeholder="e.g. acme.com"
                value={accountDomain}
                onChange={(e) => setAccountDomain(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used to match Gong calls to this account.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opportunityName">Opportunity Name</Label>
              <Input
                id="opportunityName"
                placeholder="e.g. Acme - Sentry Enterprise"
                value={opportunityName}
                onChange={(e) => setOpportunityName(e.target.value)}
              />
            </div>

            {createPoc.isError && (
              <p className="text-sm text-destructive">
                Failed to create POC. Please try again.
              </p>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" type="button" asChild>
                <Link href="/staff">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={!accountName.trim() || createPoc.isPending}
              >
                {createPoc.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Create POC
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
