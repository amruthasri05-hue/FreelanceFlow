import React, { useState, useEffect } from 'react';
import { useRouter } from '../../contexts/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase/db';
import { Proposal, Client, ProposalStatus } from '../../types';
import { proposalSchema } from '../../lib/validations';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/format';
import {
  FileText, Plus, DollarSign, ArrowRight, CheckCircle2,
  Calendar, Trash2, Edit2, Send, Sparkles
} from 'lucide-react';

export const ProposalsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [scope, setScope] = useState('');
  const [amount, setAmount] = useState(12000);
  const [validUntil, setValidUntil] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allProposals, allClients] = await Promise.all([
        db.getProposals(user.id),
        db.getClients(user.id),
      ]);
      setProposals(allProposals);
      setClients(allClients);
      if (allClients.length > 0 && !clientId) {
        setClientId(allClients[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenCreate = () => {
    setTitle('');
    setScope('');
    setAmount(12000);
    setValidUntil(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    const validation = proposalSchema.safeParse({
      title,
      client_id: clientId,
      scope,
      total_amount: Number(amount),
      valid_until: validUntil,
      status: 'sent',
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation error');
      return;
    }

    await db.createProposal({
      freelancer_id: user.id,
      client_id: clientId,
      title,
      scope,
      content: scope,
      estimated_amount: Number(amount),
      total_amount: Number(amount),
      currency: 'USD',
      valid_until: validUntil,
      status: 'sent',
    });

    setIsModalOpen(false);
    loadData();
  };

  const handleUpdateStatus = async (proposalId: string, status: ProposalStatus) => {
    await db.updateProposal(proposalId, { status });
    loadData();
  };

  const handleConvertToProject = async (proposal: Proposal) => {
    if (!user) return;
    const newProject = await db.createProject({
      freelancer_id: user.id,
      client_id: proposal.client_id,
      name: proposal.title,
      description: proposal.scope || proposal.content,
      status: 'active',
      budget: proposal.total_amount || proposal.estimated_amount || 0,
      progress: 0,
      currency: 'USD',
    });
    await db.updateProposal(proposal.id, { status: 'accepted' });
    navigate(`/projects/${newProject.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Proposals & Estimates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create client pitch proposals and convert accepted quotes into active projects
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          New Proposal
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Loading proposals..." />
      ) : proposals.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="No proposals created yet"
          description="Send professional proposals with itemized scopes and quote values to prospective clients."
          actionLabel="Create Proposal"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {proposals.map((prop) => (
            <div
              key={prop.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    {prop.client?.name || 'Prospective Client'}
                  </span>
                  <StatusBadge status={prop.status} />
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{prop.title}</h3>

                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed whitespace-pre-line">
                  {prop.scope}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Quote:</span>
                  <span className="text-base font-bold text-slate-900">
                    {formatCurrency(prop.total_amount || prop.estimated_amount || 0)}
                  </span>
                </div>

                {prop.valid_until && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Valid until:</span>
                    <span>{prop.valid_until}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-2">
                  {prop.status !== 'accepted' ? (
                    <button
                      onClick={() => handleUpdateStatus(prop.id, 'accepted')}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 cursor-pointer"
                    >
                      Mark Accepted
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConvertToProject(prop)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Convert to Project</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {prop.status === 'sent' && (
                    <button
                      onClick={() => handleUpdateStatus(prop.id, 'rejected')}
                      className="text-xs text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Proposal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Proposal"
        description="Draft a client proposal with scope deliverables and quote budget."
      >
        {formError && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Proposal Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next.js SaaS Web Architecture & Design"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Target Client *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.company || 'Client'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Scope & Deliverables *</label>
            <textarea
              rows={4}
              required
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="1. UX Wireframing and design tokens&#10;2. Production React frontend implementation&#10;3. Cloud database deployment & RLS rules"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Total Fee (₹ INR) *</label>
              <input
                type="number"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Quote Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Send Proposal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
