import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../../contexts/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTimer } from '../../contexts/TimerContext';
import { db } from '../../lib/supabase/db';
import { Notification } from '../../types';
import {
  Menu, Bell, Play, Square, Clock, Plus,
  Search, CheckCircle2, ChevronDown, Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';

interface AppHeaderProps {
  onToggleMobile: () => void;
  onOpenQuickCreate?: (type: 'project' | 'task' | 'invoice' | 'client') => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onToggleMobile, onOpenQuickCreate }) => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { activeTimer, stopTimer, formattedTime } = useTimer();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);

  // Load notifications
  useEffect(() => {
    if (!user) return;
    db.getNotifications(user.id).then(setNotifications);
  }, [user]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setShowQuickAdd(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    await db.markAllNotificationsRead(user.id);
    const updated = await db.getNotifications(user.id);
    setNotifications(updated);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      {/* Left section: Hamburger & Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="p-2 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden sm:block w-64 lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, tasks, invoices..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Right section: Timer widget, Quick Add, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Timer Header Display */}
        {activeTimer ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200/80 rounded-lg shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping shrink-0" />
            <span className="text-xs font-mono font-bold text-indigo-900">{formattedTime}</span>
            <span className="text-xs text-indigo-700 hidden md:inline truncate max-w-[120px]">
              {activeTimer.taskTitle || activeTimer.projectName}
            </span>
            <Button
              onClick={() => stopTimer()}
              variant="danger"
              size="sm"
              className="py-1 px-2 text-xs h-7"
              icon={<Square className="w-3 h-3 fill-current" />}
            >
              Stop
            </Button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/time')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            title="Start time tracker"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Track Time</span>
          </button>
        )}

        {/* Quick Add Menu */}
        {onOpenQuickCreate && (
          <div className="relative" ref={quickAddRef}>
            <Button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              className="shadow-2xs"
            >
              <span className="hidden sm:inline">New</span>
            </Button>

            {showQuickAdd && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                <button
                  onClick={() => { setShowQuickAdd(false); onOpenQuickCreate('project'); }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium cursor-pointer"
                >
                  + New Project
                </button>
                <button
                  onClick={() => { setShowQuickAdd(false); onOpenQuickCreate('task'); }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium cursor-pointer"
                >
                  + New Task
                </button>
                <button
                  onClick={() => { setShowQuickAdd(false); onOpenQuickCreate('invoice'); }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium cursor-pointer"
                >
                  + New Invoice
                </button>
                <button
                  onClick={() => { setShowQuickAdd(false); onOpenQuickCreate('client'); }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium cursor-pointer"
                >
                  + New Client
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No notifications right now
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        db.markNotificationRead(n.id);
                        if (n.link) navigate(n.link);
                        setShowNotifs(false);
                      }}
                      className={`p-3 text-xs cursor-pointer transition-colors ${
                        !n.is_read ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-800">{n.title}</span>
                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1 shrink-0" />}
                      </div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer group"
          title="Account Settings"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-indigo-500/30 transition-all"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
