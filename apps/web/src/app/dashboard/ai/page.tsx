'use client';
import { useState } from 'react';
import { Bot, Zap, Play, Pause, Settings, Activity, TrendingUp, Clock, CheckCircle, AlertCircle, Cpu, Brain } from 'lucide-react';

const agents = [
  { name: 'Scalper Agent', type: 'scalper', desc: 'High-frequency trading for small price movements', strategy: 'Momentum scalping with RSI + MACD', risk: 'HIGH', status: 'active', color: '#FF4757',
    stats: { trades: 142, winRate: 68.3, pnl: 3450, avgDuration: '3.2m', lastRun: '2m ago', executions: 28 },
    config: { symbols: ['BTC', 'ETH', 'SOL'], maxPositions: 5, stopLoss: 0.5, takeProfit: 1.2, interval: '1m' }
  },
  { name: 'Swing Agent', type: 'swing', desc: 'Medium-term position trading based on trends', strategy: 'EMA crossover + volume confirmation', risk: 'MEDIUM', status: 'active', color: '#00D9A3',
    stats: { trades: 47, winRate: 74.5, pnl: 8920, avgDuration: '2.5d', lastRun: '1h ago', executions: 15 },
    config: { symbols: ['BTC', 'ETH', 'AAPL', 'NVDA'], maxPositions: 8, stopLoss: 3, takeProfit: 8, interval: '4h' }
  },
  { name: 'Arbitrage Agent', type: 'arbitrage', desc: 'Cross-exchange price difference exploitation', strategy: 'Binance vs Coinbase spread detection', risk: 'LOW', status: 'active', color: '#3B82F6',
    stats: { trades: 234, winRate: 98.2, pnl: 1230, avgDuration: '15s', lastRun: '30s ago', executions: 45 },
    config: { symbols: ['BTC', 'ETH'], minSpread: 0.15, maxSlippage: 0.05, autoExecute: true }
  },
  { name: 'Sentiment Agent', type: 'sentiment', desc: 'AI-powered news and social sentiment analysis', strategy: 'NLP sentiment scoring + trade signals', risk: 'MEDIUM', status: 'paused', color: '#A855F7',
    stats: { trades: 23, winRate: 61.0, pnl: 560, avgDuration: '6h', lastRun: '4h ago', executions: 8 },
    config: { sources: ['Twitter', 'Reddit', 'NewsAPI'], minConfidence: 0.7, maxArticles: 50 }
  },
  { name: 'Risk Manager', type: 'risk', desc: 'Portfolio risk monitoring and position sizing', strategy: 'VaR + Kelly Criterion position sizing', risk: 'LOW', status: 'active', color: '#F59E0B',
    stats: { trades: 0, winRate: 100, pnl: 0, avgDuration: 'N/A', lastRun: '5m ago', executions: 89 },
    config: { maxDrawdown: 5, maxDailyLoss: 2000, checkInterval: '30s', autoStopLoss: true }
  },
  { name: 'Rebalancer Agent', type: 'rebalancer', desc: 'Automatic portfolio rebalancing', strategy: 'Target weight allocation with drift threshold', risk: 'LOW', status: 'paused', color: '#10B981',
    stats: { trades: 12, winRate: 100, pnl: 320, avgDuration: 'Instant', lastRun: '2d ago', executions: 5 },
    config: { targetWeights: { BTC: 40, ETH: 30, SOL: 20, Cash: 10 }, driftThreshold: 5, rebalanceFreq: 'daily' }
  },
];

