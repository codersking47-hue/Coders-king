import React, { useState } from 'react';
import { X, Plus, Shield, Image, Sparkles, Upload, Calendar, Lock, Phone, User, FolderPlus, Zap } from 'lucide-react';
import { CreateProjectPayload } from '../types';

interface ProjectFormModalProps {
  onClose: () => void;
  onSubmit: (payload: CreateProjectPayload, photos: File[]) => Promise<void>;
  defaultStudioName: string;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  onClose,
  onSubmit,
  defaultStudioName
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDate, setProjectDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDays, setExpiryDays] = useState(30);
  const [password, setPassword] = useState('');
  const [watermarkText, setWatermarkText] = useState(`${defaultStudioName} • PREVIEW ONLY`);
  const [watermarkPosition, setWatermarkPosition] = useState<'center' | 'diagonal' | 'repeated'>('repeated');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.35);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !projectName) return;

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          customerName,
          customerMobile,
          projectName,
          projectDate,
          expiryDays,
          password: password || undefined,
          watermarkText,
          watermarkPosition,
          watermarkOpacity
        },
        selectedFiles
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0A0A0C]/85 backdrop-blur-sm animate-fade-in overflow-hidden">
      <div className="bg-[#121217] border border-white/10 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-gray-200 shadow-2xl relative max-h-[92vh] flex flex-col my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition z-10"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title Header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5 flex-none pr-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-black font-bold shadow-lg shadow-amber-500/10 flex-none">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Create New Photo Project</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Generate a secure preview link for your customer</p>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-2 space-y-5 text-gray-200 scrollbar-thin scrollbar-thumb-gray-800">
            {/* Quick Presets Bar */}
            <div className="bg-[#0A0A0C] p-3.5 rounded-2xl border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 fill-amber-500" /> 1-Click Quick Preset Fill
                </span>
                <span className="text-[10px] text-gray-500">Click to autofill project details</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '👰 Wedding Album', title: 'Wedding & Reception Highlights' },
                  { label: '🎂 Birthday Party', title: 'Birthday Celebration Photos' },
                  { label: '📸 Studio Portrait', title: 'Studio Portfolio Session' },
                  { label: '💍 Pre-Wedding', title: 'Pre-Wedding Shoot' },
                  { label: '🎉 Special Event', title: 'Event Photography Highlights' }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!customerName.trim()) setCustomerName('Valued Client');
                      setProjectName(preset.title);
                    }}
                    className="px-3 py-1.5 bg-[#121217] hover:bg-amber-500 hover:text-black border border-white/10 rounded-full text-xs font-semibold text-gray-300 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 1: Customer Details */}
            <div className="bg-[#0A0A0C] p-4 sm:p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Customer Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Customer Name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Kumar"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-[#121217] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    WhatsApp / Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={customerMobile}
                      onChange={e => setCustomerMobile(e.target.value)}
                      className="w-full bg-[#121217] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Event Details & Link Security */}
            <div className="bg-[#0A0A0C] p-4 sm:p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Event & Security Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Project / Event Name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wedding & Reception Photos"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    className="w-full bg-[#121217] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Project Date</label>
                  <input
                    type="date"
                    value={projectDate}
                    onChange={e => setProjectDate(e.target.value)}
                    className="w-full bg-[#121217] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Link Validity Expiry
                  </label>
                  <select
                    value={expiryDays}
                    onChange={e => setExpiryDays(Number(e.target.value))}
                    className="w-full bg-[#121217] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value={7}>7 Days</option>
                    <option value={15}>15 Days</option>
                    <option value={30}>30 Days (Default)</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Optional Access Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Leave empty for direct link"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-[#121217] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Watermark Customization */}
            <div className="bg-[#0A0A0C] p-4 sm:p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Protection Watermark
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Watermark Text
                  </label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={e => setWatermarkText(e.target.value)}
                    className="w-full bg-[#121217] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Watermark Position
                  </label>
                  <select
                    value={watermarkPosition}
                    onChange={e => setWatermarkPosition(e.target.value as any)}
                    className="w-full bg-[#121217] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="repeated">Repeated Pattern Grid (Highest Security)</option>
                    <option value="diagonal">Diagonal Across Photo</option>
                    <option value="center">Center Banner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Opacity ({Math.round(watermarkOpacity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.15"
                    max="0.8"
                    step="0.05"
                    value={watermarkOpacity}
                    onChange={e => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-2 bg-[#121217] rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Photo Selection */}
            <div className="bg-[#0A0A0C] p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5" /> Upload Photos ({selectedFiles.length})
                </h3>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-xs font-semibold rounded-full border border-amber-500/20 transition">
                  <Upload className="w-3.5 h-3.5" /> Choose Files
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {selectedFiles.length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-2xl p-5 text-center text-gray-500 hover:border-white/20 transition">
                  <Upload className="w-7 h-7 mx-auto mb-1.5 opacity-50 text-amber-500" />
                  <p className="text-xs">Drag & drop or select images to upload for this project</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">You can also upload photos after project creation</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl bg-[#121217] border border-white/5 overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="upload preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 mt-4 flex-none">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-amber-500 font-bold text-xs rounded-full shadow-lg disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>Creating Project...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Preview Link
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
