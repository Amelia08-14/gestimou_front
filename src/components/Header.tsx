'use client';

import { Bell, Search, Menu, User } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Nouveau ticket urgent', desc: 'Fuite d\'eau - Résidence Les Pins (Pour Intervenant)', time: 'Il y a 5 min', unread: true },
    { id: 2, title: 'Loyer reçu', desc: 'Appartement F4 - Mr. Benali (Pour Gestionnaire)', time: 'Il y a 2h', unread: true },
    { id: 3, title: 'Validation requise', desc: 'Nouveau propriétaire ajouté (Pour Admin)', time: 'Il y a 4h', unread: true },
    { id: 4, title: 'Rappel maintenance', desc: 'Vérification ascenseur Bloc B', time: 'Hier', unread: false },
  ];

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
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>

          {/* Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`cursor-pointer px-4 py-3 hover:bg-slate-50 ${notif.unread ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex justify-between items-start">
                      <p className={`text-sm ${notif.unread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{notif.title}</p>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{notif.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{notif.desc}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 p-2 text-center">
                <button className="text-xs font-medium text-brand-blue hover:text-brand-blue/80">
                  Tout marquer comme lu
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium text-slate-900">Admin Principal</p>
            <p className="text-xs text-slate-500">Super Admin</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold text-brand-blue font-bold shadow-sm">
            AP
          </div>
        </div>
      </div>
    </header>
  );
}
