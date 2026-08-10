import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/AdminDashboard';
import { ProjectFormModal } from './components/ProjectFormModal';
import { ManageProjectModal } from './components/ManageProjectModal';
import { QrCodeModal } from './components/QrCodeModal';
import { CustomerPreview } from './components/CustomerPreview';
import { Project, DashboardStats, CreateProjectPayload } from './types';
import { Lock, Camera, Sparkles, Key, UserPlus, LogIn, Building2, User, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';
import photoPreviewLogo from './assets/images/photo_preview_logo_1786354910542.jpg';

export default function App() {
  const [mode, setMode] = useState<'admin' | 'customer'>('admin');
  const [routeToken, setRouteToken] = useState<string | null>(null);

  // Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(true); // Default logged in for smooth previewing
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  // Sign Up State
  const [signupStudioName, setSignupStudioName] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [adminAuthSuccess, setAdminAuthSuccess] = useState<string | null>(null);

  // Dashboard Data State
  const [studioName, setStudioName] = useState('Apex Photography & Studio');
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalPhotos: 0,
    activeLinks: 0,
    expiredLinks: 0,
    totalCustomers: 0,
    recentUploadsCount: 0
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [managingProject, setManagingProject] = useState<Project | null>(null);
  const [qrProject, setQrProject] = useState<Project | null>(null);

  // Handle URL path routing e.g. /view/ABC123
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/view/')) {
      const token = path.replace('/view/', '').trim();
      if (token) {
        setRouteToken(token);
        setMode('customer');
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const json = await res.json();
        setStudioName(json.studioName || 'Apex Photography & Studio');
        setStats(json.stats);
        setProjects(json.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setAdminAuthSuccess(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: adminPasswordInput })
      });
      const json = await res.json();
      if (json.success) {
        setIsAdminLoggedIn(true);
        if (json.user?.studioName) {
          setStudioName(json.user.studioName);
        }
        fetchDashboardData();
      } else {
        setAdminLoginError(json.message || 'Invalid admin email or password');
      }
    } catch (err) {
      setAdminLoginError('Connection error');
    }
  };

  const handleAdminSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setAdminAuthSuccess(null);

    if (signupPassword !== signupConfirmPassword) {
      setAdminLoginError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch('/api/admin/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          studioName: signupStudioName
        })
      });
      const json = await res.json();
      if (json.success) {
        setAdminAuthSuccess('Account created successfully! Signing you in...');
        setTimeout(() => {
          setIsAdminLoggedIn(true);
          if (json.user?.studioName) {
            setStudioName(json.user.studioName);
          }
          fetchDashboardData();
        }, 800);
      } else {
        setAdminLoginError(json.message || 'Failed to create account');
      }
    } catch (err) {
      setAdminLoginError('Connection error');
    }
  };

  const handleSeedDemo = async () => {
    try {
      const res = await fetch('/api/admin/seed-demo', { method: 'POST' });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStudioName = async (name: string) => {
    try {
      const res = await fetch('/api/admin/studio-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studioName: name })
      });
      if (res.ok) {
        const json = await res.json();
        setStudioName(json.studioName);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (payload: CreateProjectPayload, files: File[]) => {
    try {
      // Step 1: Create project record via API
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) return;

      const createdProject: Project = json.project;

      // INSTANT UI UPDATE: Prepend created project to state immediately
      setProjects(prev => [createdProject, ...prev]);
      setStats(prev => ({
        ...prev,
        totalProjects: prev.totalProjects + 1,
        activeLinks: prev.activeLinks + 1,
        totalCustomers: prev.totalCustomers + (payload.customerMobile ? 1 : 1)
      }));

      // Immediately open QR & Access Modal
      setQrProject(createdProject);

      // Step 2: Asynchronously upload initial photos if provided (non-blocking)
      if (files && files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('photos', file));
        if (createdProject.albums[0]) {
          formData.append('albumId', createdProject.albums[0].id);
        }

        fetch(`/api/admin/projects/${createdProject.id}/photos`, {
          method: 'POST',
          body: formData
        })
          .then(uploadRes => uploadRes.json())
          .then(uploadJson => {
            if (uploadJson.success && uploadJson.project) {
              setProjects(prev =>
                prev.map(p => (p.id === createdProject.id ? uploadJson.project : p))
              );
              setStats(prev => ({
                ...prev,
                totalPhotos: prev.totalPhotos + (files ? files.length : 0)
              }));
            }
          })
          .catch(err => console.error('Background photo upload error:', err));
      }
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  const handleQuickCreateProject = async () => {
    const dateFormatted = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const quickPayload: CreateProjectPayload = {
      customerName: 'Quick Client',
      customerMobile: '',
      projectName: `Quick Preview (${dateFormatted})`,
      projectDate: new Date().toISOString().split('T')[0],
      expiryDays: 30,
      watermarkText: `${studioName} • PREVIEW ONLY`,
      watermarkPosition: 'repeated',
      watermarkOpacity: 0.35
    };
    await handleCreateProject(quickPayload, []);
  };

  const handleUpdateProject = async (projectId: string, updateData: Partial<Project>) => {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        await fetchDashboardData();
        if (managingProject?.id === projectId) {
          const updatedRes = await res.json();
          setManagingProject(updatedRes.project);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPhotos = async (projectId: string, files: File[], albumId?: string) => {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('photos', file));
      if (albumId) formData.append('albumId', albumId);

      const res = await fetch(`/api/admin/projects/${projectId}/photos`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const json = await res.json();
        setManagingProject(json.project);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePhoto = async (projectId: string, photoId: string) => {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/photos/${photoId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const json = await res.json();
        setManagingProject(json.project);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAlbum = async (projectId: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/albums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const json = await res.json();
        setManagingProject(json.project);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAlbum = async (projectId: string, albumId: string) => {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/albums/${albumId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const json = await res.json();
        setManagingProject(json.project);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegenerateToken = async (projectId: string) => {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/regenerate-token`, {
        method: 'POST'
      });
      if (res.ok) {
        const json = await res.json();
        setManagingProject(json.project);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this photo project and all uploaded images?')) return;
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleProjectStatus = async (project: Project) => {
    const newStatus = project.status === 'active' ? 'disabled' : 'active';
    await handleUpdateProject(project.id, { status: newStatus });
  };

  const activeToken = routeToken || projects[0]?.token || '8FJ92K';

  return (
    <div className="min-h-screen w-full bg-[#0A0A0C] text-gray-200 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      <Navbar
        mode={mode}
        studioName={studioName}
        onSwitchMode={m => setMode(m)}
        onSeedDemo={handleSeedDemo}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogout={() => setIsAdminLoggedIn(false)}
        activeProjectToken={activeToken}
      />

      {/* Main Mode Viewport */}
      {mode === 'customer' ? (
        <CustomerPreview token={routeToken || activeToken} />
      ) : !isAdminLoggedIn ? (
        // Admin Login / Sign Up Screen
        <div className="flex-1 flex items-center justify-center p-4 py-12">
          <div className="bg-[#121217] border border-white/10 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="text-center space-y-2 relative">
              <img
                src={photoPreviewLogo}
                alt="Photo Preview Icon"
                referrerPolicy="no-referrer"
                className="w-20 h-20 object-contain mx-auto rounded-3xl border-2 border-amber-500/40 shadow-xl shadow-amber-500/20 hover:scale-105 transition-transform"
              />
              <h2 className="text-2xl font-extrabold text-white tracking-tight pt-2">
                {authTab === 'login' ? 'Studio Admin Sign In' : 'Create Studio Account'}
              </h2>
              <p className="text-xs text-gray-400">
                {authTab === 'login'
                  ? 'Sign in to access your photography project portal'
                  : 'Register your photography studio to manage preview links'}
              </p>
            </div>

            {/* Auth Tab Switcher */}
            <div className="flex bg-[#0A0A0C] p-1 rounded-2xl border border-white/5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setAdminLoginError(null);
                  setAdminAuthSuccess(null);
                }}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition ${
                  authTab === 'login'
                    ? 'bg-amber-500 text-black shadow-md font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab('signup');
                  setAdminLoginError(null);
                  setAdminAuthSuccess(null);
                }}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition ${
                  authTab === 'signup'
                    ? 'bg-amber-500 text-black shadow-md font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" /> Sign Up
              </button>
            </div>

            {/* Alerts */}
            {adminLoginError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-center">
                {adminLoginError}
              </p>
            )}

            {adminAuthSuccess && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center flex items-center justify-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" /> {adminAuthSuccess}
              </p>
            )}

            {authTab === 'login' ? (
              // SIGN IN FORM
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-500" /> Admin Email
                  </label>
                  <input
                    type="email"
                    placeholder="admin@apexstudio.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" /> Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Default: admin123"
                    value={adminPasswordInput}
                    onChange={e => setAdminPasswordInput(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Default demo password: <code className="text-amber-400">admin123</code></p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-full shadow-lg shadow-amber-500/10 transition mt-2 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Sign In to Dashboard
                </button>
              </form>
            ) : (
              // SIGN UP FORM
              <form onSubmit={handleAdminSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-500" /> Studio / Photography Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Photography & Studio"
                    value={signupStudioName}
                    onChange={e => setSignupStudioName(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-500" /> Full Name / Owner Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Sharma"
                    value={signupName}
                    onChange={e => setSignupName(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-500" /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. vikram@apexstudio.com"
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" /> Create Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    placeholder="Min 4 characters"
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={signupConfirmPassword}
                    onChange={e => setSignupConfirmPassword(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-full shadow-lg shadow-amber-500/10 transition mt-2 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Register Studio Account
                </button>
              </form>
            )}

            {/* Footer switcher */}
            <div className="pt-4 border-t border-white/5 text-center text-xs text-gray-400">
              {authTab === 'login' ? (
                <p>
                  Don't have a studio account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('signup');
                      setAdminLoginError(null);
                      setAdminAuthSuccess(null);
                    }}
                    className="text-amber-400 hover:underline font-semibold"
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login');
                      setAdminLoginError(null);
                      setAdminAuthSuccess(null);
                    }}
                    className="text-amber-400 hover:underline font-semibold"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Main Admin Dashboard
        <main className="flex-1">
          <AdminDashboard
            stats={stats}
            projects={projects}
            studioName={studioName}
            onUpdateStudioName={handleUpdateStudioName}
            onCreateProjectClick={() => setShowCreateModal(true)}
            onQuickCreateProject={handleQuickCreateProject}
            onInlineCreateProject={payload => handleCreateProject(payload, [])}
            onManageProjectClick={project => setManagingProject(project)}
            onQrCodeClick={project => setQrProject(project)}
            onDeleteProject={handleDeleteProject}
            onToggleProjectStatus={handleToggleProjectStatus}
            onSeedDemo={handleSeedDemo}
          />
        </main>
      )}

      {/* Modals */}
      {showCreateModal && (
        <ProjectFormModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
          defaultStudioName={studioName}
        />
      )}

      {managingProject && (
        <ManageProjectModal
          project={managingProject}
          onClose={() => setManagingProject(null)}
          onUpdateProject={handleUpdateProject}
          onAddPhotos={handleAddPhotos}
          onDeletePhoto={handleDeletePhoto}
          onCreateAlbum={handleCreateAlbum}
          onDeleteAlbum={handleDeleteAlbum}
          onRegenerateToken={handleRegenerateToken}
        />
      )}

      {qrProject && (
        <QrCodeModal
          project={qrProject}
          onClose={() => setQrProject(null)}
          studioName={studioName}
        />
      )}
    </div>
  );
}
