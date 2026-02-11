'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import {
  useCustomerPhases,
  useCustomerUpdateTask,
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
import type { Phase, TaskStatus } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Single phase section (collapsible)                                 */
/* ------------------------------------------------------------------ */

function CustomerPhaseSection({
  phase,
  shareToken,
}: {
  phase: Phase;
  shareToken: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const updateTask = useCustomerUpdateTask(shareToken);

  const completedTasks = phase.tasks.filter(
    (t) => t.status === 'completed'
  ).length;
  const totalTasks = phase.tasks.length;
  const progressPct =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTask.mutate({
      phaseId: phase.id,
      taskId,
      data: { status },
    });
  };

  const handleNotesChange = (taskId: string, notes: string) => {
    updateTask.mutate({
      phaseId: phase.id,
      taskId,
      data: { notes },
    });
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="size-5 text-slate-400" />
            ) : (
              <ChevronRight className="size-5 text-slate-400" />
            )}
            <div>
              <CardTitle className="text-base text-slate-900">
                {phase.name}
              </CardTitle>
              {phase.description && (
                <p className="text-sm text-slate-500 mt-0.5">
                  {phase.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {completedTasks}/{totalTasks} tasks
            </Badge>
            <div className="w-24">
              <Progress value={progressPct} className="h-2" />
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {phase.tasks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No tasks in this phase yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead className="w-[200px]">Resources</TableHead>
                    <TableHead className="w-[120px]">Owner</TableHead>
                    <TableHead className="w-[120px]">Target Date</TableHead>
                    <TableHead className="w-[160px]">Status</TableHead>
                    <TableHead className="w-[200px]">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phase.tasks.map((task) => (
                    <TableRow key={task.id}>
                      {/* Task title -- read-only */}
                      <TableCell className="font-medium text-sm text-slate-900">
                        {task.title}
                        {task.is_optional && (
                          <Badge
                            variant="secondary"
                            className="ml-2 text-[10px]"
                          >
                            Optional
                          </Badge>
                        )}
                      </TableCell>

                      {/* Resources -- read-only, clickable */}
                      <TableCell>
                        {task.resource_url ? (
                          <a
                            href={task.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2.5 py-1.5 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-100 hover:text-violet-700"
                          >
                            <ExternalLink className="size-3.5 shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {task.resource_label || 'View docs'}
                            </span>
                          </a>
                        ) : (
                          <span className="text-sm text-slate-300">--</span>
                        )}
                      </TableCell>

                      {/* Owner -- read-only */}
                      <TableCell className="text-sm text-slate-600">
                        {task.owner || (
                          <span className="text-slate-300">--</span>
                        )}
                      </TableCell>

                      {/* Target Date -- read-only */}
                      <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                        {task.target_date
                          ? format(
                              new Date(task.target_date),
                              'MMM d, yyyy'
                            )
                          : '--'}
                      </TableCell>

                      {/* Status -- EDITABLE */}
                      <TableCell>
                        <StatusDropdown
                          value={task.status}
                          onChange={(status) =>
                            handleStatusChange(task.id, status)
                          }
                        />
                      </TableCell>

                      {/* Notes -- EDITABLE */}
                      <TableCell>
                        <NotesCell
                          value={task.notes}
                          onChange={(notes) =>
                            handleNotesChange(task.id, notes)
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
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Phases Page                                                   */
/* ------------------------------------------------------------------ */

export default function CustomerPhasesPage() {
  const params = useParams<{ shareToken: string }>();
  const shareToken = params.shareToken;

  const { data: phases, isLoading, error } = useCustomerPhases(shareToken);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">POC Phases</h2>
          <p className="mt-1 text-sm text-slate-500">
            Step-by-step tasks with Sentry documentation resources.
          </p>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-40" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">Failed to load phases.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">POC Phases</h2>
        <p className="mt-1 text-sm text-slate-500">
          Step-by-step tasks with Sentry documentation resources. Click
          resource links to access relevant Sentry docs.
        </p>
      </div>

      {!phases || phases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="size-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">
              No phases have been configured yet. Your Sentry team will set
              these up.
            </p>
          </CardContent>
        </Card>
      ) : (
        phases.map((phase) => (
          <CustomerPhaseSection
            key={phase.id}
            phase={phase}
            shareToken={shareToken}
          />
        ))
      )}
    </div>
  );
}
