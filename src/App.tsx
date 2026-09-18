import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TimerProvider } from './contexts/TimerContext';
import { RouterProvider, useRouter } from './contexts/RouterContext';

// Layout
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public & Auth Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Freelancer App Pages
import { DashboardPage } from './pages/freelancer/DashboardPage';
import { ProjectsPage } from './pages/freelancer/ProjectsPage';
import { ProjectDetailPage } from './pages/freelancer/ProjectDetailPage';
import { ClientsPage } from './pages/freelancer/ClientsPage';
import { TasksPage } from './pages/freelancer/TasksPage';
import { CalendarPage } from './pages/freelancer/CalendarPage';
import { TimeTrackingPage } from './pages/freelancer/TimeTrackingPage';
import { FilesPage } from './pages/freelancer/FilesPage';
import { MessagesPage } from './pages/freelancer/MessagesPage';
import { ProposalsPage } from './pages/freelancer/ProposalsPage';
import { ContractsPage } from './pages/freelancer/ContractsPage';
import { InvoicesPage } from './pages/freelancer/InvoicesPage';
import { AnalyticsPage } from './pages/freelancer/AnalyticsPage';
import { SettingsPage } from './pages/freelancer/SettingsPage';

// Client & Admin Pages
import { ClientPortalPage } from './pages/client/ClientPortalPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

const AppRoutes: React.FC = () => {
  const { path, params } = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Public Landing and Auth Routes
  if (path === '/') {
    return <LandingPage />;
  }
  if (path === '/login') {
    return <LoginPage />;
  }
  if (path === '/signup') {
    return <SignupPage />;
  }
  if (path === '/reset-password') {
    return <ResetPasswordPage />;
  }

  // Protected Dashboard Area
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Render role-specific or shared app views wrapped in DashboardLayout
  const renderContent = () => {
    // Client role redirect
    if (user?.role === 'client' && path === '/dashboard') {
      return <ClientPortalPage />;
    }

    // Admin role redirect
    if (user?.role === 'administrator' && path === '/dashboard') {
      return <AdminDashboardPage />;
    }

    if (path === '/dashboard') {
      return <DashboardPage />;
    }
    if (path === '/projects') {
      return <ProjectsPage />;
    }
    if (path.startsWith('/projects/') && params.id) {
      return <ProjectDetailPage projectId={params.id} />;
    }
    if (path === '/clients') {
      return <ClientsPage />;
    }
    if (path === '/tasks') {
      return <TasksPage />;
    }
    if (path === '/calendar') {
      return <CalendarPage />;
    }
    if (path === '/time') {
      return <TimeTrackingPage />;
    }
    if (path === '/files') {
      return <FilesPage />;
    }
    if (path === '/messages') {
      return <MessagesPage />;
    }
    if (path === '/proposals') {
      return <ProposalsPage />;
    }
    if (path === '/contracts') {
      return <ContractsPage />;
    }
    if (path === '/invoices') {
      return <InvoicesPage />;
    }
    if (path === '/analytics') {
      return <AnalyticsPage />;
    }
    if (path === '/settings') {
      return <SettingsPage />;
    }
    if (path === '/portal') {
      return <ClientPortalPage />;
    }
    if (path === '/admin') {
      return <AdminDashboardPage />;
    }

    // Default fallback
    return <DashboardPage />;
  };

  return <DashboardLayout>{renderContent()}</DashboardLayout>;
};

export default function App() {
  return (
    <AuthProvider>
      <TimerProvider>
        <RouterProvider>
          <AppRoutes />
        </RouterProvider>
      </TimerProvider>
    </AuthProvider>
  );
}
