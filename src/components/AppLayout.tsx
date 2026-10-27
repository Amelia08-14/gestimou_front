'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileNavigation } from '@/components/MobileNavigation';
import { useRole } from '@/contexts/RoleContext';
import { useEffect } from 'react';
import Image from 'next/image';

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
      if (pathname === '/registrations') return role === 'ADMIN';
      if (pathname === '/documents') return ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER', 'HSE', 'RECOUVREMENT'].includes(role);
      if (pathname === '/maintenance') return ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER', 'HSE', 'INTERVENANT'].includes(role);
      if (pathname === '/owners') return ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER'].includes(role);
      if (pathname === '/properties') return ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER'].includes(role);
      if (pathname === '/trombinoscope') return ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER'].includes(role);
      if (pathname === '/avis') return ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER'].includes(role);
      return true;
    };

    if (!isAllowed()) {
      router.push(role === 'RECOUVREMENT' ? '/financial' : '/');
    }
  }, [isAuthenticated, isLoginPage, isLoading, pathname, router, user?.role]);

  // Prevent flash of content while checking auth
  if (isLoading) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-brand-cream">
          <div className="flex flex-col items-center gap-6">
            <Image src="/brand/gis_logo_vertical_light.png" alt="Gérance Immo Service" width={96} height={96} priority className="gi-appear" />
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-amber border-t-transparent" />
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
    <div className="flex min-h-screen w-full bg-brand-cream md:h-screen">
      <div className="hidden md:block"><Sidebar /></div>
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <div className="hidden md:block"><Header /></div>
        <main className="flex-1 overflow-y-auto pb-36 pt-6 md:px-8 md:pb-10 md:pt-7">
          <div key={pathname} className="gi-appear mx-auto w-full max-w-[1320px]">
            {children}
          </div>
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
