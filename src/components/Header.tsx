'use client';

import { Bell, Search, Menu, User, LogOut, ChevronDown, Check, User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRole } from '@/contexts/RoleContext';
import Link from 'next/link';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useRole();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    if (user) {
        fetchNotifications();
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }
  }, [user, API_URL]);

  const markAsRead = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        await fetch(`${API_URL}/notifications/${id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (err) {
        console.error(err);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        await fetch(`${API_URL}/notifications/read-all`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

    } catch (err) {
        console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      {/* Left: Mobile Menu Trigger (hidden on desktop) & Search */}
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-slate-500 hover:text-slate-700">
          <Menu className="h-6 w-6" />
        </button>
        <div className="relative hidden md:block w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher (Ctrl+K)..." 
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-all"
          />
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-brand-blue transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="border-b border-slate-100 px-4 py-3 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                    <span className="text-xs font-medium text-brand-blue bg-blue-50 px-2 py-0.5 rounded-full">
                        {unreadCount} nouvelle(s)
                    </span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500 text-sm">
                        Aucune notification.
                    </div>
                ) : (
                    notifications.map((notif) => (
                    <div 
                        key={notif.id} 
                        onClick={() => !notif.isRead && markAsRead(notif.id)}
                        className={`cursor-pointer px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                        <div className="flex justify-between items-start">
                        <p className={`text-sm ${!notif.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{notif.title}</p>
                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                            {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    </div>
                    ))
                )}
              </div>
              <div className="border-t border-slate-100 p-2 text-center">
                <button 
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="text-xs font-medium text-brand-blue hover:text-brand-blue/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tout marquer comme lu
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative flex items-center gap-3 border-l border-slate-200 pl-4">
          <button 
             onClick={() => setShowProfileMenu(!showProfileMenu)}
             className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors"
           >
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium text-slate-900">{user?.name || 'Utilisateur'}</p>
                <p className="text-xs text-slate-500">{user?.role || 'Rôle inconnu'}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold text-brand-blue font-bold shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
           </button>

           {/* Profile Dropdown */}
           {showProfileMenu && (
             <div className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-200">
               <div className="p-1 space-y-1">
                 <Link
                   href="/profile"
                   onClick={() => setShowProfileMenu(false)}
                   className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                 >
                   <UserIcon className="h-4 w-4" />
                   Mon Profil
                 </Link>
                 <button
                   onClick={() => logout()}
                   className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                 >
                   <LogOut className="h-4 w-4" />
                   Déconnexion
                 </button>
               </div>
             </div>
           )}
        </div>
      </div>
    </header>
  );
}
