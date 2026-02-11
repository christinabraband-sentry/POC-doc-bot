import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { AIAnalysis } from '@/lib/types';

export function useAiAnalyses(pocId: string) {
  return useQuery<AIAnalysis[]>({
    queryKey: ['ai-analyses', pocId],
    queryFn: () => api.get(`/pocs/${pocId}/ai/analyses`),
    enabled: !!pocId,
  });
}

export function useAiAnalysis(pocId: string, analysisId: string) {
  return useQuery<AIAnalysis>({
    queryKey: ['ai-analysis', pocId, analysisId],
    queryFn: () => api.get(`/pocs/${pocId}/ai/analyses/${analysisId}`),
    enabled: !!pocId && !!analysisId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'pending' || data.status === 'processing')) {
        return 3000;
      }
      return false;
    },
  });
}

export function useTriggerAnalysis(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<AIAnalysis>(`/pocs/${pocId}/ai/analyze`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-analyses', pocId] });
    },
  });
}

export function useApplyAnalysis(pocId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (analysisId: string) =>
      api.post(`/pocs/${pocId}/ai/analyses/${analysisId}/apply`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['value-framework', pocId] });
      queryClient.invalidateQueries({ queryKey: ['poc', pocId] });
      queryClient.invalidateQueries({ queryKey: ['ai-analyses', pocId] });
    },
  });
}
