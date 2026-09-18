import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase/db';
import { Invoice, Client, Project, InvoiceItem, InvoiceStatus, PaymentMethod } from '../../types';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/format';
import {
  Receipt, Plus, DollarSign, Calendar, Download, Printer,
  CheckCircle2, CreditCard, Clock, FileText, Trash2
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal: Create Invoice
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unit_price: number }>>([
    { description: 'Sprint Engineering & Deliverables', quantity: 1, unit_price: 3500 },
  ]);
  const [taxRate, setTaxRate] = useState(0);

  // Modal: Record Payment
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');

  // Modal: View / Print Invoice
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allInvoices, allClients, allProjects] = await Promise.all([
        db.getInvoices(user.id),
        db.getClients(user.id),
        db.getProjects(user.id),
      ]);
      setInvoices(allInvoices);
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
    setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setItems([{ description: 'Software Architecture & Development', quantity: 1, unit_price: 3500 }]);
    setTaxRate(0);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setItems([...items, { description: 'Additional Task Deliverable', quantity: 1, unit_price: 500 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const next = [...items];
    (next[index] as any)[field] = val;
    setItems(next);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !clientId || items.length === 0) return;

    const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    await db.createInvoice({
      freelancer_id: user.id,
      client_id: clientId,
      project_id: projectId || undefined,
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate,
      subtotal,
      tax_rate: taxRate,
      tax_amount: tax,
      tax,
      discount: 0,
      total_amount: total,
      amount_paid: 0,
      balance_due: total,
      status: 'sent',
      items: items.map((it) => ({
        description: it.description,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        amount: Number(it.quantity) * Number(it.unit_price),
        total: Number(it.quantity) * Number(it.unit_price),
      })),
    });

    setIsModalOpen(false);
    loadData();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    await db.recordPayment({
      invoice_id: payingInvoice.id,
      amount: Number(paymentAmount),
      payment_method: paymentMethod,
    });

    setPayingInvoice(null);
    loadData();
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    return true;
  });

  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + i.total_amount, 0);

  const totalOutstanding = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((acc, i) => acc + (i.balance_due ?? (i.total_amount - i.amount_paid)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Invoices & Billing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Itemized invoicing, client settlement tracking, and payment receipts
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          Create Invoice
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Collected Revenue</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalRevenue)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Paid in full</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Outstanding Receivables</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalOutstanding)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting payment</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Invoices</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{invoices.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Generated in database</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        {['all', 'sent', 'paid', 'overdue', 'draft'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg capitalize font-semibold cursor-pointer transition-colors ${
              statusFilter === st
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      {loading ? (
        <LoadingState message="Loading invoices & payments..." />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title="No invoices found"
          description="Create and issue an itemized invoice to bill your clients."
          actionLabel="Create Invoice"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
          {filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-slate-900">{inv.invoice_number}</span>
                  <StatusBadge status={inv.status} />
                </div>
                <p className="text-xs text-slate-600">
                  Client: <span className="font-semibold text-slate-800">{inv.client?.name || 'Client'}</span>
                  {inv.project?.name ? ` • Project: ${inv.project.name}` : ''}
                </p>
                <p className="text-[11px] text-slate-400">
                  Issued: {inv.issue_date} • Due: {inv.due_date}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-base font-bold text-slate-900">{formatCurrency(inv.total_amount)}</p>
                  {(inv.balance_due || 0) > 0 ? (
                    <span className="text-[11px] text-rose-600 font-semibold">
                      Due: {formatCurrency(inv.balance_due || 0)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Paid in full
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setPreviewInvoice(inv)}
                    variant="outline"
                    size="sm"
                    icon={<FileText className="w-3.5 h-3.5" />}
                  >
                    View
                  </Button>

                  {inv.status !== 'paid' && (
                    <Button
                      onClick={() => {
                        setPayingInvoice(inv);
                        setPaymentAmount(inv.balance_due ?? (inv.total_amount - inv.amount_paid));
                      }}
                      variant="primary"
                      size="sm"
                      icon={<CreditCard className="w-3.5 h-3.5" />}
                    >
                      Record Pay
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Invoice */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Invoice"
        description="Add line items, taxes, and payment due dates for your client."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs sm:text-sm">
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
              <label className="block font-medium text-slate-700 mb-1">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">None / Retainer</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Payment Due Date *</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Line items */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <label className="block font-semibold text-slate-800">Line Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                + Add Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  placeholder="Service description"
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                  placeholder="Qty"
                  className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="number"
                  min="0"
                  value={item.unit_price}
                  onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                  placeholder="Price"
                  className="w-24 px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
                <span className="w-20 text-right font-bold text-xs">
                  {formatCurrency(item.quantity * item.unit_price)}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Issue Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Payment */}
      <Modal
        isOpen={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        title={`Record Payment for ${payingInvoice?.invoice_number}`}
        description="Register a wire transfer, card payment, or check settlement."
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Amount (₹ INR) *</label>
            <input
              type="number"
              min="1"
              max={payingInvoice?.balance_due}
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
            >
              <option value="bank_transfer">Wire / Bank Transfer</option>
              <option value="stripe">Stripe / Credit Card</option>
              <option value="paypal">PayPal</option>
              <option value="cash">Cash / Check</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setPayingInvoice(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View / Print Invoice */}
      <Modal
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        title={`Invoice ${previewInvoice?.invoice_number}`}
        description="Formal billing statement view."
        maxWidth="2xl"
      >
        {previewInvoice && (
          <div className="space-y-6 text-xs sm:text-sm print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">INVOICE</h2>
                <p className="font-mono text-xs text-indigo-600 font-bold">{previewInvoice.invoice_number}</p>
                <p className="text-slate-500 mt-1">Issued: {previewInvoice.issue_date}</p>
                <p className="text-slate-500">Due: {previewInvoice.due_date}</p>
              </div>

              <div className="text-right">
                <StatusBadge status={previewInvoice.status} />
                <p className="text-sm font-bold text-slate-800 mt-2">FreelanceFlow Studio</p>
                <p className="text-slate-500">{user?.email}</p>
              </div>
            </div>

            {/* Client Bill To */}
            <div className="bg-slate-50 p-4 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Billed To</span>
              <p className="font-bold text-slate-900">{previewInvoice.client?.name}</p>
              <p className="text-slate-600">{previewInvoice.client?.company}</p>
              <p className="text-slate-500">{previewInvoice.client?.email}</p>
            </div>

            {/* Line Items */}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewInvoice.items?.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2.5 font-medium text-slate-800">{it.description}</td>
                    <td className="py-2.5 text-center text-slate-600">{it.quantity}</td>
                    <td className="py-2.5 text-right text-slate-600">{formatCurrency(it.unit_price)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      {formatCurrency(it.total ?? it.amount ?? (it.quantity * it.unit_price))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t border-slate-200 pt-4 flex justify-end">
              <div className="w-56 space-y-1.5 text-right text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(previewInvoice.subtotal)}</span>
                </div>
                {((previewInvoice.tax || previewInvoice.tax_amount || 0) > 0) && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax:</span>
                    <span>{formatCurrency(previewInvoice.tax || previewInvoice.tax_amount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(previewInvoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(previewInvoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(previewInvoice.balance_due ?? (previewInvoice.total_amount - previewInvoice.amount_paid))}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                icon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Print / Save PDF
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => setPreviewInvoice(null)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
