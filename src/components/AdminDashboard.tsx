import React, { useState } from 'react';
import {
  Camera,
  FolderPlus,
  QrCode,
  Copy,
  Check,
  MessageCircle,
  Clock,
  Trash2,
  Edit,
  Power,
  Search,
  Sparkles,
  Users,
  Image as ImageIcon,
  ShieldCheck,
  Eye,
  AlertTriangle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Project, DashboardStats, CreateProjectPayload } from '../types';

interface AdminDashboardProps {
  stats: DashboardStats;
  projects: Project[];
  studioName: string;
  onUpdateStudioName: (name: string) => Promise<void>;
  onCreateProjectClick: () => void;
  onQuickCreateProject: () => Promise<void>;
  onInlineCreateProject: (payload: CreateProjectPayload) => Promise<void>;
  onManageProjectClick: (project: Project) => void;
  onQrCodeClick: (project: Project) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  onToggleProjectStatus: (project: Project) => Promise<void>;
  onSeedDemo: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  projects,
  studioName,
  onUpdateStudioName,
  onCreateProjectClick,
  onQuickCreateProject,
  onInlineCreateProject,
  onManageProjectClick,
  onQrCodeClick,
  onDeleteProject,
  onToggleProjectStatus,
  onSeedDemo
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isEditingStudio, setIsEditingStudio] = useState(false);
  const [newStudioName, setNewStudioName] = useState(studioName);
  const [isQuickCreating, setIsQuickCreating] = useState(false);

  // Inline fast project creation states
  const [inlineCustomer, setInlineCustomer] = useState('');
  const [inlineProject, setInlineProject] = useState('');
  const [isInlineSubmitting, setIsInlineSubmitting] = useState(false);

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineCustomer.trim() || !inlineProject.trim()) return;
    setIsInlineSubmitting(true);
    try {
      await onInlineCreateProject({
        customerName: inlineCustomer.trim(),
        projectName: inlineProject.trim(),
        projectDate: new Date().toISOString().split('T')[0],
        expiryDays: 30,
        watermarkText: `${studioName} • PREVIEW ONLY`,
        watermarkPosition: 'repeated',
        watermarkOpacity: 0.35
      });
      setInlineCustomer('');
      setInlineProject('');
    } catch (err) {
      console.error('Error creating inline project:', err);
    } finally {
      setIsInlineSubmitting(false);
    }
  };

  const handleQuickCreate = async () => {
    setIsQuickCreating(true);
    try {
      await onQuickCreateProject();
    } finally {
      setIsQuickCreating(false);
    }
  };

  const handleCopyLink = (project: Project) => {
    const url = `${window.location.origin}/view/${project.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(project.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveStudioName = async () => {
    if (newStudioName.trim()) {
      await onUpdateStudioName(newStudioName.trim());
      setIsEditingStudio(false);
    }
  };

  const now = new Date();

  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.customerMobile.includes(searchQuery) ||
      project.token.toLowerCase().includes(searchQuery.toLowerCase());

    const isExpired = new Date(project.expiryDate) < now || project.status === 'disabled';

    if (filterStatus === 'active') return matchesSearch && !isExpired && project.status === 'active';
    if (filterStatus === 'expired') return matchesSearch && (isExpired || project.status === 'disabled');
    return matchesSearch;
  });

  return (
    <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8 animate-fade-in text-gray-200">
      {/* Top Banner & Studio Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121217] border border-white/5 rounded-3xl p-8 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isEditingStudio ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newStudioName}
                  onChange={e => setNewStudioName(e.target.value)}
                  className="bg-[#0A0A0C] border border-amber-500 rounded-xl px-3 py-1.5 text-xl font-semibold text-white focus:outline-none"
                />
                <button
                  onClick={handleSaveStudioName}
                  className="px-4 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-full shadow-lg"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-white tracking-tight">{studioName}</h1>
                <button
                  onClick={() => setIsEditingStudio(true)}
                  className="text-gray-500 hover:text-amber-500 p-1 transition"
                  title="Rename Studio"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
            Secure Preview & Client Management Portal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onSeedDemo}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0A0A0C] hover:bg-white/5 text-gray-300 text-xs font-semibold rounded-full border border-white/5 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Seed Demo
          </button>

          <button
            onClick={handleQuickCreate}
            disabled={isQuickCreating}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-full shadow-lg shadow-amber-500/20 disabled:opacity-50 transition"
            title="1-Click Instant Project Creation"
          >
            <Zap className="w-4 h-4 fill-black" />
            {isQuickCreating ? 'Creating...' : '⚡ QUICK CREATE'}
          </button>

          <button
            onClick={onCreateProjectClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-amber-500 text-black font-bold text-xs rounded-full shadow-lg shadow-white/5 transition-colors"
          >
            <FolderPlus className="w-4 h-4" /> + CUSTOM PROJECT
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-[#121217] p-6 rounded-3xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Projects</span>
            <Camera className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-3xl font-light text-white">{stats.totalProjects}</h3>
        </div>

        <div className="bg-[#121217] p-6 rounded-3xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Photos</span>
            <ImageIcon className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="text-3xl font-light text-white">{stats.totalPhotos}</h3>
        </div>

        <div className="bg-[#121217] p-6 rounded-3xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Links</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-light text-emerald-400">{stats.activeLinks}</h3>
        </div>

        <div className="bg-[#121217] p-6 rounded-3xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Expired Links</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <h3 className="text-3xl font-light text-rose-400">{stats.expiredLinks}</h3>
        </div>

        <div className="bg-[#121217] p-6 rounded-3xl border border-white/5 space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Customers</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-3xl font-light text-white">{stats.totalCustomers}</h3>
        </div>
      </div>

      {/* Express Fast Project Generator Bar */}
      <div className="bg-[#121217] border border-amber-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
              <Zap className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Instant Fast Project Creator <span className="text-[10px] text-amber-400 font-normal">0.1 Second Setup</span>
              </h3>
              <p className="text-[11px] text-gray-400">Type Client Name & Event Name to generate client gallery link instantly</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            ⚡ Express Mode
          </span>
        </div>

        <form onSubmit={handleInlineSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="Client Name (e.g., Rajesh Sharma)*"
              value={inlineCustomer}
              onChange={e => setInlineCustomer(e.target.value)}
              required
              className="w-full bg-[#0A0A0C] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Event / Project Name (e.g., Wedding Ceremony)*"
              value={inlineProject}
              onChange={e => setInlineProject(e.target.value)}
              required
              className="w-full bg-[#0A0A0C] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={isInlineSubmitting || !inlineCustomer.trim() || !inlineProject.trim()}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-2xl shadow-lg shadow-amber-500/20 disabled:opacity-40 transition flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4 fill-black" />
              {isInlineSubmitting ? 'Creating...' : '⚡ Create Gallery Now'}
            </button>
          </div>
        </form>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#121217] p-5 rounded-3xl border border-white/5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Search customer, event, mobile or token..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0A0C] border border-white/5 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              filterStatus === 'all'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-[#0A0A0C] text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            All ({projects.length})
          </button>

          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              filterStatus === 'active'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'bg-[#0A0A0C] text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            Active ({stats.activeLinks})
          </button>

          <button
            onClick={() => setFilterStatus('expired')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              filterStatus === 'expired'
                ? 'bg-rose-500 text-black shadow-md'
                : 'bg-[#0A0A0C] text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            Expired / Disabled ({stats.expiredLinks})
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-[#121217] border border-white/5 rounded-3xl p-12 text-center space-y-3">
          <Camera className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Photo Projects Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Create a new client photo preview project or click Seed Sample Data to load demo wedding photography.
          </p>
          <button
            onClick={onCreateProjectClick}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-black text-xs font-bold rounded-full shadow-lg"
          >
            <FolderPlus className="w-4 h-4" /> Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => {
            const isExpired = new Date(project.expiryDate) < now || project.status === 'disabled';
            const previewUrl = `${window.location.origin}/view/${project.token}`;
            const whatsappMessage = encodeURIComponent(
              `नमस्ते ${project.customerName} जी, आपकी ${project.projectName} की photos का online preview तैयार है।\n\nनीचे दिए गए link पर click करके अपनी photos देखें:\n${previewUrl}`
            );

            return (
              <div
                key={project.id}
                className="bg-[#121217] border border-white/5 hover:border-white/20 rounded-3xl p-6 flex flex-col justify-between shadow-xl transition space-y-4"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <code className="bg-[#1a1a20] text-amber-500 text-[11px] font-bold px-2.5 py-1 rounded-md font-mono border border-white/5">
                        Token: {project.token}
                      </code>
                      <h3 className="text-lg font-semibold text-white mt-2.5 leading-snug">
                        {project.projectName}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {project.customerName} {project.customerMobile && `• ${project.customerMobile}`}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        !isExpired
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {!isExpired ? 'Active' : 'Expired'}
                    </span>
                  </div>

                  {/* Project Details */}
                  <div className="bg-[#0A0A0C] rounded-2xl p-4 border border-white/5 space-y-2 text-xs text-gray-400">
                    <div className="flex justify-between items-center">
                      <span>Photos / Albums:</span>
                      <span className="font-semibold text-white">
                        {project.photos.length} Photos ({project.albums.length} Albums)
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Expires On:</span>
                      <span className={`font-semibold ${isExpired ? 'text-rose-400' : 'text-gray-200'}`}>
                        {new Date(project.expiryDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Access Protection:</span>
                      <span className="font-semibold text-gray-200">
                        {project.password ? '🔐 Password Protected' : '🌐 Direct Token'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span>Customer Views:</span>
                      <span className="font-semibold text-amber-500 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {project.viewCount || 0} Views
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleCopyLink(project)}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 bg-[#1a1a20] hover:bg-white/10 text-gray-200 text-xs font-semibold rounded-xl border border-white/5 transition"
                      title="Copy Public Preview Link"
                    >
                      {copiedId === project.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="truncate">{copiedId === project.id ? 'Copied' : 'Link'}</span>
                    </button>

                    <a
                      href={`https://wa.me/${project.customerMobile.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-500/20 transition"
                      title="Share via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      onClick={() => onQrCodeClick(project)}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 bg-[#1a1a20] hover:bg-white/10 text-gray-200 text-xs font-semibold rounded-xl border border-white/5 transition"
                      title="View QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-500" />
                      <span>QR Code</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onManageProjectClick(project)}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-full shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" /> Manage Photos
                    </button>

                    <button
                      onClick={() => onToggleProjectStatus(project)}
                      className={`p-2 rounded-full border transition ${
                        project.status === 'active'
                          ? 'bg-[#1a1a20] text-gray-400 hover:text-rose-400 border-white/5'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                      title={project.status === 'active' ? 'Disable Link' : 'Enable Link'}
                    >
                      <Power className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteProject(project.id)}
                      className="p-2 bg-[#1a1a20] text-gray-400 hover:text-rose-400 border border-white/5 rounded-full transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
