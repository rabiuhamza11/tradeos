'use client';
import { useEffect, useState, useRef } from 'react';
import { marketApi } from '@/lib/api';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function MarketsPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, any>>({});
  const [search, setSearch] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<any>(null);

  useEffect(() => {
    // Load initial quotes from REST API
    marketApi.quotes().then(({ data }) => setQuotes(data)).catch(() => {
      setQuotes([
        { symbol: 'BTC', name: 'Bitcoin', price: 65432.50, changePct: 0.036, type: 'CRYPTO' },
        { symbol: 'ETH', name: 'Ethereum', price: 3521.80, changePct: -0.004, type: 'CRYPTO' },
        { symbol: 'AAPL', name: 'Apple Inc.', price: 195.42, changePct: 0.0095, type: 'STOCK' },
        { symbol: 'TSLA', name: 'Tesla', price: 251.30, changePct: -0.0135, type: 'STOCK' },
        { symbol: 'EURUSD', name: 'EUR/USD', price: 1.0842, changePct: 0.0019, type: 'FOREX' },
        { symbol: 'XAU', name: 'Gold', price: 2352.40, changePct: 0.0055, type: 'COMMODITY' },
      ]);
    });

    // Connect to WebSocket for live updates
    const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000') + '/stream';
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        // Subscribe to all symbol prices
        ws.send(JSON.stringify({ event: 'subscribe prices', data: { symbols: ['BTC', 'ETH', 'AAPL', 'TSLA', 'EURUSD', 'XAU'] } }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'price update' || msg.event === 'prices') {
            const data = Array.isArray(msg.data) ? msg.data : [msg.data];
            setLivePrices((prev) => {
              const updated = { ...prev };
              for (const d of data) { if (d && d.symbol) updated[d.symbol] = d; }
              return updated;
            });
          }
        } catch {}
      };

      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
    } catch (e) { console.log('WebSocket connection failed, using REST fallback'); }

    return () => { try { wsRef.current?.close(); } catch {} };
  }, []);

  const filtered = quotes.filter(q => !search || q.symbol.includes(search.toUpperCase()) || q.name.toLowerCase().includes(search.toLowerCase()));

  const getPrice = (q: any) => livePrices[q.symbol]?.price || q.price;
  const getChange = (q: any) => livePrices[q.symbol]?.changePct ?? q.changePct;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Markets</h1>
          <p className="text-white/40">Live market data</p>
        </div>
        <div className={`flex items-center gap-2 text-sm ${connected ? 'text-green-400' : 'text-white/30'}`}>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
          {connected ? 'Live' : 'Offline'}
        </div>
      </div>

      <input className="input mb-4" placeholder="Search symbols..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr className="text-left text-white/40 text-sm border-b border-white/5">
            <th className="pb-3">Symbol</th><th className="pb-3">Name</th><th className="pb-3">Price</th><th className="pb-3">Change</th><th className="pb-3">Type</th>
          </tr></thead>
          <tbody>
            {filtered.map((q) => {
              const price = getPrice(q); const change = getChange(q);
              return (
                <tr key={q.symbol} className="border-b border-white/5 hover:bg-white/5 cursor-pointer">
                  <td className="py-3 font-mono font-bold">{q.symbol}</td>
                  <td className="py-3 text-white/60">{q.name}</td>
                  <td className="py-3 font-mono">${price?.toLocaleString(undefined, { minimumFractionDigits: q.type === 'FOREX' ? 4 : 2 })}</td>
                  <td className={`py-3 flex items-center gap-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {change >= 0 ? '+' : ''}{(change * 100).toFixed(2)}%
                  </td>
                  <td className="py-3"><span className="text-xs px-2 py-1 rounded bg-white/5 text-white/40">{q.type}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
