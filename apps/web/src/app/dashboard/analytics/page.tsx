'use client';
import { useState, useEffect } from 'react';
import { analyticsApi } from '@/lib/api';
import { BarChart3, TrendingUp, AlertTriangle, Target } from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>({
    totalTrades: 142,
    winRate: 64.8,
    avgWin: 340,
    avgLoss: -180,
    profitFactor: 2.14,
    sharpeRatio: 1.87,
    maxDrawdown: -12.3,
    totalPnl: 18420,
    bestTrade: 2150,
    worstTrade: -680,
    avgHoldTime: '4h 32m',
    totalVolume: 892400,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    // Generate demo monthly data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = months.map((m, i) => ({
      month: m,
      pnl: Math.round((Math.random() - 0.3) * 8000),
      trades: Math.floor(Math.random() * 30) + 15,
    }));
    setMonthlyData(data);

    // Generate demo recent trades
    const demoTrades = [
      { symbol: 'BTC', side: 'BUY', entry: 62100, exit: 65432, pnl: 3232, pnlPct: 5.2, duration: '3h 15m', date: '2024-07-03' },
      { symbol: 'ETH', side: 'BUY', entry: 3380, exit: 3521, pnl: 1155, pnlPct: 4.2, duration: '6h 40m', date: '2024-07-03' },
      { symbol: 'TSLA', side: 'SELL', entry: 248, exit: 251, pnl: -300, pnlPct: -1.2, duration: '2h 05m', date: '2024-07-02' },
      { symbol: 'SOL', side: 'BUY', entry: 128, exit: 142, pnl: 1680, pnlPct: 10.9, duration: '8h 30m', date: '2024-07-02' },
      { symbol: 'EURUSD', side: 'BUY', entry: 1.0812, exit: 1.0842, pnl: 450, pnlPct: 0.28, duration: '12h 15m', date: '2024-07-01' },
      { symbol: 'AAPL', side: 'BUY', entry: 192, exit: 195, pnl: 600, pnlPct: 1.6, duration: '1d 4h', date: '2024-06-30' },
    ];
    setTrades(demoTrades);
  }, []);

  const maxPnl = Math.max(...monthlyData.map(d => Math.abs(d.pnl)));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Analytics</h1>
      <p className="text-white/40 mb-6">Performance metrics and trade analysis</p>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-2"><Target size={16} /> Win Rate</div>
          <div className="text-2xl font-bold text-green-400">{stats.winRate}%</div>
          <div className="text-xs text-white/30 mt-1">{stats.totalTrades} trades</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-2"><TrendingUp size={16} /> Profit Factor</div>
          <div className="text-2xl font-bold">{stats.profitFactor}</div>
          <div className="text-xs text-white/30 mt-1">Win/Loss ratio</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-2"><BarChart3 size={16} /> Sharpe Ratio</div>
          <div className="text-2xl font-bold">{stats.sharpeRatio}</div>
          <div className="text-xs text-white/30 mt-1">Risk-adjusted return</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-2"><AlertTriangle size={16} /> Max Drawdown</div>
          <div className="text-2xl font-bold text-red-400">{stats.maxDrawdown}%</div>
          <div className="text-xs text-white/30 mt-1">Largest peak-to-valley</div>
        </div>
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card">
          <div className="text-white/40 text-sm mb-2">Total P&L</div>
          <div className="text-xl font-bold text-green-400">+${stats.totalPnl.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-white/40 text-sm mb-2">Avg Win</div>
          <div className="text-xl font-bold text-green-400">+${stats.avgWin}</div>
        </div>
        <div className="card">
          <div className="text-white/40 text-sm mb-2">Avg Loss</div>
          <div className="text-xl font-bold text-red-400">${stats.avgLoss}</div>
        </div>
        <div className="card">
          <div className="text-white/40 text-sm mb-2">Best Trade</div>
          <div className="text-xl font-bold text-green-400">+${stats.bestTrade}</div>
        </div>
        <div className="card">
          <div className="text-white/40 text-sm mb-2">Worst Trade</div>
          <div className="text-xl font-bold text-red-400">${stats.worstTrade}</div>
        </div>
      </div>

      {/* Monthly P&L Bar Chart */}
      <div className="card mb-6">
        <h3 className="font-semibold mb-4">Monthly P&L</h3>
        <div className="flex items-end gap-4 h-48">
          {monthlyData.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs font-mono" style={{ color: d.pnl >= 0 ? '#00D9A3' : '#FF4757' }}>
                {d.pnl >= 0 ? '+' : ''}{d.pnl}
              </div>
              <div className="w-full rounded-t transition-all" style={{
                height: `${(Math.abs(d.pnl) / maxPnl) * 100}%`,
                background: d.pnl >= 0 ? 'linear-gradient(180deg, #00D9A3, rgba(0,217,163,0.3))' : 'linear-gradient(180deg, #FF4757, rgba(255,71,87,0.3))',
                minHeight: '8px',
              }} />
              <div className="text-xs text-white/40">{d.month}</div>
              <div className="text-xs text-white/20">{d.trades} trades</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trades */}
      <div className="card">
        <h3 className="font-semibold mb-4">Recent Trades</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-left text-white/40 text-sm border-b border-white/5">
              <th className="pb-3">Date</th><th className="pb-3">Symbol</th><th className="pb-3">Side</th>
              <th className="pb-3">Entry</th><th className="pb-3">Exit</th><th className="pb-3">P&L</th><th className="pb-3">Duration</th>
            </tr></thead>
            <tbody>
              {trades.map((t, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-3 text-white/40 text-sm">{t.date}</td>
                  <td className="py-3 font-mono font-bold">{t.symbol}</td>
                  <td className="py-3"><span className={t.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>{t.side}</span></td>
                  <td className="py-3 font-mono text-white/60">${t.entry}</td>
                  <td className="py-3 font-mono">${t.exit}</td>
                  <td className={`py-3 font-mono font-bold ${t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {t.pnl >= 0 ? '+' : ''}${t.pnl} <span className="text-xs">({t.pnlPct}%)</span>
                  </td>
                  <td className="py-3 text-white/40 text-sm">{t.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
