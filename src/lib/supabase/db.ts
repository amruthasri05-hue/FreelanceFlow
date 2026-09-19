import { supabase, isSupabaseConfigured } from './client';
import {
  Profile, Client, Project, Milestone, Task, TimeEntry,
  ProjectFile, Conversation, Message, Proposal, Contract,
  Invoice, Payment, Notification, ActivityLog, DashboardStats
} from '../../types';
import {
  SEED_PROFILES, SEED_CLIENTS, SEED_PROJECTS, SEED_MILESTONES,
  SEED_TASKS, SEED_TIME_ENTRIES, SEED_FILES, SEED_CONVERSATIONS,
  SEED_MESSAGES, SEED_PROPOSALS, SEED_CONTRACTS, SEED_INVOICES,
  SEED_PAYMENTS, SEED_NOTIFICATIONS, SEED_ACTIVITY_LOGS
} from './seedData';

// Local storage key for demo persistence
const STORAGE_PREFIX = 'freelanceflow_db_v1_';

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.warn('Storage quota exceeded or error:', e);
  }
}

// In-memory / localStorage data state
class AppDatabase {
  profiles: Profile[] = getStored('profiles', SEED_PROFILES);
  clients: Client[] = getStored('clients', SEED_CLIENTS);
  projects: Project[] = getStored('projects', SEED_PROJECTS);
  milestones: Milestone[] = getStored('milestones', SEED_MILESTONES);
  tasks: Task[] = getStored('tasks', SEED_TASKS);
  timeEntries: TimeEntry[] = getStored('time_entries', SEED_TIME_ENTRIES);
  files: ProjectFile[] = getStored('files', SEED_FILES);
  conversations: Conversation[] = getStored('conversations', SEED_CONVERSATIONS);
  messages: Message[] = getStored('messages', SEED_MESSAGES);
  proposals: Proposal[] = getStored('proposals', SEED_PROPOSALS);
  contracts: Contract[] = getStored('contracts', SEED_CONTRACTS);
  invoices: Invoice[] = getStored('invoices', SEED_INVOICES);
  payments: Payment[] = getStored('payments', SEED_PAYMENTS);
  notifications: Notification[] = getStored('notifications', SEED_NOTIFICATIONS);
  activityLogs: ActivityLog[] = getStored('activity_logs', SEED_ACTIVITY_LOGS);

  private persist(key: string, val: unknown) {
    setStored(key, val);
  }

