'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, BarChart3, Wallet, Bot, Settings, LogOut, Bell, Menu, Zap, Radio } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: TrendingUp },
  { href: '/dashboard/markets', label: 'Markets', icon: BarChart3 },
  { href: '/dashboard/trading', label: 'Trading', icon: Zap },
  { href: '/dashboard/portfolios', label: 'Portfolios', icon: Wallet },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/ai', label: 'AI Agents', icon: Bot },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#0A0E17] flex">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-60 bg-[#131722] border-r border-[#2A2E39] flex flex-col fixed h-full z-40">
          {/* Logo */}
          <div className="p-5 border-b border-[#2A2E39]">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-[#00D9A3] flex items-center justify-center">
                <Zap size={20} className="text-black" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">TradeOS</div>
                <div className="text-xs text-white/30">Enterprise Trading</div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                    isActive ? 'bg-[#00D9A3]/20 text-[#00D9A3] font-medium' : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Live indicator */}
          <div className="px-4 py-3 border-t border-[#2A2E39]">
            <div className="flex items-center gap-2 text-xs">
              <Radio size={14} className="text-[#00D9A3] animate-pulse" />
              <span className="text-white/40">5 exchanges live</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-white/30">Paper trading mode</span>
            </div>
          </div>

          {/* User */}
          <div className="p-4 border-t border-[#2A2E39]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#00D9A3] flex items-center justify-center text-sm font-bold text-black">R</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-white">Rabiu Hamza</div>
                <div className="text-xs text-white/30 truncate">demo@tradeos.io</div>
              </div>
            </div>
            <button className="w-full text-xs text-white/40 hover:text-red-400 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-60' : 'ml-0'} transition-all`}>
        {/* Top Bar */}
        <header className="h-16 border-b border-[#2A2E39] flex items-center justify-between px-6 sticky top-0 bg-[#0A0E17]/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/40 hover:text-white">
              <Menu size={22} />
            </button>
            <div className="text-sm text-white/40">
              <span className="text-[#00D9A3]">BTC</span> $65,432{' '}
              <span className="text-[#00D9A3]">+3.6%</span> ·{' '}
              <span className="text-white/60">ETH</span> $3,521{' '}
              <span className="text-[#00D9A3]">+2.1%</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-white/40 hover:text-white relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00D9A3] rounded-full text-xs flex items-center justify-center text-black font-bold">3</span>
            </button>
            <span className="text-xs px-3 py-1 rounded-full bg-[#00D9A3]/20 text-[#00D9A3]">
              Paper Mode
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