export default function AIAgentsPage() {
  const [agentList, setAgentList] = useState(agents);
  const [selectedAgent, setSelectedAgent] = useState<typeof agents[0] | null>(null);

  const toggleAgent = (type: string) => {
    setAgentList(prev => prev.map(a => a.type === type ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a));
  };

  const activeCount = agentList.filter(a => a.status === 'active').length;
  const totalPnL = agentList.reduce((s, a) => s + a.stats.pnl, 0);
  const totalTrades = agentList.reduce((s, a) => s + a.stats.trades, 0);
  const avgWinRate = agentList.filter(a => a.stats.trades > 0).reduce((s, a) => s + a.stats.winRate, 0) / agentList.filter(a => a.stats.trades > 0).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><Bot size={24} className="text-[#00D9A3]" /> AI Trading Agents</h1>
          <p className="text-white/40">Automated trading strategies powered by AI</p>
        </div>
        <button className="btn-primary flex items-center gap-2"><Zap size={18} /> Run All Agents</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <Activity size={20} className="text-[#00D9A3]" />
            <span className="text-xs text-green-400">{activeCount} running</span>
          </div>
          <div className="text-2xl font-bold">{activeCount}/{agentList.length}</div>
          <div className="text-xs text-white/40">Active Agents</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={20} className="text-[#00D9A3]" />
            <span className="text-xs text-green-400">+{totalPnL.toLocaleString()}</span>
          </div>
          <div className="text-2xl font-bold text-[#00D9A3]">+${totalPnL.toLocaleString()}</div>
          <div className="text-xs text-white/40">Total Agent P&L</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <Cpu size={20} className="text-blue-400" />
            <span className="text-xs text-white/30">All time</span>
          </div>
          <div className="text-2xl font-bold">{totalTrades}</div>
          <div className="text-xs text-white/40">Total Trades</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <Brain size={20} className="text-purple-400" />
            <span className="text-xs text-white/30">Weighted avg</span>
          </div>
          <div className="text-2xl font-bold text-[#00D9A3]">{avgWinRate.toFixed(1)}%</div>
          <div className="text-xs text-white/40">Avg Win Rate</div>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agentList.map((agent) => (
          <div key={agent.type} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${agent.color}20` }}>
                  <Bot size={20} style={{ color: agent.color }} />
                </div>
                <div>
                  <div className="font-semibold">{agent.name}</div>
                  <div className="text-xs text-white/40">{agent.desc}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  agent.risk === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                  agent.risk === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>{agent.risk}</span>
              </div>
            </div>

            {/* Strategy */}
            <div className="mb-3 p-2 bg-white/5 rounded-lg">
              <div className="text-xs text-white/30 mb-0.5">Strategy</div>
              <div className="text-sm">{agent.strategy}</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <div className="text-sm font-bold font-mono">{agent.stats.trades}</div>
                <div className="text-xs text-white/30">Trades</div>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <div className={`text-sm font-bold ${agent.stats.winRate >= 70 ? 'text-[#00D9A3]' : 'text-white/60'}`}>{agent.stats.winRate}%</div>
                <div className="text-xs text-white/30">Win Rate</div>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <div className={`text-sm font-bold font-mono ${agent.stats.pnl >= 0 ? 'text-[#00D9A3]' : 'text-red-400'}`}>
                  {agent.stats.pnl >= 0 ? '+' : ''}${agent.stats.pnl.toLocaleString()}
                </div>
                <div className="text-xs text-white/30">P&L</div>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <div className="text-sm font-bold text-white/60">{agent.stats.avgDuration}</div>
                <div className="text-xs text-white/30">Avg Hold</div>
              </div>
            </div>

            {/* Config Preview */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {agent.config.symbols && agent.config.symbols.map((s) => (
                <span key={s} className="text-xs px-2 py-1 rounded bg-white/5 text-white/50 font-mono">{s}</span>
              ))}
              {!agent.config.symbols && agent.config.sources && agent.config.sources.map((s) => (
                <span key={s} className="text-xs px-2 py-1 rounded bg-white/5 text-white/50 font-mono">{s}</span>
              ))}
              {agent.config.maxPositions && <span className="text-xs px-2 py-1 rounded bg-white/5 text-white/50 font-mono">max:{agent.config.maxPositions}</span>}
              {agent.config.interval && <span className="text-xs px-2 py-1 rounded bg-white/5 text-white/50 font-mono">{agent.config.interval}</span>}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div className="flex items-center gap-3 text-xs text-white/30">
                <span className="flex items-center gap-1"><Clock size={12} /> {agent.stats.lastRun}</span>
                <span>{agent.stats.executions} runs</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedAgent(agent)} className="text-white/30 hover:text-white"><Settings size={16} /></button>
                <button onClick={() => toggleAgent(agent.type)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  agent.status === 'active' ? 'bg-[#00D9A3]/20 text-[#00D9A3]' : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}>
                  {agent.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Start</>}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Config Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelectedAgent(null)}>
          <div className="card max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{selectedAgent.name} Configuration</h3>
              <button onClick={() => setSelectedAgent(null)} className="text-white/30 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Strategy</label>
                <input className="input" defaultValue={selectedAgent.strategy} />
              </div>
              {selectedAgent.config.symbols && (
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Trading Symbols</label>
                  <input className="input font-mono" defaultValue={selectedAgent.config.symbols.join(', ')} />
                </div>
              )}
              {selectedAgent.config.maxPositions !== undefined && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Max Positions</label>
                    <input type="number" className="input" defaultValue={selectedAgent.config.maxPositions} />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Interval</label>
                    <select className="input" defaultValue={selectedAgent.config.interval}>
                      <option>1m</option><option>5m</option><option>15m</option><option>1h</option><option>4h</option><option>1d</option>
                    </select>
                  </div>
                </div>
              )}
              {selectedAgent.config.stopLoss !== undefined && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Stop Loss (%)</label>
                    <input type="number" className="input" defaultValue={selectedAgent.config.stopLoss} />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Take Profit (%)</label>
                    <input type="number" className="input" defaultValue={selectedAgent.config.takeProfit} />
                  </div>
                </div>
              )}
              <button className="btn-primary w-full">Save Configuration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
