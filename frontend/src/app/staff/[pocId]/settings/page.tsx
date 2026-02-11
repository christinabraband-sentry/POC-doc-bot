'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Save,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  Link as LinkIcon,
  Archive,
} from 'lucide-react';
import { usePoc, useUpdatePoc, useDeletePoc } from '@/hooks/usePoc';
import { POC_STATUSES } from '@/lib/constants';
import type { PocStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SettingsPage() {
  const params = useParams<{ pocId: string }>();
  const router = useRouter();
  const pocId = params.pocId;

  const { data: poc, isLoading } = usePoc(pocId);
  const updatePoc = useUpdatePoc(pocId);
  const deletePoc = useDeletePoc();

  const [accountName, setAccountName] = useState('');
  const [accountDomain, setAccountDomain] = useState('');
  const [opportunityName, setOpportunityName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<PocStatus>('draft');
  const [initialized, setInitialized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Initialize form from POC data
  if (poc && !initialized) {
    setAccountName(poc.account_name);
    setAccountDomain(poc.account_domain ?? '');
    setOpportunityName(poc.opportunity_name ?? '');
    setStartDate(poc.poc_start_date ?? '');
    setEndDate(poc.poc_end_date ?? '');
    setStatus(poc.status);
    setInitialized(true);
  }

  const customerPortalUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/portal/${poc?.share_token ?? ''}`
      : '';

  const handleSave = async () => {
    try {
      await updatePoc.mutateAsync({
        account_name: accountName.trim(),
        account_domain: accountDomain.trim() || undefined,
        opportunity_name: opportunityName.trim() || undefined,
        poc_start_date: startDate || null,
        poc_end_date: endDate || null,
        status,
      });
    } catch {
      // Handled by react-query
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(customerPortalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const handleArchive = async () => {
    try {
      await updatePoc.mutateAsync({ status: 'archived' });
      router.push('/staff');
    } catch {
      // Handled by react-query
    }
  };

  if (isLoading || !poc) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage POC configuration and sharing settings.
        </p>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>POC Information</CardTitle>
          <CardDescription>
            Update the basic information for this POC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-name">Account Name</Label>
              <Input
                id="settings-name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-domain">Account Domain</Label>
              <Input
                id="settings-domain"
                value={accountDomain}
                onChange={(e) => setAccountDomain(e.target.value)}
                placeholder="acme.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-opp">Opportunity Name</Label>
            <Input
              id="settings-opp"
              value={opportunityName}
              onChange={(e) => setOpportunityName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dates & Status */}
      <Card>
        <CardHeader>
          <CardTitle>Dates &amp; Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="settings-start">Start Date</Label>
              <Input
                id="settings-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-end">End Date</Label>
              <Input
                id="settings-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as PocStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POC_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!accountName.trim() || updatePoc.isPending}
        >
          {updatePoc.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Changes
        </Button>
      </div>

      {updatePoc.isSuccess && (
        <p className="text-sm text-green-600 text-right">Changes saved.</p>
      )}
      {updatePoc.isError && (
        <p className="text-sm text-destructive text-right">
          Failed to save. Please try again.
        </p>
      )}

      <Separator />

      {/* Share Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="size-5" />
            Customer Portal Link
          </CardTitle>
          <CardDescription>
            Share this link with your customer to give them access to their POC
            portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              readOnly
              value={customerPortalUrl}
              className="font-mono text-sm"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button variant="outline" onClick={handleCopyLink} className="shrink-0">
              {copied ? (
                <>
                  <Check className="size-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Token: {poc.share_token}
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="size-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showArchiveConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Archive this POC</p>
                <p className="text-xs text-muted-foreground">
                  Archived POCs will be hidden from the dashboard and the
                  customer portal link will be disabled.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowArchiveConfirm(true)}
              >
                <Archive className="size-4" />
                Archive POC
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <p className="text-sm font-medium">
                Are you sure you want to archive this POC?
              </p>
              <p className="text-xs text-muted-foreground">
                This will hide the POC from the dashboard and disable the
                customer portal link. You can restore it later from the archives.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowArchiveConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleArchive}
                  disabled={updatePoc.isPending}
                >
                  {updatePoc.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Yes, Archive
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
