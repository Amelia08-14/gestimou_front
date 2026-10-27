'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useRole } from '@/contexts/RoleContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { NavItem, ROLE_LABELS, canSee, initialsOf, isNavActive, navSections, tabItems } from '@/components/navigation';

// Desktop sidebar — GiSideNav of the mobile app (gi_desktop.dart): brand
// at the top, entries in the middle, the account card at the bottom.

export function Sidebar() {
  return (
    <Suspense fallback={<div className="h-full w-[260px] flex-shrink-0 border-r border-gi-card-border bg-gi-card" />}>
      <SidebarContent />
    </Suspense>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const tab = useSearchParams().get('tab');
  const { user, logout } = useRole();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const role = user?.role;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const badgeFor = (item: NavItem) => (item.href === '/notifications' ? unreadCount : 0);

  const tabs = tabItems.filter((item) => canSee(role, item));
  const sections = navSections
    .map((s) => ({ ...s, items: s.items.filter((item) => canSee(role, item)) }))
    .filter((s) => s.items.length > 0);

  return (
    <aside className="flex h-full w-[260px] flex-shrink-0 flex-col border-r border-gi-card-border bg-gi-card">
      <div className="flex justify-center pb-[18px] pt-[22px]">
        <Link href={tabs[0]?.href ?? '/'} aria-label="Accueil">
          <Image src="/brand/gis_logo_vertical_light.png" alt="Gérance Immo Service" width={76} height={76} priority />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        {tabs.map((item) => (
          <SideItem key={item.href} item={item} active={isNavActive(item.href, pathname, tab)} badge={badgeFor(item)} />
        ))}
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3.5 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gi-faint">
              {section.title}
            </p>
            {section.items.map((item) => (
              <SideItem key={item.href} item={item} active={isNavActive(item.href, pathname, tab)} badge={badgeFor(item)} />
            ))}
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-[14px] border border-gi-card-border bg-gi-scaffold p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-brand-amber/15 text-xs font-bold text-brand-amber">
            {initialsOf(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-gi-body">{user?.name || 'Utilisateur'}</p>
            <p className="truncate text-[11px] text-gi-muted">{ROLE_LABELS[role ?? ''] ?? role ?? ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-[10px] border border-gi-error/25 bg-gi-error/5 py-2 text-[13px] font-semibold text-gi-error transition-colors hover:bg-gi-error/10"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}

function SideItem({ item, active, badge }: { item: NavItem; active: boolean; badge: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={clsx(
        'mb-0.5 flex items-center gap-3 rounded-xl px-3.5 py-[11px] text-sm transition-all duration-200 active:scale-[0.97]',
        active ? 'bg-brand-amber/15 font-semibold text-brand-amber' : 'text-gi-body hover:bg-black/[0.04]'
      )}
    >
      <Icon className={clsx('h-5 w-5 flex-shrink-0', active ? 'text-brand-amber' : 'text-gi-muted')} strokeWidth={active ? 2.2 : 1.8} />
      <span className="flex-1 truncate">{item.name}</span>
      {badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-amber px-1.5 text-[10px] font-bold text-black">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}
