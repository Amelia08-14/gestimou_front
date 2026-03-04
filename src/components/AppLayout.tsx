'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useRole } from '@/contexts/RoleContext';
import { useEffect } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useRole();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  // Prevent flash of content while checking auth
  if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-blue border-t-transparent"></div>
            <p className="text-slate-500 font-medium">Chargement...</p>
          </div>
        </div>
      );
  }

  // Login page layout (no sidebar/header)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Protected layout
  if (!isAuthenticated) {
      return null; // Will redirect via useEffect
  }

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
