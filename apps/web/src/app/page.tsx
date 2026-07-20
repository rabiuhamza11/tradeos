'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState('');
  const [twoFactor, setTwoFactor] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useStore((s) => s.setAuth);
  const restoreSession = useStore((s) => s.restoreSession);
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  // Check if redirected due to session expiry
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session_expired') {
      setSessionMessage('Your session expired due to inactivity. Please log in again.');
    }

    restoreSession();
    if (isAuthenticated) router.push('/dashboard');
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const { data } = mode === 'login'
        ? await authApi.login(email, password, twoFactor || undefined)
        : await authApi.register({ email, password, firstName: name.split(' ')[0], lastName: name.split(' ')[1] || '' });

      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-tradeos-accent">TradeOS</h1>
          <p className="text-white/40 mt-2">AI-Powered Trading Platform</p>
        </div>

        {sessionMessage && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm text-center">
            {sessionMessage}
          </div>
        )}

        <div className="card">
          <div className="flex gap-2 mb-6">
            <button onClick={() => setMode('login')} className={`flex-1 py-2 rounded-lg font-medium ${mode === 'login' ? 'bg-tradeos-accent text-black' : 'text-white/40'}`}>Login</button>
            <button onClick={() => setMode('register')} className={`flex-1 py-2 rounded-lg font-medium ${mode === 'register' ? 'bg-tradeos-accent text-black' : 'text-white/40'}`}>Register</button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />}
            <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            {mode === 'login' && <input className="input" placeholder="2FA code (if enabled)" value={twoFactor} onChange={(e) => setTwoFactor(e.target.value)} />}
            {error && <p className="text-tradeos-danger text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}</button>
          </form>
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-white/30 text-xs text-center mb-4">Or continue with</p>
            <div className="flex gap-3"><button className="btn-secondary flex-1 text-sm">Google</button><button className="btn-secondary flex-1 text-sm">GitHub</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
