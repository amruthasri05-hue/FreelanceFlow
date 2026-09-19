import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['freelancer', 'client']),
  companyName: z.string().optional(),
});

export const clientSchema = z.object({
  name: z.string().min(2, 'Client name is required'),
  company: z.string().optional(),
  email: z.string().email('Valid client email is required'),
  phone: z.string().optional(),
  website: z.string().url('Must be a valid URL (include https://)').or(z.literal('')).optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  description: z.string().optional(),
  client_id: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
  budget: z.number().min(0, 'Budget must be a positive number'),
  progress: z.number().min(0).max(100).default(0),
  currency: z.string().default('INR'),
});

export const taskSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  project_id: z.string().min(1, 'Project is required'),
  milestone_id: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
});

export const milestoneSchema = z.object({
  title: z.string().min(2, 'Milestone title is required'),
  description: z.string().optional(),
  project_id: z.string().min(1, 'Project is required'),
  due_date: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
});

export const timeEntrySchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  task_id: z.string().optional(),
  description: z.string().min(2, 'Description is required'),
  duration_minutes: z.number().min(1, 'Duration must be at least 1 minute'),
  is_billable: z.boolean().default(true),
  hourly_rate: z.number().min(0).default(0),
});

export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  conversation_id: z.string().min(1, 'Conversation is required'),
});

export const proposalSchema = z.object({
  title: z.string().min(2, 'Proposal title is required'),
  client_id: z.string().min(1, 'Client is required'),
  project_id: z.string().optional(),
  content: z.string().min(10, 'Proposal scope and content is required'),
  estimated_amount: z.number().min(0, 'Estimated amount must be valid'),
  currency: z.string().default('USD'),
  valid_until: z.string().optional(),
});

export const contractSchema = z.object({
  title: z.string().min(2, 'Contract title is required'),
  client_id: z.string().min(1, 'Client is required'),
  project_id: z.string().optional(),
  terms: z.string().min(10, 'Contract terms are required'),
  total_value: z.number().min(0, 'Total value must be valid'),
});

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().min(0.1, 'Quantity must be positive'),
  unit_price: z.number().min(0, 'Unit price must be positive'),
  amount: z.number(),
});

export const invoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  client_id: z.string().min(1, 'Client is required'),
  project_id: z.string().optional(),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  tax_rate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice line item is required'),
});

export const paymentSchema = z.object({
  invoice_id: z.string().min(1, 'Invoice is required'),
  amount: z.number().min(0.01, 'Payment amount must be greater than zero'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.string().default('bank_transfer'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
