import React, { useState, useEffect } from 'react';
import { useRouter } from '../../contexts/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTimer } from '../../contexts/TimerContext';
import { db } from '../../lib/supabase/db';
import {
  Project, Milestone, Task, ProjectFile, TimeEntry, Message, ActivityLog, Invoice
} from '../../types';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/format';
import {
  ArrowLeft, CheckSquare, Flag, FileText, Clock, MessageSquare,
  DollarSign, Activity, Plus, Play, CheckCircle2, Download,
  Send, Calendar, Upload, Sparkles, AlertCircle
} from 'lucide-react';

type TabKey = 'overview' | 'tasks' | 'milestones' | 'files' | 'time' | 'messages' | 'billing';

interface ProjectDetailPageProps {
  projectId?: string;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ projectId: propProjectId }) => {
  const { params, navigate } = useRouter();
  const { user } = useAuth();
  const { startTimer } = useTimer();

  const projectId = propProjectId || params.projectId || params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);

  // Sub-entity states
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Sub-entity creation modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneAmount, setNewMilestoneAmount] = useState(2500);
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('');

  // Message chat input
  const [chatMessage, setChatMessage] = useState('');

  // File upload simulated input
  const [newFileName, setNewFileName] = useState('');
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  const loadProjectData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [proj, mStones, tsks, fls, times, msgs, invs, logs] = await Promise.all([
        db.getProjectById(projectId),
        db.getMilestones(projectId),
        db.getTasks(projectId),
        db.getFiles(projectId),
        db.getTimeEntries(projectId),
        db.getMessages(projectId),
        db.getInvoices(undefined, projectId),
        db.getActivityLogs(projectId),
      ]);

      setProject(proj);
      setMilestones(mStones);
      setTasks(tsks);
      setFiles(fls);
      setTimeEntries(times);
      setMessages(msgs);
      setInvoices(invs);
      setActivities(logs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  if (loading || !project) {
    return <LoadingState message="Loading project workspace..." />;
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;

    await db.createTask({
      project_id: project.id,
      title: newTaskTitle,
      status: 'todo',
      priority: newTaskPriority,
      due_date: newTaskDueDate || undefined,
    });

    setNewTaskTitle('');
    setIsTaskModalOpen(false);
    loadProjectData();
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    await db.updateTask(task.id, { status: nextStatus });
    loadProjectData();
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    await db.createMilestone({
      project_id: project.id,
      title: newMilestoneTitle,
      amount: Number(newMilestoneAmount) || 0,
      due_date: newMilestoneDueDate || undefined,
      status: 'pending',
    });

    setNewMilestoneTitle('');
    setIsMilestoneModalOpen(false);
    loadProjectData();
  };

  const handleToggleMilestone = async (m: Milestone) => {
    const nextStatus = m.status === 'completed' ? 'pending' : 'completed';
    await db.updateMilestone(m.id, { status: nextStatus });
    loadProjectData();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !user) return;

    await db.sendMessage({
      project_id: project.id,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: user.role,
      content: chatMessage,
    });

    setChatMessage('');
    const updated = await db.getMessages(project.id);
    setMessages(updated);
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim() || !user) return;

    await db.createFile({
      project_id: project.id,
      uploader_id: user.id,
      name: newFileName,
      file_path: `projects/${project.id}/${newFileName.toLowerCase().replace(/\s+/g, '-')}`,
      size_bytes: 1450000,
      mime_type: 'application/pdf',
      is_client_accessible: true,
    });

    setNewFileName('');
    setIsFileModalOpen(false);
    loadProjectData();
  };

  const totalTrackedHours = timeEntries.reduce((acc, t) => acc + (t.duration_minutes / 60), 0);
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* Back button & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <span className="font-semibold text-slate-700">{project.client?.name || 'Unassigned'}</span> • Budget: {formatCurrency(project.budget)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => startTimer(project.id, `Sprint work on ${project.name}`)}
            variant="primary"
            size="sm"
            icon={<Play className="w-3.5 h-3.5 fill-current" />}
          >
            Start Timer
          </Button>
          <Button
            onClick={() => setIsTaskModalOpen(true)}
            variant="outline"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-slate-200 bg-white px-2 rounded-xl shadow-xs overflow-x-auto flex items-center gap-1">
        {[
          { key: 'overview', label: 'Overview', icon: FileText },
          { key: 'tasks', label: `Tasks (${tasks.length})`, icon: CheckSquare },
          { key: 'milestones', label: `Milestones (${milestones.length})`, icon: Flag },
          { key: 'files', label: `Files (${files.length})`, icon: FileText },
          { key: 'time', label: `Time (${totalTrackedHours.toFixed(1)}h)`, icon: Clock },
          { key: 'messages', label: `Messages (${messages.length})`, icon: MessageSquare },
          { key: 'billing', label: `Billing (${invoices.length})`, icon: DollarSign },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as TabKey)}
              className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Project Scope & Description</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {project.description || 'No detailed scope written for this project.'}
              </p>

              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Overall Completion Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Milestones preview */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Project Deliverables & Milestones</h3>
                <Button onClick={() => setIsMilestoneModalOpen(true)} variant="outline" size="sm">
                  + Add Milestone
                </Button>
              </div>

              <div className="space-y-3">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={m.status === 'completed'}
                        onChange={() => handleToggleMilestone(m)}
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                      />
                      <div>
                        <p className={`font-semibold text-slate-800 ${m.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                          {m.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Due: {m.due_date || 'No deadline'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">{formatCurrency(m.amount)}</span>
                      <StatusBadge status={m.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column Specs */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Project Attributes</h3>

              <div>
                <span className="text-slate-400 block mb-0.5">Client</span>
                <span className="font-semibold text-slate-800">{project.client?.name || 'Unassigned'}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Total Budget</span>
                <span className="font-bold text-emerald-600 text-sm">{formatCurrency(project.budget)}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Timeline Dates</span>
                <span className="text-slate-700 font-medium">
                  {project.start_date || 'TBD'} → {project.deadline || 'No deadline'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Invoiced to Date</span>
                <span className="text-slate-800 font-semibold">{formatCurrency(totalInvoiced)}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Hours Logged</span>
                <span className="text-slate-800 font-semibold">{totalTrackedHours.toFixed(1)} hrs</span>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Audit Activity</h3>
              <div className="space-y-3 text-xs">
                {activities.slice(0, 4).map((a) => (
                  <div key={a.id} className="border-l-2 border-indigo-500 pl-3">
                    <p className="text-slate-700 font-medium">
                      {a.user_name} {a.action} {a.entity_type}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Tasks & Deliverable Checklist</h3>
            <Button onClick={() => setIsTaskModalOpen(true)} variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              Add Task
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
            {tasks.map((task) => (
              <div key={task.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => handleToggleTaskStatus(task)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <div>
                    <h4 className={`font-semibold text-slate-800 ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {task.due_date ? `Due ${task.due_date}` : 'No deadline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={task.priority} />
                  <StatusBadge status={task.status} />
                  <Button
                    onClick={() => startTimer(project.id, task.title, task.id)}
                    variant="ghost"
                    size="icon"
                    title="Track time on this task"
                  >
                    <Play className="w-3.5 h-3.5 text-indigo-600 fill-current" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Project Delivery Milestones</h3>
            <Button onClick={() => setIsMilestoneModalOpen(true)} variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              New Milestone
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones.map((m) => (
              <div key={m.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge status={m.status} />
                    <span className="text-base font-bold text-slate-900">{formatCurrency(m.amount)}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{m.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">Due date: {m.due_date || 'None set'}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <button
                    onClick={() => handleToggleMilestone(m)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {m.status === 'completed' ? 'Mark as Pending' : 'Approve & Mark Completed'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FILES */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Project Deliverables & Cloud Files</h3>
            <Button onClick={() => setIsFileModalOpen(true)} variant="primary" size="sm" icon={<Upload className="w-4 h-4" />}>
              Upload File
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
            {files.map((f) => (
              <div key={f.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{f.name || f.file_name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {(((f.size_bytes || f.file_size || 0) / 1024 / 1024)).toFixed(2)} MB • {f.is_client_accessible ? 'Client Accessible' : 'Private'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const blob = new Blob([`FreelanceFlow file export: ${f.name || f.file_name}`], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = f.file_name || 'document.pdf';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TIME */}
      {activeTab === 'time' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tracked Time Entries</h3>
              <p className="text-xs text-slate-500">Total: {totalTrackedHours.toFixed(1)} billable hours</p>
            </div>
            <Button
              onClick={() => startTimer(project.id, `Development on ${project.name}`)}
              variant="primary"
              size="sm"
              icon={<Play className="w-3.5 h-3.5 fill-current" />}
            >
              Start Stopwatch
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
            {timeEntries.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-semibold text-slate-800">{t.description || 'Sprint work'}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Logged: {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-indigo-600">{(t.duration_minutes / 60).toFixed(1)} hrs</p>
                  <span className="text-[11px] text-slate-400">{formatCurrency((t.duration_minutes / 60) * t.hourly_rate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: MESSAGES */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Project Communication Channel</h3>
            <span className="text-xs text-slate-400">Scoped to {project.name}</span>
          </div>

          {/* Chat transcript */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m) => {
              const isMe = m.sender_id === user?.id || m.sender_role === 'freelancer';
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-slate-700">{m.sender_name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">({m.sender_role})</span>
                  </div>
                  <div
                    className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {m.content}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chat input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200/80 bg-slate-50/50 flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Send project update or message to client..."
              className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <Button type="submit" variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
              Send
            </Button>
          </form>
        </div>
      )}

      {/* TAB 7: BILLING */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Invoices & Financial Summary</h3>
              <p className="text-xs text-slate-500">Total Billed: {formatCurrency(totalInvoiced)}</p>
            </div>
            <Button onClick={() => navigate('/invoices')} variant="primary" size="sm">
              Manage All Invoices
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-semibold text-slate-800">{inv.invoice_number}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Issued: {inv.issue_date} • Due: {inv.due_date}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatCurrency(inv.total_amount)}</p>
                    <p className="text-[10px] text-slate-400">Balance: {formatCurrency(inv.balance_due ?? (inv.total_amount - inv.amount_paid))}</p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: New Task */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add Project Task"
        description="Specify action deliverable, priority level, and deadline."
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Implement checkout flow unit tests"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: New Milestone */}
      <Modal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        title="Create Milestone"
        description="Add a phased payment target and deliverables milestone."
      >
        <form onSubmit={handleCreateMilestone} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Milestone Title *</label>
            <input
              type="text"
              required
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder="e.g. Phase 2: Design Approval & Sign-off"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Amount (₹ INR)</label>
              <input
                type="number"
                min="0"
                value={newMilestoneAmount}
                onChange={(e) => setNewMilestoneAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Date</label>
              <input
                type="date"
                value={newMilestoneDueDate}
                onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsMilestoneModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Upload File */}
      <Modal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        title="Upload Project Deliverable"
        description="Attach design specifications, contracts, or build artifacts."
      >
        <form onSubmit={handleUploadFile} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">File Name *</label>
            <input
              type="text"
              required
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. Design-Tokens-Specification.pdf"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50">
            <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">Drag and drop file here, or browse</p>
            <p className="text-[11px] text-slate-400 mt-1">PDF, PNG, SVG, ZIP, Figma files up to 50MB</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsFileModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Attach & Upload
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
