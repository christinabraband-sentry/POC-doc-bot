import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  POC,
  Phase,
  Milestone,
  SuccessCriterion,
  GroupedTeam,
  ValueFramework,
  TechStackEntry,
  DocLink,
  TaskUpdate,
  MilestoneUpdate,
  SuccessCriterionUpdate,
  TeamMemberCreate,
  TeamMember,
  TechStackEntryCreate,
} from '@/lib/types';

// ----- Read hooks (customer portal uses share token) -----

export function useCustomerPoc(shareToken: string) {
  return useQuery<POC>({
    queryKey: ['customer-poc', shareToken],
    queryFn: () => api.get(`/customer/${shareToken}`),
    enabled: !!shareToken,
  });
}

export function useCustomerPhases(shareToken: string) {
  return useQuery<Phase[]>({
    queryKey: ['customer-phases', shareToken],
    queryFn: () => api.get(`/customer/${shareToken}/phases`),
    enabled: !!shareToken,
  });
}

export function useCustomerMilestones(shareToken: string) {
  return useQuery<Milestone[]>({
    queryKey: ['customer-milestones', shareToken],
    queryFn: () => api.get(`/customer/${shareToken}/milestones`),
    enabled: !!shareToken,
  });
}

export function useCustomerSuccessCriteria(shareToken: string) {
  return useQuery<SuccessCriterion[]>({
    queryKey: ['customer-success-criteria', shareToken],
    queryFn: () => api.get(`/customer/${shareToken}/success-criteria`),
    enabled: !!shareToken,
  });
}

export function useCustomerTeam(shareToken: string) {
  return useQuery<GroupedTeam>({
    queryKey: ['customer-team', shareToken],
    queryFn: () => api.get(`/customer/${shareToken}/team`),
    enabled: !!shareToken,
  });
}

export function useCustomerValueFramework(shareToken: string) {
  return useQuery<ValueFramework>({
    queryKey: ['customer-value-framework', shareToken],
    queryFn: () => api.get(`/customer/${shareToken}/value-framework`),
    enabled: !!shareToken,
  });
}

export function useCustomerTechStack(shareToken: string) {
  return useQuery<TechStackEntry[]>({
    queryKey: ['customer-tech-stack', shareToken],
    queryFn: () => api.get(`/customer/${shareToken}/tech-stack`),
    enabled: !!shareToken,
  });
}

export function useCustomerDocLinks(shareToken: string) {
  return useQuery<DocLink[]>({
    queryKey: ['customer-doc-links', shareToken],
    queryFn: () => api.get(`/customer/${shareToken}/doc-links`),
    enabled: !!shareToken,
  });
}

// ----- Mutation hooks (limited writes the customer can perform) -----

export function useCustomerUpdateTask(shareToken: string) {
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
    }) =>
      api.patch(
        `/customer/${shareToken}/phases/${phaseId}/tasks/${taskId}`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-phases', shareToken] });
      queryClient.invalidateQueries({ queryKey: ['customer-poc', shareToken] });
    },
  });
}

export function useCustomerUpdateMilestone(shareToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      milestoneId,
      data,
    }: {
      milestoneId: string;
      data: MilestoneUpdate;
    }) =>
      api.patch(
        `/customer/${shareToken}/milestones/${milestoneId}`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-milestones', shareToken] });
      queryClient.invalidateQueries({ queryKey: ['customer-poc', shareToken] });
    },
  });
}

export function useCustomerUpdateCriterion(shareToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      criterionId,
      data,
    }: {
      criterionId: string;
      data: SuccessCriterionUpdate;
    }) =>
      api.patch(
        `/customer/${shareToken}/success-criteria/${criterionId}`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['customer-success-criteria', shareToken],
      });
    },
  });
}

export function useCustomerConfirmTechStack(shareToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId,
      confirmed,
    }: {
      entryId: string;
      confirmed: boolean;
    }) =>
      api.patch(`/customer/${shareToken}/tech-stack/${entryId}`, {
        confirmed_by_customer: confirmed,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['customer-tech-stack', shareToken],
      });
    },
  });
}

export function useCustomerAddTeamMember(shareToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TeamMemberCreate) =>
      api.post<TeamMember>(`/customer/${shareToken}/team`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['customer-team', shareToken],
      });
    },
  });
}

export function useCustomerAddTechStack(shareToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TechStackEntryCreate) =>
      api.post<TechStackEntry>(`/customer/${shareToken}/tech-stack`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['customer-tech-stack', shareToken],
      });
      queryClient.invalidateQueries({
        queryKey: ['customer-doc-links', shareToken],
      });
    },
  });
}
