import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase/db';
import { Project, Milestone, Invoice, ProjectFile, Contract, Proposal } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/format';
import {
  FolderKanban, CheckCircle2, FileText, Download, CreditCard,
  FileSignature, MessageSquare, Clock, ShieldCheck
} from 'lucide-react';

export const ClientPortalPage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'projects' | 'invoices' | 'files' | 'agreements'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  // Pay modal
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allProjects, allMilestones, allInvoices, allFiles, allContracts, allProposals] = await Promise.all([
        db.getProjects(),
        db.getMilestones(),
        db.getInvoices(),
        db.getFiles(),
        db.getContracts(),
        db.getProposals(),
      ]);

      setProjects(allProjects);
      setMilestones(allMilestones);
      setInvoices(allInvoices);
      // Filter client-accessible files only
      setFiles(allFiles.filter((f) => f.is_client_accessible));
      setContracts(allContracts);
      setProposals(allProposals);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveMilestone = async (mId: string) => {
    await db.updateMilestone(mId, { status: 'approved' });
    loadData();
  };

  const handlePayInvoice = async () => {
    if (!payingInvoice) return;
    await db.recordPayment({
      invoice_id: payingInvoice.id,
      amount: payingInvoice.balance_due || payingInvoice.total_amount,
      payment_method: 'stripe',
      payment_date: new Date().toISOString(),
      status: 'completed',
    });
    setPayingInvoice(null);
    loadData();
  };

  const handleSignContract = async (cId: string) => {
    await db.updateContract(cId, {
      status: 'signed',
      signed_at: new Date().toISOString(),
    });
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Client Portal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {user?.full_name || 'Partner'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Review deliverable progress, approve milestone sign-offs, and pay pending invoices
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Role: Client View (RLS Enforced)</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            activeTab === 'projects' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Active Projects ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            activeTab === 'invoices' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Invoices & Billing ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            activeTab === 'files' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Deliverables & Files ({files.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('agreements')}
          className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            activeTab === 'agreements' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSignature className="w-4 h-4" />
          <span>Contracts & Proposals ({contracts.length + proposals.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingState message="Loading client portal..." />
      ) : activeTab === 'projects' ? (
        /* PROJECTS & MILESTONES TAB */
        <div className="space-y-6">
          {projects.map((prj) => {
            const prjMilestones = milestones.filter((m) => m.project_id === prj.id);
            return (
              <div key={prj.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-0.5">
                      Deliverable Project
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{prj.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{prj.description}</p>
                  </div>
                  <StatusBadge status={prj.status} />
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span>Overall Completion</span>
                    <span>{prj.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${prj.progress}%` }} />
                  </div>
                </div>

                {/* Milestones to Approve */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Milestones & Approvals
                  </h4>
                  <div className="space-y-2.5">
                    {prjMilestones.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs hover:bg-slate-50"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{m.title}</p>
                          <p className="text-[11px] text-slate-500">
                            Due: {m.due_date || 'Ongoing'} • Value: {formatCurrency(m.amount || 0)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <StatusBadge status={m.status} />
                          {m.status === 'completed' && (
                            <Button
                              onClick={() => handleApproveMilestone(m.id)}
                              variant="primary"
                              size="sm"
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            >
                              Approve Sign-off
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : activeTab === 'invoices' ? (
        /* INVOICES TAB */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
          {invoices.map((inv) => (
            <div key={inv.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{inv.invoice_number}</span>
                  <StatusBadge status={inv.status} />
                </div>
                <p className="text-slate-500 mt-1">Due: {inv.due_date}</p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-base font-bold text-slate-900">{formatCurrency(inv.total_amount)}</span>
                  {(inv.balance_due || 0) > 0 && (
                    <span className="text-[11px] text-rose-600 block font-semibold">
                      Due: {formatCurrency(inv.balance_due || 0)}
                    </span>
                  )}
                </div>

                {inv.status !== 'paid' && (
                  <Button
                    onClick={() => setPayingInvoice(inv)}
                    variant="primary"
                    size="sm"
                    icon={<CreditCard className="w-3.5 h-3.5" />}
                  >
                    Pay Online
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'files' ? (
        /* FILES TAB */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div key={file.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 truncate">{file.name || file.file_name}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{file.project_name}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">{(((file.size_bytes || file.file_size || 0) / (1024 * 1024))).toFixed(2)} MB</span>
                <button
                  onClick={() => {
                    const blob = new Blob([`Deliverable Asset: ${file.name || file.file_name}\nProject: ${file.project_name || 'FreelanceFlow'}\nSize: ${file.size_bytes || 0} bytes`], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.name || file.file_name || 'deliverable.txt';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  className="p-1.5 hover:bg-slate-100 text-indigo-600 rounded cursor-pointer"
                  title="Download deliverable"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* AGREEMENTS & PROPOSALS TAB */
        <div className="space-y-4">
          {contracts.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-sm text-slate-900 block">{c.title}</span>
                <span className="text-slate-500 mt-1 block">Value: {formatCurrency(c.value || c.total_value || 0)}</span>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={c.status} />
                {c.status !== 'signed' && (
                  <Button
                    onClick={() => handleSignContract(c.id)}
                    variant="primary"
                    size="sm"
                    icon={<FileSignature className="w-3.5 h-3.5" />}
                  >
                    Sign Contract
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment simulation modal */}
      <Modal
        isOpen={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        title="Secure Stripe Payment"
        description={`Settling ${payingInvoice?.invoice_number} for ${formatCurrency(payingInvoice?.balance_due || payingInvoice?.total_amount || 0)}`}
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="font-bold text-slate-900">Card ending in 4242</p>
              <p className="text-[11px] text-slate-500">Stripe test card token simulated</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPayingInvoice(null)}>Cancel</Button>
            <Button variant="primary" onClick={handlePayInvoice}>Pay {formatCurrency(payingInvoice?.balance_due || payingInvoice?.total_amount || 0)}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
