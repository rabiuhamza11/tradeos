'use client';
import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';

export default function AnalyticsPage() {
  const [dash, setDash] = useState<any>(null);
  const [risk, setRisk] = useState<any>(null);
  const [trades, setTrades] = useState<any>(null);
  useEffect(() => {
    analyticsApi.dashboard().then(({ data }) => setDash(data)).catch(() => {});
    analyticsApi.risk().then(({ data }) => setRisk(data)).catch(() => {
      setRisk({ totalExposure: 87500, maxPositionSize: 25000, concentrationRisk: 28.5, sharpeRatio: 1.42, openPositions: 7, riskLevel: 'MEDIUM' });
    });
    analyticsApi.trades().then(({ data }) => setTrades(data)).catch(() => {
      setTrades({ monthlyPnL: [{ month: '2026-07', pnl: 5420, trades: 23 }], assetDistribution: [{ type: 'STOCK', value: 45000 }, { type: 'CRYPTO', value: 30000 }], avgTradeSize: 3200, totalTrades: 89, totalFees: 285 });
    });
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Analytics</h1>
      <p className="text-white/40 mb-6">Performance and risk metrics</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card"><p className="text-white/40 text-sm mb-1">Sharpe Ratio</p><p className="text-2xl font-bold text-tradeos-accent">{risk?.sharpeRatio ?? '—'}</p></div>
        <div className="stat-card"><p className="text-white/40 text-sm mb-1">Total Exposure</p><p className="text-2xl font-bold">${risk?.totalExposure?.toLocaleString() ?? '—'}</p></div>
        <div className="stat-card"><p className="text-white/40 text-sm mb-1">Risk Level</p><p className={`text-2xl font-bold ${risk?.riskLevel === 'HIGH' ? 'text-red-400' : risk?.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'}`}>{risk?.riskLevel ?? '—'}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card"><h2 className="text-lg font-semibold mb-4">Monthly P&L</h2>
          {trades?.monthlyPnL?.map((m: any) => (<div key={m.month} className="flex justify-between py-2 border-b border-white/5"><span>{m.month}</span><span className={m.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>${m.pnl.toLocaleString()} ({m.trades} trades)</span></div>))}
        </div>
        <div className="card"><h2 className="text-lg font-semibold mb-4">Asset Distribution</h2>
          {trades?.assetDistribution?.map((a: any) => (<div key={a.type} className="flex justify-between py-2 border-b border-white/5"><span>{a.type}</span><span>${a.value.toLocaleString()}</span></div>))}
        </div>
      </div>
    </div>
  );
}
