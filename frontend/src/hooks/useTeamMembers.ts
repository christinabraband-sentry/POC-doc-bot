import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { GroupedTeam, TeamMember, TeamMemberCreate } from '@/lib/types';

export function useTeamMembers(pocId: string) {
  return useQuery<GroupedTeam>({
    queryKey: ['team-members', pocId],
    queryFn: () => api.get(`/pocs/${pocId}/team`),
    enabled: !!pocId,
  });
}

export function useCreateTeamMember(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TeamMemberCreate) =>
      api.post<TeamMember>(`/pocs/${pocId}/team`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', pocId] });
    },
  });
}

export function useUpdateTeamMember(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: string;
      data: Partial<TeamMemberCreate>;
    }) => api.patch<TeamMember>(`/pocs/${pocId}/team/${memberId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', pocId] });
    },
  });
}

export function useDeleteTeamMember(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/pocs/${pocId}/team/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', pocId] });
    },
  });
}
