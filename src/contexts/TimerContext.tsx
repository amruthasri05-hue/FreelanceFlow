import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/supabase/db';
import { useAuth } from './AuthContext';

interface ActiveTimer {
  projectId: string;
  projectName?: string;
  taskId?: string;
  taskTitle?: string;
  description: string;
  startedAt: number; // timestamp ms
  elapsedSeconds: number;
}

interface TimerContextType {
  activeTimer: ActiveTimer | null;
  startTimer: (projectId: string, description: string, taskId?: string) => void;
  stopTimer: () => Promise<void>;
  discardTimer: () => void;
  formattedTime: string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => {
    try {
      const saved = localStorage.getItem('freelanceflow_active_timer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [seconds, setSeconds] = useState<number>(0);

  // Tick active timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTimer) {
      const initialSeconds = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
      setSeconds(initialSeconds);
      interval = setInterval(() => {
        const curSeconds = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
        setSeconds(curSeconds);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  const startTimer = async (projectId: string, description: string, taskId?: string) => {
    const project = await db.getProjectById(projectId);
    const tasks = await db.getTasks(projectId);
    const task = taskId ? tasks.find(t => t.id === taskId) : undefined;

    const timer: ActiveTimer = {
      projectId,
      projectName: project?.name || 'Project',
      taskId,
      taskTitle: task?.title,
      description: description || 'Working on project',
      startedAt: Date.now(),
      elapsedSeconds: 0,
    };
    setActiveTimer(timer);
    localStorage.setItem('freelanceflow_active_timer', JSON.stringify(timer));
  };

  const stopTimer = async () => {
    if (!activeTimer || !user) return;
    const durationMinutes = Math.max(1, Math.round(seconds / 60));
    
    await db.createTimeEntry({
      user_id: user.id,
      project_id: activeTimer.projectId,
      task_id: activeTimer.taskId,
      description: activeTimer.description,
      duration_minutes: durationMinutes,
      is_billable: true,
      hourly_rate: user.hourly_rate || 100,
    });

    setActiveTimer(null);
    localStorage.removeItem('freelanceflow_active_timer');
    setSeconds(0);
  };

  const discardTimer = () => {
    setActiveTimer(null);
    localStorage.removeItem('freelanceflow_active_timer');
    setSeconds(0);
  };

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <TimerContext.Provider value={{ activeTimer, startTimer, stopTimer, discardTimer, formattedTime }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
