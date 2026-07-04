'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { LayoutDashboard, Briefcase, LineChart, Bot, Bell, Settings, LogOut, TrendingUp, Wallet } from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/portfolios', label: 'Portfolios', icon: Briefcase },
  { href: '/dashboard/markets', label: 'Markets', icon: TrendingUp },
  { href: '/dashboard/trading', label: 'Trade', icon: Wallet },
  { href: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
  { href: '/dashboard/ai', label: 'AI Agents', icon: Bot },
  { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loadFromStorage, logout, token } = useAuthStore();
  const router = useRouter(); const pathname = usePathname();
  useEffect(() => { loadFromStorage(); if (!token && typeof window !== 'undefined') router.push('/'); }, []);
  const handleLogout = () => { logout(); router.push('/'); };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-tradeos-panel border-r border-white/5 fixed h-full flex flex-col">
        <div className="p-6"><h1 className="text-xl font-bold text-tradeos-accent">TradeOS</h1></div>
        <nav className="flex-1 px-3 py-4">
          {nav.map((item) => { const Icon = item.icon; const active = pathname === item.href; return (
            <div key={item.href} className={`nav-item ${active ? 'active' : ''}`} onClick={() => router.push(item.href)}>
              <Icon size={20} /><span>{item.label}</span>
            </div>); })}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-tradeos-accent flex items-center justify-center text-sm font-bold text-black">{user?.name?.[0] || 'U'}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{user?.name || 'User'}</p><p className="text-xs text-white/30 truncate">{user?.email}</p></div>
          </div>
          <button onClick={handleLogout} className="nav-item text-sm"><LogOut size={16} /> Logout</button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
