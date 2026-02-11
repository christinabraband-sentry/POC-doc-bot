'use client';

import { useState } from 'react';
import { UserPlus, X, Users, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TeamMember, TeamMemberCreate, TeamSide } from '@/lib/types';

interface TeamRosterProps {
  title: string;
  members: TeamMember[];
  onAdd?: (member: TeamMemberCreate) => void;
  onRemove?: (id: string) => void;
  editable?: boolean;
}

export function TeamRoster({
  title,
  members,
  onAdd,
  onRemove,
  editable = false,
}: TeamRosterProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSide, setNewSide] = useState<TeamSide>('sentry');

  const handleAdd = () => {
    if (!newName.trim() || !onAdd) return;

    onAdd({
      team_side: newSide,
      name: newName.trim(),
      role: newRole.trim() || undefined,
      email: newEmail.trim() || undefined,
    });

    setNewName('');
    setNewRole('');
    setNewEmail('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') setIsAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <span className="text-xs text-slate-400">({members.length})</span>
        </div>
        {editable && onAdd && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsAdding(true)}
            className="text-violet-600 hover:text-violet-700"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </div>

      {/* Member List */}
      <div className="divide-y rounded-lg border bg-white">
        {members.length === 0 && !isAdding && (
          <div className="px-4 py-6 text-center text-sm text-slate-400">
            No team members yet
          </div>
        )}

        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                {member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {member.name}
                  {member.is_primary_contact && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                      Primary
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  {member.role && (
                    <span className="text-xs text-slate-500">
                      {member.role}
                    </span>
                  )}
                  {member.email && (
                    <span className="flex items-center gap-0.5 text-xs text-slate-400">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {editable && onRemove && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onRemove(member.id)}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}

        {/* Add Member Form */}
        {isAdding && (
          <div className="space-y-3 px-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 text-sm"
                autoFocus
              />
              <Input
                placeholder="Role (optional)"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Email (optional)"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 text-sm"
              />
              <Select
                value={newSide}
                onValueChange={(v) => setNewSide(v as TeamSide)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sentry">Sentry</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!newName.trim()}
              >
                Add Member
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
