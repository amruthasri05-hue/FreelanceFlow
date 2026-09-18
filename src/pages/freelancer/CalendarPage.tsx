import React, { useState, useEffect } from 'react';
import { useRouter } from '../../contexts/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase/db';
import { Project, Task, Milestone, Invoice } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingState } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/format';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Clock, Flag, CheckSquare, Receipt, FolderKanban
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'project' | 'task' | 'milestone' | 'invoice';
  date: string; // YYYY-MM-DD
  link?: string;
  subtitle?: string;
}

export const CalendarPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      if (!user) return;
      setLoading(true);
      try {
        const [projects, tasks, milestones, invoices] = await Promise.all([
          db.getProjects(user.id),
          db.getTasks(),
          db.getMilestones(),
          db.getInvoices(user.id),
        ]);

        const calendarEvents: CalendarEvent[] = [];

        projects.forEach((p) => {
          if (p.deadline) {
            calendarEvents.push({
              id: `prj-${p.id}`,
              title: `Project Deadline: ${p.name}`,
              type: 'project',
              date: p.deadline,
              link: `/projects/${p.id}`,
              subtitle: `Client: ${p.client?.name || 'Client'}`,
            });
          }
        });

        tasks.forEach((t) => {
          if (t.due_date) {
            calendarEvents.push({
              id: `tsk-${t.id}`,
              title: `Task: ${t.title}`,
              type: 'task',
              date: t.due_date,
              link: `/tasks`,
              subtitle: `${t.project_name} (${t.priority})`,
            });
          }
        });

        milestones.forEach((m) => {
          if (m.due_date) {
            calendarEvents.push({
              id: `mls-${m.id}`,
              title: `Milestone: ${m.title}`,
              type: 'milestone',
              date: m.due_date,
              link: `/projects/${m.project_id}`,
              subtitle: `${formatCurrency(m.amount || 0)} deliverable`,
            });
          }
        });

        invoices.forEach((i) => {
          if (i.due_date) {
            calendarEvents.push({
              id: `inv-${i.id}`,
              title: `Invoice Due: ${i.invoice_number}`,
              type: 'invoice',
              date: i.due_date,
              link: `/invoices`,
              subtitle: `${formatCurrency(i.total_amount)} from ${i.client?.name || 'Client'}`,
            });
          }
        });

        setEvents(calendarEvents);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [user]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedDayEvents = events.filter((e) => e.date === selectedDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Schedule & Deadlines
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Synchronized calendar of project milestones, deliverables, and invoice payment due dates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm text-slate-800 min-w-[140px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading calendar timeline..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty padding cells */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 sm:h-24 p-1 bg-slate-50/50 rounded-lg border border-transparent" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = events.filter((e) => e.date === dateStr);
                const isSelected = selectedDate === dateStr;
                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-20 sm:h-24 p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                        : isToday
                        ? 'border-slate-300 bg-slate-50'
                        : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-indigo-600 text-white'
                            : isSelected
                            ? 'text-indigo-600 font-extrabold'
                            : 'text-slate-700'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      )}
                    </div>

                    <div className="space-y-0.5 mt-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`text-[9px] truncate px-1 py-0.5 rounded font-medium ${
                            ev.type === 'invoice'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ev.type === 'milestone'
                              ? 'bg-amber-100 text-amber-800'
                              : ev.type === 'project'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] text-slate-400 font-semibold block px-1">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Selected Day Agenda */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Agenda for Date</h3>
                  <p className="text-xs text-indigo-600 font-semibold">{selectedDate}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700">
                  {selectedDayEvents.length} items
                </span>
              </div>

              {selectedDayEvents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No deliverables scheduled for this date.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => ev.link && navigate(ev.link)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all cursor-pointer text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600">
                          {ev.type}
                        </span>
                        <span className="text-[10px] text-slate-400">Scheduled</span>
                      </div>
                      <h4 className="font-bold text-slate-900 leading-snug">{ev.title}</h4>
                      {ev.subtitle && <p className="text-slate-500">{ev.subtitle}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Project Deadlines</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Milestone Sign-offs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Invoice Due Dates</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>Task Action Items</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
