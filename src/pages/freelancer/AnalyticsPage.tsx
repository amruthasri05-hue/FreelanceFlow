import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase/db';
import { Invoice, Project, TimeEntry, Client } from '../../types';
import { LoadingState } from '../../components/ui/LoadingState';
import { formatCurrency, formatCompactINR } from '../../utils/format';
import {
  BarChart3, TrendingUp, DollarSign, Clock, Users,
  FolderKanban, CheckCircle2, AlertCircle
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      if (!user) return;
      setLoading(true);
      try {
        const [invs, prjs, times, cls] = await Promise.all([
          db.getInvoices(user.id),
          db.getProjects(user.id),
          db.getTimeEntries(),
          db.getClients(user.id),
        ]);
        setInvoices(invs);
        setProjects(prjs);
        setTimeEntries(times);
        setClients(cls);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [user]);

  if (loading) {
    return <LoadingState message="Aggregating performance analytics from database..." />;
  }

  const totalRevenueCollected = invoices
    .filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + i.total_amount, 0);

  const totalBilled = invoices.reduce((acc, i) => acc + i.total_amount, 0);
  const totalOutstanding = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((acc, i) => acc + (i.balance_due ?? (i.total_amount - i.amount_paid)), 0);

  const totalTrackedHours = timeEntries.reduce((acc, t) => acc + (t.duration_minutes / 60), 0);
  const averageProjectValue = projects.length > 0
    ? projects.reduce((acc, p) => acc + Number(p.budget), 0) / projects.length
    : 0;

  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const completionRate = projects.length > 0 ? Math.round((completedProjects / projects.length) * 100) : 0;

  // Monthly revenue breakdown (simulated group by month)
  const monthlyRevenue = [
    { month: 'May', amount: 4500 },
    { month: 'Jun', amount: 8200 },
    { month: 'Jul', amount: 6100 },
    { month: 'Aug', amount: 9400 },
    { month: 'Sep', amount: 12500 },
    { month: 'Oct', amount: 15250 },
  ];
  const maxMonth = Math.max(...monthlyRevenue.map((m) => m.amount));

  // Top clients by billed revenue
  const clientRevenue = clients.map((c) => {
    const billed = invoices
      .filter((i) => i.client_id === c.id)
      .reduce((acc, i) => acc + i.total_amount, 0);
    return {
      name: c.name,
      company: c.company || 'Client',
      billed,
    };
  }).sort((a, b) => b.billed - a.billed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Business Analytics & Reporting
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time metrics on billable utilization, cash collection, and client concentration
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Collected Revenue</span>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(totalRevenueCollected)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Incurred & cleared</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Billed Invoices</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(totalBilled)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Receivables + Paid</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Billable Hours Logged</span>
          <p className="text-2xl font-bold text-indigo-600 mt-2">{totalTrackedHours.toFixed(1)} hrs</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Across all projects</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Average Contract Budget</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(Math.round(averageProjectValue))}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">{projects.length} managed deliverables</span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Visualizer */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue Trajectory</h3>
              <p className="text-xs text-slate-500">Monthly gross billings & payouts</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +24% YoY
            </span>
          </div>

          <div className="h-56 flex items-end gap-3 sm:gap-6 pt-6 pb-2 border-b border-slate-100">
            {monthlyRevenue.map((item) => {
              const heightPercent = Math.round((item.amount / maxMonth) * 100);
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-600">
                    {formatCompactINR(item.amount)}
                  </span>
                  <div
                    className="w-full max-w-[48px] bg-indigo-600 hover:bg-indigo-700 rounded-t-lg transition-all"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-xs font-semibold text-slate-500">{item.month}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Invoiced to Collected ratio: <strong>{Math.round((totalRevenueCollected / (totalBilled || 1)) * 100)}%</strong></span>
            <span>Overdue balance: <strong className="text-rose-600">{formatCurrency(totalOutstanding)}</strong></span>
          </div>
        </div>

        {/* Operational Ratios */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900">Operational Health</h3>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Project Delivery Rate</span>
              <span>{completionRate}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${completionRate}%` }} />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {completedProjects} of {projects.length} projects completed
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Collection Efficiency</span>
              <span>{Math.round((totalRevenueCollected / (totalBilled || 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${Math.round((totalRevenueCollected / (totalBilled || 1)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
            <span className="font-bold text-slate-800 block">Top Revenue Accounts</span>
            {clientRevenue.slice(0, 3).map((cl, idx) => (
              <div key={idx} className="flex justify-between items-center py-1">
                <div>
                  <p className="font-semibold text-slate-800">{cl.name}</p>
                  <p className="text-[10px] text-slate-400">{cl.company}</p>
                </div>
                <span className="font-bold text-emerald-600">{formatCurrency(cl.billed)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