  // --- PROFILES ---
  async getProfiles(): Promise<Profile[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data && data.length > 0) return data as Profile[];
    }
    return this.profiles;
  }

  async getProfileById(id: string): Promise<Profile | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (!error && data) return data as Profile;
    }
    return this.profiles.find(p => p.id === id) || null;
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Profile;
    }
    const idx = this.profiles.findIndex(p => p.id === id);
    if (idx >= 0) {
      this.profiles[idx] = { ...this.profiles[idx], ...updates, updated_at: new Date().toISOString() };
      this.persist('profiles', this.profiles);
      return this.profiles[idx];
    }
    throw new Error('Profile not found');
  }

  // --- CLIENTS ---
  async getClients(freelancerId?: string): Promise<Client[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('clients').select('*');
      if (freelancerId) query = query.eq('freelancer_id', freelancerId);
      const { data, error } = await query;
      if (!error && data) return data as Client[];
    }
    let list = this.clients;
    if (freelancerId) {
      list = list.filter(c => c.freelancer_id === freelancerId);
    }
    return list;
  }

  async createClient(client: Omit<Client, 'id' | 'created_at' | 'is_archived'>): Promise<Client> {
    if (isSupabaseConfigured() && supabase) {
      let freelancerId = client.freelancer_id;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        freelancerId = session.user.id;
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.id) {
          freelancerId = authUser.id;
        }
      }

      const insertPayload = {
        freelancer_id: freelancerId,
        name: client.name,
        company: client.company || null,
        email: client.email,
        phone: client.phone || null,
        website: client.website || null,
        address: client.address || null,
        notes: client.notes || null,
        is_archived: false,
      };
      const { data, error } = await supabase.from('clients').insert(insertPayload).select().single();
      if (error) {
        console.error('Error creating client in Supabase:', error);
        throw error;
      }
      if (data) {
        await this.logActivity(freelancerId, undefined, 'created', 'client', data.id, { name: data.name });
        return data as Client;
      }
    }
    const newClient: Client = {
      ...client,
      id: 'cli-' + Date.now(),
      is_archived: false,
      created_at: new Date().toISOString(),
      active_projects_count: 0,
      total_billed: 0,
    };
    this.clients.unshift(newClient);
    this.persist('clients', this.clients);
    await this.logActivity(client.freelancer_id, undefined, 'created', 'client', newClient.id, { name: newClient.name });
    return newClient;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    if (isSupabaseConfigured() && supabase) {
      const { active_projects_count, total_billed, id: _id, created_at: _cat, ...cleanUpdates } = updates;
      const { data, error } = await supabase.from('clients').update(cleanUpdates).eq('id', id).select().single();
      if (!error && data) return data as Client;
    }
    const idx = this.clients.findIndex(c => c.id === id);
    if (idx >= 0) {
      this.clients[idx] = { ...this.clients[idx], ...updates, updated_at: new Date().toISOString() };
      this.persist('clients', this.clients);
      return this.clients[idx];
    }
    throw new Error('Client not found');
  }

  async archiveClient(id: string, isArchived = true): Promise<Client> {
    return this.updateClient(id, { is_archived: isArchived });
  }

  // --- PROJECTS ---
  async getProjects(userId?: string, role?: string): Promise<Project[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('projects').select('*, client:clients(*)');
      if (userId && role === 'freelancer') {
        query = query.eq('freelancer_id', userId);
      }
      const { data, error } = await query;
      if (!error && data) return data as Project[];
    }
    let list = this.projects.map(p => ({
      ...p,
      client: this.clients.find(c => c.id === p.client_id)
    }));

    if (userId && role === 'client') {
      // Find client record belonging to user's email
      const userProfile = this.profiles.find(u => u.id === userId);
      const matchedClient = this.clients.find(c => c.email === userProfile?.email);
      if (matchedClient) {
        list = list.filter(p => p.client_id === matchedClient.id);
      }
    } else if (userId && role === 'freelancer') {
      list = list.filter(p => p.freelancer_id === userId);
    }
    return list;
  }

  async getProjectById(id: string): Promise<Project | null> {
    const list = await this.getProjects();
    return list.find(p => p.id === id) || null;
  }

  async createProject(project: Omit<Project, 'id' | 'created_at' | 'is_archived'>): Promise<Project> {
    if (isSupabaseConfigured() && supabase) {
      let freelancerId = project.freelancer_id;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        freelancerId = session.user.id;
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.id) {
          freelancerId = authUser.id;
        }
      }

      const insertPayload = {
        freelancer_id: freelancerId,
        client_id: project.client_id && project.client_id.trim() !== '' ? project.client_id : null,
        name: project.name,
        description: project.description || null,
        status: project.status || 'active',
        start_date: project.start_date && project.start_date.trim() !== '' ? project.start_date : null,
        deadline: project.deadline && project.deadline.trim() !== '' ? project.deadline : null,
        budget: project.budget !== undefined ? Number(project.budget) : 0,
        progress: project.progress !== undefined ? Number(project.progress) : 0,
        currency: project.currency || 'USD',
        is_archived: false,
      };
      const { data, error } = await supabase.from('projects').insert(insertPayload).select('*, client:clients(*)').single();
      if (error) {
        console.error('Error creating project in Supabase:', error);
        throw error;
      }
      if (data) {
        await this.logActivity(freelancerId, data.id, 'created', 'project', data.id, { name: data.name });
        return data as Project;
      }
    }
    const newProject: Project = {
      ...project,
      id: 'prj-' + Date.now(),
      start_date: project.start_date && project.start_date.trim() !== '' ? project.start_date : undefined,
      deadline: project.deadline && project.deadline.trim() !== '' ? project.deadline : undefined,
      is_archived: false,
      created_at: new Date().toISOString(),
    };
    this.projects.unshift(newProject);
    this.persist('projects', this.projects);
    await this.logActivity(project.freelancer_id, newProject.id, 'created', 'project', newProject.id, { name: newProject.name });
    
    // Auto-create initial project discussion conversation
    await this.createConversation({
      project_id: newProject.id,
      title: `${newProject.name} — Workspace`,
      is_group: true,
    });

    return newProject;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    if (isSupabaseConfigured() && supabase) {
      const { client, id: _id, created_at: _cat, ...cleanUpdates } = updates;
      const updatePayload: Record<string, any> = { ...cleanUpdates };
      if ('start_date' in updatePayload) {
        updatePayload.start_date = updatePayload.start_date && typeof updatePayload.start_date === 'string' && updatePayload.start_date.trim() !== '' ? updatePayload.start_date : null;
      }
      if ('deadline' in updatePayload) {
        updatePayload.deadline = updatePayload.deadline && typeof updatePayload.deadline === 'string' && updatePayload.deadline.trim() !== '' ? updatePayload.deadline : null;
      }
      const { data, error } = await supabase.from('projects').update(updatePayload).eq('id', id).select('*, client:clients(*)').single();
      if (!error && data) return data as Project;
    }
    const idx = this.projects.findIndex(p => p.id === id);
    if (idx >= 0) {
      this.projects[idx] = { ...this.projects[idx], ...updates, updated_at: new Date().toISOString() };
      this.persist('projects', this.projects);
      return this.projects[idx];
    }
    throw new Error('Project not found');
  }

  // --- MILESTONES ---
  async getMilestones(projectId?: string): Promise<Milestone[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('milestones').select('*').order('order_index');
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error } = await query;
      if (!error && data) return data as Milestone[];
    }
    let list = this.milestones;
    if (projectId) list = list.filter(m => m.project_id === projectId);
    return list;
  }

  async createMilestone(milestone: Omit<Milestone, 'id' | 'created_at'>): Promise<Milestone> {
    const newMilestone: Milestone = {
      ...milestone,
      id: 'mls-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('milestones').insert(newMilestone).select().single();
      if (!error && data) return data as Milestone;
    }
    this.milestones.push(newMilestone);
    this.persist('milestones', this.milestones);
    return newMilestone;
  }

  async updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('milestones').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Milestone;
    }
    const idx = this.milestones.findIndex(m => m.id === id);
    if (idx >= 0) {
      this.milestones[idx] = { ...this.milestones[idx], ...updates, updated_at: new Date().toISOString() };
      this.persist('milestones', this.milestones);
      return this.milestones[idx];
    }
    throw new Error('Milestone not found');
  }

  // --- TASKS ---
  async getTasks(projectId?: string): Promise<Task[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('tasks').select('*');
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error } = await query;
      if (!error && data) return data as Task[];
    }
    let list = this.tasks.map(t => ({
      ...t,
      project_name: this.projects.find(p => p.id === t.project_id)?.name,
      assignee: this.profiles.find(p => p.id === t.assigned_to),
    }));
    if (projectId) list = list.filter(t => t.project_id === projectId);
    return list;
  }

  async createTask(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: 'tsk-' + Date.now(),
      created_at: new Date().toISOString(),
      project_name: this.projects.find(p => p.id === task.project_id)?.name,
      assignee: this.profiles.find(p => p.id === task.assigned_to),
    };
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
      if (!error && data) return data as Task;
    }
    this.tasks.unshift(newTask);
    this.persist('tasks', this.tasks);
    await this.logActivity(task.assigned_to, task.project_id, 'created', 'task', newTask.id, { title: newTask.title });
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Task;
    }
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx >= 0) {
      this.tasks[idx] = { ...this.tasks[idx], ...updates, updated_at: new Date().toISOString() };
      this.persist('tasks', this.tasks);
      return this.tasks[idx];
    }
    throw new Error('Task not found');
  }

  async deleteTask(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('tasks').delete().eq('id', id);
    }
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.persist('tasks', this.tasks);
    return true;
  }

  // --- TIME ENTRIES ---
  async getTimeEntries(projectId?: string): Promise<TimeEntry[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('time_entries').select('*').order('created_at', { ascending: false });
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error } = await query;
      if (!error && data) return data as TimeEntry[];
    }
    let list = this.timeEntries.map(e => ({
      ...e,
      project_name: this.projects.find(p => p.id === e.project_id)?.name,
      task_title: this.tasks.find(t => t.id === e.task_id)?.title,
    }));
    if (projectId) list = list.filter(e => e.project_id === projectId);
    return list;
  }

  async createTimeEntry(entry: Omit<TimeEntry, 'id' | 'created_at'>): Promise<TimeEntry> {
    const newEntry: TimeEntry = {
      ...entry,
      id: 'tim-' + Date.now(),
      created_at: new Date().toISOString(),
      project_name: this.projects.find(p => p.id === entry.project_id)?.name,
      task_title: this.tasks.find(t => t.id === entry.task_id)?.title,
    };
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('time_entries').insert(newEntry).select().single();
      if (!error && data) return data as TimeEntry;
    }
    this.timeEntries.unshift(newEntry);
    this.persist('time_entries', this.timeEntries);
    return newEntry;
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('time_entries').delete().eq('id', id);
    }
    this.timeEntries = this.timeEntries.filter(t => t.id !== id);
    this.persist('time_entries', this.timeEntries);
    return true;
  }

  // --- FILES & SUPABASE STORAGE ---
  async getFiles(projectId?: string): Promise<ProjectFile[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('files').select('*').order('created_at', { ascending: false });
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error } = await query;
      if (!error && data) return data as ProjectFile[];
    }
    let list = this.files.map(f => ({
      ...f,
      uploader_name: this.profiles.find(p => p.id === f.uploaded_by)?.full_name,
      project_name: this.projects.find(p => p.id === f.project_id)?.name,
      name: f.name || f.file_name,
      size_bytes: f.size_bytes || f.file_size,
      mime_type: f.mime_type || f.file_type || 'application/pdf',
      is_client_accessible: f.is_client_accessible !== undefined ? f.is_client_accessible : true,
    }));
    if (projectId) list = list.filter(f => f.project_id === projectId);
    return list;
  }

  async createFile(fileData: {
    project_id: string;
    uploader_id: string;
    name: string;
    file_path: string;
    size_bytes: number;
    mime_type: string;
    is_client_accessible?: boolean;
  }): Promise<ProjectFile> {
    const newFile: ProjectFile = {
      id: 'fil-' + Date.now(),
      project_id: fileData.project_id,
      uploaded_by: fileData.uploader_id,
      file_name: fileData.name,
      name: fileData.name,
      file_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      storage_path: fileData.file_path,
      file_type: fileData.mime_type,
      mime_type: fileData.mime_type,
      file_size: fileData.size_bytes,
      size_bytes: fileData.size_bytes,
      is_client_accessible: fileData.is_client_accessible !== undefined ? fileData.is_client_accessible : true,
      created_at: new Date().toISOString(),
      uploader_name: this.profiles.find(p => p.id === fileData.uploader_id)?.full_name,
      project_name: this.projects.find(p => p.id === fileData.project_id)?.name,
    };

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('files').insert(newFile);
    }
    this.files.unshift(newFile);
    this.persist('files', this.files);
    return newFile;
  }

  async uploadFile(fileData: {
    projectId: string;
    taskId?: string;
    uploadedBy: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileBlob?: Blob;
  }): Promise<ProjectFile> {
    let fileUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
    const storagePath = `project-files/${fileData.projectId}/${fileData.fileName}`;

    if (isSupabaseConfigured() && supabase && fileData.fileBlob) {
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(storagePath, fileData.fileBlob, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from('project-files').getPublicUrl(storagePath);
        if (data) fileUrl = data.publicUrl;
      }
    }

    const newFile: ProjectFile = {
      id: 'fil-' + Date.now(),
      project_id: fileData.projectId,
      task_id: fileData.taskId,
      uploaded_by: fileData.uploadedBy,
      file_name: fileData.fileName,
      name: fileData.fileName,
      file_url: fileUrl,
      storage_path: storagePath,
      file_type: fileData.fileType,
      mime_type: fileData.fileType,
      file_size: fileData.fileSize,
      size_bytes: fileData.fileSize,
      is_client_accessible: true,
      created_at: new Date().toISOString(),
      uploader_name: this.profiles.find(p => p.id === fileData.uploadedBy)?.full_name,
      project_name: this.projects.find(p => p.id === fileData.projectId)?.name,
    };

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('files').insert(newFile);
    }
    this.files.unshift(newFile);
    this.persist('files', this.files);
    await this.logActivity(fileData.uploadedBy, fileData.projectId, 'uploaded', 'file', newFile.id, { file_name: newFile.file_name });
    return newFile;
  }

  async deleteFile(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const target = this.files.find(f => f.id === id);
      if (target?.storage_path) {
        await supabase.storage.from('project-files').remove([target.storage_path]);
      }
      await supabase.from('files').delete().eq('id', id);
    }
    this.files = this.files.filter(f => f.id !== id);
    this.persist('files', this.files);
    return true;
  }

  // --- MESSAGES & CONVERSATIONS ---
  async getConversations(projectId?: string): Promise<Conversation[]> {
    let list = this.conversations.map(c => ({
      ...c,
      project_name: this.projects.find(p => p.id === c.project_id)?.name,
    }));
    if (projectId) list = list.filter(c => c.project_id === projectId);
    return list;
  }

  async createConversation(conv: Omit<Conversation, 'id' | 'created_at'>): Promise<Conversation> {
    const newConv: Conversation = {
      ...conv,
      id: 'conv-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.conversations.unshift(newConv);
    this.persist('conversations', this.conversations);
    return newConv;
  }

  async getMessages(conversationOrProjectId: string): Promise<Message[]> {
    // Find matching conversation if project id was passed
    const conv = this.conversations.find(c => c.project_id === conversationOrProjectId || c.id === conversationOrProjectId);
    const targetConvId = conv ? conv.id : conversationOrProjectId;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', targetConvId)
        .order('created_at', { ascending: true });
      if (!error && data) return data as Message[];
    }
    return this.messages
      .filter(m => m.conversation_id === targetConvId)
      .map(m => {
        const sender = this.profiles.find(p => p.id === m.sender_id);
        return {
          ...m,
          sender,
          sender_name: m.sender_name || sender?.full_name,
          sender_role: m.sender_role || sender?.role,
        };
      });
  }

  async sendMessage(
    conversationIdOrData: string | { project_id?: string; sender_id: string; content: string; sender_name?: string; sender_role?: string },
    senderId?: string,
    content?: string
  ): Promise<Message> {
    let convId = '';
    let sId = '';
    let msgContent = '';
    let senderName = '';
    let senderRole = '';

    if (typeof conversationIdOrData === 'object') {
      sId = conversationIdOrData.sender_id;
      msgContent = conversationIdOrData.content;
      senderName = conversationIdOrData.sender_name || '';
      senderRole = conversationIdOrData.sender_role || '';
      if (conversationIdOrData.project_id) {
        let conv = this.conversations.find(c => c.project_id === conversationIdOrData.project_id);
        if (!conv) {
          conv = await this.createConversation({
            project_id: conversationIdOrData.project_id,
            title: 'Project Channel',
            is_group: true,
          });
        }
        convId = conv.id;
      }
    } else {
      convId = conversationIdOrData;
      sId = senderId || '';
      msgContent = content || '';
    }

    const sender = this.profiles.find(p => p.id === sId);
    const newMsg: Message = {
      id: 'msg-' + Date.now(),
      conversation_id: convId,
      sender_id: sId,
      content: msgContent,
      created_at: new Date().toISOString(),
      sender,
      sender_name: senderName || sender?.full_name,
      sender_role: senderRole || sender?.role,
    };

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('messages').insert(newMsg);
    }
    this.messages.push(newMsg);
    this.persist('messages', this.messages);

    // Update conversation last message preview
    const convIdx = this.conversations.findIndex(c => c.id === convId);
    if (convIdx >= 0) {
      this.conversations[convIdx].last_message = msgContent;
      this.conversations[convIdx].last_message_at = newMsg.created_at;
      this.persist('conversations', this.conversations);
    }

    return newMsg;
  }

  // --- PROPOSALS ---
  async getProposals(freelancerId?: string, clientId?: string): Promise<Proposal[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('proposals').select('*, client:clients(*), project:projects(*)');
      if (freelancerId) query = query.eq('freelancer_id', freelancerId);
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (!error && data) return data as Proposal[];
    }
    let list = this.proposals.map(p => ({
      ...p,
      client: this.clients.find(c => c.id === p.client_id),
      project: this.projects.find(prj => prj.id === p.project_id),
    }));
    if (freelancerId) list = list.filter(p => p.freelancer_id === freelancerId);
    if (clientId) list = list.filter(p => p.client_id === clientId);
    return list;
  }

  async createProposal(prop: Omit<Proposal, 'id' | 'created_at'>): Promise<Proposal> {
    const newProp: Proposal = {
      ...prop,
      id: 'prop-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('proposals').insert(newProp).select().single();
      if (!error && data) return data as Proposal;
    }
    this.proposals.unshift(newProp);
    this.persist('proposals', this.proposals);
    return newProp;
  }

  async updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('proposals').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Proposal;
    }
    const idx = this.proposals.findIndex(p => p.id === id);
    if (idx >= 0) {
      this.proposals[idx] = { ...this.proposals[idx], ...updates, updated_at: new Date().toISOString() };
      this.persist('proposals', this.proposals);
      return this.proposals[idx];
    }
    throw new Error('Proposal not found');
  }

  // --- CONTRACTS ---
  async getContracts(freelancerId?: string, clientId?: string): Promise<Contract[]> {
    let list = this.contracts.map(c => ({
      ...c,
      client: this.clients.find(cli => cli.id === c.client_id),
      project: this.projects.find(p => p.id === c.project_id),
    }));
    if (freelancerId) list = list.filter(c => c.freelancer_id === freelancerId);
    if (clientId) list = list.filter(c => c.client_id === clientId);
    return list;
  }

  async createContract(contract: Omit<Contract, 'id' | 'created_at'>): Promise<Contract> {
    const newContract: Contract = {
      ...contract,
      id: 'cnt-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.contracts.unshift(newContract);
    this.persist('contracts', this.contracts);
    return newContract;
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract> {
    const idx = this.contracts.findIndex(c => c.id === id);
    if (idx >= 0) {
      this.contracts[idx] = { ...this.contracts[idx], ...updates, updated_at: new Date().toISOString() };
      this.persist('contracts', this.contracts);
      return this.contracts[idx];
    }
    throw new Error('Contract not found');
  }

  // --- INVOICES & PAYMENTS ---
  async getInvoices(freelancerId?: string, clientId?: string): Promise<Invoice[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('invoices').select('*, items:invoice_items(*), client:clients(*), project:projects(*)');
      if (freelancerId) query = query.eq('freelancer_id', freelancerId);
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (!error && data) {
        return (data as Invoice[]).map(inv => ({
          ...inv,
          balance_due: inv.total_amount - (inv.amount_paid || 0),
        }));
      }
    }
    let list = this.invoices.map(inv => ({
      ...inv,
      balance_due: inv.total_amount - (inv.amount_paid || 0),
      client: this.clients.find(c => c.id === inv.client_id),
      project: this.projects.find(p => p.id === inv.project_id),
    }));
    if (freelancerId) list = list.filter(i => i.freelancer_id === freelancerId);
    if (clientId) list = list.filter(i => i.client_id === clientId);
    return list;
  }

  async createInvoice(inv: Omit<Invoice, 'id' | 'created_at'>): Promise<Invoice> {
    const newInv: Invoice = {
      ...inv,
      id: 'inv-' + Date.now(),
      created_at: new Date().toISOString(),
      balance_due: inv.total_amount - (inv.amount_paid || 0),
    };
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('invoices').insert(newInv).select().single();
      if (!error && data) return { ...data, balance_due: data.total_amount - (data.amount_paid || 0) } as Invoice;
    }
    this.invoices.unshift(newInv);
    this.persist('invoices', this.invoices);
    await this.logActivity(inv.freelancer_id, inv.project_id, 'created', 'invoice', newInv.id, { invoice_number: newInv.invoice_number, amount: newInv.total_amount });
    return newInv;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const idx = this.invoices.findIndex(i => i.id === id);
    if (idx >= 0) {
      this.invoices[idx] = { ...this.invoices[idx], ...updates, updated_at: new Date().toISOString() };
      this.persist('invoices', this.invoices);
      return this.invoices[idx];
    }
    throw new Error('Invoice not found');
  }

  async getPayments(invoiceId?: string): Promise<Payment[]> {
    let list = this.payments.map(p => {
      const inv = this.invoices.find(i => i.id === p.invoice_id);
      const client = inv ? this.clients.find(c => c.id === inv.client_id) : undefined;
      return {
        ...p,
        invoice_number: inv?.invoice_number,
        client_name: client?.name,
      };
    });
    if (invoiceId) list = list.filter(p => p.invoice_id === invoiceId);
    return list;
  }

  async recordPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const newPayment: Payment = {
      ...payment,
      id: 'pay-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.payments.unshift(newPayment);
    this.persist('payments', this.payments);

    // Update the invoice amount paid and status
    const inv = this.invoices.find(i => i.id === payment.invoice_id);
    if (inv) {
      const updatedPaid = (inv.amount_paid || 0) + payment.amount;
      const isFullyPaid = updatedPaid >= inv.total_amount;
      await this.updateInvoice(inv.id, {
        amount_paid: updatedPaid,
        status: isFullyPaid ? 'paid' : 'pending',
      });
      await this.createNotification({
        user_id: inv.freelancer_id,
        title: 'Payment Received',
        message: `Recorded payment of $${payment.amount.toLocaleString()} for ${inv.invoice_number}`,
        type: 'payment',
        link: '/invoices',
      });
    }

    return newPayment;
  }

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async createNotification(notif: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<Notification> {
    const newNotif: Notification = {
      ...notif,
      id: 'notif-' + Date.now(),
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    this.persist('notifications', this.notifications);
    return newNotif;
  }

  async markNotificationRead(id: string): Promise<void> {
    const idx = this.notifications.findIndex(n => n.id === id);
    if (idx >= 0) {
      this.notifications[idx].is_read = true;
      this.persist('notifications', this.notifications);
    }
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    this.notifications = this.notifications.map(n => 
      n.user_id === userId ? { ...n, is_read: true } : n
    );
    this.persist('notifications', this.notifications);
  }

  // --- ACTIVITY LOGS ---
  async getActivityLogs(projectId?: string): Promise<ActivityLog[]> {
    let list = this.activityLogs.map(a => ({
      ...a,
      user_name: this.profiles.find(p => p.id === a.user_id)?.full_name,
      project_name: this.projects.find(p => p.id === a.project_id)?.name,
    }));
    if (projectId) list = list.filter(a => a.project_id === projectId);
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async logActivity(
    userId?: string,
    projectId?: string,
    action = 'updated',
    entityType = 'item',
    entityId?: string,
    details?: Record<string, unknown>
  ): Promise<ActivityLog> {
    const newLog: ActivityLog = {
      id: 'act-' + Date.now(),
      user_id: userId,
      project_id: projectId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString(),
      user_name: this.profiles.find(p => p.id === userId)?.full_name,
      project_name: this.projects.find(p => p.id === projectId)?.name,
    };
    this.activityLogs.unshift(newLog);
    this.persist('activity_logs', this.activityLogs);
    return newLog;
  }

  // --- DASHBOARD CALCULATIONS (REAL DATABASE AGGREGATIONS) ---
  async getDashboardStats(freelancerId: string): Promise<DashboardStats> {
    const projects = await this.getProjects(freelancerId, 'freelancer');
    const tasks = await this.getTasks();
    const timeEntries = await this.getTimeEntries();
    const invoices = await this.getInvoices(freelancerId);

    const activeProjects = projects.filter(p => p.status === 'active').length;
    const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
    
    const now = new Date();
    const overdueTasks = tasks.filter(t => {
      if (t.status === 'completed' || !t.due_date) return false;
      return new Date(t.due_date) < now;
    }).length;

    const upcomingDeadlines = tasks.filter(t => {
      if (t.status === 'completed' || !t.due_date) return false;
      const due = new Date(t.due_date);
      const diffDays = (due.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 14;
    }).length;

    const hoursTracked = Math.round(
      timeEntries.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) / 60
    );

    const totalRevenue = invoices.reduce((acc, inv) => acc + (Number(inv.amount_paid) || 0), 0);
    
    const outstandingInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
    const outstandingAmount = outstandingInvoices.reduce(
      (acc, inv) => acc + (Number(inv.total_amount) - Number(inv.amount_paid || 0)),
      0
    );

    return {
      active_projects: activeProjects,
      total_revenue: totalRevenue,
      pending_tasks: pendingTasks,
      hours_tracked: hoursTracked,
      upcoming_deadlines_count: upcomingDeadlines,
      overdue_tasks_count: overdueTasks,
      outstanding_invoices_amount: outstandingAmount,
      unpaid_invoices_count: outstandingInvoices.length,
    };
  }

  // Reset to seed data for testing
  resetDemoData(): void {
    Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
    this.profiles = SEED_PROFILES;
    this.clients = SEED_CLIENTS;
    this.projects = SEED_PROJECTS;
    this.milestones = SEED_MILESTONES;
    this.tasks = SEED_TASKS;
    this.timeEntries = SEED_TIME_ENTRIES;
    this.files = SEED_FILES;
    this.conversations = SEED_CONVERSATIONS;
    this.messages = SEED_MESSAGES;
    this.proposals = SEED_PROPOSALS;
    this.contracts = SEED_CONTRACTS;
    this.invoices = SEED_INVOICES;
    this.payments = SEED_PAYMENTS;
    this.notifications = SEED_NOTIFICATIONS;
    this.activityLogs = SEED_ACTIVITY_LOGS;
  }
}

export const db = new AppDatabase();
