'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, TrendingDown, Star, RefreshCw, Wifi } from 'lucide-react';

const TRADEOS_AI = 'https://superagent-2286fb2f.base44.app/functions/tradeosAI?action=market';

// Static non-crypto assets (Alpaca/OANDA — no free real-time API)
const STATIC_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc', price: 214.22, change: 1.2, volume: '$52B', exchange: 'Alpaca', sparkline: [210, 211, 212, 213, 214, 214.22] },
  { symbol: 'TSLA', name: 'Tesla', price: 248.10, change: -2.1, volume: '$88B', exchange: 'Alpaca', sparkline: [255, 253, 251, 250, 249, 248.10] },
  { symbol: 'NVDA', name: 'NVIDIA', price: 128.45, change: 4.8, volume: '$320B', exchange: 'Alpaca', sparkline: [120, 122, 125, 126, 127, 128.45] },
  { symbol: 'EURUSD', name: 'Euro / USD', price: 1.0842, change: 0.3, volume: 'FX', exchange: 'OANDA', sparkline: [1.082, 1.083, 1.0835, 1.084, 1.0841, 1.0842] },
  { symbol: 'XAU', name: 'Gold', price: 2387, change: 0.8, volume: 'Spot', exchange: 'OANDA', sparkline: [2370, 2375, 2380, 2383, 2385, 2387] },
];

const EXCHANGES = ['All', 'Kraken', 'Alpaca', 'OANDA'];

function fmt(price: number) {
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(3);
  return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtVol(vol: number) {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(0)}M`;
  return `$${vol.toFixed(0)}`;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data?.length) return <div className="w-20 h-5 bg-white/5 rounded animate-pulse" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 80},${18 - ((v - min) / range) * 16}`).join(' ');
  return (
    <svg width="80" height="20" viewBox="0 0 80 20">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function MarketsPage() {
  const [cryptoMarkets, setCryptoMarkets] = useState<any[]>([]);
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [exchange, setExchange] = useState('All');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['BTC', 'ETH', 'SOL']);

  const fetchLive = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(TRADEOS_AI);
      const data = await res.json();
      if (data.success) {
        setCryptoMarkets(data.markets || []);
        setSparklines(data.sparklines || {});
        setLastUpdate(new Date(data.timestamp).toLocaleTimeString());
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchLive(); }, [fetchLive]);

  // Merge crypto (live) + static assets
  const allSymbols = [
    ...cryptoMarkets.map(m => ({
      symbol: m.symbol, name: m.name, price: m.price,
      change: m.change24h, volume: fmtVol(m.volume),
      exchange: 'Kraken', sparkline: sparklines[m.symbol] || [],
      live: true, rsi: m.rsi,
    })),
    ...STATIC_SYMBOLS.map(s => ({ ...s, live: false, rsi: null })),
  ];

  const filtered = allSymbols.filter(s => {
    if (exchange !== 'All' && s.exchange !== exchange) return false;
    if (search && !s.symbol.toLowerCase().includes(search.toLowerCase()) && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleFav = (symbol: string) => {
    setFavorites(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]);
  };

  const totalMktCap = cryptoMarkets.reduce((s, m) => s + (m.volume || 0), 0);
  const bullish = allSymbols.filter(s => s.change > 0).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Markets</h1>
          <p className="text-white/40 text-sm flex items-center gap-2">
            <Wifi size={12} className={loading ? 'text-yellow-400' : 'text-[#00D9A3]'} />
            {loading ? 'Fetching live prices...' : `Kraken live · ${lastUpdate} · ${bullish}/${allSymbols.length} bullish`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-xs text-white/30">24h Volume (crypto)</div>
            <div className="font-bold">{fmtVol(totalMktCap)}</div>
          </div>
          <button onClick={fetchLive} disabled={loading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
            <RefreshCw size={16} className={`text-white/40 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input className="input pl-9 text-sm" placeholder="Search symbols..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {EXCHANGES.map(ex => (
            <button key={ex} onClick={() => setExchange(ex)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${exchange === ex ? 'bg-[#00D9A3] text-black font-medium' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden mb-6">
        {loading && cryptoMarkets.length === 0 ? (
          <div className="py-12 text-center">
            <div className="animate-spin mx-auto mb-3 w-6 h-6 border-2 border-white/10 border-t-[#00D9A3] rounded-full" />
            <div className="text-white/30 text-sm">Loading live prices from Kraken...</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-xs text-white/40">
                <th className="text-left p-3 w-8"></th>
                <th className="text-left p-3 font-medium">Symbol</th>
                <th className="text-right p-3 font-medium">Price</th>
                <th className="text-right p-3 font-medium">24h Change</th>
                <th className="text-right p-3 font-medium hidden md:table-cell">Volume</th>
                <th className="text-right p-3 font-medium hidden lg:table-cell">RSI</th>
                <th className="text-center p-3 font-medium hidden md:table-cell">24h Chart</th>
                <th className="text-right p-3 font-medium hidden lg:table-cell">Exchange</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.symbol} className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer group">
                  <td className="p-3">
                    <button onClick={e => { e.stopPropagation(); toggleFav(s.symbol); }}>
                      <Star size={14} className={favorites.includes(s.symbol) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20 group-hover:text-white/40'} />
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-bold text-sm">{s.symbol}</div>
                        <div className="text-xs text-white/30">{s.name}</div>
                      </div>
                      {s.live && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00D9A3]/10 text-[#00D9A3] font-bold">LIVE</span>}
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono font-bold">${fmt(s.price)}</td>
                  <td className="p-3 text-right">
                    <span className={`flex items-center justify-end gap-1 text-sm font-medium ${s.change >= 0 ? 'text-[#00D9A3]' : 'text-red-400'}`}>
                      {s.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-3 text-right text-white/40 text-sm hidden md:table-cell">{s.volume}</td>
                  <td className="p-3 text-right hidden lg:table-cell">
                    {s.rsi != null ? (
                      <span className={`text-sm font-mono ${s.rsi > 70 ? 'text-red-400' : s.rsi < 30 ? 'text-green-400' : 'text-white/50'}`}>{s.rsi}</span>
                    ) : <span className="text-white/20">—</span>}
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <div className="flex justify-center">
                      <Sparkline data={s.sparkline} color={s.change >= 0 ? '#00D9A3' : '#EF4444'} />
                    </div>
                  </td>
                  <td className="p-3 text-right hidden lg:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/40">{s.exchange}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Star size={14} className="text-yellow-400 fill-yellow-400" /> Watchlist
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {favorites.map(sym => {
              const s = allSymbols.find(x => x.symbol === sym);
              if (!s) return null;
              return (
                <div key={sym} className="card hover:bg-white/8 transition cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{s.symbol}</span>
                    <span className={`text-xs font-medium ${s.change >= 0 ? 'text-[#00D9A3]' : 'text-red-400'}`}>
                      {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="font-mono font-bold mb-1">${fmt(s.price)}</div>
                  <Sparkline data={s.sparkline} color={s.change >= 0 ? '#00D9A3' : '#EF4444'} />
                  <div className="text-xs text-white/30 mt-1">{s.exchange}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
