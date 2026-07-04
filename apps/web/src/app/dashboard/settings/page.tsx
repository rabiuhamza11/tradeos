'use client';
import { useState } from 'react';
import { Settings, Key, Shield, Bell, Plus, Trash2, Check, AlertTriangle, Eye, EyeOff, Server, Smartphone } from 'lucide-react';

const EXCHANGES = [
  { name: 'Binance', assetType: 'Crypto', connected: true, testnet: true, fields: ['API Key', 'API Secret'] },
  { name: 'Binance Futures', assetType: 'Crypto Futures', connected: true, testnet: true, fields: ['API Key', 'API Secret'] },
  { name: 'Coinbase', assetType: 'Crypto', connected: true, testnet: true, fields: ['API Key', 'API Secret', 'Passphrase'] },
  { name: 'Alpaca', assetType: 'US Stocks', connected: false, testnet: true, fields: ['API Key', 'API Secret'] },
  { name: 'OANDA', assetType: 'Forex/CFD', connected: false, testnet: true, fields: ['API Key', 'Account ID'] },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<'exchanges' | 'security' | 'notifications' | 'trading'>('exchanges');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [addingExchange, setAddingExchange] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const tabs = [
    { id: 'exchanges', label: 'Exchange API Keys', icon: Key },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'trading', label: 'Trading Preferences', icon: Settings },
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-white/40 mb-6">Manage exchanges, security, and preferences</p>

      <div className="flex gap-1 mb-6 border-b border-white/5 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                tab === t.id ? 'border-[#00D9A3] text-white' : 'border-transparent text-white/40 hover:text-white/60'
              }`}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Exchange API Keys */}
      {tab === 'exchanges' && (
        <div className="max-w-3xl space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Key size={18} /> Connected Exchanges</h3>
            <div className="space-y-3">
              {EXCHANGES.filter(e => e.connected).map((ex) => (
                <div key={ex.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#00D9A3]/20 flex items-center justify-center">
                      <Server size={18} className="text-[#00D9A3]" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{ex.name}</div>
                      <div className="text-xs text-white/40">{ex.assetType} · {ex.testnet ? 'Testnet' : 'Live'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                      <Check size={12} /> Connected
                    </span>
                    <button className="text-white/30 hover:text-red-400"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available Exchanges */}
          <div className="card">
            <h3 className="font-semibold mb-4">Available Exchanges</h3>
            <div className="space-y-3">
              {EXCHANGES.filter(e => !e.connected).map((ex) => (
                <div key={ex.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Server size={18} className="text-white/30" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{ex.name}</div>
                      <div className="text-xs text-white/40">{ex.assetType}</div>
                    </div>
                  </div>
                  <button onClick={() => setAddingExchange(ex.name)} className="text-[#00D9A3] text-sm hover:underline flex items-center gap-1">
                    <Plus size={14} /> Connect
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Exchange Modal */}
          {addingExchange && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setAddingExchange(null)}>
              <div className="card max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold mb-4">Connect {addingExchange}</h3>
                <div className="space-y-4">
                  {EXCHANGES.find(e => e.name === addingExchange)?.fields.map((field) => (
                    <div key={field}>
                      <label className="text-xs text-white/40 mb-1.5 block">{field}</label>
                      <input type={showKeys[field] ? 'text' : 'password'} className="input font-mono pr-10" placeholder={`Enter ${field}`} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Environment</label>
                    <select className="input" defaultValue="testnet">
                      <option value="testnet">Testnet (Paper Trading)</option>
                      <option value="live">Live (Real Money)</option>
                    </select>
                  </div>
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                    <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/60">API keys are encrypted with AES-256-GCM and stored securely. Never share your keys.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setAddingExchange(null)} className="flex-1 py-2.5 rounded-lg bg-white/5 text-white/60">Cancel</button>
                    <button onClick={() => { setAddingExchange(null); save(); }} className="flex-1 py-2.5 rounded-lg bg-[#00D9A3] text-black font-bold">Connect</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security */}
      {tab === 'security' && (
        <div className="max-w-2xl space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield size={18} /> Security</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Two-Factor Authentication</div>
                  <div className="text-xs text-white/40 mt-0.5">Google Authenticator</div>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                  <Check size={12} /> Enabled
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Change Password</div>
                  <div className="text-xs text-white/40 mt-0.5">Last changed 45 days ago</div>
                </div>
                <button className="text-[#00D9A3] text-sm hover:underline">Change</button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Active Sessions</div>
                  <div className="text-xs text-white/40 mt-0.5">3 devices · Lagos, NG</div>
                </div>
                <button className="text-red-400 text-sm hover:underline">Revoke All</button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="font-medium text-sm">IP Whitelist</div>
                  <div className="text-xs text-white/40 mt-0.5">105.112.x.x (Lagos)</div>
                </div>
                <button className="text-[#00D9A3] text-sm hover:underline">Manage</button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="font-medium text-sm">API Key Encryption</div>
                  <div className="text-xs text-white/40 mt-0.5">AES-256-GCM with PBKDF2</div>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">Active</span>
              </div>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={18} className="text-red-400" />
                  <span className="font-medium text-red-400 text-sm">Danger Zone</span>
                </div>
                <p className="text-xs text-white/40 mb-3">Delete account and all trading data. Cannot be undone.</p>
                <button className="text-red-400 text-sm border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/10">Delete Account</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {tab === 'notifications' && (
        <div className="max-w-2xl space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Bell size={18} /> Notification Preferences</h3>
            <div className="space-y-3">
              {[
                { label: 'Trade Executed', desc: 'When an order is filled', email: true, push: true },
                { label: 'Price Alert Triggered', desc: 'When a price alert fires', email: false, push: true },
                { label: 'Risk Warning', desc: 'When risk thresholds are breached', email: true, push: true },
                { label: 'Agent Started/Stopped', desc: 'AI agent status changes', email: false, push: true },
                { label: 'Daily Summary', desc: 'Daily P&L and trade summary', email: true, push: false },
                { label: 'Security Alerts', desc: 'Login from new device, 2FA changes', email: true, push: true },
              ].map((n, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{n.label}</div>
                    <div className="text-xs text-white/40">{n.desc}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-white/40">
                      <input type="checkbox" defaultChecked={n.email} className="rounded" /> Email
                    </label>
                    <label className="flex items-center gap-2 text-xs text-white/40">
                      <input type="checkbox" defaultChecked={n.push} className="rounded" /> Push
                    </label>
                  </div>
                </div>
              ))}
              <button onClick={save} className="btn-primary flex items-center gap-2 mt-4">
                {saved ? <><Check size={16} /> Saved!</> : <>Save Preferences</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trading Preferences */}
      {tab === 'trading' && (
        <div className="max-w-2xl space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Settings size={18} /> Trading Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Default Exchange</label>
                <select className="input" defaultValue="Binance">
                  <option>Binance</option><option>Coinbase</option><option>Alpaca</option><option>OANDA</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Default Order Type</label>
                <select className="input" defaultValue="MARKET">
                  <option>MARKET</option><option>LIMIT</option><option>STOP</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Default Time-in-Force</label>
                <select className="input" defaultValue="GTC">
                  <option>GTC</option><option>IOC</option><option>FOK</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Max Position Size ($)</label>
                  <input type="number" className="input" defaultValue={50000} />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Max Daily Loss ($)</label>
                  <input type="number" className="input" defaultValue={5000} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Max Open Positions</label>
                  <input type="number" className="input" defaultValue={20} />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Max Portfolio Exposure (%)</label>
                  <input type="number" className="input" defaultValue={80} />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Trading Mode</div>
                  <div className="text-xs text-white/40 mt-0.5">Paper or Live trading</div>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">Paper (Active)</span>
                  <button className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/40 hover:text-white">Switch to Live</button>
                </div>
              </div>
              <button onClick={save} className="btn-primary flex items-center gap-2">
                {saved ? <><Check size={16} /> Saved!</> : <>Save Preferences</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
