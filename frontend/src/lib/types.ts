// Enums
export type PocStatus = 'draft' | 'active' | 'completed' | 'archived';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';
export type Priority = 'high' | 'medium' | 'low';
export type TeamSide = 'sentry' | 'customer';

// Value Framework
export interface ValueFramework {
  id: string;
  poc_id: string;
  current_challenges: string | null;
  impact: string | null;
  ideal_future_state: string | null;
  everyday_metrics: string | null;
  core_requirements: string | null;
  ai_generated: boolean;
  ai_confidence_score: number | null;
  source_call_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

// POC Progress
export interface POCProgress {
  total_milestones: number;
  completed_milestones: number;
  total_tasks: number;
  completed_tasks: number;
  completion_pct: number;
}

// POC
export interface POC {
  id: string;
  account_name: string;
  account_domain: string | null;
  opportunity_name: string | null;
  share_token: string;
  status: PocStatus;
  poc_start_date: string | null;
  poc_end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  value_framework: ValueFramework | null;
  progress: POCProgress;
}

export interface POCSummary {
  id: string;
  account_name: string;
  account_domain: string | null;
  status: PocStatus;
  created_at: string;
  updated_at: string;
  progress: POCProgress;
}

export interface POCCreate {
  account_name: string;
  account_domain?: string;
  opportunity_name?: string;
}

export interface POCUpdate {
  account_name?: string;
  account_domain?: string;
  opportunity_name?: string;
  status?: PocStatus;
  poc_start_date?: string | null;
  poc_end_date?: string | null;
  notes?: string | null;
}

// Milestone
export interface Milestone {
  id: string;
  poc_id: string;
  due_date: string | null;
  title: string;
  description: string | null;
  notes: string | null;
  status: TaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MilestoneCreate {
  title: string;
  due_date?: string;
  description?: string;
  notes?: string;
  sort_order?: number;
}

export interface MilestoneUpdate {
  title?: string;
  due_date?: string | null;
  description?: string;
  notes?: string;
  status?: TaskStatus;
  sort_order?: number;
}

// Phase & Task
export interface Task {
  id: string;
  phase_id: string;
  poc_id: string;
  title: string;
  resource_url: string | null;
  resource_label: string | null;
  owner: string | null;
  target_date: string | null;
  status: TaskStatus;
  notes: string | null;
  is_optional: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  resource_url?: string;
  resource_label?: string;
  owner?: string;
  target_date?: string;
  status?: TaskStatus;
  notes?: string;
  is_optional?: boolean;
  sort_order?: number;
}

export interface TaskUpdate {
  title?: string;
  resource_url?: string | null;
  resource_label?: string | null;
  owner?: string | null;
  target_date?: string | null;
  status?: TaskStatus;
  notes?: string | null;
  is_optional?: boolean;
  sort_order?: number;
}

export interface Phase {
  id: string;
  poc_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  tasks: Task[];
  created_at: string;
  updated_at: string;
}

// Success Criteria
export interface SuccessCriterion {
  id: string;
  poc_id: string;
  feature: string;
  priority: Priority | null;
  criteria: string | null;
  current_state: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SuccessCriterionCreate {
  feature: string;
  priority?: Priority;
  criteria?: string;
  current_state?: string;
  notes?: string;
  sort_order?: number;
}

export interface SuccessCriterionUpdate {
  feature?: string;
  priority?: Priority | null;
  criteria?: string;
  current_state?: string;
  notes?: string;
  sort_order?: number;
}

// Team Members
export interface TeamMember {
  id: string;
  poc_id: string;
  team_side: TeamSide;
  name: string;
  role: string | null;
  email: string | null;
  is_primary_contact: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberCreate {
  team_side: TeamSide;
  name: string;
  role?: string;
  email?: string;
  is_primary_contact?: boolean;
}

export interface GroupedTeam {
  sentry: TeamMember[];
  customer: TeamMember[];
}

// Gong
export interface GongCall {
  id: string;
  poc_id: string;
  gong_call_id: string;
  title: string | null;
  started_at: string | null;
  duration_seconds: number | null;
  participant_emails: string[] | null;
  transcript_text: string | null;
  transcript_fetched_at: string | null;
  selected_for_analysis: boolean;
  created_at: string;
  updated_at: string;
}

export interface GongSearchParams {
  account_domain: string;
  date_from?: string;
  date_to?: string;
}

// AI Analysis
export interface AIAnalysis {
  id: string;
  poc_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input_call_ids: string[];
  raw_response: string | null;
  extracted_data: {
    current_challenges: string;
    impact: string;
    ideal_future_state: string;
    everyday_metrics: string;
    core_requirements: string;
    confidence_score: number;
    evidence: Record<string, string[]>;
  } | null;
  error_message: string | null;
  model_used: string | null;
  token_usage: { input_tokens: number; output_tokens: number } | null;
  created_at: string;
  completed_at: string | null;
}

// Tech Stack
export interface TechStackEntry {
  id: string;
  poc_id: string;
  category: string;
  name: string;
  sentry_platform_key: string | null;
  confirmed_by_customer: boolean;
  doc_links: DocLink[];
  created_at: string;
  updated_at: string;
}

export interface TechStackEntryCreate {
  category: string;
  name: string;
}

export interface DocLink {
  id: string;
  poc_id: string;
  tech_stack_entry_id: string | null;
  category: string;
  title: string;
  url: string;
  relevance_note: string | null;
  sort_order: number;
  created_at: string;
}
