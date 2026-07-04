'use client';
import { useEffect, useRef, useState } from 'react';

interface Candle { timestamp: number; open: number; high: number; low: number; close: number; volume: number; }

interface LiveChartProps {
  symbol: string;
  interval?: string;
  height?: number;
}

export default function LiveChart({ symbol, interval = '1h', height = 400 }: LiveChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [livePrice, setLivePrice] = useState<number>(0);
  const [prevPrice, setPrevPrice] = useState<number>(0);
  const wsRef = useRef<any>(null);

  // Load initial candles from REST API
  useEffect(() => {
    async function loadCandles() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
        const res = await fetch(`${API}/markets/${symbol}/candles?interval=${interval}&limit=100`);
        const data = await res.json();
        if (data.candles) setCandles(data.candles);
      } catch {
        // Fallback: generate sample candles
        const sample: Candle[] = [];
        let prev = 65000;
        for (let i = 99; i >= 0; i--) {
          const open = prev;
          const vol = (Math.random() - 0.5) * 0.008;
          const close = open * (1 + vol);
          const high = Math.max(open, close) * (1 + Math.random() * 0.004);
          const low = Math.min(open, close) * (1 - Math.random() * 0.004);
          sample.push({ timestamp: Date.now() - i * 3600000, open, high, low, close, volume: Math.floor(Math.random() * 1000000) });
          prev = close;
        }
        setCandles(sample);
        setLivePrice(sample[sample.length - 1].close);
      }
    }
    loadCandles();
  }, [symbol, interval]);

  // WebSocket for live updates
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
            setPrevPrice(livePrice);
            setLivePrice(msg.data.price);

            // Update last candle
            setCandles((prev) => {
              if (prev.length === 0) return prev;
              const updated = [...prev];
              const last = { ...updated[updated.length - 1] };
              last.close = msg.data.price;
              last.high = Math.max(last.high, msg.data.price);
              last.low = Math.min(last.low, msg.data.price);
              updated[updated.length - 1] = last;
              return updated;
            });
          }
        } catch {}
      };

      ws.onclose = () => {};
      ws.onerror = () => {};
    } catch {}

    return () => { try { wsRef.current?.close(); } catch {} };
  }, [symbol]);

  // Render candlestick chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = height;
    const padding = { top: 20, right: 70, bottom: 40, left: 10 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Clear
    ctx.fillStyle = '#0A0E17';
    ctx.fillRect(0, 0, w, h);

    // Calculate price range
    const allPrices = candles.flatMap(c => [c.high, c.low]);
    if (livePrice > 0) allPrices.push(livePrice);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const range = maxPrice - minPrice || 1;
    const padded = range * 0.1;
    const min = minPrice - padded;
    const max = maxPrice + padded;
    const priceRange = max - min;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    const gridLines = 6;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();

      // Price labels
      const price = max - (priceRange / gridLines) * i;
      ctx.fillText(price.toFixed(2), padding.left + chartW + 5, y + 3);
    }

    // Candles
    const candleW = chartW / candles.length;
    const bodyW = Math.max(candleW * 0.6, 2);

    candles.forEach((candle, i) => {
      const x = padding.left + i * candleW + candleW / 2;
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#00D9A3' : '#FF4757';

      // Wick
      const highY = padding.top + ((max - candle.high) / priceRange) * chartH;
      const lowY = padding.top + ((max - candle.low) / priceRange) * chartH;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const openY = padding.top + ((max - candle.open) / priceRange) * chartH;
      const closeY = padding.top + ((max - candle.close) / priceRange) * chartH;
      const bodyTop = Math.min(openY, closeY);
      const bodyH = Math.max(Math.abs(closeY - openY), 1);

      ctx.fillStyle = color;
      ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyH);
    });

    // Live price line
    if (livePrice > 0) {
      const priceY = padding.top + ((max - livePrice) / priceRange) * chartH;
      ctx.strokeStyle = livePrice >= prevPrice ? '#00D9A3' : '#FF4757';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, priceY);
      ctx.lineTo(padding.left + chartW, priceY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price label
      ctx.fillStyle = livePrice >= prevPrice ? '#00D9A3' : '#FF4757';
      ctx.fillRect(padding.left + chartW, priceY - 9, 65, 18);
      ctx.fillStyle = '#0A0E17';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(livePrice.toFixed(2), padding.left + chartW + 4, priceY + 3);
    }

    // Volume bars at bottom
    const volMax = Math.max(...candles.map(c => c.volume));
    const volH = 30;
    candles.forEach((candle, i) => {
      const x = padding.left + i * candleW + candleW / 2;
      const isGreen = candle.close >= candle.open;
      const barH = (candle.volume / volMax) * volH;
      ctx.fillStyle = isGreen ? 'rgba(0,217,163,0.3)' : 'rgba(255,71,87,0.3)';
      ctx.fillRect(x - bodyW / 2, h - padding.bottom + 5, bodyW, barH);
    });
  }, [candles, livePrice, prevPrice, height]);

  const priceChange = livePrice && candles.length > 0
    ? ((livePrice - candles[0].open) / candles[0].open) * 100
    : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{symbol}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-2xl font-bold font-mono ${livePrice >= prevPrice ? 'text-green-400' : 'text-red-400'}`}>
              ${livePrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
            <button
              key={tf}
              className={`px-3 py-1 rounded text-sm font-medium ${interval === tf ? 'bg-tradeos-accent text-black' : 'text-white/40 hover:bg-white/5'}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height }} />
    </div>
  );
}
