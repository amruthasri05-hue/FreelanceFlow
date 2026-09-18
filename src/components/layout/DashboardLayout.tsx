import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { db } from '../../lib/supabase/db';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../contexts/RouterContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { navigate } = useRouter();

  // Quick create modal state
  const [quickCreateType, setQuickCreateType] = useState<'project' | 'task' | 'invoice' | 'client' | null>(null);

  // Quick project form state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClientId, setNewProjectClientId] = useState('');
  const [newProjectBudget, setNewProjectBudget] = useState(5000);
  const [clientsList, setClientsList] = useState<Array<{ id: string; name: string }>>([]);

  const handleOpenQuickCreate = async (type: 'project' | 'task' | 'invoice' | 'client') => {
    if (type === 'task') {
      navigate('/tasks');
      return;
    }
    if (type === 'invoice') {
      navigate('/invoices');
      return;
    }
    if (type === 'client') {
      navigate('/clients');
      return;
    }
    // For project: load clients
    const clients = await db.getClients(user?.id);
    setClientsList(clients);
    if (clients.length > 0) setNewProjectClientId(clients[0].id);
    setQuickCreateType('project');
  };

  const handleCreateQuickProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProjectName.trim()) return;

    await db.createProject({
      freelancer_id: user.id,
      client_id: newProjectClientId || undefined,
      name: newProjectName,
      status: 'active',
      budget: Number(newProjectBudget) || 0,
      progress: 0,
      currency: 'USD',
    });

    setQuickCreateType(null);
    setNewProjectName('');
    navigate('/projects');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <AppSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <AppHeader
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          onOpenQuickCreate={handleOpenQuickCreate}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Quick Create Project Modal */}
      <Modal
        isOpen={quickCreateType === 'project'}
        onClose={() => setQuickCreateType(null)}
        title="Create New Project"
        description="Launch a new project workspace for your client."
      >
        <form onSubmit={handleCreateQuickProject} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Mobile Banking Application"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Assign Client *</label>
            <select
              value={newProjectClientId}
              onChange={(e) => setNewProjectClientId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Budget ($ USD)</label>
            <input
              type="number"
              min="0"
              value={newProjectBudget}
              onChange={(e) => setNewProjectBudget(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuickCreateType(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
