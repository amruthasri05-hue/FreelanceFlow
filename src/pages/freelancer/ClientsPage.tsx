import React, { useState, useEffect } from 'react';
import { useRouter } from '../../contexts/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase/db';
import { Client, Project, Invoice } from '../../types';
import { clientSchema } from '../../lib/validations';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/format';
import {
  Users, Plus, Search, Mail, Phone, Globe, DollarSign,
  FolderKanban, ExternalLink, Archive, CheckCircle2, ChevronRight
} from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [cls, prjs, invs] = await Promise.all([
        db.getClients(user.id),
        db.getProjects(user.id),
        db.getInvoices(user.id),
      ]);
      setClients(cls);
      setProjects(prjs);
      setInvoices(invs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setNotes('');
    setAddress('');
    setCurrency('USD');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCompany(client.company || '');
    setEmail(client.email);
    setPhone(client.phone || '');
    setWebsite(client.website || '');
    setNotes(client.notes || '');
    setAddress(client.address || '');
    setCurrency(client.currency || 'USD');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    const validation = clientSchema.safeParse({
      name,
      company,
      email,
      phone,
      website,
      notes,
      address,
      currency,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation error');
      return;
    }

    if (editingClient) {
      await db.updateClient(editingClient.id, {
        name,
        company,
        email,
        phone,
        website,
        notes,
        address,
        currency,
      });
    } else {
      await db.createClient({
        freelancer_id: user.id,
        name,
        company,
        email,
        phone,
        website,
        notes,
        address,
        currency,
      });
    }

    setIsModalOpen(false);
    loadData();
  };

  const filteredClients = clients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Clients</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Maintain client records, associated projects, and billed amounts
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Client
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by name, company, or email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <LoadingState message="Fetching client directory from database..." />
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="No clients yet"
          description="Add your first client to get started organizing projects and invoices."
          actionLabel="Add Client"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const clientProjects = projects.filter((p) => p.client_id === client.id);
            const clientInvoices = invoices.filter((i) => i.client_id === client.id);
            const totalBilled = clientInvoices.reduce((acc, inv) => acc + inv.total_amount, 0);

            return (
              <div
                key={client.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                      {client.name.charAt(0)}
                    </div>
                    <button
                      onClick={() => handleOpenEdit(client)}
                      className="text-xs font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{client.name}</h3>
                  <p className="text-xs font-medium text-slate-500">{client.company || 'Private Client'}</p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-indigo-600 truncate">{client.website}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Projects</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
                      {clientProjects.length} active
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block">Total Billed</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      {formatCurrency(totalBilled)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Client Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Edit Client Record' : 'Add New Client'}
        description="Enter client contact credentials, company details, and billing preferences."
      >
        {formError && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Contact Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marcus Vance"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Nova Labs Inc."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marcus@novalabs.ai"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 392-1092"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://novalabs.ai"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Office Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="100 Market St, Suite 400, San Francisco, CA"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Private Client Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key stakeholder expectations, payment terms, or preferred channels..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingClient ? 'Save Client' : 'Create Client'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
