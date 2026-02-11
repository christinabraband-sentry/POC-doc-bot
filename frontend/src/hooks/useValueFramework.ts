import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ValueFramework } from '@/lib/types';

export function useValueFramework(pocId: string) {
  return useQuery<ValueFramework>({
    queryKey: ['value-framework', pocId],
    queryFn: () => api.get(`/pocs/${pocId}/value-framework`),
    enabled: !!pocId,
  });
}

export function useUpdateValueFramework(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ValueFramework>) =>
      api.patch<ValueFramework>(`/pocs/${pocId}/value-framework`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['value-framework', pocId] });
      queryClient.invalidateQueries({ queryKey: ['poc', pocId] });
    },
  });
}
