'use client';

import { RoleProvider } from '@/contexts/RoleContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      {children}
    </RoleProvider>
  );
}
