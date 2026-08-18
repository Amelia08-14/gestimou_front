'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Bell, Building2, FileText, Grid2X2, Images, LayoutDashboard,
  LogOut, Megaphone, Menu, MessageSquare, User, Users, Wallet, Wrench, X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useRole } from '@/contexts/RoleContext';

const primary = [
  { label: 'Accueil', href: '/', icon: LayoutDashboard },
  { label: 'Tickets', href: '/maintenance', icon: Wrench },
  { label: 'Avis', href: '/avis', icon: Megaphone },
];

const menuItems = [
  { label: 'Résidences', href: '/properties', icon: Building2, roles: ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER'] },
  { label: 'Finances', href: '/financial', icon: Wallet, roles: ['ADMIN', 'RECOUVREMENT'] },
  { label: 'Appel de fonds', href: '/appel-de-fonds', icon: FileText, roles: ['ADMIN', 'RECOUVREMENT'] },
  { label: 'Employés', href: '/admin?tab=users', icon: Users, roles: ['ADMIN'] },
  { label: 'Trombinoscope', href: '/trombinoscope', icon: Images, roles: ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER'] },
  { label: 'Messages', href: '/messages', icon: MessageSquare, roles: ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER'] },
  { label: 'Notifications', href: '/notifications', icon: Bell, roles: ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER', 'HSE', 'INTERVENANT', 'RECOUVREMENT'] },
  { label: 'Profil', href: '/profile', icon: User, roles: ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER', 'HSE', 'INTERVENANT', 'RECOUVREMENT'] },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useRole();
  const [open, setOpen] = useState(false);
  const visible = menuItems.filter((item) => user?.role && item.roles.includes(user.role));

  const signOut = () => {
    logout();
    setOpen(false);
    router.push('/login');
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-brand-navy/45 backdrop-blur-[2px] md:hidden" onClick={() => setOpen(false)}>
          <section className="absolute inset-x-0 bottom-0 rounded-t-[24px] bg-white px-5 pb-7 pt-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-brand-navy">Menu</p>
                <p className="text-xs text-brand-gold">{user?.name}</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full border border-stone-200 p-2 text-slate-500"><X className="size-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {visible.map((item) => (
                <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl border border-stone-200 px-3 py-3 text-sm font-semibold text-brand-navy">
                  <item.icon className="size-4 text-brand-amber" />{item.label}
                </Link>
              ))}
            </div>
            <button onClick={signOut} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-bold text-red-600">
              <LogOut className="size-4" /> Déconnexion
            </button>
          </section>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-[74px] grid-cols-4 border-t border-white/10 bg-brand-navy px-2 pb-[env(safe-area-inset-bottom)] text-[10px] md:hidden">
        {primary.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={clsx('flex flex-col items-center justify-center gap-1 uppercase tracking-wide', active ? 'font-bold text-brand-amber' : 'text-slate-500')}>
              <item.icon className="size-5" /><span>{item.label}</span>
            </Link>
          );
        })}
        <button onClick={() => setOpen(true)} className={clsx('flex flex-col items-center justify-center gap-1 uppercase tracking-wide', open ? 'font-bold text-brand-amber' : 'text-slate-500')}>
          {open ? <Grid2X2 className="size-5" /> : <Menu className="size-5" />}<span>Menu</span>
        </button>
      </nav>
    </>
  );
}
