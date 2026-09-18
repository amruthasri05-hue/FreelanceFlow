import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTimer } from '../../contexts/TimerContext';
import { db } from '../../lib/supabase/db';
import { TimeEntry, Project, Task } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/format';
import {
  Clock, Play, Square, Plus, DollarSign, Calendar,
  FolderKanban, CheckSquare, Trash2, RotateCcw
} from 'lucide-react';

export const TimeTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const { activeTimer, startTimer, stopTimer, discardTimer, formattedTime } = useTimer();

  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Active timer starter form
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [timerDesc, setTimerDesc] = useState('');

  // Manual entry modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualHours, setManualHours] = useState(2);
  const [manualDesc, setManualDesc] = useState('');
  const [manualProjectId, setManualProjectId] = useState('');
  const [manualTaskId, setManualTaskId] = useState('');
  const [isBillable, setIsBillable] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [entries, projs, tsks] = await Promise.all([
        db.getTimeEntries(),
        db.getProjects(user.id),
        db.getTasks(),
      ]);
      setTimeEntries(entries);
      setProjects(projs);
      setTasks(tsks);

      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0].id);
        setManualProjectId(projs[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleStartLiveTimer = () => {
    if (!selectedProjectId) return;
    startTimer(selectedProjectId, timerDesc || 'Working on project deliverable', selectedTaskId || undefined);
    setTimerDesc('');
  };

  const handleSaveManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !manualProjectId) return;

    await db.createTimeEntry({
      user_id: user.id,
      project_id: manualProjectId,
      task_id: manualTaskId || undefined,
      description: manualDesc || 'Manual work log',
      duration_minutes: Math.round(Number(manualHours) * 60),
      is_billable: isBillable,
      hourly_rate: user.hourly_rate || 100,
    });

    setIsManualModalOpen(false);
    setManualDesc('');
    setManualHours(2);
    loadData();
  };

  const totalMinutes = timeEntries.reduce((acc, t) => acc + t.duration_minutes, 0);
  const totalHours = totalMinutes / 60;
  const totalBillableAmount = timeEntries.reduce((acc, t) => {
    return t.is_billable ? acc + ((t.duration_minutes / 60) * t.hourly_rate) : acc;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Time Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record billable client hours with live stopwatch or manual entries
          </p>
        </div>

        <Button
          onClick={() => setIsManualModalOpen(true)}
          variant="outline"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Manual Time
        </Button>
      </div>

      {/* Live Stopwatch Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${activeTimer ? 'bg-rose-500 animate-ping' : 'bg-slate-300'}`} />
              {activeTimer ? 'Active Stopwatch' : 'Stopwatch Ready'}
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-extrabold text-slate-900 tracking-tight">
              {activeTimer ? formattedTime : '00:00:00'}
            </div>
            {activeTimer && (
              <p className="text-xs text-slate-500">
                Tracking on <span className="font-semibold text-slate-700">{activeTimer.projectName}</span>
                {activeTimer.taskTitle ? ` → ${activeTimer.taskTitle}` : ''}
              </p>
            )}
          </div>

          {activeTimer ? (
            <div className="flex items-center gap-3">
              <Button
                onClick={async () => { await stopTimer(); loadData(); }}
                variant="danger"
                size="lg"
                icon={<Square className="w-4 h-4 fill-current" />}
              >
                Stop & Log Time
              </Button>
              <Button
                onClick={discardTimer}
                variant="outline"
                size="lg"
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Discard
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <input
                type="text"
                value={timerDesc}
                onChange={(e) => setTimerDesc(e.target.value)}
                placeholder="What are you working on?"
                className="px-3.5 py-2 text-xs border border-slate-300 rounded-lg w-full sm:w-64"
              />

              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <Button
                onClick={handleStartLiveTimer}
                variant="primary"
                size="md"
                icon={<Play className="w-4 h-4 fill-current" />}
              >
                Start Timer
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Time Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold">Total Logged Hours</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalHours.toFixed(1)} hrs</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Across all projects</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold">Estimated Billable Value</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalBillableAmount)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">At configured rates</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold">Total Time Sessions</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{timeEntries.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Saved in database</span>
        </div>
      </div>

      {/* Time Entries History Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Logged Time Entries</h3>
          <span className="text-xs text-slate-500">{timeEntries.length} entries</span>
        </div>

        {loading ? (
          <LoadingState message="Loading time logs from Supabase..." />
        ) : timeEntries.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-6 h-6" />}
            title="No time entries logged"
            description="Start the timer or add a manual entry to track your billable project hours."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {timeEntries.map((entry) => {
              const hours = (entry.duration_minutes / 60).toFixed(1);
              const amount = ((entry.duration_minutes / 60) * entry.hourly_rate).toFixed(2);

              return (
                <div key={entry.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{entry.description || 'Sprint Work'}</span>
                      {entry.is_billable && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          Billable
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Project: {entry.project_name || 'Project'} • Date: {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">{hours} hrs</span>
                      <span className="text-[11px] text-emerald-600 block font-semibold">{formatCurrency(Number(amount))}</span>
                    </div>

                    <button
                      onClick={async () => {
                        await db.deleteTimeEntry(entry.id);
                        loadData();
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                      title="Delete time entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Time Entry Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Add Manual Time Entry"
        description="Record hours spent on offline work, meetings, or previous sprints."
      >
        <form onSubmit={handleSaveManualEntry} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Project *</label>
            <select
              value={manualProjectId}
              onChange={(e) => setManualProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Work Description *</label>
            <input
              type="text"
              required
              value={manualDesc}
              onChange={(e) => setManualDesc(e.target.value)}
              placeholder="e.g. Architecture review & schema migration"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Duration (Hours)</label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={manualHours}
                onChange={(e) => setManualHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBillable}
                  onChange={(e) => setIsBillable(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-700">Billable to Client</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsManualModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
