'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Trash2, Loader2, Users, Building2 } from 'lucide-react';
import {
  useTeamMembers,
  useCreateTeamMember,
  useDeleteTeamMember,
} from '@/hooks/useTeamMembers';
import type { TeamSide, TeamMember } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

function AddMemberDialog({
  side,
  sideLabel,
  pocId,
}: {
  side: TeamSide;
  sideLabel: string;
  pocId: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');

  const createMember = useCreateTeamMember(pocId);

  const resetForm = () => {
    setName('');
    setRole('');
    setEmail('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createMember.mutateAsync({
        team_side: side,
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
          <DialogTitle>Add {sideLabel} Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`name-${side}`}>
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`name-${side}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`role-${side}`}>Role</Label>
            <Input
              id={`role-${side}`}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Solutions Engineer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`email-${side}`}>Email</Label>
            <Input
              id={`email-${side}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </div>
          {createMember.isError && (
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
              disabled={!name.trim() || createMember.isPending}
            >
              {createMember.isPending && (
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

function TeamSection({
  title,
  icon: Icon,
  side,
  members,
  pocId,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  side: TeamSide;
  members: TeamMember[];
  pocId: string;
}) {
  const deleteMember = useDeleteTeamMember(pocId);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-5" />
          {title}
          <Badge variant="secondary" className="ml-1">
            {members.length}
          </Badge>
        </CardTitle>
        <AddMemberDialog side={side} sideLabel={title.replace(' Project Team', '')} pocId={pocId} />
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No team members added yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.name}
                    {member.is_primary_contact && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        Primary
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.role || '--'}
                  </TableCell>
                  <TableCell>
                    {member.email ? (
                      <a
                        href={`mailto:${member.email}`}
                        className="text-primary hover:underline text-sm"
                      >
                        {member.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMember.mutate(member.id)}
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
  );
}

export default function TeamPage() {
  const params = useParams<{ pocId: string }>();
  const pocId = params.pocId;

  const { data: team, isLoading, error } = useTeamMembers(pocId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
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
          <p className="text-destructive">Failed to load team members.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Team Members</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage the project team from both the Sentry and customer sides.
        </p>
      </div>

      <TeamSection
        title="Sentry Project Team"
        icon={Users}
        side="sentry"
        members={team?.sentry ?? []}
        pocId={pocId}
      />

      <TeamSection
        title="Customer Project Team"
        icon={Building2}
        side="customer"
        members={team?.customer ?? []}
        pocId={pocId}
      />
    </div>
  );
}
