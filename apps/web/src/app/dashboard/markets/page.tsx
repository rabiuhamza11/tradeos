'use client';
import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Star } from 'lucide-react';

const EXCHANGES = ['All', 'Binance', 'Coinbase', 'Alpaca', 'OANDA'];

const ALL_SYMBOLS = [
  { symbol: 'BTC', name: 'Bitcoin', price: 65432, change: 3.6, volume: '28.4B', exchange: 'Binance', sparkline: [63200, 63800, 64100, 64500, 65200, 65432] },
  { symbol: 'ETH', name: 'Ethereum', price: 3521, change: 2.1, volume: '14.2B', exchange: 'Binance', sparkline: [3420, 3460, 3480, 3510, 3500, 3521] },
  { symbol: 'SOL', name: 'Solana', price: 142, change: 8.4, volume: '3.1B', exchange: 'Binance', sparkline: [128, 132, 135, 138, 140, 142] },
  { symbol: 'BNB', name: 'BNB', price: 598, change: 1.2, volume: '1.8B', exchange: 'Binance', sparkline: [590, 592, 595, 594, 597, 598] },
  { symbol: 'XRP', name: 'Ripple', price: 0.52, change: -1.8, volume: '2.4B', exchange: 'Binance', sparkline: [0.54, 0.53, 0.53, 0.52, 0.52, 0.52] },
  { symbol: 'ADA', name: 'Cardano', price: 0.45, change: 3.1, volume: '890M', exchange: 'Binance', sparkline: [0.43, 0.44, 0.44, 0.45, 0.45, 0.45] },
  { symbol: 'AVAX', name: 'Avalanche', price: 28.5, change: 5.2, volume: '670M', exchange: 'Coinbase', sparkline: [26.8, 27.2, 27.8, 28.1, 28.4, 28.5] },
  { symbol: 'DOT', name: 'Polkadot', price: 6.2, change: -0.8, volume: '420M', exchange: 'Binance', sparkline: [6.3, 6.25, 6.22, 6.2, 6.21, 6.2] },
  { symbol: 'AAPL', name: 'Apple Inc', price: 214, change: 1.2, volume: '52M', exchange: 'Alpaca', sparkline: [210, 211, 212, 213, 214, 214] },
  { symbol: 'TSLA', name: 'Tesla', price: 248, change: -2.1, volume: '88M', exchange: 'Alpaca', sparkline: [255, 253, 251, 250, 249, 248] },
  { symbol: 'NVDA', name: 'NVIDIA', price: 128, change: 4.8, volume: '320M', exchange: 'Alpaca', sparkline: [120, 122, 125, 126, 127, 128] },
  { symbol: 'EURUSD', name: 'Euro / USD', price: 1.0842, change: 0.3, volume: 'N/A', exchange: 'OANDA', sparkline: [1.082, 1.083, 1.0835, 1.084, 1.0841, 1.0842] },
  { symbol: 'XAU', name: 'Gold', price: 2387, change: 0.8, volume: 'N/A', exchange: 'OANDA', sparkline: [2370, 2375, 2380, 2383, 2385, 2387] },
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 80},${20 - ((v - min) / range) * 18}`).join(' ');
  return (
    <svg width="80" height="20" viewBox="0 0 80 20">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export default function MarketsPage() {
  const [exchange, setExchange] = useState('All');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['BTC', 'ETH']);

  const filtered = ALL_SYMBOLS.filter((s) => {
    if (exchange !== 'All' && s.exchange !== exchange) return false;
    if (search && !s.symbol.toLowerCase().includes(search.toLowerCase()) && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleFav = (symbol: string) => {
    setFavorites((prev) => prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Markets</h1>
          <p className="text-white/40">Live prices across 5 exchanges</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-white/40">Market Cap</div>
          <div className="text-xl font-bold">$2.34T</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input className="input pl-10" placeholder="Search symbols..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {EXCHANGES.map((ex) => (
            <button key={ex} onClick={() => setExchange(ex)}
              className={`px-3 py-2 rounded-lg text-sm transition ${exchange === ex ? 'bg-[#00D9A3] text-black font-medium' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Symbols Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 text-xs text-white/40">
              <th className="text-left p-3 font-medium"></th>
              <th className="text-left p-3 font-medium">Symbol</th>
              <th className="text-right p-3 font-medium">Price</th>
              <th className="text-right p-3 font-medium">24h Change</th>
              <th className="text-right p-3 font-medium hidden md:table-cell">Volume</th>
              <th className="text-center p-3 font-medium hidden md:table-cell">Last 6h</th>
              <th className="text-right p-3 font-medium hidden lg:table-cell">Exchange</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.symbol} className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer">
                <td className="p-3">
                  <button onClick={(e) => { e.stopPropagation(); toggleFav(s.symbol); }}>
                    <Star size={16} className={favorites.includes(s.symbol) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />
                  </button>
                </td>
                <td className="p-3">
                  <div className="font-bold">{s.symbol}</div>
                  <div className="text-xs text-white/30">{s.name}</div>
                </td>
                <td className="p-3 text-right font-mono font-medium">
                  ${s.price < 1 ? s.price.toFixed(4) : s.price.toLocaleString()}
                </td>
                <td className="p-3 text-right">
                  <span className={`flex items-center justify-end gap-1 ${s.change >= 0 ? 'text-[#00D9A3]' : 'text-red-400'}`}>
                    {s.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {s.change >= 0 ? '+' : ''}{s.change}%
                  </span>
                </td>
                <td className="p-3 text-right text-white/40 text-sm hidden md:table-cell">{s.volume}</td>
                <td className="p-3 hidden md:table-cell">
                  <div className="flex justify-center">
                    <Sparkline data={s.sparkline} color={s.change >= 0 ? '#00D9A3' : '#FF4757'} />
                  </div>
                </td>
                <td className="p-3 text-right hidden lg:table-cell">
                  <span className="text-xs px-2 py-1 rounded bg-white/5 text-white/40">{s.exchange}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Star size={16} className="text-yellow-400" /> Favorites</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {favorites.map((sym) => {
              const s = ALL_SYMBOLS.find((x) => x.symbol === sym);
              if (!s) return null;
              return (
                <div key={s.symbol} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">{s.symbol}</span>
                    <span className={s.change >= 0 ? 'text-[#00D9A3] text-sm' : 'text-red-400 text-sm'}>
                      {s.change >= 0 ? '+' : ''}{s.change}%
                    </span>
                  </div>
                  <div className="text-xl font-mono">${s.price.toLocaleString()}</div>
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
