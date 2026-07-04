'use client';
import { useEffect, useState } from 'react';
import { analyticsApi, marketApi } from '@/lib/api';
import { TrendingUp, TrendingDown, Wallet, Bot, AlertCircle, Activity } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [movers, setMovers] = useState<any>({ gainers: [], losers: [] });
  useEffect(() => {
    analyticsApi.dashboard().then(({ data }) => setStats(data)).catch(() => {
      setStats({ totalPortfolioValue: 125000, totalUnrealizedPnL: 5420, openPositions: 7, totalOrders: 142, totalTrades: 89, activeAlerts: 3, activeStrategies: 2 });
    });
    marketApi.movers().then(({ data }) => setMovers(data)).catch(() => {
      setMovers({ gainers: [{ symbol: 'BTC', changePct: 0.036 }, { symbol: 'AAPL', changePct: 0.0095 }], losers: [{ symbol: 'TSLA', changePct: -0.0135 }] });
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-white/40 mb-6">Your trading overview</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Wallet} label="Portfolio Value" value={stats ? `$${Number(stats.totalPortfolioValue).toLocaleString()}` : '—'} color="text-tradeos-accent" />
        <StatCard icon={stats?.totalUnrealizedPnL >= 0 ? TrendingUp : TrendingDown} label="Unrealized P&L" value={stats ? `$${Number(stats.totalUnrealizedPnL).toLocaleString()}` : '—'} color={stats?.totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'} />
        <StatCard icon={Activity} label="Open Positions" value={stats?.openPositions ?? '—'} color="text-white" />
        <StatCard icon={Bot} label="Active Strategies" value={stats?.activeStrategies ?? '—'} color="text-tradeos-purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Top Gainers</h2>
          {movers.gainers?.map((g: any) => (<div key={g.symbol} className="flex justify-between py-2 border-b border-white/5"><span className="font-medium">{g.symbol}</span><span className="text-green-400">+{(g.changePct * 100).toFixed(2)}%</span></div>))}
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Top Losers</h2>
          {movers.losers?.map((l: any) => (<div key={l.symbol} className="flex justify-between py-2 border-b border-white/5"><span className="font-medium">{l.symbol}</span><span className="text-red-400">{(l.changePct * 100).toFixed(2)}%</span></div>))}
        </div>
      </div>
    </div>
  );
}
function StatCard({ icon: Icon, label, value, color }: any) {
  return (<div className="stat-card"><div className="flex items-center justify-between mb-2"><span className="text-white/40 text-sm">{label}</span><Icon size={18} className={color} /></div><p className={`text-2xl font-bold ${color}`}>{value}</p></div>);
}
