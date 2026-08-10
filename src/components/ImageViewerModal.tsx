import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ShieldAlert,
  RotateCcw,
  Grid
} from 'lucide-react';

interface PhotoItem {
  id: string;
  albumId?: string;
  filename: string;
}

interface ImageViewerModalProps {
  photos: PhotoItem[];
  currentIndex: number;
  token: string;
  password?: string;
  studioName: string;
  watermarkText: string;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  photos,
  currentIndex,
  token,
  password,
  studioName,
  watermarkText,
  onClose,
  onNavigate
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentPhoto = photos[currentIndex];

  // Reset zoom on photo change
  useEffect(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length]);

  const handlePrev = () => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Dragging / Panning logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Construct image source URL pointing to protected watermarked server endpoint
  const passParam = password ? `&pass=${encodeURIComponent(password)}` : '';
  const imageUrl = `/api/preview/image/${token}/${currentPhoto?.id}?quality=full${passParam}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0A0A0C]/98 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in text-gray-200"
      onContextMenu={e => e.preventDefault()}
    >
      {/* Top Controls Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#060608] border-b border-white/5 z-20">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-500 font-mono bg-[#1a1a20] px-3 py-1 rounded-md border border-white/5">
            {currentIndex + 1} / {photos.length}
          </span>
          <div className="hidden sm:block">
            <h4 className="text-xs font-semibold text-white truncate max-w-xs">{currentPhoto?.filename}</h4>
            <p className="text-[10px] text-amber-500 uppercase tracking-widest">{studioName} • Protected Preview</p>
          </div>
        </div>

        {/* Protection Warning */}
        <div className="hidden md:flex items-center gap-1.5 px-3.5 py-1 bg-amber-500/10 text-amber-500 text-[11px] font-semibold rounded-full border border-amber-500/20">
          <ShieldAlert className="w-3.5 h-3.5" /> Watermarked Copy
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="p-2 text-gray-300 hover:text-white bg-[#121217] hover:bg-white/10 rounded-full disabled:opacity-40 transition"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono text-gray-300 min-w-[42px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 4}
            className="p-2 text-gray-300 hover:text-white bg-[#121217] hover:bg-white/10 rounded-full disabled:opacity-40 transition"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {zoomLevel > 1 && (
            <button
              onClick={handleResetZoom}
              className="p-2 text-gray-300 hover:text-amber-500 bg-[#121217] hover:bg-white/10 rounded-full transition"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <div className="h-4 w-px bg-white/10 mx-1" />

          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-300 hover:text-white bg-[#121217] hover:bg-white/10 rounded-full transition"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-2 rounded-full transition ${
              showThumbnails ? 'text-amber-500 bg-amber-500/10' : 'text-gray-300 bg-[#121217]'
            }`}
            title="Toggle Filmstrip"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 rounded-full transition ml-2"
            title="Close Viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewport Stage */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing p-4"
        style={{
          userSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
      >
        {/* Navigation Arrow Left */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-900/80 hover:bg-amber-500 text-slate-200 hover:text-slate-950 border border-slate-700/80 shadow-2xl transition transform hover:scale-110"
            title="Previous Image (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Protected Photo Image */}
        {currentPhoto && (
          <div
            className="relative transition-transform duration-100 ease-out max-w-full max-h-full flex items-center justify-center pointer-events-none"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`
            }}
          >
            <img
              src={imageUrl}
              alt={currentPhoto.filename}
              onDragStart={e => e.preventDefault()}
              onContextMenu={e => e.preventDefault()}
              className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl pointer-events-auto border border-slate-800/80"
            />
          </div>
        )}

        {/* Navigation Arrow Right */}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-900/80 hover:bg-amber-500 text-slate-200 hover:text-slate-950 border border-slate-700/80 shadow-2xl transition transform hover:scale-110"
            title="Next Image (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Filmstrip Bottom Thumbnails */}
      {showThumbnails && (
        <div className="bg-slate-900/90 border-t border-slate-800 p-2 z-20">
          <div className="flex items-center gap-2 overflow-x-auto max-w-7xl mx-auto py-1 px-2 no-scrollbar">
            {photos.map((p, idx) => {
              const thumbUrl = `/api/preview/image/${token}/${p.id}?quality=thumb${passParam}`;
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={p.id}
                  onClick={() => onNavigate(idx)}
                  className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                    isSelected
                      ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={thumbUrl}
                    alt={p.filename}
                    onDragStart={e => e.preventDefault()}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
