// FreelanceFlow Core Domain Types

export type UserRole = 'freelancer' | 'client' | 'administrator' | 'admin';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type PriorityLevel = TaskPriority;

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';

export type ContractStatus = 'draft' | 'sent' | 'accepted' | 'signed' | 'rejected' | 'expired';

export type InvoiceStatus = 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type PaymentMethod = 'stripe' | 'bank_transfer' | 'paypal' | 'cash';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  company_name?: string;
  title?: string;
  bio?: string;
  hourly_rate?: number;
  phone?: string;
  currency?: string;
  created_at: string;
  updated_at?: string;
}

export type UserProfile = Profile;

export interface Client {
  id: string;
  freelancer_id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  currency?: string;
  is_archived: boolean;
  created_at: string;
  updated_at?: string;
  // Computed / joined helpers
  active_projects_count?: number;
  total_billed?: number;
}

export interface Project {
  id: string;
  freelancer_id: string;
  client_id?: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  start_date?: string;
  deadline?: string;
  budget: number;
  progress: number;
  currency: string;
  is_archived: boolean;
  created_at: string;
  updated_at?: string;
  // Relations
  client?: Client;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'collaborator' | 'client';
  joined_at: string;
  user?: Profile;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  order_index?: number;
  amount?: number;
  created_at: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  project_id: string;
  milestone_id?: string;
  assigned_to?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  estimated_hours?: number;
  order_index?: number;
  created_at: string;
  updated_at?: string;
  // Joined fields
  project_name?: string;
  assignee?: Profile;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  task_id?: string;
  description: string;
  duration_minutes: number;
  started_at?: string;
  ended_at?: string;
  is_billable: boolean;
  hourly_rate: number;
  created_at: string;
  // Joined
  project_name?: string;
  task_title?: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  task_id?: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  file_type?: string;
  file_size: number;
  created_at: string;
  uploader_name?: string;
  project_name?: string;
  // Compatibility aliases
  name?: string;
  size_bytes?: number;
  mime_type?: string;
  is_client_accessible?: boolean;
}

export interface Conversation {
  id: string;
  project_id?: string;
  title: string;
  is_group: boolean;
  created_at: string;
  updated_at?: string;
  last_message?: string;
  last_message_at?: string;
  project_name?: string;
  members?: Profile[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
  sender_name?: string;
  sender_role?: string;
}

export interface Proposal {
  id: string;
  freelancer_id: string;
  client_id?: string;
  project_id?: string;
  title: string;
  content?: string;
  estimated_amount?: number;
  currency?: string;
  status: ProposalStatus;
  valid_until?: string;
  created_at: string;
  updated_at?: string;
  client?: Client;
  project?: Project;
  // Compatibility aliases
  scope?: string;
  total_amount?: number;
}

export interface Contract {
  id: string;
  freelancer_id: string;
  client_id?: string;
  project_id?: string;
  title: string;
  terms?: string;
  total_value?: number;
  status: ContractStatus;
  signed_at?: string;
  created_at: string;
  updated_at?: string;
  client?: Client;
  project?: Project;
  // Compatibility aliases
  content?: string;
  value?: number;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount?: number;
  total?: number;
}

export interface Invoice {
  id: string;
  freelancer_id: string;
  client_id: string;
  project_id?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  status: InvoiceStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
  items?: InvoiceItem[];
  client?: Client;
  project?: Project;
  // Compatibility aliases
  balance_due?: number;
  tax?: number;
  discount?: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date?: string;
  payment_method: string;
  status?: PaymentStatus;
  reference?: string;
  notes?: string;
  created_at: string;
  invoice_number?: string;
  client_name?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  type: 'project' | 'task' | 'invoice' | 'payment' | 'message' | 'proposal' | 'contract' | 'info';
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  project_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
  user_name?: string;
  project_name?: string;
}

export interface DashboardStats {
  active_projects: number;
  total_revenue: number;
  pending_tasks: number;
  hours_tracked: number;
  upcoming_deadlines_count: number;
  overdue_tasks_count: number;
  outstanding_invoices_amount: number;
  unpaid_invoices_count: number;
}
