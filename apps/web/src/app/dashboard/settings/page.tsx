'use client';
import { useState } from 'react';
import { Shield, Key, Plus, Trash2, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ApiKeyEntry {
  id: string;
  exchange: string;
  label: string;
  hasKey: boolean;
  status: 'active' | 'inactive';
  permissions: string[];
}

export default function SettingsPage() {
  const [testnet, setTestnet] = useState(true);
  const [keys, setKeys] = useState<ApiKeyEntry[]>([
    { id: '1', exchange: 'Binance Spot', label: 'Main Binance', hasKey: true, status: 'active', permissions: ['Read', 'Trade', 'Withdraw'] },
    { id: '2', exchange: 'Binance Futures', label: 'Futures Trading', hasKey: true, status: 'active', permissions: ['Read', 'Trade'] },
    { id: '3', exchange: 'Coinbase', label: 'Coinbase Advanced', hasKey: false, status: 'inactive', permissions: [] },
    { id: '4', exchange: 'Alpaca', label: 'Stock Trading', hasKey: false, status: 'inactive', permissions: [] },
    { id: '5', exchange: 'OANDA', label: 'Forex Trading', hasKey: false, status: 'inactive', permissions: [] },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState({ exchange: 'Binance Spot', apiKey: '', apiSecret: '', passphrase: '' });
  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved] = useState(false);

  const addKey = () => {
    if (!newKey.apiKey || !newKey.apiSecret) return;
    setKeys((prev) => prev.map((k) =>
      k.exchange === newKey.exchange
        ? { ...k, hasKey: true, status: 'active', label: `${newKey.exchange} Key` }
        : k
    ));
    setShowAdd(false);
    setNewKey({ exchange: 'Binance Spot', apiKey: '', apiSecret: '', passphrase: '' });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const removeKey = (id: string) => {
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, hasKey: false, status: 'inactive', permissions: [] } : k));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-white/40 mb-6">Manage API keys, trading environment, and security</p>

      {/* Trading Environment */}
      <div className="card mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield size={18} /> Trading Environment</h3>
        <div className="flex gap-4">
          <button onClick={() => setTestnet(true)}
            className={`flex-1 p-4 rounded-lg border-2 transition ${testnet ? 'border-green-500 bg-green-500/10' : 'border-white/10'}`}>
            <div className="font-semibold mb-1">📄 Paper Trading</div>
            <div className="text-sm text-white/40">Test strategies with simulated money. No real funds at risk.</div>
            {testnet && <div className="text-xs text-green-400 mt-2 flex items-center gap-1"><Check size={14} /> Active</div>}
          </button>
          <button onClick={() => setTestnet(false)}
            className={`flex-1 p-4 rounded-lg border-2 transition ${!testnet ? 'border-red-500 bg-red-500/10' : 'border-white/10'}`}>
            <div className="font-semibold mb-1">🔴 Live Trading</div>
            <div className="text-sm text-white/40">Real money. Real exchanges. Real risk.</div>
            {!testnet && <div className="text-xs text-red-400 mt-2 flex items-center gap-1"><AlertCircle size={14} /> Live — Trade with caution</div>}
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><Key size={18} /> Exchange API Keys</h3>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Key
          </button>
        </div>

        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{k.exchange}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    k.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/30'
                  }`}>{k.status}</span>
                </div>
                <div className="text-xs text-white/40">
                  {k.hasKey ? `Key: ${k.label} · ${k.permissions.join(', ')}` : 'No API key configured'}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {k.hasKey ? (
                  <button onClick={() => removeKey(k.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <button onClick={() => { setNewKey({ ...newKey, exchange: k.exchange }); setShowAdd(true); }}
                    className="text-tradeos-accent text-sm">Connect</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Settings */}
      <div className="card mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield size={18} /> Security</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div><div className="font-medium">Two-Factor Authentication</div><div className="text-xs text-white/40">Extra security for your account</div></div>
            <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">Enabled</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div><div className="font-medium">IP Whitelist</div><div className="text-xs text-white/40">Restrict API access to specific IPs</div></div>
            <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/30">Not configured</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div><div className="font-medium">Withdrawal Whitelist</div><div className="text-xs text-white/40">Only allow withdrawals to trusted addresses</div></div>
            <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/30">Not configured</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card mb-6">
        <h3 className="font-semibold mb-4">Notifications</h3>
        <div className="space-y-3">
          {['Trade Executions', 'Order Fills', 'Price Alerts', 'Daily P&L Summary', 'Risk Warnings'].map((n) => (
            <label key={n} className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer">
              <span className="text-sm">{n}</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </label>
          ))}
        </div>
      </div>

      {saved && <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Check size={18} /> Settings saved</div>}

      {/* Add Key Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-tradeos-dark-2 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Add API Key — {newKey.exchange}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Exchange</label>
                <select className="input" value={newKey.exchange} onChange={(e) => setNewKey({ ...newKey, exchange: e.target.value })}>
                  <option>Binance Spot</option><option>Binance Futures</option><option>Coinbase</option><option>Alpaca</option><option>OANDA</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">API Key</label>
                <input className="input" placeholder="Your API key" value={newKey.apiKey} onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">API Secret</label>
                <div className="relative">
                  <input className="input pr-10" type={showSecret ? 'text' : 'password'} placeholder="Your API secret" value={newKey.apiSecret} onChange={(e) => setNewKey({ ...newKey, apiSecret: e.target.value })} />
                  <button onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                    {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {(newKey.exchange === 'Coinbase') && (
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Passphrase (Coinbase only)</label>
                  <input className="input" placeholder="Passphrase" value={newKey.passphrase} onChange={(e) => setNewKey({ ...newKey, passphrase: e.target.value })} />
                </div>
              )}
              <div className="p-3 bg-amber-500/10 rounded-lg text-xs text-amber-400 flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>Keys are encrypted at rest and never sent to the frontend. We recommend restricting API key permissions to Read + Trade only.</span>
              </div>
              <button onClick={addKey} className="btn-primary w-full">Save API Key</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
