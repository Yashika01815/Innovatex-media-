import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuthStore } from '@/store/authStore';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const status = useAuthStore((s) => s.status);

  // 'idle'/'loading' = initialize() (see App.tsx) is still trying a silent
  // refresh via the httpOnly cookie -- wait rather than bounce to /login,
  // otherwise every full-page reload would flash the login screen even for
  // an already-signed-in user.
  if (status === 'idle' || status === 'loading') return null;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
