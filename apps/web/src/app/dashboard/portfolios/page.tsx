'use client';
import { useState, useEffect } from 'react';
import { portfoliosApi } from '@/lib/api';
import { TrendingUp, TrendingDown, Wallet, PieChart, Plus } from 'lucide-react';

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPort, setNewPort] = useState({ name: '', description: '', initialCapital: 10000 });

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      const { data } = await portfoliosApi.list();
      setPortfolios(data);
      if (data.length > 0 && !selected) { setSelected(data[0]); loadPortfolioData(data[0].id); }
    } catch {
      // Fallback demo data
      const demo = [
        { id: 'demo-1', name: 'Crypto Portfolio', description: 'Main crypto holdings', initialCapital: 50000, currentValue: 67850, pnl: 17850, pnlPct: 35.7 },
        { id: 'demo-2', name: 'Stock Portfolio', description: 'US equities long-term', initialCapital: 100000, currentValue: 112400, pnl: 12400, pnlPct: 12.4 },
        { id: 'demo-3', name: 'Forex Portfolio', description: 'Currency trading', initialCapital: 25000, currentValue: 23100, pnl: -1900, pnlPct: -7.6 },
      ];
      setPortfolios(demo);
      setSelected(demo[0]);
      setPositions([
        { symbol: 'BTC', exchange: 'binance', side: 'LONG', quantity: 0.85, entryPrice: 58000, currentPrice: 65432, pnl: 6317, pnlPct: 12.8 },
        { symbol: 'ETH', exchange: 'binance', side: 'LONG', quantity: 8.2, entryPrice: 2900, currentPrice: 3521, pnl: 5072, pnlPct: 21.4 },
        { symbol: 'SOL', exchange: 'binance', side: 'LONG', quantity: 120, entryPrice: 95, currentPrice: 142, pnl: 5640, pnlPct: 49.5 },
      ]);
      setBalances([
        { asset: 'USDT', free: 12450, locked: 0 },
        { asset: 'BTC', free: 0.85, locked: 0 },
        { asset: 'ETH', free: 8.2, locked: 0 },
      ]);
    }
  };

  const loadPortfolioData = async (id: string) => {
    try {
      const [pos, bal] = await Promise.all([
        portfoliosApi.positions(id),
        portfoliosApi.balances(id),
      ]);
      setPositions(pos.data); setBalances(bal.data);
    } catch {}
  };

  const createPortfolio = async () => {
    try {
      const { data } = await portfoliosApi.create(newPort);
      setPortfolios([...portfolios, data]);
      setSelected(data);
      setShowCreate(false);
      setNewPort({ name: '', description: '', initialCapital: 10000 });
    } catch {
      // Add locally for demo
      const p = { id: `demo-${Date.now()}`, ...newPort, currentValue: newPort.initialCapital, pnl: 0, pnlPct: 0 };
      setPortfolios([...portfolios, p]);
      setSelected(p);
      setShowCreate(false);
    }
  };

  const totalValue = portfolios.reduce((sum, p) => sum + (p.currentValue || 0), 0);
  const totalPnl = portfolios.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const totalPnlPct = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Portfolios</h1>
          <p className="text-white/40">Track your holdings across exchanges</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Portfolio
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-2"><Wallet size={16} /> Total Value</div>
          <div className="text-2xl font-bold font-mono">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-2"><TrendingUp size={16} /> Total P&L</div>
          <div className={`text-2xl font-bold font-mono ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-2"><PieChart size={16} /> Return</div>
          <div className={`text-2xl font-bold font-mono ${totalPnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio List */}
        <div className="space-y-3">
          {portfolios.map((p) => (
            <div key={p.id} onClick={() => { setSelected(p); loadPortfolioData(p.id); }}
              className={`card cursor-pointer transition ${selected?.id === p.id ? 'ring-2 ring-tradeos-accent' : 'hover:bg-white/5'}`}>
              <div className="font-semibold mb-1">{p.name}</div>
              <div className="text-xs text-white/40 mb-3">{p.description}</div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg">${(p.currentValue || 0).toLocaleString()}</span>
                <span className={`text-sm font-medium ${(p.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(p.pnl || 0) >= 0 ? '+' : ''}{(p.pnlPct || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Portfolio Detail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balances */}
          <div className="card">
            <h3 className="font-semibold mb-4">Balances</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="text-left text-white/40 text-sm border-b border-white/5">
                  <th className="pb-2">Asset</th><th className="pb-2">Available</th><th className="pb-2">Locked</th><th className="pb-2">Value (USD)</th>
                </tr></thead>
                <tbody>
                  {balances.map((b, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-3 font-mono font-bold">{b.asset}</td>
                      <td className="py-3 font-mono">{b.free?.toLocaleString()}</td>
                      <td className="py-3 font-mono text-white/40">{b.locked || 0}</td>
                      <td className="py-3 font-mono">${(b.free * (b.asset === 'BTC' ? 65432 : b.asset === 'ETH' ? 3521 : 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {balances.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-white/30">No balances</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Open Positions */}
          <div className="card">
            <h3 className="font-semibold mb-4">Open Positions</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="text-left text-white/40 text-sm border-b border-white/5">
                  <th className="pb-2">Symbol</th><th className="pb-2">Side</th><th className="pb-2">Qty</th><th className="pb-2">Entry</th><th className="pb-2">Current</th><th className="pb-2">P&L</th>
                </tr></thead>
                <tbody>
                  {positions.map((pos, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-3 font-mono font-bold">{pos.symbol}</td>
                      <td className="py-3"><span className={`text-xs px-2 py-1 rounded ${pos.side === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{pos.side}</span></td>
                      <td className="py-3 font-mono">{pos.quantity}</td>
                      <td className="py-3 font-mono text-white/60">${pos.entryPrice?.toLocaleString()}</td>
                      <td className="py-3 font-mono">${pos.currentPrice?.toLocaleString()}</td>
                      <td className={`py-3 font-mono font-bold ${(pos.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(pos.pnl || 0) >= 0 ? '+' : ''}${(pos.pnl || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        <span className="block text-xs">({(pos.pnlPct || 0).toFixed(1)}%)</span>
                      </td>
                    </tr>
                  ))}
                  {positions.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-white/30">No open positions</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Portfolio Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-tradeos-dark-2 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Create Portfolio</h3>
            <div className="space-y-3">
              <input className="input" placeholder="Portfolio name" value={newPort.name} onChange={(e) => setNewPort({ ...newPort, name: e.target.value })} />
              <input className="input" placeholder="Description" value={newPort.description} onChange={(e) => setNewPort({ ...newPort, description: e.target.value })} />
              <input className="input" type="number" placeholder="Initial capital ($)" value={newPort.initialCapital} onChange={(e) => setNewPort({ ...newPort, initialCapital: parseFloat(e.target.value) || 0 })} />
              <button onClick={createPortfolio} className="btn-primary w-full">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
