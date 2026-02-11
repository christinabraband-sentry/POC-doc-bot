import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  SuccessCriterion,
  SuccessCriterionCreate,
  SuccessCriterionUpdate,
} from '@/lib/types';

export function useSuccessCriteria(pocId: string) {
  return useQuery<SuccessCriterion[]>({
    queryKey: ['success-criteria', pocId],
    queryFn: () => api.get(`/pocs/${pocId}/success-criteria`),
    enabled: !!pocId,
  });
}

export function useCreateCriterion(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SuccessCriterionCreate) =>
      api.post<SuccessCriterion>(`/pocs/${pocId}/success-criteria`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['success-criteria', pocId] });
    },
  });
}

export function useUpdateCriterion(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      criterionId,
      data,
    }: {
      criterionId: string;
      data: SuccessCriterionUpdate;
    }) =>
      api.patch<SuccessCriterion>(
        `/pocs/${pocId}/success-criteria/${criterionId}`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['success-criteria', pocId] });
    },
  });
}

export function useDeleteCriterion(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (criterionId: string) =>
      api.delete(`/pocs/${pocId}/success-criteria/${criterionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['success-criteria', pocId] });
    },
  });
}
