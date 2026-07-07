'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useRole } from '@/contexts/RoleContext';
import { useEffect } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useRole();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  useEffect(() => {
    if (isLoading || isLoginPage || !isAuthenticated) return;
    const role = user?.role || '';

    const isAllowed = () => {
      if (!role) return false;
      if (pathname === '/profile') return true;
      if (pathname === '/') return role !== 'RECOUVREMENT';
      if (pathname === '/financial') return role === 'ADMIN' || role === 'RECOUVREMENT';
      if (pathname === '/appel-de-fonds') return role === 'ADMIN' || role === 'RECOUVREMENT';
      if (pathname === '/admin') return role === 'ADMIN';
      if (pathname === '/documents') return role === 'ADMIN';
      if (pathname === '/maintenance') return ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER', 'HSE', 'INTERVENANT'].includes(role);
      if (pathname === '/owners') return ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER'].includes(role);
      if (pathname === '/properties') return ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER'].includes(role);
      return true;
    };

    if (!isAllowed()) {
      router.push(role === 'RECOUVREMENT' ? '/financial' : '/');
    }
  }, [isAuthenticated, isLoginPage, isLoading, pathname, router, user?.role]);

  // Prevent flash of content while checking auth
  if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-brand-cream">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-navy border-t-transparent"></div>
            <p className="text-brand-navy/60 font-medium">Chargement…</p>
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
    <div className="flex h-screen w-full bg-brand-cream">
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
