import {
  Bell,
  Building2,
  Contact,
  FileText,
  FolderOpen,
  Images,
  LayoutDashboard,
  LucideIcon,
  Megaphone,
  Settings,
  Ticket,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';

// Navigation shared by the desktop sidebar and the mobile tab bar, grouped
// like the mobile app's admin space (manager_home_screen.dart): the four
// tabs first, then Gestion, Administration and Compte.
//
// Keep the role lists in sync with AppLayout.isAllowed().

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
  /** App icon (public/brand/icons) used by the mobile tab bar. */
  tabIcon?: string;
}

const STAFF = ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER'];
const EVERYONE = ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER', 'HSE', 'INTERVENANT', 'RECOUVREMENT'];

export const tabItems: NavItem[] = [
  { name: 'Accueil', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER', 'HSE', 'INTERVENANT'], tabIcon: 'nav_home' },
  { name: 'Tickets', href: '/maintenance', icon: Ticket, roles: ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER', 'HSE', 'INTERVENANT'], tabIcon: 'nav_report' },
  { name: 'Annonces', href: '/avis', icon: Megaphone, roles: STAFF, tabIcon: 'nav_notice' },
  { name: 'Résidences', href: '/properties', icon: Building2, roles: STAFF, tabIcon: 'nav_residence' },
  // RECOUVREMENT has none of the tabs above: Finances leads their space.
  { name: 'Finances', href: '/financial', icon: Wallet, roles: ['RECOUVREMENT'], tabIcon: 'nav_payment' },
];

export const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Gestion',
    items: [
      { name: 'Propriétaires', href: '/owners', icon: Contact, roles: STAFF },
      { name: 'Trombinoscope', href: '/trombinoscope', icon: Images, roles: STAFF },
      { name: 'Documents', href: '/documents', icon: FolderOpen, roles: ['ADMIN', 'RESPONSABLE_ZONE', 'MANAGER', 'HSE', 'RECOUVREMENT'] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { name: 'Finances', href: '/financial', icon: Wallet, roles: ['ADMIN'] },
      { name: 'Appel de fonds', href: '/appel-de-fonds', icon: FileText, roles: ['ADMIN', 'RECOUVREMENT'] },
      { name: 'Employés', href: '/admin?tab=users', icon: Users, roles: ['ADMIN'] },
      { name: 'Inscriptions', href: '/registrations', icon: UserPlus, roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Compte',
    items: [
      { name: 'Notifications', href: '/notifications', icon: Bell, roles: EVERYONE },
      { name: 'Profil et réglages', href: '/profile', icon: Settings, roles: EVERYONE },
    ],
  },
];

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  RESPONSABLE_ZONE: 'Responsable de zone',
  MANAGER: 'Manager',
  HSE: 'HSE',
  INTERVENANT: 'Intervenant',
  RECOUVREMENT: 'Recouvrement',
  GESTIONNAIRE_TAG: 'Gestionnaire TAG',
};

export const canSee = (role: string | undefined, item: NavItem) => Boolean(role && item.roles.includes(role));

/**
 * Active only if both the path AND its own "tab" query param (when it has
 * one) match — comparing the path alone lit up every /admin entry at once.
 */
export function isNavActive(href: string, pathname: string, tab: string | null) {
  const [itemPath, itemQuery] = href.split('?');
  if (pathname !== itemPath) return false;
  if (!itemQuery) return true;
  return new URLSearchParams(itemQuery).get('tab') === tab;
}

export function initialsOf(name?: string | null) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}
