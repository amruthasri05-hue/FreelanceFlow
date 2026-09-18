import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase/db';
import { Contract, Client, Project, ContractStatus } from '../../types';
import { contractSchema } from '../../lib/validations';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/format';
import {
  FileSignature, Plus, DollarSign, Calendar, CheckCircle2,
  FileCheck, Shield, Sparkles
} from 'lucide-react';

export const ContractsPage: React.FC = () => {
  const { user } = useAuth();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [content, setContent] = useState('');
  const [value, setValue] = useState(15000);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allContracts, allClients, allProjects] = await Promise.all([
        db.getContracts(user.id),
        db.getClients(user.id),
        db.getProjects(user.id),
      ]);
      setContracts(allContracts);
      setClients(allClients);
      setProjects(allProjects);

      if (allClients.length > 0 && !clientId) setClientId(allClients[0].id);
      if (allProjects.length > 0 && !projectId) setProjectId(allProjects[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenCreate = () => {
    setTitle('');
    setContent(
      `1. Scope of Work: The Contractor agrees to provide engineering services as specified.\n2. Payment Terms: Net 15 days upon milestone invoice submission.\n3. Intellectual Property: Full copyright transfers to the Client upon final payment settlement.\n4. Confidentiality: Both parties agree to protect proprietary source code.`
    );
    setValue(15000);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    const validation = contractSchema.safeParse({
      title,
      client_id: clientId,
      project_id: projectId || undefined,
      content,
      value: Number(value),
      status: 'sent',
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation error');
      return;
    }

    await db.createContract({
      freelancer_id: user.id,
      client_id: clientId,
      project_id: projectId || undefined,
      title,
      terms: content,
      content,
      total_value: Number(value),
      value: Number(value),
      status: 'sent',
    });

    setIsModalOpen(false);
    loadData();
  };

  const handleToggleSign = async (contract: Contract) => {
    const newStatus: ContractStatus = contract.status === 'signed' ? 'sent' : 'signed';
    await db.updateContract(contract.id, {
      status: newStatus,
      signed_at: newStatus === 'signed' ? new Date().toISOString() : undefined,
    });
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Contracts & Agreements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Legally binding agreements, digital signatures, terms, and scope governance
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          New Contract
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Loading legal contracts..." />
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="w-6 h-6" />}
          title="No contracts signed yet"
          description="Draft master service agreements or statements of work for your clients."
          actionLabel="Create Contract"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <FileSignature className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                        {contract.client?.name || 'Client'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {contract.title}
                      </h3>
                    </div>
                  </div>
                  <StatusBadge status={contract.status} />
                </div>

                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 font-mono text-xs text-slate-600 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                  {contract.content || contract.terms}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Agreement Value</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency(contract.value || contract.total_value || 0)}
                  </span>
                </div>

                <div className="text-right">
                  {contract.status === 'signed' ? (
                    <div className="flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Signed digitally</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleToggleSign(contract)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                    >
                      Sign Agreement
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Contract Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Draft New Contract"
        description="Establish formal terms of service, payment milestones, and intellectual property terms."
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Contract Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Services Agreement & Statement of Work"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Client *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Associated Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">No Project (General MSA)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Contract Value (₹ INR) *</label>
            <input
              type="number"
              min="0"
              required
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Terms & Clauses *</label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Send Agreement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
