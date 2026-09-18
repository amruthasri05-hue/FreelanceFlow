import React, { useEffect, useState } from 'react';
import { useRouter } from '../../contexts/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase/db';
import { Project, Client, Task, Invoice, ActivityLog, DashboardStats } from '../../types';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingState } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/format';
import {
  FolderKanban, DollarSign, CheckSquare, Clock, AlertTriangle,
  Calendar, Users, Receipt, ArrowRight, TrendingUp, Plus,
  ChevronRight, Sparkles
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!user) return;
      setLoading(true);
      try {
        const [
          dashboardStats,
          projects,
          clients,
          tasks,
          invoices,
          logs,
        ] = await Promise.all([
          db.getDashboardStats(user.id),
          db.getProjects(user.id, 'freelancer'),
          db.getClients(user.id),
          db.getTasks(),
          db.getInvoices(user.id),
          db.getActivityLogs(),
        ]);

        setStats(dashboardStats);
        setActiveProjects(projects.filter(p => p.status === 'active').slice(0, 4));
        setRecentClients(clients.filter(c => !c.is_archived).slice(0, 4));
        setUrgentTasks(
          tasks
            .filter(t => t.status !== 'completed')
            .sort((a, b) => (a.priority === 'urgent' ? -1 : 1))
            .slice(0, 5)
        );
        setRecentInvoices(invoices.slice(0, 4));
        setActivityLogs(logs.slice(0, 6));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user]);

  if (loading || !stats) {
    return <LoadingState message="Calculating real workspace metrics from database..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Freelancer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here is your live business summary across projects, deliverables, and cash flow.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => navigate('/projects')}
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
          >
            New Project
          </Button>
          <Button
            onClick={() => navigate('/invoices')}
            variant="outline"
            size="sm"
            icon={<Receipt className="w-4 h-4" />}
          >
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Projects</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{stats.active_projects}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
            <span>In progress delivery</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Revenue Paid</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatCurrency(stats.total_revenue)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Cleared earnings</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{stats.pending_tasks}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span>{stats.overdue_tasks_count} overdue</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Hours Tracked</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{stats.hours_tracked} hrs</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
            <span>Billable client time</span>
          </div>
        </div>
      </div>

      {/* Outstanding Invoices & Urgent Tasks Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
              Outstanding Invoices
            </span>
            <h3 className="text-2xl font-bold mt-1">
              {formatCurrency(stats.outstanding_invoices_amount)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {stats.unpaid_invoices_count} invoice(s) awaiting payment
            </p>
          </div>
          <Button
            onClick={() => navigate('/invoices')}
            variant="primary"
            size="sm"
            className="bg-white text-indigo-950 hover:bg-slate-100"
          >
            Review Invoices
          </Button>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-600 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Deadlines Watch
            </span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {stats.upcoming_deadlines_count} upcoming
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tasks and milestones due in the next 14 days
            </p>
          </div>
          <Button
            onClick={() => navigate('/calendar')}
            variant="outline"
            size="sm"
          >
            Open Calendar
          </Button>
        </div>
      </div>

      {/* Main Grid: Active Projects & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Projects</h3>
                <p className="text-xs text-slate-500">Live development deliverables</p>
              </div>
              <button
                onClick={() => navigate('/projects')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {activeProjects.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No active projects right now.
                </div>
              ) : (
                activeProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 hover:text-indigo-600">
                          {p.name}
                        </h4>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        Client: {p.client?.name || 'Unassigned'} • Budget: {formatCurrency(p.budget)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 sm:w-48 shrink-0">
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                          <span>Progress</span>
                          <span>{p.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Tasks Section */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Priority Action Items</h3>
                <p className="text-xs text-slate-500">Urgent and upcoming task deliverables</p>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Task Board</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {urgentTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No pending tasks!
                </div>
              ) : (
                urgentTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => navigate('/tasks')}
                    className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-slate-800">{t.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {t.project_name} {t.due_date ? `• Due ${t.due_date}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Clients & Activity Stream */}
        <div className="space-y-6">
          {/* Active Clients */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Clients</h3>
              <button
                onClick={() => navigate('/clients')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                Manage
              </button>
            </div>
            <div className="p-3 divide-y divide-slate-100">
              {recentClients.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/clients/${c.id}`)}
                  className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{c.name}</p>
                      <p className="text-[11px] text-slate-400">{c.company || c.email}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recent Invoices</h3>
              <button
                onClick={() => navigate('/invoices')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                All
              </button>
            </div>
            <div className="p-3 divide-y divide-slate-100">
              {recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => navigate('/invoices')}
                  className="py-2.5 px-2 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{inv.invoice_number}</p>
                    <p className="text-[11px] text-slate-400">{inv.client?.name || 'Client'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatCurrency(inv.total_amount)}</p>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real Database Activity Logs */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Recent Workspace Activity</h3>
            </div>
            <div className="p-4 space-y-3.5">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">{log.user_name || 'System'}</span>{' '}
                    <span className="text-slate-500">{log.action} {log.entity_type}</span>{' '}
                    {log.project_name && (
                      <span className="text-indigo-600 font-medium">on {log.project_name}</span>
                    )}
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
