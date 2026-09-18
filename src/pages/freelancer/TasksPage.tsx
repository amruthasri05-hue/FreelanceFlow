import React, { useState, useEffect } from 'react';
import { useRouter } from '../../contexts/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTimer } from '../../contexts/TimerContext';
import { db } from '../../lib/supabase/db';
import { Task, Project, TaskStatus, PriorityLevel } from '../../types';
import { taskSchema } from '../../lib/validations';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import {
  CheckSquare, Plus, Search, Filter, Play, Kanban,
  List, Calendar, Clock, Trash2, Edit2, ArrowRight
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const { startTimer } = useTimer();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allTasks, allProjects] = await Promise.all([
        db.getTasks(),
        db.getProjects(),
      ]);
      setTasks(allTasks);
      setProjects(allProjects);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = (initialStatus: TaskStatus = 'todo') => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setProjectId(projects[0]?.id || '');
    setPriority('medium');
    setStatus(initialStatus);
    setDueDate('');
    setEstimatedHours(4);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setProjectId(task.project_id);
    setPriority(task.priority);
    setStatus(task.status);
    setDueDate(task.due_date || '');
    setEstimatedHours(task.estimated_hours || 4);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await db.deleteTask(taskId);
      loadData();
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await db.updateTask(taskId, { status: newStatus });
    loadData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = taskSchema.safeParse({
      title,
      description,
      project_id: projectId,
      priority,
      status,
      due_date: dueDate || undefined,
      estimated_hours: Number(estimatedHours),
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation error');
      return;
    }

    if (editingTask) {
      await db.updateTask(editingTask.id, {
        title,
        description,
        project_id: projectId,
        priority,
        status,
        due_date: dueDate || undefined,
        estimated_hours: Number(estimatedHours),
      });
    } else {
      await db.createTask({
        title,
        description,
        project_id: projectId,
        priority,
        status,
        due_date: dueDate || undefined,
        estimated_hours: Number(estimatedHours),
      });
    }

    setIsModalOpen(false);
    loadData();
  };

  const filteredTasks = tasks.filter((t) => {
    if (projectFilter !== 'all' && t.project_id !== projectFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchProject = t.project_name?.toLowerCase().includes(q);
      if (!matchTitle && !matchProject) return false;
    }
    return true;
  });

  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'todo', label: 'To Do', color: 'border-slate-300' },
    { status: 'in_progress', label: 'In Progress', color: 'border-indigo-500' },
    { status: 'review', label: 'In Review', color: 'border-amber-500' },
    { status: 'completed', label: 'Completed', color: 'border-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Task Board</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage deliverable workflows, deadlines, and task time tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'list' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={() => handleOpenCreate('todo')}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Organizing task boards..." />
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex flex-col min-h-[450px]"
              >
                {/* Column header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{col.label}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenCreate(col.status)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tasks List */}
                <div className="space-y-2.5 flex-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs hover:shadow-sm transition-all text-xs"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider line-clamp-1">
                          {task.project_name || 'Project'}
                        </span>
                        <StatusBadge status={task.priority} />
                      </div>

                      <h4 className="font-bold text-slate-800 leading-snug">{task.title}</h4>

                      {task.description && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        {task.due_date ? (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {task.due_date}
                          </span>
                        ) : (
                          <span className="text-slate-400">No deadline</span>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startTimer(task.project_id, task.title, task.id)}
                            className="p-1 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer"
                            title="Start tracking time"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(task)}
                            className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                            title="Edit task"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Move Column Shortcut */}
                      <div className="mt-2 pt-2 border-t border-slate-100/60 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Move:</span>
                        <div className="flex gap-1">
                          {columns.filter(c => c.status !== task.status).map(c => (
                            <button
                              key={c.status}
                              onClick={() => handleStatusChange(task.id, c.status)}
                              className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium cursor-pointer"
                            >
                              {c.label.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
          {filteredTasks.map((task) => (
            <div key={task.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.status === 'completed'}
                  onChange={() => handleStatusChange(task.id, task.status === 'completed' ? 'todo' : 'completed')}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
                <div>
                  <h4 className={`font-semibold text-slate-800 ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                    {task.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {task.project_name} {task.due_date ? `• Due ${task.due_date}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={task.priority} />
                <StatusBadge status={task.status} />
                <button
                  onClick={() => startTimer(task.project_id, task.title, task.id)}
                  className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
                <button
                  onClick={() => handleOpenEdit(task)}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Add New Task'}
        description="Configure deliverable expectations, priority level, and timeline."
      >
        {formError && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement authentication middleware"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Associated Project *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Acceptance criteria and technical details..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
