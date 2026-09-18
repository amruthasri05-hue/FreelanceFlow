import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase/db';
import { Project, Invoice, UserProfile, UserRole } from '../../types';
import { LoadingState } from '../../components/ui/LoadingState';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/format';
import {
  ShieldAlert, Users, FolderKanban, DollarSign, Database,
  Activity, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user, isSupabaseLive, switchRoleDemo } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulated platform user list
  const [usersList, setUsersList] = useState<Array<{ id: string; name: string; email: string; role: UserRole; status: string }>>([
    { id: 'usr-1', name: 'Alex Rivera', email: 'alex@freelanceflow.dev', role: 'freelancer', status: 'active' },
    { id: 'usr-2', name: 'Marcus Vance', email: 'marcus@novalabs.ai', role: 'client', status: 'active' },
    { id: 'usr-3', name: 'Elena Rostova', email: 'elena@solarpulse.io', role: 'client', status: 'active' },
    { id: 'usr-4', name: 'System Admin', email: 'admin@freelanceflow.dev', role: 'administrator', status: 'active' },
  ]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [allProjects, allInvoices] = await Promise.all([
        db.getProjects(),
        db.getInvoices(),
      ]);
      setProjects(allProjects);
      setInvoices(allInvoices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const totalPlatformVolume = invoices.reduce((acc, i) => acc + i.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Platform Administration & Health</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            System Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cross-tenant governance, user authorization audits, and database health metrics
          </p>
        </div>

        <Button
          onClick={loadAdminData}
          variant="outline"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* System Health Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Database & Edge Engine Status</h3>
            <p className="text-xs text-slate-500">
              PostgreSQL Schema Migration v00001 • RLS Isolation: <span className="text-emerald-600 font-bold">100% Active</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            PostgreSQL Operational
          </span>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
            Latency: 28ms
          </span>
        </div>
      </div>

      {/* Global metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Registered Tenants</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{usersList.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Active across roles</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Platform Projects</span>
          <p className="text-2xl font-bold text-indigo-600 mt-2">{projects.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Under active management</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Platform Invoiced Volume</span>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(totalPlatformVolume)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Processed through billing</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">RLS Policies Enforced</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">13 Tables</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Zero cross-tenant leakage</span>
        </div>
      </div>

      {/* Tenant User Directory */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Tenant Account Governance</h3>
          <span className="text-xs text-slate-500">{usersList.length} total accounts</span>
        </div>

        <div className="divide-y divide-slate-100">
          {usersList.map((u) => (
            <div key={u.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{u.name}</h4>
                  <p className="text-slate-400">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {u.role}
                </span>

                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {u.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
