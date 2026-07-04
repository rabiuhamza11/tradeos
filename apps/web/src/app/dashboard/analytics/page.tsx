'use client';
import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Target, Activity, Download, Calendar } from 'lucide-react';

const monthlyPnL = [
  { month: 'Jan', pnl: 3200, trades: 45 },
  { month: 'Feb', pnl: -1800, trades: 38 },
  { month: 'Mar', pnl: 5400, trades: 62 },
  { month: 'Apr', pnl: 2100, trades: 51 },
  { month: 'May', pnl: -2400, trades: 44 },
  { month: 'Jun', pnl: 8900, trades: 78 },
  { month: 'Jul', pnl: 6200, trades: 67 },
];

const recentTrades = [
  { symbol: 'BTC', side: 'BUY', pnl: 342.50, pnlPct: 5.2, duration: '4h 23m', time: '14:32', exchange: 'Binance' },
  { symbol: 'ETH', side: 'SELL', pnl: 87.20, pnlPct: 2.1, duration: '2h 15m', time: '14:28', exchange: 'Binance' },
  { symbol: 'AAPL', side: 'BUY', pnl: 156.00, pnlPct: 1.4, duration: '6h 40m', time: '13:45', exchange: 'Alpaca' },
  { symbol: 'SOL', side: 'BUY', pnl: 234.80, pnlPct: 8.4, duration: '1h 30m', time: '12:15', exchange: 'Coinbase' },
  { symbol: 'TSLA', side: 'SELL', pnl: -128.40, pnlPct: -2.1, duration: '3h 20m', time: '11:30', exchange: 'Alpaca' },
  { symbol: 'NVDA', side: 'BUY', pnl: 672.00, pnlPct: 4.8, duration: '8h 12m', time: '10:00', exchange: 'Alpaca' },
  { symbol: 'EURUSD', side: 'SELL', pnl: 45.30, pnlPct: 0.6, duration: '12h 05m', time: '09:15', exchange: 'OANDA' },
  { symbol: 'XRP', side: 'BUY', pnl: -56.80, pnlPct: -1.8, duration: '5h 40m', time: '08:22', exchange: 'Binance' },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('7d');

  const totalPnL = monthlyPnL.reduce((s, m) => s + m.pnl, 0);
  const totalTrades = monthlyPnL.reduce((s, m) => s + m.trades, 0);
  const winTrades = recentTrades.filter((t) => t.pnl > 0).length;
  const maxDrawdown = 2400;

  const maxBarHeight = 120;
  const maxValue = Math.max(...monthlyPnL.map((m) => Math.abs(m.pnl)));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Analytics</h1>
          <p className="text-white/40">Performance metrics and trade analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {['24h', '7d', '30d', '90d', '1y'].map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded text-xs transition ${period === p ? 'bg-[#00D9A3] text-black font-medium' : 'text-white/40 hover:text-white'}`}>
                {p}
              </button>
            ))}
          </div>
          <button className="btn-primary flex items-center gap-2 text-sm"><Download size={16} /> Export</button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={20} className="text-[#00D9A3]" />
            <span className="text-xs text-white/30">Total P&L</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#00D9A3]">+${totalPnL.toLocaleString()}</div>
          <div className="text-xs text-white/40 mt-1">{period} period</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <Activity size={20} className="text-blue-400" />
            <span className="text-xs text-white/30">Total Trades</span>
          </div>
          <div className="text-2xl font-bold">{totalTrades}</div>
          <div className="text-xs text-white/40 mt-1">{(totalTrades / 7).toFixed(1)} avg/day</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <Target size={20} className="text-purple-400" />
            <span className="text-xs text-white/30">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-[#00D9A3]">{((winTrades / recentTrades.length) * 100).toFixed(1)}%</div>
          <div className="text-xs text-white/40 mt-1">{winTrades}W / {recentTrades.length - winTrades}L</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown size={20} className="text-red-400" />
            <span className="text-xs text-white/30">Max Drawdown</span>
          </div>
          <div className="text-2xl font-bold text-red-400">-${maxDrawdown.toLocaleString()}</div>
          <div className="text-xs text-white/40 mt-1">Sharpe: 2.14</div>
        </div>
      </div>

      {/* Monthly P&L Chart */}
      <div className="card mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 size={18} /> Monthly P&L</h3>
        <div className="flex items-end justify-between gap-3 h-40">
          {monthlyPnL.map((m) => {
            const height = (Math.abs(m.pnl) / maxValue) * maxBarHeight;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-mono" style={{ color: m.pnl >= 0 ? '#00D9A3' : '#FF4757' }}>
                  {m.pnl >= 0 ? '+' : ''}{m.pnl >= 1000 ? `${(m.pnl / 1000).toFixed(1)}k` : m.pnl}
                </div>
                <div className="w-full flex justify-center" style={{ height: maxBarHeight }}>
                  <div
                    className="w-8 rounded-t transition-all hover:opacity-80"
                    style={{
                      height: `${height}px`,
                      background: m.pnl >= 0 ? 'linear-gradient(to top, #00D9A3, #00D9A3/40)' : 'linear-gradient(to top, #FF4757, #FF4757/40)',
                      marginTop: m.pnl >= 0 ? `${maxBarHeight - height}px` : '0',
                      borderRadius: m.pnl >= 0 ? '4px 4px 0 0' : '0 0 4px 4px',
                    }}
                  />
                </div>
                <div className="text-xs text-white/40">{m.month}</div>
                <div className="text-xs text-white/20">{m.trades}</div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-white/40">
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#00D9A3]" /> Profit</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#FF4757]" /> Loss</span>
          <span className="flex items-center gap-2"><Calendar size={12} /> Trades count below bars</span>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity size={18} /> Recent Trades</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-xs text-white/40">
                <th className="text-left p-3 font-medium">Time</th>
                <th className="text-left p-3 font-medium">Symbol</th>
                <th className="text-left p-3 font-medium">Side</th>
                <th className="text-right p-3 font-medium">P&L</th>
                <th className="text-right p-3 font-medium">P&L %</th>
                <th className="text-right p-3 font-medium hidden md:table-cell">Duration</th>
                <th className="text-right p-3 font-medium hidden lg:table-cell">Exchange</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((t, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 text-xs text-white/30 font-mono">{t.time}</td>
                  <td className="p-3 font-bold">{t.symbol}</td>
                  <td className="p-3">
                    <span className={`text-xs ${t.side === 'BUY' ? 'text-[#00D9A3]' : 'text-red-400'}`}>
                      {t.side === 'BUY' ? <TrendingUp size={12} className="inline" /> : <TrendingDown size={12} className="inline" />} {t.side}
                    </span>
                  </td>
                  <td className={`p-3 text-right font-mono font-bold ${t.pnl >= 0 ? 'text-[#00D9A3]' : 'text-red-400'}`}>
                    {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                  </td>
                  <td className={`p-3 text-right ${t.pnl >= 0 ? 'text-[#00D9A3]' : 'text-red-400'}`}>
                    {t.pnl >= 0 ? '+' : ''}{t.pnlPct}%
                  </td>
                  <td className="p-3 text-right text-white/40 text-sm hidden md:table-cell">{t.duration}</td>
                  <td className="p-3 text-right hidden lg:table-cell">
                    <span className="text-xs px-2 py-1 rounded bg-white/5 text-white/40">{t.exchange}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="card">
          <h3 className="font-semibold mb-3">By Exchange</h3>
          <div className="space-y-3">
            {[
              { name: 'Binance', trades: 45, pnl: 5400, share: 38 },
              { name: 'Alpaca', trades: 32, pnl: 3200, share: 28 },
              { name: 'Coinbase', trades: 18, pnl: 2100, share: 18 },
              { name: 'OANDA', trades: 12, pnl: 800, share: 16 },
            ].map((ex) => (
              <div key={ex.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{ex.name}</span>
                  <span className="text-sm font-mono text-[#00D9A3]">+${ex.pnl.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00D9A3] rounded-full" style={{ width: `${ex.share}%` }} />
                </div>
                <div className="text-xs text-white/30 mt-0.5">{ex.trades} trades · {ex.share}% volume</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-3">By Asset Class</h3>
          <div className="space-y-3">
            {[
              { name: 'Crypto', trades: 63, pnl: 7500, share: 52 },
              { name: 'US Stocks', trades: 32, pnl: 3200, share: 28 },
              { name: 'Forex', trades: 12, pnl: 800, share: 14 },
              { name: 'Commodities', trades: 4, pnl: 200, share: 6 },
            ].map((ac) => (
              <div key={ac.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{ac.name}</span>
                  <span className="text-sm font-mono text-[#00D9A3]">+${ac.pnl.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${ac.share}%` }} />
                </div>
                <div className="text-xs text-white/30 mt-0.5">{ac.trades} trades · {ac.share}% volume</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
