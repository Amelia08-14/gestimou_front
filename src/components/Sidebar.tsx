'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  UserCog
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

import { useRouter } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useRole();
  const router = useRouter();

  const filteredNavigation = navigation.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-brand-blue text-white shadow-xl border-r border-brand-gold/20">
      <div className="flex h-20 items-center gap-3 px-6 border-b border-brand-gold/20">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold font-bold text-brand-blue shadow-lg shadow-brand-gold/20">
          G
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight text-brand-gold">GESTIMOU</span>
          <span className="text-[10px] text-brand-gold/80 font-medium tracking-wider">Votre partenaire immo</span>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-6">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand-gold text-brand-blue shadow-md shadow-brand-gold/20'
                  : 'text-slate-300 hover:bg-white/5 hover:text-brand-gold'
              )}
            >
              <item.icon
                className={clsx(
                  'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-brand-blue' : 'text-slate-400 group-hover:text-brand-gold'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-brand-gold/20 p-4 space-y-4">
        <div 
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl bg-white/5 p-3 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-brand-gold/30"
        >
          <div className="h-9 w-9 rounded-full bg-brand-gold flex items-center justify-center text-xs font-bold text-brand-blue shadow-lg">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">
              {user?.name || 'Utilisateur'}
            </p>
            <p className="truncate text-xs text-slate-400">
              {user?.email || ''}
            </p>
          </div>
          <LogOut className="h-4 w-4 text-slate-400 hover:text-brand-gold transition-colors" />
        </div>
      </div>
    </div>
  );
}
