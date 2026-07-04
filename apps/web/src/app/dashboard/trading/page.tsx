'use client';
import { useState, useEffect, useRef } from 'react';
import { tradingApi, marketApi } from '@/lib/api';
import LiveChart from '../components/LiveChart';

export default function TradingPage() {
  const [symbol, setSymbol] = useState('BTC');
  const [interval, setInterval] = useState('1h');
  const [form, setForm] = useState({ assetType: 'CRYPTO', side: 'BUY', type: 'MARKET', quantity: 1, price: 0, portfolioId: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [orderBook, setOrderBook] = useState<{ bids: [number, number][]; asks: [number, number][] }>({ bids: [], asks: [] });
  const [ticker, setTicker] = useState<any>(null);
  const wsRef = useRef<any>(null);

  // Fetch ticker and order book
  useEffect(() => {
    async function loadData() {
      try {
        const { data } = await marketApi.quote(symbol);
        setTicker(data);
        setForm((f) => ({ ...f, price: data.price }));
      } catch {}
    }
    loadData();
    const refresh = setInterval(loadData, 5000);
    return () => clearInterval(refresh);
  }, [symbol]);

  // WebSocket for live price
  useEffect(() => {
    const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000') + '/stream';
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => {
        ws.send(JSON.stringify({ event: 'subscribe prices', data: { symbols: [symbol] } }));
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'price update' && msg.data?.symbol === symbol) {
            setTicker((t: any) => t ? { ...t, price: msg.data.price, changePct: msg.data.changePct } : t);
          }
        } catch {}
      };
    } catch {}
    return () => { try { wsRef.current?.close(); } catch {} };
  }, [symbol]);

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await tradingApi.placeOrder({
        symbol, assetType: form.assetType, side: form.side, type: form.type,
        quantity: form.quantity, price: form.type !== 'MARKET' ? form.price : undefined,
        portfolioId: form.portfolioId,
      });
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.response?.data?.message || 'Order failed' });
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Trade</h1>
      <p className="text-white/40 mb-6">Live trading with real exchange integration</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart — takes 2 columns */}
        <div className="lg:col-span-2">
          <LiveChart symbol={symbol} interval={interval} height={420} />
          <div className="flex gap-2 mt-3">
            {['BTC', 'ETH', 'AAPL', 'TSLA', 'EURUSD', 'XAU'].map((s) => (
              <button
                key={s}
                onClick={() => setSymbol(s)}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${symbol === s ? 'bg-tradeos-accent text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Order Panel + Order Book */}
        <div className="space-y-6">
          {/* Order Form */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Place Order</h3>
              {ticker && <span className="font-mono text-sm text-tradeos-accent">${ticker.price?.toLocaleString()}</span>}
            </div>

            <div className="flex gap-2 mb-4">
              <button onClick={() => setForm({ ...form, side: 'BUY' })} className={`flex-1 py-2.5 rounded-lg font-semibold ${form.side === 'BUY' ? 'bg-green-500 text-white' : 'bg-white/5 text-white/40'}`}>BUY</button>
              <button onClick={() => setForm({ ...form, side: 'SELL' })} className={`flex-1 py-2.5 rounded-lg font-semibold ${form.side === 'SELL' ? 'bg-red-500 text-white' : 'bg-white/5 text-white/40'}`}>SELL</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Asset Type</label>
                <select className="input" value={form.assetType} onChange={(e) => setForm({ ...form, assetType: e.target.value })}>
                  <option>CRYPTO</option><option>STOCK</option><option>FOREX</option><option>COMMODITY</option><option>ETF</option><option>FUTURE</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block">Order Type</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option>MARKET</option><option>LIMIT</option><option>STOP</option><option>STOP_LIMIT</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block">Quantity</label>
                <input className="input" type="number" step="0.0001" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })} />
              </div>

              {form.type !== 'MARKET' && (
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Price</label>
                  <input className="input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
                </div>
              )}

              <div>
                <label className="text-xs text-white/40 mb-1 block">Portfolio ID</label>
                <input className="input" placeholder="Portfolio ID" value={form.portfolioId} onChange={(e) => setForm({ ...form, portfolioId: e.target.value })} />
              </div>

              {/* Order Summary */}
              <div className="p-3 bg-white/5 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-white/40">Estimated Cost</span><span className="font-mono">${(form.quantity * (form.price || ticker?.price || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Est. Fee (0.1%)</span><span className="font-mono">${(form.quantity * (form.price || ticker?.price || 0) * 0.001).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between border-t border-white/5 pt-1"><span className="text-white/40">Total</span><span className="font-mono font-bold">${(form.quantity * (form.price || ticker?.price || 0) * 1.001).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
              </div>

              <button onClick={submit} disabled={loading} className={`w-full py-3 rounded-lg font-semibold transition ${form.side === 'BUY' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                {loading ? 'Placing...' : `${form.side} ${form.quantity} ${symbol}`}
              </button>

              {result && (
                <div className={`p-3 rounded-lg text-sm ${result.error ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                  {result.message || result.error}
                </div>
              )}
            </div>
          </div>

          {/* Order Book (simplified) */}
          <div className="card">
            <h3 className="font-semibold mb-3">Order Book</h3>
            <div className="text-xs space-y-1">
              <div className="grid grid-cols-3 gap-2 text-white/40 mb-2 pb-2 border-b border-white/5">
                <span>Price</span><span className="text-right">Size</span><span className="text-right">Total</span>
              </div>
              {/* Asks (sells) */}
              {[...Array(5)].map((_, i) => {
                const askPrice = (ticker?.ask || ticker?.price || 100) * (1 + (5 - i) * 0.0005);
                const size = Math.random() * 5;
                return (
                  <div key={`ask-${i}`} className="grid grid-cols-3 gap-2 text-red-400">
                    <span className="font-mono">{askPrice.toFixed(2)}</span>
                    <span className="text-right font-mono">{size.toFixed(4)}</span>
                    <span className="text-right font-mono text-white/40">{(askPrice * size).toFixed(0)}</span>
                  </div>
                );
              })}
              {/* Spread */}
              <div className="text-center py-1 text-tradeos-accent font-mono text-xs">
                Spread: {((ticker?.ask || 0) - (ticker?.bid || 0)).toFixed(2)}
              </div>
              {/* Bids (buys) */}
              {[...Array(5)].map((_, i) => {
                const bidPrice = (ticker?.bid || ticker?.price || 100) * (1 - (i + 1) * 0.0005);
                const size = Math.random() * 5;
                return (
                  <div key={`bid-${i}`} className="grid grid-cols-3 gap-2 text-green-400">
                    <span className="font-mono">{bidPrice.toFixed(2)}</span>
                    <span className="text-right font-mono">{size.toFixed(4)}</span>
                    <span className="text-right font-mono text-white/40">{(bidPrice * size).toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
