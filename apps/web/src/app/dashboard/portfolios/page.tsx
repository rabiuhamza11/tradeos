'use client';
import { useState } from 'react';
import { Wallet, Plus, TrendingUp, TrendingDown, PieChart, ArrowRight } from 'lucide-react';

const portfolios = [
  { id: '1', name: 'Crypto Portfolio', initialCapital: 25000, currentValue: 31250, currency: 'USD', color: '#00D9A3',
    positions: [
      { symbol: 'BTC', qty: 0.25, entry: 52000, current: 65432, pnl: 33.1, exchange: 'Binance' },
      { symbol: 'ETH', qty: 3.5, entry: 2900, current: 3521, pnl: 21.4, exchange: 'Binance' },
      { symbol: 'SOL', qty: 45, entry: 98, current: 142, pnl: 44.9, exchange: 'Coinbase' },
    ]
  },
  { id: '2', name: 'Stock Portfolio', initialCapital: 50000, currentValue: 54800, currency: 'USD', color: '#3B82F6',
    positions: [
      { symbol: 'AAPL', qty: 150, entry: 195, current: 214, pnl: 9.7, exchange: 'Alpaca' },
      { symbol: 'NVDA', qty: 100, entry: 95, current: 128, pnl: 34.7, exchange: 'Alpaca' },
      { symbol: 'TSLA', qty: 80, entry: 265, current: 248, pnl: -6.4, exchange: 'Alpaca' },
    ]
  },
  { id: '3', name: 'Forex Portfolio', initialCapital: 15000, currentValue: 15300, currency: 'USD', color: '#A855F7',
    positions: [
      { symbol: 'EURUSD', qty: 50000, entry: 1.0780, current: 1.0842, pnl: 0.6, exchange: 'OANDA' },
      { symbol: 'XAU', qty: 5, entry: 2350, current: 2387, pnl: 1.6, exchange: 'OANDA' },
    ]
  },
];

export default function PortfoliosPage() {
  const [selected, setSelected] = useState(portfolios[0]);
  const [showCreate, setShowCreate] = useState(false);

  const totalValue = portfolios.reduce((s, p) => s + p.currentValue, 0);
  const totalPnL = portfolios.reduce((s, p) => s + (p.currentValue - p.initialCapital), 0);
  const totalPnLPct = (totalPnL / portfolios.reduce((s, p) => s + p.initialCapital, 0)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Portfolios</h1>
          <p className="text-white/40">Track your positions across exchanges</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> New Portfolio</button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <Wallet size={20} className="text-[#00D9A3]" />
            <span className="text-xs text-white/30">Total</span>
          </div>
          <div className="text-2xl font-bold font-mono">${totalValue.toLocaleString()}</div>
          <div className="text-xs text-white/40 mt-1">Across {portfolios.length} portfolios</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            {totalPnL >= 0 ? <TrendingUp size={20} className="text-[#00D9A3]" /> : <TrendingDown size={20} className="text-red-400" />}
            <span className="text-xs text-white/30">Total P&L</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${totalPnL >= 0 ? 'text-[#00D9A3]' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()}
          </div>
          <div className={`text-xs mt-1 ${totalPnL >= 0 ? 'text-[#00D9A3]' : 'text-red-400'}`}>
            {totalPnLPct >= 0 ? '+' : ''}{totalPnLPct.toFixed(1)}% all time
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <PieChart size={20} className="text-blue-400" />
            <span className="text-xs text-white/30">Active Positions</span>
          </div>
          <div className="text-2xl font-bold">{portfolios.reduce((s, p) => s + p.positions.length, 0)}</div>
          <div className="text-xs text-white/40 mt-1">Across 3 exchanges</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={20} className="text-purple-400" />
            <span className="text-xs text-white/30">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-[#00D9A3]">72.3%</div>
          <div className="text-xs text-white/40 mt-1">Last 30 days</div>
        </div>
      </div>

      {/* Portfolio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {portfolios.map((p) => {
          const pnl = p.currentValue - p.initialCapital;
          const pnlPct = (pnl / p.initialCapital) * 100;
          return (
            <div key={p.id} onClick={() => setSelected(p)}
              className={`card cursor-pointer transition ${selected.id === p.id ? 'ring-2 ring-[#00D9A3]' : 'hover:bg-white/5'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                  <span className="font-semibold">{p.name}</span>
                </div>
                <ArrowRight size={16} className="text-white/30" />
              </div>
              <div className="text-2xl font-bold font-mono mb-1">${p.currentValue.toLocaleString()}</div>
              <div className={`text-sm ${pnl >= 0 ? 'text-[#00D9A3]' : 'text-red-400'}`}>
                {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-white/30">
                <span>{p.positions.length} positions</span>
                <span>·</span>
                <span>{p.currency}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Portfolio Detail */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: selected.color }} />
            {selected.name} — Positions
          </h3>
          <button className="text-[#00D9A3] text-sm hover:underline">Rebalance</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-xs text-white/40">
                <th className="text-left p-3 font-medium">Symbol</th>
                <th className="text-right p-3 font-medium">Quantity</th>
                <th className="text-right p-3 font-medium">Entry Price</th>
                <th className="text-right p-3 font-medium">Current Price</th>
                <th className="text-right p-3 font-medium">Value</th>
                <th className="text-right p-3 font-medium">P&L %</th>
                <th className="text-right p-3 font-medium hidden md:table-cell">Exchange</th>
                <th className="text-center p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {selected.positions.map((pos) => {
                const value = pos.qty * pos.current;
                const pnlAmt = (pos.current - pos.entry) * pos.qty * (pos.pnl >= 0 ? 1 : 1);
                return (
                  <tr key={pos.symbol} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 font-bold">{pos.symbol}</td>
                    <td className="p-3 text-right font-mono">{pos.qty}</td>
                    <td className="p-3 text-right font-mono text-white/60">${pos.entry.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">${pos.current.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-bold">${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right">
                      <span className={pos.pnl >= 0 ? 'text-[#00D9A3]' : 'text-red-400'}>
                        {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-right hidden md:table-cell">
                      <span className="text-xs px-2 py-1 rounded bg-white/5 text-white/40">{pos.exchange}</span>
                    </td>
                    <td className="p-3 text-center">
                      <button className="text-xs text-red-400 hover:underline">Close</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
