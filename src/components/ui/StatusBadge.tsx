import React from 'react';

type BadgeType = 
  | 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
  | 'todo' | 'in_progress' | 'review'
  | 'low' | 'medium' | 'high' | 'urgent'
  | 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
  | 'pending' | 'paid' | 'overdue' | 'cancelled';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const colorMap: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  // Project statuses
  planning: { bg: 'bg-purple-50', text: 'text-purple-700 border-purple-200', dot: 'bg-purple-500', label: 'Planning' },
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Active' },
  on_hold: { bg: 'bg-amber-50', text: 'text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'On Hold' },
  completed: { bg: 'bg-blue-50', text: 'text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Completed' },
  archived: { bg: 'bg-slate-100', text: 'text-slate-600 border-slate-200', dot: 'bg-slate-400', label: 'Archived' },

  // Task statuses
  todo: { bg: 'bg-slate-100', text: 'text-slate-700 border-slate-200', dot: 'bg-slate-500', label: 'To Do' },
  in_progress: { bg: 'bg-indigo-50', text: 'text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', label: 'In Progress' },
  review: { bg: 'bg-amber-50', text: 'text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'In Review' },

  // Priority
  low: { bg: 'bg-slate-50', text: 'text-slate-600 border-slate-200', dot: 'bg-slate-400', label: 'Low' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Medium' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'High' },
  urgent: { bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Urgent' },

  // Invoice / Proposal / Contract
  draft: { bg: 'bg-slate-100', text: 'text-slate-600 border-slate-200', dot: 'bg-slate-400', label: 'Draft' },
  sent: { bg: 'bg-sky-50', text: 'text-sky-700 border-sky-200', dot: 'bg-sky-500', label: 'Sent' },
  viewed: { bg: 'bg-cyan-50', text: 'text-cyan-700 border-cyan-200', dot: 'bg-cyan-500', label: 'Viewed' },
  accepted: { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Accepted' },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Rejected' },
  expired: { bg: 'bg-slate-100', text: 'text-slate-500 border-slate-200', dot: 'bg-slate-400', label: 'Expired' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Pending' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Paid' },
  overdue: { bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Overdue' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-500 border-slate-200', dot: 'bg-slate-400', label: 'Cancelled' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  const style = colorMap[normalized] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span className="whitespace-nowrap">{style.label}</span>
    </span>
  );
};
