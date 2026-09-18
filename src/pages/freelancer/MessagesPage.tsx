import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase/db';
import { Message, Project } from '../../types';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import {
  MessageSquare, Send, FolderKanban, Users, Clock,
  Sparkles, CheckCheck
} from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadConversations() {
      if (!user) return;
      setLoading(true);
      try {
        const projs = await db.getProjects(user.id);
        setProjects(projs);
        if (projs.length > 0) {
          setSelectedProjectId(projs[0].id);
          const msgs = await db.getMessages(projs[0].id);
          setMessages(msgs);
        }
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, [user]);

  // Load messages when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    db.getMessages(selectedProjectId).then((msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  }, [selectedProjectId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedProjectId) return;

    await db.sendMessage({
      project_id: selectedProjectId,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: user.role,
      content: newMessage,
    });

    setNewMessage('');
    const updated = await db.getMessages(selectedProjectId);
    setMessages(updated);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Project Messages
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Dedicated, real-time-capable collaboration channels organized by project
        </p>
      </div>

      {loading ? (
        <LoadingState message="Connecting communication channels..." />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-6 h-6" />}
          title="No projects available"
          description="Create a project to initiate direct client communication channels."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-3 min-h-[600px] overflow-hidden">
          {/* Left Panel: Project Conversation List */}
          <div className="border-r border-slate-200 bg-slate-50/50 p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-2">
              Channels ({projects.length})
            </h3>

            {projects.map((p) => {
              const isSelected = p.id === selectedProjectId;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border border-slate-200/80 shadow-xs'
                      : 'hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                      {p.client?.name || 'Client'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <h4 className={`text-xs font-bold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                    {p.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    Click to enter live channel
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Panel: Chat Stream */}
          <div className="md:col-span-2 flex flex-col justify-between h-full bg-white">
            {/* Chat header */}
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedProject?.name}</h3>
                <p className="text-xs text-slate-500">
                  Client: <span className="font-semibold text-slate-700">{selectedProject?.client?.name || 'Client'}</span>
                </p>
              </div>

              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Channel
              </span>
            </div>

            {/* Message transcript */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[480px]">
              {messages.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  No messages yet in this project channel. Start the conversation below!
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === user?.id || m.sender_role === user?.role;
                  return (
                    <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-700">{m.sender_name}</span>
                        <span className="text-[10px] text-slate-400 capitalize bg-slate-100 px-1.5 py-0.5 rounded">
                          {m.sender_role}
                        </span>
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

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                        <span>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3 text-indigo-500" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200/80 bg-slate-50/60 flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Write message to ${selectedProject?.client?.name || 'client'}...`}
                className="flex-1 px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <Button type="submit" variant="primary" size="md" icon={<Send className="w-4 h-4" />}>
                Send
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
