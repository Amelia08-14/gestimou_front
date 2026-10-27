'use client';

import { RoleProvider } from '@/contexts/RoleContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <NotificationsProvider>
        {children}
      </NotificationsProvider>
    </RoleProvider>
  );
}
