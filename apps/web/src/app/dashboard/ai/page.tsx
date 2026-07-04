'use client';
import { Bot, TrendingUp, Shield, Cpu, Newspaper, RefreshCw } from 'lucide-react';

const agents = [
  { name: 'Market Analyst', type: 'MARKET_ANALYST', desc: 'Scans markets for opportunities and trends', icon: TrendingUp },
  { name: 'Risk Manager', type: 'RISK_MANAGER', desc: 'Monitors exposure and enforces position limits', icon: Shield },
  { name: 'Strategy Optimizer', type: 'STRATEGY_OPTIMIZER', desc: 'Backtests and optimizes trading strategies', icon: Cpu },
  { name: 'Execution Agent', type: 'EXECUTION', desc: 'Executes trades with optimal timing', icon: Bot },
  { name: 'News Monitor', type: 'NEWS_MONITOR', desc: 'Tracks news sentiment for signals', icon: Newspaper },
  { name: 'Portfolio Rebalancer', type: 'REBALANCER', desc: 'Auto-rebalances based on target allocations', icon: RefreshCw },
];

export default function AIAgentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">AI Agents</h1>
      <p className="text-white/40 mb-6">6 specialized trading agents working 24/7</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((a) => { const Icon = a.icon; return (
          <div key={a.type} className="card hover:border-tradeos-accent/30 transition cursor-pointer">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-tradeos-accent/20 flex items-center justify-center"><Icon size={20} className="text-tradeos-glow" /></div>
              <div className="flex-1"><h3 className="font-semibold">{a.name}</h3><p className="text-xs text-tradeos-glow">{a.type}</p></div>
              <span className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <p className="text-sm text-white/40">{a.desc}</p>
          </div>); })}
      </div>
    </div>
  );
}
