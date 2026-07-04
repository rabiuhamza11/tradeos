'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message { role: 'user' | 'ai'; content: string; timestamp: number; }

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hi! I'm your TradeOS AI assistant. I can analyze markets, suggest trades, manage risk, and help with strategy. What would you like to do?", timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI response (would call backend in production)
    setTimeout(() => {
      const responses: Record<string, string> = {
        btc: "BTC is currently trading at $65,432, up 3.6% in the last 24h. The RSI is at 68 (approaching overbought). Support at $63,500, resistance at $67,200. I'd suggest waiting for a pullback to $64,000-64,500 before entering a long position. Risk: 2% of portfolio max.",
        eth: "ETH at $3,521, up 2.1% today. ETH/BTC ratio strengthening. Support at $3,400, resistance at $3,600. Gas fees are low which is bullish for DeFi activity. Consider a long with stop at $3,380.",
        risk: "Your current portfolio risk analysis:\n1. Total exposure: 78% of capital\n2. Largest position: BTC (42%)\n3. Correlation risk: HIGH (crypto-heavy)\n4. Recommendation: Reduce BTC to 30%, add a non-crypto position for diversification",
        strategy: "Based on current market conditions, here are 3 active strategies:\n1. Trend Following (BTC, ETH) — ride the momentum with trailing stops\n2. Mean Reversion (Forex pairs) — fade extreme moves on EUR/USD\n3. Breakout (SOL, AVAX) — buy on volume confirmation above key levels",
        portfolio: "Portfolio snapshot: Total value $67,850, P&L +$17,850 (+35.7%). Your crypto allocation is high at 85%. Consider rebalancing to 70% crypto, 20% stocks, 10% forex for better risk distribution.",
      };

      const lower = userMsg.content.toLowerCase();
      let response = "I can help with market analysis, trade suggestions, risk management, and portfolio strategy. Try asking about BTC, ETH, your portfolio risk, or trading strategies.";

      for (const [key, val] of Object.entries(responses)) {
        if (lower.includes(key)) { response = val; break; }
      }

      if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        response = "Hey! Ready to trade smart. I can analyze any market, suggest entries/exits, calculate position sizes, and manage your risk. What are we looking at today?";
      }

      setMessages((prev) => [...prev, { role: 'ai', content: response, timestamp: Date.now() }]);
      setLoading(false);
    }, 1200);
  };

  const quickActions = [
    'Analyze BTC',
    'Check portfolio risk',
    'Suggest a strategy',
    'ETH analysis',
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Sparkles size={24} className="text-tradeos-accent" /> AI Trading Assistant
          </h1>
          <p className="text-white/40">Market analysis, trade suggestions, and risk management</p>
        </div>
      </div>

      <div className="card flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Messages */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-tradeos-accent text-black' : 'bg-purple-500 text-white'
              }`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`max-w-[70%] rounded-xl p-3 ${
                msg.role === 'user' ? 'bg-tradeos-accent/20 text-white' : 'bg-white/5 text-white/90'
              }`}>
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center"><Bot size={18} /></div>
              <div className="bg-white/5 rounded-xl p-3 flex gap-1">
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2 flex gap-2 flex-wrap border-t border-white/5">
          {quickActions.map((q) => (
            <button key={q} onClick={() => setInput(q)} className="px-3 py-1.5 rounded-full text-xs bg-white/5 text-white/60 hover:bg-white/10">
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 flex gap-2">
          <input
            className="input flex-1"
            placeholder="Ask about any market, strategy, or risk..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button onClick={send} className="btn-primary px-4 py-2">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
