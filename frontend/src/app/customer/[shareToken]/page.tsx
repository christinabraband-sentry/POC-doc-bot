'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Target,
  Users,
  Building2,
  CalendarDays,
  Loader2,
  Plus,
  Mail,
  UserCircle,
} from 'lucide-react';
import {
  useCustomerPoc,
  useCustomerMilestones,
  useCustomerTeam,
  useCustomerAddTeamMember,
} from '@/hooks/useCustomerPortal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { TeamMember } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Add Customer Team Member Dialog                                    */
/* ------------------------------------------------------------------ */

function AddCustomerMemberDialog({ shareToken }: { shareToken: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');

  const addMember = useCustomerAddTeamMember(shareToken);

  const resetForm = () => {
    setName('');
    setRole('');
    setEmail('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await addMember.mutateAsync({
        team_side: 'customer',
        name: name.trim(),
        role: role.trim() || undefined,
        email: email.trim() || undefined,
      });
      resetForm();
      setOpen(false);
    } catch {
      // Handled by react-query
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="member-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-role">Role</Label>
            <Input
              id="member-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Engineering Manager"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </div>
          {addMember.isError && (
            <p className="text-sm text-destructive">
              Failed to add member. Please try again.
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || addMember.isPending}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {addMember.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Add Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Read-only team member list                                         */
/* ------------------------------------------------------------------ */

function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
      <div className="flex size-9 items-center justify-center rounded-full bg-violet-100 text-violet-600">
        <UserCircle className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-900 truncate">
            {member.name}
          </p>
          {member.is_primary_contact && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              Primary
            </Badge>
          )}
        </div>
        {member.role && (
          <p className="text-xs text-slate-500 truncate">{member.role}</p>
        )}
      </div>
      {member.email && (
        <a
          href={`mailto:${member.email}`}
          className="shrink-0 text-slate-400 hover:text-violet-600 transition-colors"
          title={member.email}
        >
          <Mail className="size-4" />
        </a>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Overview Page                                                 */
/* ------------------------------------------------------------------ */

export default function CustomerOverviewPage() {
  const params = useParams<{ shareToken: string }>();
  const shareToken = params.shareToken;

  const { data: poc, isLoading: pocLoading } = useCustomerPoc(shareToken);
  const { data: milestones } = useCustomerMilestones(shareToken);
  const { data: team } = useCustomerTeam(shareToken);

  if (pocLoading || !poc) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-28" />
          </Card>
        ))}
      </div>
    );
  }

  const completedMilestones =
    milestones?.filter((m) => m.status === 'completed').length ?? 0;
  const totalMilestones = milestones?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-violet-50/30 px-8 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome to your POC collaboration portal
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Track progress, manage your team, and access resources for your Sentry
          proof of concept. Everything you need in one place.
        </p>
        {(poc.poc_start_date || poc.poc_end_date) && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="size-4" />
            <span>
              {poc.poc_start_date
                ? format(new Date(poc.poc_start_date), 'MMM d, yyyy')
                : 'Start TBD'}
              {' \u2014 '}
              {poc.poc_end_date
                ? format(new Date(poc.poc_end_date), 'MMM d, yyyy')
                : 'End TBD'}
            </span>
          </div>
        )}
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">POC Completion</span>
            <span className="font-semibold text-slate-900">
              {poc.progress.completion_pct}%
            </span>
          </div>
          <Progress value={poc.progress.completion_pct} className="h-2.5" />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex size-11 items-center justify-center rounded-lg bg-violet-100">
              <CheckCircle2 className="size-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {completedMilestones}/{totalMilestones}
              </p>
              <p className="text-sm text-slate-500">Milestones Done</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex size-11 items-center justify-center rounded-lg bg-violet-100">
              <Target className="size-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {poc.progress.completed_tasks}/{poc.progress.total_tasks}
              </p>
              <p className="text-sm text-slate-500">Tasks Done</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex size-11 items-center justify-center rounded-lg bg-violet-100">
              <Users className="size-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {(team?.sentry?.length ?? 0) + (team?.customer?.length ?? 0)}
              </p>
              <p className="text-sm text-slate-500">Team Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Rosters */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sentry Team (read-only) */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex size-7 items-center justify-center rounded-md bg-violet-600">
                <Users className="size-3.5 text-white" />
              </div>
              Sentry Team
              <Badge variant="secondary" className="ml-1">
                {team?.sentry?.length ?? 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!team?.sentry?.length ? (
              <p className="text-sm text-slate-400 text-center py-6">
                Your Sentry team will be shown here.
              </p>
            ) : (
              <div className="space-y-2">
                {team.sentry.map((member) => (
                  <TeamMemberCard key={member.id} member={member} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Team (editable -- can add) */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex size-7 items-center justify-center rounded-md bg-slate-700">
                <Building2 className="size-3.5 text-white" />
              </div>
              Your Team
              <Badge variant="secondary" className="ml-1">
                {team?.customer?.length ?? 0}
              </Badge>
            </CardTitle>
            <AddCustomerMemberDialog shareToken={shareToken} />
          </CardHeader>
          <CardContent>
            {!team?.customer?.length ? (
              <p className="text-sm text-slate-400 text-center py-6">
                Add your team members to collaborate on this POC.
              </p>
            ) : (
              <div className="space-y-2">
                {team.customer.map((member) => (
                  <TeamMemberCard key={member.id} member={member} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
