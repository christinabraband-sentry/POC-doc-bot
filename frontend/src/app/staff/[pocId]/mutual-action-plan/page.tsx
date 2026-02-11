'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Plus, Trash2, Loader2, Users } from 'lucide-react';
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
} from '@/hooks/useMilestones';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { TASK_STATUSES } from '@/lib/constants';
import type { TaskStatus, TeamMember } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function getStatusColor(status: TaskStatus) {
  return TASK_STATUSES.find((s) => s.value === status)?.color ?? '';
}

function getStatusLabel(status: TaskStatus) {
  return TASK_STATUSES.find((s) => s.value === status)?.label ?? status;
}

function TeamRoster({
  title,
  members,
}: {
  title: string;
  members: TeamMember[];
}) {
  if (members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No members added yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="size-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <Badge key={member.id} variant="secondary" className="gap-1.5 py-1">
              <span className="font-medium">{member.name}</span>
              {member.role && (
                <span className="text-muted-foreground">({member.role})</span>
              )}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MutualActionPlanPage() {
  const params = useParams<{ pocId: string }>();
  const pocId = params.pocId;

  const { data: milestones, isLoading } = useMilestones(pocId);
  const { data: team } = useTeamMembers(pocId);
  const createMilestone = useCreateMilestone(pocId);
  const updateMilestone = useUpdateMilestone(pocId);
  const deleteMilestone = useDeleteMilestone(pocId);

  const handleAddMilestone = () => {
    createMilestone.mutate({
      title: 'New Milestone',
      sort_order: (milestones?.length ?? 0) + 1,
    });
  };

  const handleUpdate = (
    milestoneId: string,
    field: string,
    value: string | null
  ) => {
    updateMilestone.mutate({
      milestoneId,
      data: { [field]: value },
    });
  };

  const handleDelete = (milestoneId: string) => {
    deleteMilestone.mutate(milestoneId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20" />
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="h-64" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Mutual Action Plan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Track milestones and align with the customer on key deliverables.
        </p>
      </div>

      {/* Team Rosters */}
      <div className="grid sm:grid-cols-2 gap-4">
        <TeamRoster
          title="Sentry Project Team"
          members={team?.sentry ?? []}
        />
        <TeamRoster
          title="Customer Project Team"
          members={team?.customer ?? []}
        />
      </div>

      {/* Milestones Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Milestones</CardTitle>
          <Button
            size="sm"
            onClick={handleAddMilestone}
            disabled={createMilestone.isPending}
          >
            {createMilestone.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add Milestone
          </Button>
        </CardHeader>
        <CardContent>
          {(!milestones || milestones.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No milestones yet. Add your first milestone to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Due Date</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestones.map((milestone) => (
                  <TableRow key={milestone.id}>
                    <TableCell>
                      <Input
                        type="date"
                        defaultValue={milestone.due_date ?? ''}
                        className="h-8 text-xs w-[120px]"
                        onBlur={(e) =>
                          handleUpdate(
                            milestone.id,
                            'due_date',
                            e.target.value || null
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={milestone.title}
                        className="h-8 text-sm"
                        onBlur={(e) =>
                          handleUpdate(milestone.id, 'title', e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={milestone.description ?? ''}
                        className="h-8 text-sm"
                        placeholder="Description..."
                        onBlur={(e) =>
                          handleUpdate(
                            milestone.id,
                            'description',
                            e.target.value || null
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={milestone.notes ?? ''}
                        className="h-8 text-sm"
                        placeholder="Notes..."
                        onBlur={(e) =>
                          handleUpdate(
                            milestone.id,
                            'notes',
                            e.target.value || null
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={milestone.status}
                        onValueChange={(value) =>
                          handleUpdate(milestone.id, 'status', value)
                        }
                      >
                        <SelectTrigger size="sm" className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(milestone.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
