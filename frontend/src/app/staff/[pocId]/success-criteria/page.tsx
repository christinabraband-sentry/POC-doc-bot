'use client';

import { useParams } from 'next/navigation';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import {
  useSuccessCriteria,
  useCreateCriterion,
  useUpdateCriterion,
  useDeleteCriterion,
} from '@/hooks/useSuccessCriteria';
import { PRIORITIES } from '@/lib/constants';
import type { Priority } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function SuccessCriteriaPage() {
  const params = useParams<{ pocId: string }>();
  const pocId = params.pocId;

  const { data: criteria, isLoading, error } = useSuccessCriteria(pocId);
  const createCriterion = useCreateCriterion(pocId);
  const updateCriterion = useUpdateCriterion(pocId);
  const deleteCriterion = useDeleteCriterion(pocId);

  const handleAdd = () => {
    createCriterion.mutate({
      feature: 'New Feature',
      sort_order: (criteria?.length ?? 0) + 1,
    });
  };

  const handleUpdate = (
    criterionId: string,
    field: string,
    value: string | null
  ) => {
    updateCriterion.mutate({
      criterionId,
      data: { [field]: value },
    });
  };

  const handleDelete = (criterionId: string) => {
    deleteCriterion.mutate(criterionId);
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-64" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-destructive">Failed to load success criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Success Criteria</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Define what success looks like for each feature being evaluated.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Criteria</CardTitle>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={createCriterion.isPending}
          >
            {createCriterion.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add Criterion
          </Button>
        </CardHeader>
        <CardContent>
          {(!criteria || criteria.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No success criteria defined yet. Add criteria to track feature
              evaluation goals.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead className="w-[130px]">Priority</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Current State</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {criteria.map((criterion) => (
                  <TableRow key={criterion.id}>
                    <TableCell>
                      <Input
                        defaultValue={criterion.feature}
                        className="h-8 text-sm"
                        onBlur={(e) =>
                          handleUpdate(
                            criterion.id,
                            'feature',
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={criterion.priority ?? undefined}
                        onValueChange={(value) =>
                          handleUpdate(criterion.id, 'priority', value)
                        }
                      >
                        <SelectTrigger size="sm" className="h-8 text-xs">
                          <SelectValue placeholder="Set..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={criterion.criteria ?? ''}
                        className="h-8 text-sm"
                        placeholder="Success criteria..."
                        onBlur={(e) =>
                          handleUpdate(
                            criterion.id,
                            'criteria',
                            e.target.value || null
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={criterion.current_state ?? ''}
                        className="h-8 text-sm"
                        placeholder="Current state..."
                        onBlur={(e) =>
                          handleUpdate(
                            criterion.id,
                            'current_state',
                            e.target.value || null
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={criterion.notes ?? ''}
                        className="h-8 text-sm"
                        placeholder="Notes..."
                        onBlur={(e) =>
                          handleUpdate(
                            criterion.id,
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
                        onClick={() => handleDelete(criterion.id)}
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
