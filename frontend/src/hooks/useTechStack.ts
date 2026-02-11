import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { TechStackEntry, TechStackEntryCreate, DocLink } from '@/lib/types';

export function useTechStack(pocId: string) {
  return useQuery<TechStackEntry[]>({
    queryKey: ['tech-stack', pocId],
    queryFn: () => api.get(`/pocs/${pocId}/tech-stack`),
    enabled: !!pocId,
  });
}

export function useAddTechStack(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TechStackEntryCreate) =>
      api.post<TechStackEntry>(`/pocs/${pocId}/tech-stack`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-stack', pocId] });
    },
  });
}

export function useConfirmTechStack(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId,
      confirmed,
    }: {
      entryId: string;
      confirmed: boolean;
    }) =>
      api.patch<TechStackEntry>(`/pocs/${pocId}/tech-stack/${entryId}`, {
        confirmed_by_customer: confirmed,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-stack', pocId] });
    },
  });
}

export function useDeleteTechStack(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      api.delete(`/pocs/${pocId}/tech-stack/${entryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-stack', pocId] });
    },
  });
}

export function useGenerateDocLinks(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      api.post<DocLink[]>(`/pocs/${pocId}/tech-stack/${entryId}/doc-links`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-stack', pocId] });
      queryClient.invalidateQueries({ queryKey: ['doc-links', pocId] });
    },
  });
}

export function useDocLinks(pocId: string) {
  return useQuery<DocLink[]>({
    queryKey: ['doc-links', pocId],
    queryFn: () => api.get(`/pocs/${pocId}/doc-links`),
    enabled: !!pocId,
  });
}
