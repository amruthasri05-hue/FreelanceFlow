import React from 'react';
import { useRouter } from '../contexts/RouterContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles, ArrowRight, CheckCircle2, Shield, FolderKanban,
  Users, Clock, Receipt, MessageSquare, ChevronRight, Star,
  Layers, Zap, BarChart3, FileSignature, Check
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, isSupabaseLive } = useAuth();

  const handleLaunch = () => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'client') navigate('/client/dashboard');
      else navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* 1. Navbar */}
      <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight">FreelanceFlow</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                SaaS
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#client-portal" className="hover:text-white transition-colors">Client Portal</a>
            <a href="#benefits" className="hover:text-white transition-colors">Benefits</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Log in
            </button>
            <Button
              onClick={() => navigate('/signup')}
              variant="primary"
              size="sm"
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              className="shadow-sm"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden px-4 sm:px-6">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/20 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-indigo-300 mb-6 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Full-Stack Freelance Project Management
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            One workspace. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">
              Every freelance project.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            FreelanceFlow centralizes clients, proposals, project milestones, tasks,
            time tracking, secure file storage, invoices, and a dedicated client collaboration portal.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button
              onClick={handleLaunch}
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto text-base font-semibold px-7 py-3 shadow-lg shadow-indigo-600/30"
            >
              Open Live Workspace
            </Button>
            <button
              onClick={() => {
                navigate('/login');
              }}
              className="w-full sm:w-auto text-sm font-medium px-5 py-3 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              {isSupabaseLive ? 'Sign In to Workspace' : 'Explore 1-Click Demo Accounts'}
            </button>
          </div>

          {/* Social Proof metrics */}
          <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">₹42,000+</p>
              <p className="text-xs text-slate-400 mt-1">Managed Freelance Billing</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">100%</p>
              <p className="text-xs text-slate-400 mt-1">PostgreSQL RLS Protected</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Real-time</p>
              <p className="text-xs text-slate-400 mt-1">Client Collaboration</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">0%</p>
              <p className="text-xs text-slate-400 mt-1">Context Switching</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Preview Interactive Card */}
      <section className="px-4 sm:px-8 max-w-6xl mx-auto -mt-4 mb-20 w-full">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2 sm:p-4 shadow-2xl shadow-indigo-950/40">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-[11px] text-slate-400">freelanceflow.dev/dashboard</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-300 font-medium text-[10px]">
              Live Production Interface
            </span>
          </div>

          <div className="p-4 sm:p-6 bg-slate-900/50 rounded-xl mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Active Project</span>
                <span className="text-emerald-400 font-semibold">68% Complete</span>
              </div>
              <h4 className="text-base font-bold text-white">Brand Website Redesign</h4>
              <p className="text-xs text-slate-400 mt-1">Client: Nova Labs Inc.</p>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Pending Milestone</span>
                <span className="text-amber-400 font-semibold">Phase 3</span>
              </div>
              <h4 className="text-base font-bold text-white">Frontend Engineering & CMS</h4>
              <p className="text-xs text-slate-400 mt-1">Due in 14 days • 4 subtasks</p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-300">
                <Clock className="w-3.5 h-3.5" />
                <span>36 hrs logged this sprint</span>
              </div>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Billing Status</span>
                <span className="text-emerald-400 font-semibold">Paid</span>
              </div>
              <h4 className="text-base font-bold text-white">₹9,250 Received</h4>
              <p className="text-xs text-slate-400 mt-1">INV-2026-001 • Bank transfer</p>
              <div className="mt-3 text-xs text-slate-400">
                Next: INV-2026-002 (₹4,625)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Grid */}
      <section id="features" className="py-16 sm:py-24 bg-slate-900/60 border-t border-slate-800 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-indigo-400 font-semibold text-xs tracking-wider uppercase">Built for Professionals</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Everything required to run your independent business
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Eliminate the stack of disconnected tools. Manage client relationships, delivery, and cashflow in one cohesive operating system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Project & Milestone Delivery</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Structured phases, timeline deadlines, budget progress, and synchronized milestone verification.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Proposals, Contracts & Invoices</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                From initial quote to digital agreement, itemized billing, payment tracking, and automated balance calculation.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Dedicated Client Portal</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Give clients their own secure login to review deliverables, download authorized files, and approve milestones.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Time Tracking & Billing</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Persistent live stopwatch and manual entry logs tied to specific projects and tasks for billable hour accuracy.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Project-Scoped Messaging</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Real-time conversations organized by project thread. Eliminate buried email chains and missed feedback.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">PostgreSQL Row-Level Security</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Rigorous database-enforced authorization policies ensure clients only see their projects and private files remain private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works / Workflow */}
      <section id="workflow" className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-indigo-400 font-semibold text-xs tracking-wider uppercase">Streamlined Workflow</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            How FreelanceFlow organizes your client lifecycle
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-3">
              1
            </div>
            <h4 className="text-sm font-bold text-white">Client & Proposal</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Add your client, send an itemized proposal, and convert to an active signed contract.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-3">
              2
            </div>
            <h4 className="text-sm font-bold text-white">Phased Roadmaps</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Define milestone deliverables, manage Kanban tasks, track deadlines, and log time.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-3">
              3
            </div>
            <h4 className="text-sm font-bold text-white">Client Collaboration</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Invite clients to their dedicated portal to review assets, communicate, and sign off.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-3">
              4
            </div>
            <h4 className="text-sm font-bold text-white">Invoicing & Payouts</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Generate PDF-ready invoices, record wire/card payments, and analyze profit metrics.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Freelancer Benefits vs Client Benefits */}
      <section id="benefits" className="py-16 sm:py-20 bg-slate-900/80 border-t border-slate-800 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Freelancer Column */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-900/40">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              For Freelancers
            </h3>
            <p className="text-xs text-slate-400 mt-2 mb-6">
              Run your business like a top-tier digital agency.
            </p>
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <span>Single dashboard displaying active projects, revenue, and deadlines</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <span>Kanban boards and list views with priority levels and estimates</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <span>Automatic invoice generation from tracked hours and fixed milestones</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <span>Real-time revenue charts, overdue task alarms, and activity logs</span>
              </li>
            </ul>
          </div>

          {/* Client Column */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              For Clients
            </h3>
            <p className="text-xs text-slate-400 mt-2 mb-6">
              Transparent, professional visibility into project progress.
            </p>
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Private portal with real-time percentage progress and milestone dates</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>One-click file downloads without hunting through messy email attachments</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Direct project chat thread for rapid Q&A and status updates</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Clear invoice history, payment receipts, and contract terms review</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 7. Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-950/60 border border-indigo-800/50 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to upgrade your freelance workflow?
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto mt-4 mb-8">
            Start organizing your clients, tasks, and cash flow in one unified workspace today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => navigate('/signup')}
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              className="px-8 py-3 text-base shadow-lg shadow-indigo-600/30"
            >
              Create Free Account
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              size="lg"
              className="px-6 py-3 text-base text-slate-200 border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white"
            >
              Sign In to Workspace
            </Button>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-10 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-white font-bold">FreelanceFlow</span>
            <span className="text-slate-400">— One workspace. Every freelance project.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-slate-400">Production-Ready Full Stack</span>
            <span className="text-slate-400">Supabase & PostgreSQL Architecture</span>
            <span className="text-slate-400">© 2026 FreelanceFlow</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
