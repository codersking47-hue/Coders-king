import React, { useState } from 'react';
import {
  X,
  Plus,
  Upload,
  Trash2,
  FolderPlus,
  Shield,
  RefreshCw,
  Copy,
  Check,
  Key,
  Layers,
  Image as ImageIcon,
  Lock,
  Eye,
  Settings
} from 'lucide-react';
import { Project, Album, Photo } from '../types';

interface ManageProjectModalProps {
  project: Project;
  onClose: () => void;
  onUpdateProject: (projectId: string, payload: Partial<Project>) => Promise<void>;
  onAddPhotos: (projectId: string, files: File[], albumId?: string) => Promise<void>;
  onDeletePhoto: (projectId: string, photoId: string) => Promise<void>;
  onCreateAlbum: (projectId: string, name: string) => Promise<void>;
  onDeleteAlbum: (projectId: string, albumId: string) => Promise<void>;
  onRegenerateToken: (projectId: string) => Promise<void>;
}

export const ManageProjectModal: React.FC<ManageProjectModalProps> = ({
  project,
  onClose,
  onUpdateProject,
  onAddPhotos,
  onDeletePhoto,
  onCreateAlbum,
  onDeleteAlbum,
  onRegenerateToken
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'watermark' | 'settings'>('photos');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | 'all'>('all');
  const [newAlbumName, setNewAlbumName] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form states
  const [watermarkText, setWatermarkText] = useState(project.watermark.text);
  const [watermarkPosition, setWatermarkPosition] = useState(project.watermark.position);
  const [watermarkOpacity, setWatermarkOpacity] = useState(project.watermark.opacity);
  const [password, setPassword] = useState(project.password || '');
  const [expiryDate, setExpiryDate] = useState(project.expiryDate.split('T')[0]);
  const [status, setStatus] = useState(project.status);

  const previewUrl = `${window.location.origin}/view/${project.token}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(previewUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingFiles(true);
    try {
      const files = Array.from(e.target.files);
      const targetAlbum = selectedAlbumId === 'all' ? project.albums[0]?.id : selectedAlbumId;
      await onAddPhotos(project.id, files, targetAlbum);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    await onCreateAlbum(project.id, newAlbumName.trim());
    setNewAlbumName('');
  };

  const handleSaveWatermark = async () => {
    await onUpdateProject(project.id, {
      watermark: {
        ...project.watermark,
        text: watermarkText,
        position: watermarkPosition,
        opacity: watermarkOpacity
      }
    });
  };

  const handleSaveSettings = async () => {
    await onUpdateProject(project.id, {
      password: password ? password.trim() : undefined,
      expiryDate: new Date(expiryDate).toISOString(),
      status
    });
  };

  const filteredPhotos = selectedAlbumId === 'all'
    ? project.photos
    : project.photos.filter(p => p.albumId === selectedAlbumId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0A0A0C]/85 backdrop-blur-sm animate-fade-in overflow-hidden">
      <div className="bg-[#121217] border border-white/10 rounded-3xl max-w-4xl w-full p-6 sm:p-8 text-gray-200 shadow-2xl relative max-h-[92vh] flex flex-col my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition z-10"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5 flex-none pr-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-white">{project.projectName}</h2>
              <span className={`px-3 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full ${
                project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {project.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Customer: <span className="text-gray-200 font-medium">{project.customerName}</span> ({project.customerMobile || 'No mobile'}) • {project.photos.length} Photos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0A0A0C] hover:bg-white/5 text-gray-200 text-xs font-semibold rounded-full border border-white/5 transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
              {copiedLink ? 'Copied Link' : 'Copy Link'}
            </button>

            <a
              href={`/view/${project.token}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-xs font-semibold rounded-full border border-amber-500/20 transition"
            >
              <Eye className="w-3.5 h-3.5" /> Preview Client Page
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/5 mb-5 pb-3 flex-none overflow-x-auto">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-full transition whitespace-nowrap ${
              activeTab === 'photos'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
                : 'text-gray-400 hover:text-white bg-[#0A0A0C] border border-white/5'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Photos & Albums ({project.photos.length})
          </button>

          <button
            onClick={() => setActiveTab('watermark')}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'watermark'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
                : 'text-gray-400 hover:text-white bg-[#0A0A0C] border border-white/5'
            }`}
          >
            <Shield className="w-4 h-4" /> Protection Watermark
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
                : 'text-gray-400 hover:text-white bg-[#0A0A0C] border border-white/5'
            }`}
          >
            <Settings className="w-4 h-4" /> Access & Security
          </button>
        </div>

        {/* Scrollable Tab Content Container */}
        <div className="flex-1 overflow-y-auto pr-1 text-gray-200 min-h-0">

        {/* TAB 1: PHOTOS & ALBUMS */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            {/* Albums Bar */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedAlbumId('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedAlbumId === 'all'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    All Photos ({project.photos.length})
                  </button>

                  {project.albums.map(album => {
                    const count = project.photos.filter(p => p.albumId === album.id).length;
                    return (
                      <div key={album.id} className="inline-flex items-center bg-slate-800 rounded-lg pr-1">
                        <button
                          onClick={() => setSelectedAlbumId(album.id)}
                          className={`px-3 py-1 rounded-l-lg text-xs font-semibold transition ${
                            selectedAlbumId === album.id
                              ? 'bg-amber-500 text-slate-950'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {album.name} ({count})
                        </button>
                        {project.albums.length > 1 && (
                          <button
                            onClick={() => onDeleteAlbum(project.id, album.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Delete Album"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Upload Button */}
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-md transition">
                  <Upload className="w-3.5 h-3.5" /> Upload Photos
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Add New Album Form */}
              <form onSubmit={handleCreateAlbum} className="flex gap-2 pt-2 border-t border-slate-800/80">
                <input
                  type="text"
                  placeholder="New Album Name (e.g. Reception, Haldi, Pre-wedding)..."
                  value={newAlbumName}
                  onChange={e => setNewAlbumName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" /> Add Album
                </button>
              </form>
            </div>

            {/* Photos Grid */}
            {filteredPhotos.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-400">No photos in this album</p>
                <p className="text-xs text-slate-500 mt-1">Click Upload Photos above to add high resolution pictures</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-sm"
                  >
                    <img
                      src={`/api/preview/image/${project.token}/${photo.id}?quality=thumb`}
                      alt={photo.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-300 bg-slate-900/80 px-1.5 py-0.5 rounded">
                        <span className="truncate max-w-[100px]">{photo.filename}</span>
                        <span>#{index + 1}</span>
                      </div>

                      <button
                        onClick={() => onDeletePhoto(project.id, photo.id)}
                        className="self-end bg-rose-600 hover:bg-rose-500 text-white p-1.5 rounded-lg shadow-md transition"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WATERMARK SETTINGS */}
        {activeTab === 'watermark' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Watermark Configuration
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Watermark Label</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={e => setWatermarkText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Layout Style</label>
                <select
                  value={watermarkPosition}
                  onChange={e => setWatermarkPosition(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="repeated">Repeated Pattern Grid (Safest)</option>
                  <option value="diagonal">Diagonal Across Center</option>
                  <option value="center">Center Banner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Watermark Opacity ({Math.round(watermarkOpacity * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={watermarkOpacity}
                  onChange={e => setWatermarkOpacity(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-900 rounded-lg cursor-pointer"
                />
              </div>

              <button
                onClick={handleSaveWatermark}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
              >
                Apply Watermark Changes
              </button>
            </div>

            {/* Live Watermark Preview Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2">Live Watermark Preview Example</h4>
                <div className="relative aspect-video rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                  {project.photos[0] ? (
                    <img
                      src={`/api/preview/image/${project.token}/${project.photos[0].id}?quality=thumb`}
                      alt="Watermark preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-xs text-slate-500">Upload photos to preview live server stamp</div>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 italic">
                Notice: All previews are dynamically generated on the server using Sharp image processing before being sent to customer browser.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: ACCESS & SECURITY */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Link Security & Expiry
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Access Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="active">Active (Accessible via Token)</option>
                    <option value="disabled">Disabled / Suspended Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Project Password</label>
                  <input
                    type="text"
                    placeholder="None (Public preview link)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleSaveSettings}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Save Security Settings
                  </button>
                </div>
              </div>
            </div>

            {/* Token Regeneration */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Regenerate Preview Link Token
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Current Token: <code className="text-amber-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">{project.token}</code>. Regenerating invalidates previous links.
                </p>
              </div>

              <button
                onClick={() => onRegenerateToken(project.id)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Regenerate Now
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
