'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'ADMIN' | 'INTERVENANT';

interface RoleContextType {
  role: Role;
  user: { name: string; email: string };
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>('ADMIN');
  const [user, setUser] = useState({ name: 'Super Admin', email: 'admin@aymen.com' });

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    // Update mock user based on role for demo purposes
    if (newRole === 'ADMIN') {
      setUser({ name: 'Super Admin', email: 'admin@aymen.com' });
    } else {
      setUser({ name: 'Ahmed Electricien', email: 'elec@aymen.com' });
    }
  };

  return (
    <RoleContext.Provider value={{ role, user, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
