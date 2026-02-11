import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { POC, POCSummary, POCCreate, POCUpdate } from '@/lib/types';

export function usePocs(status?: string) {
  return useQuery<POCSummary[]>({
    queryKey: ['pocs', status],
    queryFn: () => api.get(`/pocs${status ? `?status=${status}` : ''}`),
  });
}

export function usePoc(pocId: string) {
  return useQuery<POC>({
    queryKey: ['poc', pocId],
    queryFn: () => api.get(`/pocs/${pocId}`),
    enabled: !!pocId,
  });
}

export function useCreatePoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: POCCreate) => api.post<POC>('/pocs', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pocs'] }),
  });
}

export function useUpdatePoc(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: POCUpdate) => api.patch<POC>(`/pocs/${pocId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poc', pocId] });
      queryClient.invalidateQueries({ queryKey: ['pocs'] });
    },
  });
}

export function useDeletePoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pocId: string) => api.delete(`/pocs/${pocId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pocs'] }),
  });
}
