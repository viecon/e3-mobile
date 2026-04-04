import { useState } from 'react';

import { login } from '@/api/moodle';
import * as storage from '@/lib/storage';

export function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [proxyUrl, setProxyUrl] = useState(storage.getProxyUrl() || '');
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

  const inputClass = 'w-full bg-e3-card rounded-lg px-3 py-2.5 text-[15px] text-e3-text placeholder:text-e3-muted focus:outline-none focus:ring-2 focus:ring-e3-accent/30';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-e3-bg">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-[28px] font-bold text-e3-text">E3 Mobile</h1>
          <p className="text-[15px] text-e3-muted mt-1">NYCU E3 LMS</p>
        </div>

        <div className="bg-e3-card rounded-xl overflow-hidden">
          <div className="divide-y divide-e3-separator">
            <div className="px-4 py-2">
              <label className="block text-[11px] text-e3-muted mb-0.5">Proxy URL</label>
              <input
                type="url"
                placeholder="https://e3-proxy.xxx.workers.dev"
                value={proxyUrl}
                onChange={(e) => setProxyUrl(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="px-4 py-2">
              <label className="block text-[11px] text-e3-muted mb-0.5">E3 帳號</label>
              <input
                type="text"
                placeholder="學號"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="px-4 py-2">
              <label className="block text-[11px] text-e3-muted mb-0.5">E3 密碼</label>
              <input
                type="password"
                placeholder="密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-[13px] text-e3-danger bg-e3-danger/10 rounded-lg px-3 py-2.5">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || !proxyUrl || !username || !password}
          className="w-full bg-e3-accent text-white rounded-xl py-3 text-[17px] font-semibold disabled:opacity-40 active:opacity-80 transition-opacity cursor-pointer"
        >
          {loading ? '登入中...' : '登入'}
        </button>

        <p className="text-[11px] text-e3-muted text-center leading-relaxed">
          需要先部署 Cloudflare Worker 作為 CORS proxy。<br />
          帳號密碼儲存於本機，用於 token 過期時自動重新登入。
        </p>
      </div>
    </div>
  );
}
