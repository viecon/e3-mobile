import { useState } from 'react';

import { login } from '@/api/moodle';

export function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [proxyUrl, setProxyUrl] = useState(localStorage.getItem('e3m_proxyUrl') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!proxyUrl || !username || !password) return;
    setLoading(true);
    setError('');
    try {
      await login(proxyUrl.replace(/\/$/, ''), username, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-e3-text">E3 Mobile</h1>
          <p className="text-sm text-e3-muted mt-2">NYCU E3 LMS</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-e3-muted mb-1.5">Proxy URL</label>
            <input
              type="url"
              placeholder="https://e3-proxy.xxx.workers.dev"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              className="w-full bg-e3-card border border-e3-border rounded-lg px-3 py-2.5 text-sm text-e3-text placeholder:text-e3-muted/50 focus:outline-none focus:border-e3-accent"
            />
            <p className="text-[10px] text-e3-muted mt-1">Cloudflare Worker proxy URL</p>
          </div>

          <div>
            <label className="block text-xs text-e3-muted mb-1.5">E3 帳號</label>
            <input
              type="text"
              placeholder="學號"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-e3-card border border-e3-border rounded-lg px-3 py-2.5 text-sm text-e3-text placeholder:text-e3-muted/50 focus:outline-none focus:border-e3-accent"
            />
          </div>

          <div>
            <label className="block text-xs text-e3-muted mb-1.5">E3 密碼</label>
            <input
              type="password"
              placeholder="密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-e3-card border border-e3-border rounded-lg px-3 py-2.5 text-sm text-e3-text placeholder:text-e3-muted/50 focus:outline-none focus:border-e3-accent"
            />
          </div>

          {error && (
            <p className="text-xs text-e3-danger bg-e3-danger/10 rounded-lg p-2.5">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !proxyUrl || !username || !password}
            className="w-full bg-e3-accent text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 active:bg-blue-700 transition-colors"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </div>

        <p className="text-[10px] text-e3-muted text-center leading-relaxed">
          需要先部署 Cloudflare Worker 作為 CORS proxy。
          密碼不會被儲存，只儲存登入後取得的 token。
        </p>
      </div>
    </div>
  );
}
