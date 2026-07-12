'use client';
import { useState, useEffect, useCallback } from 'react';
import { Zap, TrendingUp, TrendingDown, X, ArrowDownRight, ArrowUpRight, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const TRADEOS_AI = 'https://superagent-2286fb2f.base44.app/functions/tradeosAI';
const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'LINK', 'AVAX'];
const ORDER_TYPES = ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'];

function fmt(p: number) {
  if (!p) return '0.00';
  if (p < 0.01) return p.toFixed(6);
  if (p < 1) return p.toFixed(4);
  if (p < 100) return p.toFixed(3);
  return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

type OrderStatus = 'FILLED' | 'PENDING' | 'PARTIAL' | 'CANCELLED';
interface SimOrder {
  id: string; symbol: string; exchange: string;
  side: 'BUY' | 'SELL'; type: string;
  qty: number; price: number; status: OrderStatus; time: string;
  pnl?: number;
}

const SEED_ORDERS: SimOrder[] = [
  { id: '1', symbol: 'BTC', exchange: 'Kraken', side: 'BUY', type: 'LIMIT', qty: 0.05, price: 62100, status: 'FILLED', time: '09:14:02', pnl: 46.25 },
  { id: '2', symbol: 'ETH', exchange: 'Kraken', side: 'SELL', type: 'MARKET', qty: 1.2, price: 1748, status: 'FILLED', time: '10:28:41', pnl: -12.40 },
  { id: '3', symbol: 'SOL', exchange: 'Kraken', side: 'BUY', type: 'LIMIT', qty: 15, price: 76.5, status: 'PARTIAL', time: '11:15:22', pnl: 22.50 },
];

export default function TradingPage() {
  const [liveMarkets, setLiveMarkets] = useState<Record<string, any>>({});
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const [order, setOrder] = useState({
    symbol: 'BTC', side: 'BUY' as 'BUY' | 'SELL',
    type: 'MARKET', quantity: '', price: '', stopPrice: '',
  });
  const [orders, setOrders] = useState<SimOrder[]>(SEED_ORDERS);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [balance, setBalance] = useState(50000);

  const fetchPrices = useCallback(async () => {
    setLoadingPrices(true);
    try {
      const res = await fetch(TRADEOS_AI);
      const data = await res.json();
      if (data.success) {
        const map: Record<string, any> = {};
        (data.markets || []).forEach((m: any) => { map[m.symbol] = m; });
        setLiveMarkets(map);
        setLastUpdate(new Date(data.timestamp).toLocaleTimeString());
      }
    } catch (_) {}
    setLoadingPrices(false);
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  const livePrice = liveMarkets[order.symbol]?.price || 0;
  const liveChange = liveMarkets[order.symbol]?.change24h || 0;
  const execPrice = order.type === 'MARKET' ? livePrice : parseFloat(order.price || '0');
  const qty = parseFloat(order.quantity || '0');
  const estimatedCost = qty * execPrice;
  const fee = estimatedCost * 0.001;

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const submitOrder = () => {
    if (!qty || qty <= 0) return showToast('Enter a valid quantity', 'error');
    if (order.type !== 'MARKET' && (!execPrice || execPrice <= 0)) return showToast('Enter a valid price', 'error');
    if (order.side === 'BUY' && estimatedCost > balance) return showToast('Insufficient balance', 'error');

    const newOrder: SimOrder = {
      id: `${Date.now()}`,
      symbol: order.symbol,
      exchange: 'Kraken (sim)',
      side: order.side,
      type: order.type,
      qty,
      price: execPrice || livePrice,
      status: order.type === 'MARKET' ? 'FILLED' : 'PENDING',
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      pnl: order.type === 'MARKET' ? 0 : undefined,
    };

    setOrders(prev => [newOrder, ...prev]);
    if (order.side === 'BUY') setBalance(b => b - estimatedCost - fee);
    else setBalance(b => b + estimatedCost - fee);
    setOrder(o => ({ ...o, quantity: '', price: '', stopPrice: '' }));
    showToast(`✅ ${order.side} ${qty} ${order.symbol} @ $${fmt(execPrice || livePrice)} — ${newOrder.status}`, 'success');
  };

  const cancelOrder = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'CANCELLED' } : o));
    showToast('Order cancelled', 'success');
  };

  const filledOrders = orders.filter(o => o.status === 'FILLED');
  const totalPnL = filledOrders.reduce((s, o) => s + (o.pnl || 0), 0);

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-[#00D9A3]/10 border border-[#00D9A3]/30 text-[#00D9A3]' : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Trading Simulator</h1>
          <p className="text-white/40 text-sm">
            {loadingPrices ? 'Fetching live prices...' : `Live Kraken prices · ${lastUpdate}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-white/30">Sim Balance</div>
            <div className="font-bold font-mono text-[#00D9A3]">${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/30">Total P&L</div>
            <div className={`font-bold font-mono ${totalPnL >= 0 ? 'text-[#00D9A3]' : 'text-red-400'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </div>
          </div>
          <button onClick={fetchPrices} disabled={loadingPrices} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
            <RefreshCw size={15} className={`text-white/40 ${loadingPrices ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live price ticker row */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
        {CRYPTO_SYMBOLS.map(sym => {
          const m = liveMarkets[sym];
          if (!m) return (
            <div key={sym} className={`flex-shrink-0 px-3 py-2 rounded-lg border cursor-pointer transition text-xs ${order.symbol === sym ? 'border-[#00D9A3]/50 bg-[#00D9A3]/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
              onClick={() => setOrder(o => ({ ...o, symbol: sym }))}>
              <div className="font-bold mb-0.5">{sym}</div>
              <div className="animate-pulse text-white/20">···</div>
            </div>
          );
          return (
            <div key={sym}
              onClick={() => setOrder(o => ({ ...o, symbol: sym }))}
              className={`flex-shrink-0 px-3 py-2 rounded-lg border cursor-pointer transition ${order.symbol === sym ? 'border-[#00D9A3]/50 bg-[#00D9A3]/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
              <div className="text-xs font-bold mb-0.5 flex items-center gap-1">{sym}
                {order.symbol === sym && <span className="text-[9px] text-[#00D9A3]">●</span>}
              </div>
              <div className="font-mono text-xs">${fmt(m.price)}</div>
              <div className={`text-[10px] ${m.change24h >= 0 ? 'text-[#00D9A3]' : 'text-red-400'}`}>
                {m.change24h >= 0 ? '+' : ''}{m.change24h?.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <div className="card">
          <div className="flex gap-2 mb-5">
            <button onClick={() => setOrder(o => ({ ...o, side: 'BUY' }))}
              className={`flex-1 py-2.5 rounded-lg font-bold transition ${order.side === 'BUY' ? 'bg-[#00D9A3] text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
              Buy
            </button>
            <button onClick={() => setOrder(o => ({ ...o, side: 'SELL' }))}
              className={`flex-1 py-2.5 rounded-lg font-bold transition ${order.side === 'SELL' ? 'bg-red-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
              Sell
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Symbol</label>
              <select className="input" value={order.symbol} onChange={e => setOrder(o => ({ ...o, symbol: e.target.value }))}>
                {CRYPTO_SYMBOLS.map(s => (
                  <option key={s} value={s}>{s} {liveMarkets[s] ? `— $${fmt(liveMarkets[s].price)}` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Order Type</label>
              <select className="input" value={order.type} onChange={e => setOrder(o => ({ ...o, type: e.target.value }))}>
                {ORDER_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Quantity ({order.symbol})</label>
              <input type="number" className="input font-mono" placeholder="0.00" min="0" step="any"
                value={order.quantity} onChange={e => setOrder(o => ({ ...o, quantity: e.target.value }))} />
            </div>

            {order.type !== 'MARKET' && (
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Limit Price (USD)</label>
                <input type="number" className="input font-mono" placeholder={livePrice ? fmt(livePrice) : '0.00'}
                  value={order.price} onChange={e => setOrder(o => ({ ...o, price: e.target.value }))} />
              </div>
            )}

            {order.type === 'STOP_LIMIT' && (
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Stop Price (USD)</label>
                <input type="number" className="input font-mono" placeholder="0.00"
                  value={order.stopPrice} onChange={e => setOrder(o => ({ ...o, stopPrice: e.target.value }))} />
              </div>
            )}

            {/* Live price + summary */}
            <div className="p-3 bg-white/5 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-white/40">Live Price</span>
                <div className="text-right">
                  <span className="font-mono font-bold">{livePrice ? `$${fmt(livePrice)}` : '—'}</span>
                  {liveChange !== 0 && (
                    <span className={`ml-2 text-xs ${liveChange >= 0 ? 'text-[#00D9A3]' : 'text-red-400'}`}>
                      {liveChange >= 0 ? '+' : ''}{liveChange.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Est. Total</span>
                <span className="font-mono font-bold">${estimatedCost > 0 ? estimatedCost.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Fee (0.1%)</span>
                <span className="font-mono text-white/40">${fee > 0 ? fee.toFixed(2) : '—'}</span>
              </div>
              {order.side === 'BUY' && estimatedCost > balance && (
                <div className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12} /> Insufficient balance</div>
              )}
            </div>

            <button onClick={submitOrder}
              disabled={!qty || (order.side === 'BUY' && estimatedCost > balance)}
              className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                order.side === 'BUY' ? 'bg-[#00D9A3] text-black hover:bg-[#00D9A3]/90' : 'bg-red-500 text-white hover:bg-red-500/90'
              }`}>
              {order.side === 'BUY' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
              {order.side === 'BUY' ? 'Buy' : 'Sell'} {order.symbol}
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Zap size={16} className="text-[#00D9A3]" /> Order History
            <span className="ml-auto text-xs text-white/30">{orders.length} orders · {filledOrders.length} filled</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-white/30">
                  <th className="text-left p-2 font-medium">Time</th>
                  <th className="text-left p-2 font-medium">Symbol</th>
                  <th className="text-left p-2 font-medium">Side</th>
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-right p-2 font-medium">Qty</th>
                  <th className="text-right p-2 font-medium">Price</th>
                  <th className="text-right p-2 font-medium">P&L</th>
                  <th className="text-right p-2 font-medium">Status</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="p-2 text-xs font-mono text-white/30">{o.time}</td>
                    <td className="p-2 font-bold">{o.symbol}</td>
                    <td className="p-2">
                      <span className={`flex items-center gap-1 text-xs font-medium ${o.side === 'BUY' ? 'text-[#00D9A3]' : 'text-red-400'}`}>
                        {o.side === 'BUY' ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {o.side}
                      </span>
                    </td>
                    <td className="p-2 text-xs text-white/40">{o.type.replace('_', ' ')}</td>
                    <td className="p-2 text-right font-mono">{o.qty}</td>
                    <td className="p-2 text-right font-mono">${fmt(o.price)}</td>
                    <td className="p-2 text-right font-mono">
                      {o.pnl != null ? (
                        <span className={o.pnl >= 0 ? 'text-[#00D9A3]' : 'text-red-400'}>
                          {o.pnl >= 0 ? '+' : ''}${o.pnl.toFixed(2)}
                        </span>
                      ) : <span className="text-white/20">—</span>}
                    </td>
                    <td className="p-2 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        o.status === 'FILLED' ? 'bg-green-500/15 text-green-400' :
                        o.status === 'PENDING' ? 'bg-yellow-500/15 text-yellow-400' :
                        o.status === 'PARTIAL' ? 'bg-blue-500/15 text-blue-400' :
                        'bg-red-500/15 text-red-400'
                      }`}>{o.status}</span>
                    </td>
                    <td className="p-2 text-center">
                      {(o.status === 'PENDING' || o.status === 'PARTIAL') && (
                        <button onClick={() => cancelOrder(o.id)} className="text-white/20 hover:text-red-400 transition">
                          <X size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
