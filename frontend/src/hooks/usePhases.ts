import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Phase, Task, TaskCreate, TaskUpdate } from '@/lib/types';

export function usePhases(pocId: string) {
  return useQuery<Phase[]>({
    queryKey: ['phases', pocId],
    queryFn: () => api.get(`/pocs/${pocId}/phases`),
    enabled: !!pocId,
  });
}

export function useCreateTask(pocId: string, phaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskCreate) =>
      api.post<Task>(`/pocs/${pocId}/phases/${phaseId}/tasks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases', pocId] });
      queryClient.invalidateQueries({ queryKey: ['poc', pocId] });
    },
  });
}

export function useUpdateTask(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      phaseId,
      taskId,
      data,
    }: {
      phaseId: string;
      taskId: string;
      data: TaskUpdate;
    }) => api.patch<Task>(`/pocs/${pocId}/phases/${phaseId}/tasks/${taskId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases', pocId] });
      queryClient.invalidateQueries({ queryKey: ['poc', pocId] });
    },
  });
}

export function useDeleteTask(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ phaseId, taskId }: { phaseId: string; taskId: string }) =>
      api.delete(`/pocs/${pocId}/phases/${phaseId}/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases', pocId] });
      queryClient.invalidateQueries({ queryKey: ['poc', pocId] });
    },
  });
}
