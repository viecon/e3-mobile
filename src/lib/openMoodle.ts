import * as storage from '@/lib/storage';

export function openMoodle(url: string) {
  const username = storage.get('username');
  const password = storage.get('password');

  // Extract Moodle site origin from the target URL
  let siteOrigin: string;
  try {
    siteOrigin = new URL(url).origin;
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  if (!username || !password) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // Open blank window synchronously (avoids popup blocker)
  const win = window.open('about:blank', '_blank');
  if (!win) { window.location.href = url; return; }

  // Write an auto-submitting login form that redirects to the target URL
  const loginAction = `${siteOrigin}/login/index.php`;
  const escaped = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:system-ui;color:#888;background:#f5f5f5}
@media(prefers-color-scheme:dark){body{background:#1c1c1e;color:#888}}</style></head>
<body><p>登入中...</p>
<form id="f" method="POST" action="${escaped(loginAction)}">
<input type="hidden" name="username" value="${escaped(username)}">
<input type="hidden" name="password" value="${escaped(password)}">
<input type="hidden" name="anchor" value="">
<input type="hidden" name="wantsurl" value="${escaped(url)}">
</form>
<script>document.getElementById('f').submit();</script>
</body></html>`);
  win.document.close();
}
