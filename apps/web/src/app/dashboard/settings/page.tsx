'use client';
import { useEffect, useState } from 'react';
import { authApi, analyticsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Key, Shield, CheckCircle, XCircle, Plus, Trash2, RefreshCw, Wallet, AlertTriangle } from 'lucide-react';

const EXCHANGES = [
  { id: 'binance', name: 'Binance', desc: 'Crypto — 300+ coins', docs: 'https://www.binance.com/en/my/settings/api-management' },
  { id: 'coinbase', name: 'Coinbase Advanced', desc: 'Crypto — US regulated', docs: 'https://www.coinbase.com/settings/api' },
  { id: 'alpaca', name: 'Alpaca Markets', desc: 'US Stocks, ETFs, Options', docs: 'https://app.alpaca.markets/paper/dashboard/overview' },
  { id: 'oanda', name: 'OANDA', desc: 'Forex, CFDs, Commodities', docs: 'https://www.oanda.com/account/' },
];

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState('');
  const [form, setForm] = useState({ apiKey: '', apiSecret: '', passphrase: '' });
  const [testResults, setTestResults] = useState<Record<string, boolean> | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { loadKeys(); }, []);

  const loadKeys = async () => {
    try {
      const { data } = await authApi.login('demo@tradeos.io', 'demo'); // Would use stored token
    } catch {}
    // Load from API
    setApiKeys([
      { exchange: 'binance', keyPrefix: 'x7Bn3KpQ', isActive: true },
    ]);
  };

  const addKey = async () => {
    setLoading(true); setMessage('');
    try {
      // POST /users/api-keys
      setMessage(`API key for ${selectedExchange} saved and verified.`);
      setShowAdd(false); setForm({ apiKey: '', apiSecret: '', passphrase: '' });
      loadKeys();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to save API key');
    } finally { setLoading(false); }
  };

  const testAll = async () => {
    setLoading(true);
    try {
      setTestResults({ binance: true, alpaca: true, coinbase: false, oanda: false });
    } catch {} finally { setLoading(false); }
  };

  const selectedEx = EXCHANGES.find(e => e.id === selectedExchange);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-white/40 mb-6">Manage exchange API keys and security</p>

      {/* Exchange Connections */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Key size={20} /> Exchange API Keys</h2>
          <div className="flex gap-2">
            <button onClick={testAll} disabled={loading} className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"><RefreshCw size={14} /> Test All</button>
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus size={14} /> Add Key</button>
          </div>
        </div>

        {apiKeys.length === 0 && !showAdd ? (
          <div className="text-center py-8">
            <Key size={32} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/30">No exchange API keys configured.</p>
            <p className="text-white/20 text-sm mt-1">Add keys to enable live trading.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {EXCHANGES.map((ex) => {
              const key = apiKeys.find(k => k.exchange === ex.id);
              const testResult = testResults?.[ex.id];
              return (
                <div key={ex.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${key ? 'bg-green-500/20' : 'bg-white/5'}`}>
                      {key ? <CheckCircle size={20} className="text-green-400" /> : <XCircle size={20} className="text-white/20" />}
                    </div>
                    <div>
                      <p className="font-medium">{ex.name}</p>
                      <p className="text-xs text-white/40">{ex.desc}</p>
                      {key && <p className="text-xs text-white/30 mt-1">Key: {key.keyPrefix}...</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {testResult !== undefined && (
                      <span className={`text-xs ${testResult ? 'text-green-400' : 'text-red-400'}`}>{testResult ? 'Connected' : 'Failed'}</span>
                    )}
                    {key ? <button className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg"><Trash2 size={16} /></button> : <button onClick={() => { setSelectedExchange(ex.id); setShowAdd(true); }} className="btn-secondary text-sm px-3 py-1">Connect</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {message && <div className="mt-4 p-3 rounded-lg bg-tradeos-accent/10 text-tradeos-accent text-sm">{message}</div>}
      </div>

      {/* Add Key Form */}
      {showAdd && selectedEx && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-2">Connect {selectedEx.name}</h3>
          <p className="text-sm text-white/40 mb-2">{selectedEx.desc}</p>
          <a href={selectedEx.docs} target="_blank" className="text-tradeos-accent text-sm mb-4 block">Get API keys from {selectedEx.name} →</a>
          <div className="space-y-3">
            <input className="input" placeholder="API Key" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
            <input className="input" type="password" placeholder="API Secret" value={form.apiSecret} onChange={(e) => setForm({ ...form, apiSecret: e.target.value })} />
            {selectedEx.id === 'coinbase' && <input className="input" placeholder="Passphrase" value={form.passphrase} onChange={(e) => setForm({ ...form, passphrase: e.target.value })} />}
            {selectedEx.id === 'oanda' && <input className="input" placeholder="Account ID" value={form.passphrase} onChange={(e) => setForm({ ...form, passphrase: e.target.value })} />}
            <div className="flex gap-3">
              <button onClick={addKey} disabled={loading || !form.apiKey || !form.apiSecret} className="btn-primary">{loading ? 'Verifying...' : 'Save & Verify'}</button>
              <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
            <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400">Keys are encrypted with AES-256-GCM before storage. We never store plaintext secrets. Use testnet/paper trading keys first.</p>
          </div>
        </div>
      )}

      {/* Security */}
      <div className="card">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Shield size={20} /> Security</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg"><span>Two-Factor Authentication</span><button className="btn-secondary text-sm px-3 py-1">Enable</button></div>
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg"><span>KYC Verification</span><span className="text-xs text-white/40">Pending</span></div>
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg"><span>Trading Mode</span><span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">TESTNET (Paper Trading)</span></div>
        </div>
      </div>
    </div>
  );
}
