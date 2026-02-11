'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  usePhases,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '@/hooks/usePhases';
import { TASK_STATUSES } from '@/lib/constants';
import type { Phase, Task, TaskStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function PhaseSection({
  phase,
  pocId,
}: {
  phase: Phase;
  pocId: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const updateTask = useUpdateTask(pocId);
  const deleteTask = useDeleteTask(pocId);

  const completedTasks = phase.tasks.filter(
    (t) => t.status === 'completed'
  ).length;
  const totalTasks = phase.tasks.length;
  const progressPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleUpdateTask = (
    taskId: string,
    field: string,
    value: string | null
  ) => {
    updateTask.mutate({
      phaseId: phase.id,
      taskId,
      data: { [field]: value },
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask.mutate({ phaseId: phase.id, taskId });
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
              <ChevronDown className="size-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-5 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-base">{phase.name}</CardTitle>
              {phase.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
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
              <Progress value={progressPct} />
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <PhaseTaskTable
            phase={phase}
            pocId={pocId}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        </CardContent>
      )}
    </Card>
  );
}

function PhaseTaskTable({
  phase,
  pocId,
  onUpdateTask,
  onDeleteTask,
}: {
  phase: Phase;
  pocId: string;
  onUpdateTask: (taskId: string, field: string, value: string | null) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const createTask = useCreateTask(pocId, phase.id);

  const handleAddTask = () => {
    createTask.mutate({
      title: 'New Task',
      sort_order: phase.tasks.length + 1,
    });
  };

  return (
    <div className="space-y-3">
      {phase.tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No tasks in this phase yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead className="w-[150px]">Resources</TableHead>
              <TableHead className="w-[120px]">Owner</TableHead>
              <TableHead className="w-[130px]">Target Date</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {phase.tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Input
                    defaultValue={task.title}
                    className="h-8 text-sm"
                    onBlur={(e) =>
                      onUpdateTask(task.id, 'title', e.target.value)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Input
                      defaultValue={task.resource_url ?? ''}
                      className="h-8 text-xs"
                      placeholder="URL..."
                      onBlur={(e) =>
                        onUpdateTask(
                          task.id,
                          'resource_url',
                          e.target.value || null
                        )
                      }
                    />
                    {task.resource_url && (
                      <a
                        href={task.resource_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-primary hover:text-primary/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    defaultValue={task.owner ?? ''}
                    className="h-8 text-sm"
                    placeholder="Owner..."
                    onBlur={(e) =>
                      onUpdateTask(
                        task.id,
                        'owner',
                        e.target.value || null
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    defaultValue={task.target_date ?? ''}
                    className="h-8 text-xs"
                    onBlur={(e) =>
                      onUpdateTask(
                        task.id,
                        'target_date',
                        e.target.value || null
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={task.status}
                    onValueChange={(value) =>
                      onUpdateTask(task.id, 'status', value)
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
                  <Input
                    defaultValue={task.notes ?? ''}
                    className="h-8 text-sm"
                    placeholder="Notes..."
                    onBlur={(e) =>
                      onUpdateTask(
                        task.id,
                        'notes',
                        e.target.value || null
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteTask(task.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleAddTask}
        disabled={createTask.isPending}
      >
        {createTask.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        Add Task
      </Button>
    </div>
  );
}

export default function PhasesPage() {
  const params = useParams<{ pocId: string }>();
  const pocId = params.pocId;

  const { data: phases, isLoading, error } = usePhases(pocId);

  if (isLoading) {
    return (
      <div className="space-y-4">
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
        <CardContent>
          <p className="text-destructive">Failed to load phases.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">POC Phases</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Organize and track tasks across different phases of the POC.
        </p>
      </div>

      {(!phases || phases.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              No phases configured for this POC yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        phases.map((phase) => (
          <PhaseSection key={phase.id} phase={phase} pocId={pocId} />
        ))
      )}
    </div>
  );
}
