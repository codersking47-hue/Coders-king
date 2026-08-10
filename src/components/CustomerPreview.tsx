import React, { useState, useEffect } from 'react';
import {
  Camera,
  Lock,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Eye,
  Phone,
  Maximize2
} from 'lucide-react';
import { CustomerPreviewData, Album } from '../types';
import { ImageViewerModal } from './ImageViewerModal';
import photoPreviewLogo from '../assets/images/photo_preview_logo_1786354910542.jpg';

interface CustomerPreviewProps {
  token: string;
}

export const CustomerPreview: React.FC<CustomerPreviewProps> = ({ token }) => {
  const [data, setData] = useState<CustomerPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password Verification State
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  // Album & Viewer State
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | 'all'>('all');
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/preview/data/${token}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || 'Unable to load photo preview');
      } else {
        setData(json);
        if (!json.requiresPassword) {
          setIsPasswordVerified(true);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    try {
      const res = await fetch(`/api/preview/verify-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      const json = await res.json();
      if (json.verified) {
        setIsPasswordVerified(true);
      } else {
        setPasswordError('Incorrect access password. Please contact your photographer.');
      }
    } catch (err) {
      setPasswordError('Error verifying password');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center p-4 text-gray-200">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-bounce mb-4">
          <Camera className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-gray-300">Loading Secure Photo Gallery...</p>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Preparing watermarked preview representation</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center p-4 text-gray-200">
        <div className="bg-[#121217] border border-white/5 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-white">Preview Not Found</h2>
          <p className="text-xs text-gray-400">{error || 'This preview link is invalid or has been deleted.'}</p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-white text-black text-xs font-bold rounded-full hover:bg-amber-500 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  // Handle Expired or Disabled Link
  if (data.isExpired) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center p-4 text-gray-200">
        <div className="bg-[#121217] border border-white/5 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center border border-amber-500/20">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-semibold text-white">Preview Link Expired</h2>
          <p className="text-xs text-gray-300">
            This photo preview link for <strong className="text-amber-500">{data.projectName}</strong> has expired.
          </p>
          <div className="bg-[#0A0A0C] p-4 rounded-2xl border border-white/5 text-xs text-gray-400 space-y-1">
            <p className="font-semibold text-gray-200">{data.studioName}</p>
            <p className="text-[11px]">Please contact your photo studio to renew your preview access.</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle Password Gate
  if (data.requiresPassword && !isPasswordVerified) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center p-4 text-gray-200">
        <div className="bg-[#121217] border border-white/5 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <img
              src={photoPreviewLogo}
              alt="Photo Preview Icon"
              referrerPolicy="no-referrer"
              className="w-16 h-16 object-contain mx-auto rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/20"
            />
            <h2 className="text-xl font-semibold text-white pt-1">Protected Photo Preview</h2>
            <p className="text-xs text-gray-400">
              Enter the access password provided by <strong className="text-gray-200">{data.studioName}</strong>
            </p>
          </div>

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Access Password</label>
              <input
                type="password"
                required
                placeholder="Enter password..."
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full bg-[#0A0A0C] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {passwordError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl text-center">
                {passwordError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-full shadow-lg transition"
            >
              Unlock Photo Gallery
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter photos by selected album
  const filteredPhotos = selectedAlbumId === 'all'
    ? data.photos
    : data.photos.filter(p => p.albumId === selectedAlbumId);

  return (
    <div
      className="min-h-screen bg-[#0A0A0C] text-gray-200 pb-16 select-none"
      onContextMenu={e => e.preventDefault()}
    >
      {/* Top Banner Header */}
      <div className="bg-[#060608] border-b border-white/5 pt-8 pb-6 px-4 sm:px-8 lg:px-12">
        <div className="max-w-[1700px] w-full mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <img
                src={photoPreviewLogo}
                alt="Photo Preview Icon"
                referrerPolicy="no-referrer"
                className="w-16 h-16 object-contain rounded-2xl border border-amber-500/30 shadow-xl shadow-amber-500/20 flex-shrink-0"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> Protected Client Gallery
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {data.studioName}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                  Welcome {data.customerName}
                </h1>
                <p className="text-sm font-medium text-amber-500 mt-1">
                  {data.projectName} • {data.photos.length} Photos
                </p>
              </div>
            </div>

            {/* Validity Badge */}
            <div className="bg-[#121217] border border-white/5 rounded-3xl p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="text-xs">
                <span className="text-gray-500 block text-[10px] uppercase tracking-wider font-bold">Preview Valid Until</span>
                <span className="font-semibold text-white">
                  {new Date(data.expiryDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Watermark Security Notice */}
          <div className="bg-[#121217] border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>
                <strong className="text-white">Note:</strong> All photos are displayed in protected preview mode with watermarking. Original high-resolution copies will be provided by <strong className="text-white">{data.studioName}</strong> after selection.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Album Filter Bar */}
      <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedAlbumId('all')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
              selectedAlbumId === 'all'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
                : 'bg-[#121217] text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> All Photos ({data.photos.length})
          </button>

          {data.albums.map(album => {
            const count = data.photos.filter(p => p.albumId === album.id).length;
            if (count === 0) return null;
            return (
              <button
                key={album.id}
                onClick={() => setSelectedAlbumId(album.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
                  selectedAlbumId === album.id
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
                    : 'bg-[#121217] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {album.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Gallery Photo Grid */}
      <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-8 lg:px-12">
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-16 bg-[#121217] border border-white/5 rounded-3xl">
            <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-300">No photos in this album</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredPhotos.map((photo, idx) => {
              const passParam = passwordInput ? `&pass=${encodeURIComponent(passwordInput)}` : '';
              const thumbUrl = `/api/preview/image/${token}/${photo.id}?quality=thumb${passParam}`;

              return (
                <div
                  key={photo.id}
                  onClick={() => setActivePhotoIndex(idx)}
                  className="group relative aspect-square bg-[#121217] rounded-3xl overflow-hidden border border-white/5 hover:border-amber-500/50 cursor-pointer shadow-xl transition duration-300 transform hover:-translate-y-1"
                >
                  <img
                    src={thumbUrl}
                    alt={photo.filename}
                    loading="lazy"
                    onDragStart={e => e.preventDefault()}
                    onContextMenu={e => e.preventDefault()}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />

                  {/* Hover Quick Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center p-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Photo Counter Tag */}
                  <div className="absolute bottom-3 left-3 bg-[#0A0A0C]/90 text-[10px] font-bold text-amber-500 px-2.5 py-1 rounded-md border border-white/5 font-mono">
                    #{idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Premium Viewer Modal */}
      {activePhotoIndex !== null && (
        <ImageViewerModal
          photos={filteredPhotos}
          currentIndex={activePhotoIndex}
          token={token}
          password={passwordInput}
          studioName={data.studioName}
          watermarkText={data.watermarkText}
          onClose={() => setActivePhotoIndex(null)}
          onNavigate={newIndex => setActivePhotoIndex(newIndex)}
        />
      )}
    </div>
  );
};
