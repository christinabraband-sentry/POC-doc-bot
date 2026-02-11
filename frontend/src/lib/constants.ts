export const POC_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' },
  { value: 'archived', label: 'Archived', color: 'bg-yellow-100 text-yellow-800' },
] as const;

export const TASK_STATUSES = [
  { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
] as const;

export const PRIORITIES = [
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
] as const;

export const VALUE_FRAMEWORK_FIELDS = [
  { key: 'current_challenges', label: 'Current Challenges', description: 'What problems exist today?' },
  { key: 'impact', label: 'Impact', description: 'What is the business impact of these challenges?' },
  { key: 'ideal_future_state', label: 'Ideal Future State', description: 'What does success look like?' },
  { key: 'everyday_metrics', label: 'Everyday Metrics', description: 'What KPIs/metrics do they track?' },
  { key: 'core_requirements', label: 'Core Requirements', description: 'What are the must-have requirements?' },
] as const;
