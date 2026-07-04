'use client';
import { useState } from 'react';
import { Zap, TrendingUp, TrendingDown, X, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOT', 'AAPL', 'TSLA', 'NVDA', 'EURUSD'];
const EXCHANGES = ['Binance', 'Coinbase', 'Alpaca', 'OANDA'];
const ORDER_TYPES = ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'];

const mockOrders = [
  { id: '1', symbol: 'BTC', exchange: 'Binance', side: 'BUY', type: 'LIMIT', qty: 0.05, price: 64000, status: 'FILLED', time: '14:32:05' },
  { id: '2', symbol: 'ETH', exchange: 'Binance', side: 'SELL', type: 'MARKET', qty: 1.2, price: 3521, status: 'FILLED', time: '14:28:41' },
  { id: '3', symbol: 'SOL', exchange: 'Coinbase', side: 'BUY', type: 'LIMIT', qty: 10, price: 138, status: 'PARTIAL', time: '14:15:22' },
  { id: '4', symbol: 'AAPL', exchange: 'Alpaca', side: 'BUY', type: 'MARKET', qty: 50, price: 214, status: 'FILLED', time: '13:45:10' },
  { id: '5', symbol: 'NVDA', exchange: 'Alpaca', side: 'SELL', type: 'LIMIT', qty: 20, price: 130, status: 'PENDING', time: '13:30:00' },
];

export default function TradingPage() {
  const [order, setOrder] = useState({
    symbol: 'BTC', exchange: 'Binance', side: 'BUY' as 'BUY' | 'SELL',
    type: 'MARKET', quantity: '', price: '', stopPrice: '',
  });
  const [orders, setOrders] = useState(mockOrders);
  const [confirming, setConfirming] = useState(false);

  const currentPrice = order.symbol === 'BTC' ? 65432 : order.symbol === 'ETH' ? 3521 : 142;
  const estimatedCost = parseFloat(order.quantity || '0') * (order.type === 'MARKET' ? currentPrice : parseFloat(order.price || '0'));

  const submitOrder = () => {
    if (!order.quantity) return;
    const newOrder = {
      id: `${Date.now()}`,
      symbol: order.symbol,
      exchange: order.exchange,
      side: order.side,
      type: order.type,
      qty: parseFloat(order.quantity),
      price: order.type === 'MARKET' ? currentPrice : parseFloat(order.price || '0'),
      status: 'PENDING',
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    };
    setOrders([newOrder, ...orders]);
    setConfirming(false);
    setOrder({ ...order, quantity: '', price: '', stopPrice: '' });
  };

  const cancelOrder = (id: string) => {
    setOrders(orders.map((o) => o.id === id ? { ...o, status: 'CANCELLED' } : o));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Trading</h1>
          <p className="text-white/40">Place and manage orders across exchanges</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-white/40">Buying Power:</span>
          <span className="text-[#00D9A3] font-bold font-mono">$50,000.00</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <div className="card">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setOrder({ ...order, side: 'BUY' })}
              className={`flex-1 py-2.5 rounded-lg font-medium transition ${order.side === 'BUY' ? 'bg-[#00D9A3] text-black' : 'bg-white/5 text-white/40'}`}>
              Buy
            </button>
            <button onClick={() => setOrder({ ...order, side: 'SELL' })}
              className={`flex-1 py-2.5 rounded-lg font-medium transition ${order.side === 'SELL' ? 'bg-red-500 text-white' : 'bg-white/5 text-white/40'}`}>
              Sell
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Symbol</label>
              <select className="input" value={order.symbol} onChange={(e) => setOrder({ ...order, symbol: e.target.value })}>
                {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Exchange</label>
              <select className="input" value={order.exchange} onChange={(e) => setOrder({ ...order, exchange: e.target.value })}>
                {EXCHANGES.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Order Type</label>
              <select className="input" value={order.type} onChange={(e) => setOrder({ ...order, type: e.target.value })}>
                {ORDER_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Quantity</label>
              <input type="number" className="input font-mono" placeholder="0.00" value={order.quantity}
                onChange={(e) => setOrder({ ...order, quantity: e.target.value })} />
            </div>

            {order.type !== 'MARKET' && (
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Price (USD)</label>
                <input type="number" className="input font-mono" placeholder="0.00" value={order.price}
                  onChange={(e) => setOrder({ ...order, price: e.target.value })} />
              </div>
            )}

            {order.type === 'STOP_LIMIT' && (
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Stop Price (USD)</label>
                <input type="number" className="input font-mono" placeholder="0.00" value={order.stopPrice}
                  onChange={(e) => setOrder({ ...order, stopPrice: e.target.value })} />
              </div>
            )}

            {/* Summary */}
            <div className="p-3 bg-white/5 rounded-lg space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Market Price</span>
                <span className="font-mono">${currentPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Est. Cost</span>
                <span className="font-mono font-bold">${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Est. Fee</span>
                <span className="font-mono text-white/60">${(estimatedCost * 0.001).toFixed(2)}</span>
              </div>
            </div>

            <button onClick={() => setConfirming(true)}
              className={`w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                order.side === 'BUY' ? 'bg-[#00D9A3] text-black hover:bg-[#00D9A3]/90' : 'bg-red-500 text-white hover:bg-red-500/90'
              }`}>
              {order.side === 'BUY' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
              {order.side === 'BUY' ? 'Buy' : 'Sell'} {order.symbol}
            </button>
          </div>
        </div>

        {/* Open Orders */}
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Zap size={18} /> Active Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-xs text-white/40">
                  <th className="text-left p-2 font-medium">Time</th>
                  <th className="text-left p-2 font-medium">Symbol</th>
                  <th className="text-left p-2 font-medium">Side</th>
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-right p-2 font-medium">Qty</th>
                  <th className="text-right p-2 font-medium">Price</th>
                  <th className="text-right p-2 font-medium">Status</th>
                  <th className="text-center p-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-2 text-xs text-white/30 font-mono">{o.time}</td>
                    <td className="p-2 font-bold">{o.symbol}</td>
                    <td className="p-2">
                      <span className={o.side === 'BUY' ? 'text-[#00D9A3]' : 'text-red-400'}>
                        {o.side === 'BUY' ? <TrendingUp size={14} className="inline" /> : <TrendingDown size={14} className="inline" />} {o.side}
                      </span>
                    </td>
                    <td className="p-2 text-xs text-white/40">{o.type.replace('_', ' ')}</td>
                    <td className="p-2 text-right font-mono">{o.qty}</td>
                    <td className="p-2 text-right font-mono">${o.price.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        o.status === 'FILLED' ? 'bg-green-500/20 text-green-400' :
                        o.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                        o.status === 'PARTIAL' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{o.status}</span>
                    </td>
                    <td className="p-2 text-center">
                      {(o.status === 'PENDING' || o.status === 'PARTIAL') && (
                        <button onClick={() => cancelOrder(o.id)} className="text-white/30 hover:text-red-400">
                          <X size={16} />
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

      {/* Confirm Modal */}
      {confirming && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setConfirming(false)}>
          <div className="card max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-4">Confirm Order</h3>
            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between"><span className="text-white/40">Action</span><span className={order.side === 'BUY' ? 'text-[#00D9A3]' : 'text-red-400'}>{order.side}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Symbol</span><span className="font-bold">{order.symbol}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Exchange</span><span>{order.exchange}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Type</span><span>{order.type.replace('_', ' ')}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Quantity</span><span className="font-mono">{order.quantity}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Est. Cost</span><span className="font-mono font-bold">${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(false)} className="flex-1 py-2.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10">Cancel</button>
              <button onClick={submitOrder} className={`flex-1 py-2.5 rounded-lg font-bold ${order.side === 'BUY' ? 'bg-[#00D9A3] text-black' : 'bg-red-500 text-white'}`}>
                Confirm {order.side}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
