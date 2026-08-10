import React from 'react';
import { Camera, Lock, ShieldCheck, RefreshCw, LogOut, ExternalLink, Sparkles } from 'lucide-react';
import photoPreviewLogo from '../assets/images/photo_preview_logo_1786354910542.jpg';

interface NavbarProps {
  mode: 'admin' | 'customer';
  studioName: string;
  onSwitchMode: (mode: 'admin' | 'customer') => void;
  onSeedDemo: () => void;
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
  activeProjectToken?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  studioName,
  onSwitchMode,
  onSeedDemo,
  isAdminLoggedIn,
  onAdminLogout,
  activeProjectToken
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#060608]/95 backdrop-blur-md border-b border-white/5 text-gray-200 w-full">
      <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <img
            src={photoPreviewLogo}
            alt="Photo Preview Website Icon"
            referrerPolicy="no-referrer"
            className="w-12 h-12 object-contain rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-white font-sans">
                {studioName || 'LensView Studio'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <ShieldCheck className="w-3 h-3" /> Secure Preview
              </span>
            </div>
            <p className="text-xs text-gray-500 tracking-wide uppercase hidden sm:block">Client Photo Preview & Protection System</p>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-3">
          {mode === 'admin' ? (
            <>
              <button
                onClick={onSeedDemo}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#121217] hover:bg-white/5 text-gray-300 rounded-full border border-white/5 transition"
                title="Reset/Add Sample Photography Projects"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Seed Sample Data
              </button>

              {activeProjectToken && (
                <button
                  onClick={() => onSwitchMode('customer')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-full border border-amber-500/30 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Customer Portal
                </button>
              )}

              {isAdminLoggedIn && (
                <button
                  onClick={onAdminLogout}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-full border border-rose-500/20 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => onSwitchMode('admin')}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-white hover:bg-amber-500 text-black font-bold text-xs rounded-full shadow-lg transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Admin Portal
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
