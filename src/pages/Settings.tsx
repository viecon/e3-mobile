import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as storage from '@/lib/storage';
import { getTheme, setTheme, themeLabel, type Theme } from '@/lib/theme';
import { clearAll as clearCache } from '@/lib/cache';

export function SettingsPage() {
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState<Theme>(getTheme());
  const [proxyUrl, setProxyUrl] = useState(storage.getProxyUrl() || '');
  const [proxyEditing, setProxyEditing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const fullname = storage.get('fullname') || '';
  const username = storage.get('username') || '';
  const userid = storage.getUserId();

  const themes: Theme[] = ['system', 'light', 'dark'];

  const handleTheme = (t: Theme) => {
    setTheme(t);
    setCurrentTheme(t);
  };

  const handleProxySave = () => {
    const url = proxyUrl.replace(/\/$/, '');
    storage.set('proxyUrl', url);
    setProxyUrl(url);
    setProxyEditing(false);
  };

  const handleClearCache = () => {
    clearCache();
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  const handleLogout = () => {
    storage.logout();
    clearCache();
    window.location.hash = '/';
    window.location.reload();
  };

  return (
    <div className="px-4 pt-2 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="text-e3-accent cursor-pointer">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold text-e3-text">設定</h1>
      </div>

      <div className="space-y-5">
        {/* Account */}
        <section>
          <h2 className="text-[13px] font-medium text-e3-muted uppercase tracking-wide mb-2 px-1">帳號</h2>
          <div className="bg-e3-card rounded-xl overflow-hidden divide-y divide-e3-separator">
            <div className="px-4 py-3">
              <p className="text-[13px] text-e3-muted">姓名</p>
              <p className="text-[15px] text-e3-text">{fullname}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[13px] text-e3-muted">學號</p>
              <p className="text-[15px] text-e3-text">{username || '-'}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[13px] text-e3-muted">User ID</p>
              <p className="text-[15px] text-e3-text">{userid || '-'}</p>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <h2 className="text-[13px] font-medium text-e3-muted uppercase tracking-wide mb-2 px-1">外觀</h2>
          <div className="bg-e3-card rounded-xl overflow-hidden">
            <div className="px-4 py-3">
              <p className="text-[13px] text-e3-muted mb-2">主題</p>
              <div className="flex gap-1 bg-e3-bg rounded-lg p-0.5">
                {themes.map(t => (
                  <button
                    key={t}
                    onClick={() => handleTheme(t)}
                    className={`flex-1 py-1.5 text-[13px] font-medium rounded-md cursor-pointer transition-colors ${
                      currentTheme === t ? 'bg-e3-card text-e3-text' : 'text-e3-muted'
                    }`}
                  >
                    {themeLabel[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Connection */}
        <section>
          <h2 className="text-[13px] font-medium text-e3-muted uppercase tracking-wide mb-2 px-1">連線</h2>
          <div className="bg-e3-card rounded-xl overflow-hidden">
            <div className="px-4 py-3">
              <p className="text-[13px] text-e3-muted mb-1">Proxy URL</p>
              {proxyEditing ? (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={proxyUrl}
                    onChange={e => setProxyUrl(e.target.value)}
                    className="flex-1 bg-e3-bg rounded-lg px-3 py-1.5 text-[15px] text-e3-text focus:outline-none"
                  />
                  <button
                    onClick={handleProxySave}
                    className="text-[13px] text-e3-accent font-medium cursor-pointer"
                  >
                    儲存
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-[15px] text-e3-text truncate flex-1 mr-2">{proxyUrl}</p>
                  <button
                    onClick={() => setProxyEditing(true)}
                    className="text-[13px] text-e3-accent font-medium cursor-pointer shrink-0"
                  >
                    編輯
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Data */}
        <section>
          <h2 className="text-[13px] font-medium text-e3-muted uppercase tracking-wide mb-2 px-1">資料</h2>
          <div className="bg-e3-card rounded-xl overflow-hidden divide-y divide-e3-separator">
            <button
              onClick={handleClearCache}
              className="w-full px-4 py-3 text-left cursor-pointer active:bg-e3-bg transition-colors"
            >
              <p className="text-[15px] text-e3-accent">
                {cleared ? '已清除' : '清除快取'}
              </p>
              <p className="text-[13px] text-e3-muted mt-0.5">清除離線快取資料，下次會重新載入</p>
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left cursor-pointer active:bg-e3-bg transition-colors"
            >
              <p className="text-[15px] text-e3-danger">登出</p>
              <p className="text-[13px] text-e3-muted mt-0.5">清除所有登入資料並返回登入頁</p>
            </button>
          </div>
        </section>

        {/* App info */}
        <p className="text-[11px] text-e3-muted text-center pt-2">
          E3 Mobile · NYCU E3 LMS PWA
        </p>
      </div>
    </div>
  );
}
