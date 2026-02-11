'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  CalendarDays,
  Globe,
  Briefcase,
  CheckCircle2,
  Target,
  Users,
  Pencil,
  X,
  Loader2,
} from 'lucide-react';
import { usePoc, useUpdatePoc } from '@/hooks/usePoc';
import { useMilestones } from '@/hooks/useMilestones';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

export default function PocOverviewPage() {
  const params = useParams<{ pocId: string }>();
  const pocId = params.pocId;

  const { data: poc, isLoading } = usePoc(pocId);
  const { data: milestones } = useMilestones(pocId);
  const { data: team } = useTeamMembers(pocId);
  const updatePoc = useUpdatePoc(pocId);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editOpportunity, setEditOpportunity] = useState('');

  if (isLoading || !poc) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  const completedMilestones = milestones?.filter(
    (m) => m.status === 'completed'
  ).length ?? 0;
  const totalMilestones = milestones?.length ?? 0;
  const teamSize = (team?.sentry?.length ?? 0) + (team?.customer?.length ?? 0);

  const startEditing = () => {
    setEditName(poc.account_name);
    setEditDomain(poc.account_domain ?? '');
    setEditOpportunity(poc.opportunity_name ?? '');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEdits = async () => {
    try {
      await updatePoc.mutateAsync({
        account_name: editName.trim(),
        account_domain: editDomain.trim() || undefined,
        opportunity_name: editOpportunity.trim() || undefined,
      });
      setIsEditing(false);
    } catch {
      // Handled by react-query
    }
  };

  return (
    <div className="space-y-6">
      {/* POC Details Card */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>POC Details</CardTitle>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="size-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancelEditing}>
                <X className="size-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveEdits}
                disabled={updatePoc.isPending || !editName.trim()}
              >
                {updatePoc.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Domain</Label>
                <Input
                  value={editDomain}
                  onChange={(e) => setEditDomain(e.target.value)}
                  placeholder="e.g. acme.com"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Opportunity Name</Label>
                <Input
                  value={editOpportunity}
                  onChange={(e) => setEditOpportunity(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Briefcase className="size-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Account Name</p>
                  <p className="font-medium">{poc.account_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="size-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Domain</p>
                  <p className="font-medium">
                    {poc.account_domain || 'Not set'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="size-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Opportunity</p>
                  <p className="font-medium">
                    {poc.opportunity_name || 'Not set'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays className="size-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Dates</p>
                  <p className="font-medium">
                    {poc.poc_start_date
                      ? format(new Date(poc.poc_start_date), 'MMM d, yyyy')
                      : 'Start not set'}
                    {' -- '}
                    {poc.poc_end_date
                      ? format(new Date(poc.poc_end_date), 'MMM d, yyyy')
                      : 'End not set'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-semibold">{poc.progress.completion_pct}%</span>
          </div>
          <Progress value={poc.progress.completion_pct} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {poc.progress.completed_tasks} of {poc.progress.total_tasks} tasks
            completed
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <CheckCircle2 className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {completedMilestones}/{totalMilestones}
              </p>
              <p className="text-sm text-muted-foreground">
                Milestones Completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Target className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {poc.progress.completed_tasks}/{poc.progress.total_tasks}
              </p>
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teamSize}</p>
              <p className="text-sm text-muted-foreground">Team Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {poc.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{poc.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
