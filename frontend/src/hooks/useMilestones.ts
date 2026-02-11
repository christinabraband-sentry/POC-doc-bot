import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Milestone, MilestoneCreate, MilestoneUpdate } from '@/lib/types';

export function useMilestones(pocId: string) {
  return useQuery<Milestone[]>({
    queryKey: ['milestones', pocId],
    queryFn: () => api.get(`/pocs/${pocId}/milestones`),
    enabled: !!pocId,
  });
}

export function useCreateMilestone(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MilestoneCreate) =>
      api.post<Milestone>(`/pocs/${pocId}/milestones`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', pocId] });
      queryClient.invalidateQueries({ queryKey: ['poc', pocId] });
    },
  });
}

export function useUpdateMilestone(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: MilestoneUpdate }) =>
      api.patch<Milestone>(`/pocs/${pocId}/milestones/${milestoneId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', pocId] });
      queryClient.invalidateQueries({ queryKey: ['poc', pocId] });
    },
  });
}

export function useDeleteMilestone(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) =>
      api.delete(`/pocs/${pocId}/milestones/${milestoneId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', pocId] });
      queryClient.invalidateQueries({ queryKey: ['poc', pocId] });
    },
  });
}
