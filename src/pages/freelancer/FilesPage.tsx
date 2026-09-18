import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase/db';
import { ProjectFile, Project } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import {
  FolderArchive, Upload, Download, Trash2, Search,
  FileText, Image, FileCode, CheckCircle2, Lock, Globe
} from 'lucide-react';

export const FilesPage: React.FC = () => {
  const { user } = useAuth();

  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');

  // Upload modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [fileType, setFileType] = useState('application/pdf');
  const [isClientAccessible, setIsClientAccessible] = useState(true);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const [allFiles, allProjects] = await Promise.all([
        db.getFiles(),
        db.getProjects(),
      ]);
      setFiles(allFiles);
      setProjects(allProjects);
      if (allProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(allProjects[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fileName.trim() || !selectedProjectId) return;

    await db.createFile({
      project_id: selectedProjectId,
      uploader_id: user.id,
      name: fileName,
      file_path: `projects/${selectedProjectId}/${fileName.toLowerCase().replace(/\s+/g, '-')}`,
      size_bytes: Math.floor(Math.random() * 3000000) + 500000,
      mime_type: fileType,
      is_client_accessible: isClientAccessible,
    });

    setIsModalOpen(false);
    setFileName('');
    loadFiles();
  };

  const handleDelete = async (fileId: string) => {
    if (confirm('Are you sure you want to remove this file?')) {
      await db.deleteFile(fileId);
      loadFiles();
    }
  };

  const handleDownload = (file: ProjectFile) => {
    const blob = new Blob(
      [`FreelanceFlow asset export: ${file.name || file.file_name}\nProject: ${file.project_name || 'Project'}\nSize: ${file.size_bytes || 0} bytes`],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name || file.file_name || 'asset.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredFiles = files.filter((f) => {
    if (projectFilter !== 'all' && f.project_id !== projectFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (f.name || f.file_name || '').toLowerCase().includes(q) || f.project_name?.toLowerCase().includes(q);
    }
    return true;
  });

  const getFileIcon = (mime?: string) => {
    if (!mime) return <FileText className="w-5 h-5 text-indigo-500" />;
    if (mime.includes('image')) return <Image className="w-5 h-5 text-sky-500" />;
    if (mime.includes('code') || mime.includes('json')) return <FileCode className="w-5 h-5 text-amber-500" />;
    return <FileText className="w-5 h-5 text-indigo-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Files & Project Assets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cloud repository for deliverables, contracts, briefs, and client downloads
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          icon={<Upload className="w-4 h-4" />}
        >
          Upload Asset
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deliverables by name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="w-full sm:w-auto">
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
        </div>
      </div>

      {/* Files Grid */}
      {loading ? (
        <LoadingState message="Fetching storage directory..." />
      ) : filteredFiles.length === 0 ? (
        <EmptyState
          icon={<FolderArchive className="w-6 h-6" />}
          title="No files found"
          description="Upload project deliverables or specifications for your clients."
          actionLabel="Upload File"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    {getFileIcon(file.mime_type)}
                  </div>
                  {file.is_client_accessible ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Globe className="w-3 h-3" />
                      Client Visible
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" />
                      Internal Only
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-900 truncate" title={file.name || file.file_name}>
                  {file.name || file.file_name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {file.project_name || 'Project File'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{(((file.size_bytes || file.file_size || 0) / (1024 * 1024))).toFixed(2)} MB</span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded cursor-pointer"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload File Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Project Asset"
        description="Attach design specifications, source code, or signed documentation."
      >
        <form onSubmit={handleUpload} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Project *</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">File Name *</label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. Design-System-V2.fig"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Asset Category</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="application/pdf">Document (PDF)</option>
                <option value="image/png">Graphic / Image</option>
                <option value="application/zip">Archive (ZIP)</option>
                <option value="application/json">Code / JSON</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isClientAccessible}
                  onChange={(e) => setIsClientAccessible(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-700">Allow Client Access</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Upload Asset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
