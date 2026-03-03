'use client';

import { usePathname } from 'next/navigation';
import { useRole } from '@/contexts/RoleContext'; // We might need a real auth context later
import { useEffect, useState } from 'react';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  
  // In a real app, check for token/session here
  // For now, we just handle layout structure
  
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
    </>
  );
}
