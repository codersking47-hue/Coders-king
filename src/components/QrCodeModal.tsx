import React, { useState } from 'react';
import { X, QrCode, Download, Printer, Copy, Check, Share2, MessageCircle, Key, FileImage, Sparkles, ShieldCheck } from 'lucide-react';
import { Project } from '../types';
import { generatePasswordCardImage, downloadPasswordCardImage } from '../utils/passcardGenerator';

interface QrCodeModalProps {
  project: Project;
  onClose: () => void;
  studioName?: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ project, onClose, studioName = 'Apex Photography & Studio' }) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  const previewUrl = `${window.location.origin}/view/${project.token}`;
  const qrImageUrl = `/api/qr/${project.token}`;

  const whatsappMessage = encodeURIComponent(
    `नमस्ते ${project.customerName} जी, आपकी ${project.projectName} की photos का online preview तैयार है।\n\n` +
    `Gallery Link: ${previewUrl}\n` +
    (project.password ? `Access Password: ${project.password}\n` : '') +
    `Valid Until: ${new Date(project.expiryDate).toLocaleDateString('en-GB')}`
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `QR_${project.customerName.replace(/\s+/g, '_')}_${project.token}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPasswordCard = async () => {
    setIsGeneratingCard(true);
    try {
      const dataUrl = await generatePasswordCardImage(project, studioName);
      const safeCustomer = project.customerName.replace(/[^a-zA-Z0-9]/g, '_');
      downloadPasswordCardImage(dataUrl, `${safeCustomer}_Gallery_Password_Card.png`);
    } catch (err) {
      console.error('Failed to generate password card:', err);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Photo Preview Card - ${project.customerName}</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #f8fafc; }
            .card { border: 2px solid #e2e8f0; padding: 32px; border-radius: 20px; max-width: 440px; margin: 0 auto; background: white; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
            img { width: 220px; height: 220px; }
            h2 { margin: 12px 0 4px; color: #0f172a; font-size: 20px; }
            p { color: #64748b; font-size: 13px; margin-bottom: 16px; }
            .pass-box { background: #fef3c7; border: 1px solid #fde68a; padding: 10px; border-radius: 12px; margin-bottom: 16px; font-weight: bold; color: #92400e; font-size: 14px; }
            .link { font-family: monospace; background: #f1f5f9; padding: 10px; border-radius: 8px; font-size: 12px; word-break: break-all; color: #334155; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${studioName}</h2>
            <p>${project.projectName} • ${project.customerName}</p>
            <img src="${qrImageUrl}" />
            ${project.password ? `<div class="pass-box">🔑 Gallery Password: ${project.password}</div>` : ''}
            <div class="link">${previewUrl}</div>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0A0A0C]/85 backdrop-blur-sm animate-fade-in overflow-hidden">
      <div className="bg-[#121217] border border-white/10 rounded-3xl max-w-md w-full p-6 sm:p-8 text-gray-200 shadow-2xl relative max-h-[92vh] overflow-y-auto my-auto space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-none">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Project QR & Access Card</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest">{project.projectName} ({project.customerName})</p>
          </div>
        </div>

        {/* QR Display */}
        <div className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center border border-white/10 shadow-inner">
          <img
            src={qrImageUrl}
            alt="Project Preview QR Code"
            className="w-48 h-48 object-contain"
          />
          <p className="text-[11px] text-gray-600 font-mono mt-2 text-center break-all">
            {previewUrl}
          </p>
        </div>

        {/* Password Details Highlight Card */}
        <div className="bg-[#0A0A0C] border border-amber-500/30 rounded-2xl p-4 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-amber-500">
            <span className="flex items-center gap-1.5">
              <Key className="w-4 h-4" /> Password / Access Details
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {project.password ? 'Protected' : 'Direct Link'}
            </span>
          </div>
          <div className="text-sm font-mono font-bold text-white bg-[#121217] p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
            <span>{project.password ? `PASSWORD: ${project.password}` : 'NO PASSWORD (DIRECT LINK)'}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* NEW FEATURE BUTTON: Generate & Download Password Card Image */}
        <button
          onClick={handleDownloadPasswordCard}
          disabled={isGeneratingCard}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-full shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
        >
          {isGeneratingCard ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin" /> Generating Password Image Card...
            </>
          ) : (
            <>
              <FileImage className="w-4 h-4" /> Generate & Download Password Details Image
            </>
          )}
        </button>

        {/* Actions Grid */}
        <div className="space-y-2.5 pt-1 border-t border-white/5">
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0A0A0C] hover:bg-white/5 text-gray-200 text-xs font-semibold rounded-full border border-white/5 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-500" />}
              {copied ? 'Copied Link' : 'Copy Link'}
            </button>

            <a
              href={`https://wa.me/${project.customerMobile.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-500 text-black hover:bg-emerald-400 text-xs font-bold rounded-full shadow-md transition"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              WhatsApp Share
            </a>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadQr}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0A0A0C] hover:bg-white/5 text-gray-200 text-xs font-semibold rounded-full border border-white/5 transition"
            >
              <Download className="w-4 h-4 text-amber-500" />
              Download QR
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0A0A0C] hover:bg-white/5 text-gray-200 text-xs font-semibold rounded-full border border-white/5 transition"
            >
              <Printer className="w-4 h-4 text-amber-500" />
              Print Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

