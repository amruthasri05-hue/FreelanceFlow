import React, { useState, useEffect } from 'react';
import { useRouter } from '../../contexts/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase/db';
import { Project, Client, ProjectStatus } from '../../types';
import { projectSchema } from '../../lib/validations';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/format';
import {
  FolderKanban, Plus, Search, Filter, Calendar, DollarSign,
  ChevronRight, Archive, CheckCircle, Clock
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [budget, setBudget] = useState(10000);
  const [progress, setProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allProjects, allClients] = await Promise.all([
        db.getProjects(user.id, 'freelancer'),
        db.getClients(user.id),
      ]);
      setProjects(allProjects);
      setClients(allClients);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setClientId(clients[0]?.id || '');
    setStatus('active');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDeadline('');
    setBudget(10000);
    setProgress(0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setClientId(project.client_id || clients[0]?.id || '');
    setStatus(project.status);
    setStartDate(project.start_date || '');
    setDeadline(project.deadline || '');
    setBudget(project.budget);
    setProgress(project.progress);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleArchiveToggle = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    await db.updateProject(project.id, { is_archived: !project.is_archived });
    fetchProjects();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    setFormError(null);

    const validation = projectSchema.safeParse({
      name,
      description,
      client_id: clientId,
      status,
      start_date: startDate,
      deadline,
      budget: Number(budget),
      progress: Number(progress),
      currency: 'INR',
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProject) {
        await db.updateProject(editingProject.id, {
          name,
          description: description || undefined,
          client_id: clientId || undefined,
          status,
          start_date: startDate || undefined,
          deadline: deadline || undefined,
          budget: Number(budget),
          progress: Number(progress),
        });
      } else {
        await db.createProject({
          client_id: clientId ? clientId : null,
          name,
          description: description ? description : null,
          status,
          start_date: startDate ? startDate : null,
          deadline: deadline ? deadline : null,
          budget: Number(budget),
          progress: Number(progress),
          currency: 'INR',
        });
      }

      setIsModalOpen(false);
      await fetchProjects();
    } catch (err: unknown) {
      console.error('Error saving project:', err);
      let errorMsg = 'Failed to save project';
      if (err && typeof err === 'object') {
        const errorObj = err as Record<string, unknown>;
        if (typeof errorObj.message === 'string' && errorObj.message) {
          errorMsg = errorObj.message;
        } else if (typeof errorObj.details === 'string' && errorObj.details) {
          errorMsg = errorObj.details;
        } else if (typeof errorObj.hint === 'string' && errorObj.hint) {
          errorMsg = `${errorObj.message || 'Database error'}: ${errorObj.hint}`;
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setFormError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!showArchived && p.is_archived) return false;
    if (showArchived && !p.is_archived) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchClient = p.client?.name.toLowerCase().includes(q);
      if (!matchName && !matchClient) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Deliverables, client milestones, deadlines, and budget tracking
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          New Project
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by title or client..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
              showArchived
                ? 'bg-slate-800 text-white border-slate-800 font-semibold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Archived ({projects.filter(p => p.is_archived).length})
          </button>
        </div>
      </div>

      {/* Project Cards Grid */}
      {loading ? (
        <LoadingState message="Loading projects from Supabase..." />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-6 h-6" />}
          title={showArchived ? 'No archived projects' : 'No projects found'}
          description={
            showArchived
              ? 'Archived projects will appear here when closed out.'
              : 'Launch your first project to organize tasks, track milestones, and invite clients.'
          }
          actionLabel={!showArchived ? 'Create Project' : undefined}
          onAction={!showArchived ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                    {project.client?.name || 'Private Client'}
                  </span>
                  <StatusBadge status={project.status} />
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {project.name}
                </h3>

                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {project.description || 'No project description provided.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        project.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Deadlines and budget */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1 font-semibold text-slate-800">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{formatCurrency(project.budget)}</span>
                  </div>

                  {project.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{project.deadline}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={(e) => handleOpenEdit(e, project)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    Edit
                  </button>

                  <button
                    onClick={(e) => handleArchiveToggle(e, project)}
                    className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Archive className="w-3 h-3" />
                    <span>{project.is_archived ? 'Unarchive' : 'Archive'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Edit Project' : 'Create Project'}
        description="Configure project schedule, client allocation, and deliverables budget."
      >
        {formError && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design System & Frontend"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Client *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-xs sm:text-sm"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company || 'Client'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope details, technical requirements, and deliverable targets..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-xs sm:text-sm"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Progress ({progress}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Budget (₹ INR)</label>
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
