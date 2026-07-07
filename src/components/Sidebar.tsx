'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Key,
  Wallet,
  Wrench,
  LogOut,
  FileText,
  Settings,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useRole } from '@/contexts/RoleContext';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER', 'HSE', 'INTERVENANT'] },
  { name: 'Biens', href: '/properties', icon: Building2, roles: ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER'] },
  { name: 'Propriétaires', href: '/owners', icon: Key, roles: ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER'] },
  { name: 'Finances', href: '/financial', icon: Wallet, roles: ['ADMIN', 'RECOUVREMENT'] },
  { name: 'Appel de fonds', href: '/appel-de-fonds', icon: FileText, roles: ['ADMIN', 'RECOUVREMENT'] },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench, roles: ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER', 'HSE', 'INTERVENANT'] },
  { name: 'Documents', href: '/documents', icon: FileText, roles: ['ADMIN'] },
  { name: 'Administration', href: '/admin', icon: Settings, roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useRole();
  const router = useRouter();

  const filteredNavigation = navigation.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="flex h-full w-64 flex-col bg-brand-navy text-white shadow-2xl">
      {/* ── Logo ─────────────────────────────────────────── */}
      <div className="flex h-20 items-center gap-3 px-5 border-b border-white/10">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
          <Image
            src="/logo-light.png"
            alt="Global Immo Service"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-widest text-brand-amber uppercase">
            Global Immo
          </span>
          <span className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">
            Service
          </span>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 space-y-0.5 px-3 py-5 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-amber text-brand-navy shadow-md'
                  : 'text-white/70 hover:bg-white/8 hover:text-white'
              )}
            >
              <item.icon
                className={clsx(
                  'mr-3 h-4.5 w-4.5 flex-shrink-0 transition-colors',
                  isActive
                    ? 'text-brand-navy'
                    : 'text-white/40 group-hover:text-brand-amber'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* ── User / Logout ────────────────────────────────── */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-amber text-brand-navy text-xs font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user?.name || 'Utilisateur'}
            </p>
            <p className="truncate text-[11px] text-white/50">
              {user?.role || ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="text-white/40 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
