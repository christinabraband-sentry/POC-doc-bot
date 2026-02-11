'use client';

import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Users,
  Building2,
  Mail,
  UserCircle,
  CalendarDays,
} from 'lucide-react';
import {
  useCustomerMilestones,
  useCustomerUpdateMilestone,
  useCustomerTeam,
} from '@/hooks/useCustomerPortal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusDropdown } from '@/components/shared/StatusDropdown';
import { NotesCell } from '@/components/shared/NotesCell';
import { ProgressBar } from '@/components/shared/ProgressBar';
import type { TaskStatus, TeamMember } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Compact team roster (read-only)                                    */
/* ------------------------------------------------------------------ */

function CompactTeamRoster({
  title,
  icon: Icon,
  members,
  accentClass,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  members: TeamMember[];
  accentClass: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <div
            className={`flex size-6 items-center justify-center rounded-md ${accentClass}`}
          >
            <Icon className="size-3 text-white" />
          </div>
          {title}
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {members.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">
            No members yet.
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2.5 text-sm"
              >
                <UserCircle className="size-4 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-700 truncate">
                  {m.name}
                </span>
                {m.role && (
                  <span className="text-xs text-slate-400 truncate hidden sm:inline">
                    {m.role}
                  </span>
                )}
                {m.email && (
                  <a
                    href={`mailto:${m.email}`}
                    className="ml-auto shrink-0 text-slate-400 hover:text-violet-600 transition-colors"
                    title={m.email}
                  >
                    <Mail className="size-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Action Plan Page                                              */
/* ------------------------------------------------------------------ */

export default function CustomerActionPlanPage() {
  const params = useParams<{ shareToken: string }>();
  const shareToken = params.shareToken;

  const {
    data: milestones,
    isLoading: msLoading,
    error: msError,
  } = useCustomerMilestones(shareToken);
  const { data: team } = useCustomerTeam(shareToken);
  const updateMilestone = useCustomerUpdateMilestone(shareToken);

  const completedCount =
    milestones?.filter((m) => m.status === 'completed').length ?? 0;
  const totalCount = milestones?.length ?? 0;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleStatusChange = (milestoneId: string, status: TaskStatus) => {
    updateMilestone.mutate({ milestoneId, data: { status } });
  };

  const handleNotesChange = (milestoneId: string, notes: string) => {
    updateMilestone.mutate({ milestoneId, data: { notes } });
  };

  if (msLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Mutual Action Plan
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Key milestones and commitments for a successful POC.
          </p>
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (msError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Failed to load the action plan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Mutual Action Plan
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Key milestones and commitments for a successful POC.
        </p>
      </div>

      {/* Team rosters side-by-side */}
      <div className="grid gap-4 md:grid-cols-2">
        <CompactTeamRoster
          title="Sentry Team"
          icon={Users}
          members={team?.sentry ?? []}
          accentClass="bg-violet-600"
        />
        <CompactTeamRoster
          title="Your Team"
          icon={Building2}
          members={team?.customer ?? []}
          accentClass="bg-slate-700"
        />
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="py-4">
          <ProgressBar
            value={progressPct}
            label={`Milestones: ${completedCount} of ${totalCount} completed`}
          />
        </CardContent>
      </Card>

      {/* Milestones table */}
      <Card>
        <CardContent>
          {!milestones || milestones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="size-8 text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">
                No milestones have been created yet. Your Sentry team will set
                these up.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Due Date</TableHead>
                    <TableHead className="w-[200px]">Milestone</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[200px]">Notes</TableHead>
                    <TableHead className="w-[160px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestones.map((milestone) => (
                    <TableRow key={milestone.id}>
                      {/* Due Date -- read-only */}
                      <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                        {milestone.due_date
                          ? format(
                              new Date(milestone.due_date),
                              'MMM d, yyyy'
                            )
                          : '--'}
                      </TableCell>

                      {/* Title -- read-only */}
                      <TableCell className="font-medium text-sm text-slate-900">
                        {milestone.title}
                      </TableCell>

                      {/* Description -- read-only */}
                      <TableCell className="text-sm text-slate-600">
                        {milestone.description || (
                          <span className="text-slate-300">--</span>
                        )}
                      </TableCell>

                      {/* Notes -- EDITABLE */}
                      <TableCell>
                        <NotesCell
                          value={milestone.notes}
                          onChange={(notes) =>
                            handleNotesChange(milestone.id, notes)
                          }
                        />
                      </TableCell>

                      {/* Status -- EDITABLE */}
                      <TableCell>
                        <StatusDropdown
                          value={milestone.status}
                          onChange={(status) =>
                            handleStatusChange(milestone.id, status)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
