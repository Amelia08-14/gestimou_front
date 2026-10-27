'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { LogOut, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useRole } from '@/contexts/RoleContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { AppIcon } from '@/components/ui';
import { ROLE_LABELS, canSee, initialsOf, isNavActive, navSections, tabItems } from '@/components/navigation';

// Phone tab bar — GiBottomNav of the mobile app: a navy capsule floating
// 24px above the bottom edge, the active tab filled in amber, "Plus" opening
// the rest of the menu as a bottom sheet.

export function MobileNavigation() {
  return (
    <Suspense fallback={null}>
      <MobileNavigationContent />
    </Suspense>
  );
}

function MobileNavigationContent() {
  const pathname = usePathname();
  const tab = useSearchParams().get('tab');
  const router = useRouter();
  const { user, logout } = useRole();
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const role = user?.role;

  const tabs = tabItems.filter((item) => canSee(role, item)).slice(0, 4);
  const tabHrefs = new Set(tabs.map((t) => t.href));
  const sections = navSections
    .map((s) => ({ ...s, items: s.items.filter((item) => canSee(role, item) && !tabHrefs.has(item.href)) }))
    .filter((s) => s.items.length > 0);
  const moreActive = !tabs.some((t) => isNavActive(t.href, pathname, tab));

  const signOut = () => {
    logout();
    setOpen(false);
    router.push('/login');
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-brand-navy/40 backdrop-blur-[2px] md:hidden" onClick={() => setOpen(false)}>
          <section
            className="gi-appear absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[28px] bg-gi-scaffold px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#ced0d2]" />
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-amber/60 bg-brand-amber/15 text-xs font-bold text-brand-amber">
                {initialsOf(user?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-gi-body">{user?.name}</p>
                <p className="truncate text-xs text-gi-muted">{ROLE_LABELS[role ?? ''] ?? role}</p>
              </div>
              <button onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 text-gi-body">
                <X className="h-4 w-4" />
              </button>
            </div>

            {sections.map((section) => (
              <div key={section.title}>
                <p className="pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gi-faint">{section.title}</p>
                <div className="overflow-hidden rounded-2xl border border-gi-card-border bg-gi-card">
                  {section.items.map((item, i) => {
                    const Icon = item.icon;
                    const badge = item.href === '/notifications' ? unreadCount : 0;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={clsx('flex items-center gap-3 px-4 py-3.5 text-sm text-gi-body active:bg-black/5', i > 0 && 'border-t border-gi-card-border')}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-amber/10 bg-brand-amber/5 text-brand-amber">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex-1">{item.name}</span>
                        {badge > 0 && (
                          <span className="whitespace-nowrap rounded-full bg-brand-amber px-1.5 py-0.5 text-[10px] font-bold text-black">{badge}</span>
                        )}
                        <svg width="9" height="8" viewBox="0 0 9 8" fill="none" className="text-gi-muted">
                          <path d="M2.885 7.231 6.654 4 3.228.769" stroke="currentColor" strokeLinecap="round" />
                        </svg>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={signOut}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-gi-error/25 bg-gi-error/5 py-3.5 text-sm font-semibold text-gi-error"
            >
              <LogOut className="h-4 w-4" /> Se déconnecter
            </button>
          </section>
        </div>
      )}

      {/* Veil under the capsule so content scrolling behind it stays legible. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-28 bg-gradient-to-t from-gi-scaffold via-gi-scaffold/80 to-transparent md:hidden" />

      <nav className="fixed inset-x-2 bottom-[calc(24px+env(safe-area-inset-bottom))] z-40 flex h-[66px] items-stretch rounded-[40px] border border-gi-navbar-border bg-gi-navbar/95 px-1.5 shadow-2xl backdrop-blur-xl md:hidden">
        {tabs.map((item) => {
          const active = isNavActive(item.href, pathname, tab) && !open;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx('relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-transform active:scale-90', active ? 'font-semibold text-brand-amber' : 'text-white/55')}
            >
              {active && <span className="absolute inset-x-1 inset-y-1.5 rounded-[30px] bg-white/[0.08]" />}
              <AppIcon name={active ? `${item.tabIcon}_fill` : item.tabIcon ?? 'nav_home'} className="relative h-[22px] w-[22px]" />
              <span className="relative">{item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className={clsx('relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-transform active:scale-90', open || moreActive ? 'font-semibold text-brand-amber' : 'text-white/55')}
        >
          {(open || moreActive) && <span className="absolute inset-x-1 inset-y-1.5 rounded-[30px] bg-white/[0.08]" />}
          <span className="relative flex h-[22px] items-center">
            <AppIcon name="nav_more" className="h-[5px] w-6" />
            {unreadCount > 0 && <span className="absolute -right-2 -top-0.5 h-2 w-2 rounded-full bg-gi-error" />}
          </span>
          <span className="relative">Plus</span>
        </button>
      </nav>
    </>
  );
}
