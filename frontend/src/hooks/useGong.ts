import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { GongCall, GongSearchParams } from '@/lib/types';

export function useGongCalls(pocId: string) {
  return useQuery<GongCall[]>({
    queryKey: ['gong-calls', pocId],
    queryFn: () => api.get(`/pocs/${pocId}/gong/calls`),
    enabled: !!pocId,
  });
}

export function useSearchGongCalls(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: GongSearchParams) =>
      api.post<GongCall[]>(`/pocs/${pocId}/gong/search`, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gong-calls', pocId] });
    },
  });
}

export function useFetchTranscript(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (callId: string) =>
      api.post<GongCall>(`/pocs/${pocId}/gong/calls/${callId}/fetch-transcript`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gong-calls', pocId] });
    },
  });
}

export function useToggleCallSelection(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      callId,
      selected,
    }: {
      callId: string;
      selected: boolean;
    }) =>
      api.patch<GongCall>(`/pocs/${pocId}/gong/calls/${callId}`, {
        selected_for_analysis: selected,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gong-calls', pocId] });
    },
  });
}
