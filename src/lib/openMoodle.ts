import * as storage from '@/lib/storage';

async function fetchLoginToken(proxyUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${proxyUrl}/login/index.php`);
    const html = await res.text();
    const match = html.match(/name="logintoken"\s+value="([^"]+)"/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function openMoodle(url: string) {
  const username = storage.get('username');
  const password = storage.get('password');
  const proxyUrl = storage.getProxyUrl();

  if (!username || !password || !proxyUrl) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // Extract Moodle site origin from the target URL
  let siteOrigin: string;
  try {
    siteOrigin = new URL(url).origin;
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // Open window synchronously to avoid popup blocker
  const win = window.open('about:blank', '_blank');
  if (!win) { window.location.href = url; return; }

  // Show loading state
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:system-ui;color:#888;background:#f5f5f5}
@media(prefers-color-scheme:dark){body{background:#1c1c1e}}</style></head>
<body><p>登入中...</p></body></html>`);
  win.document.close();

  const escaped = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const loginAction = `${siteOrigin}/login/index.php`;

  // Try to get logintoken, then submit form
  fetchLoginToken(proxyUrl).then(logintoken => {
    const tokenField = logintoken
      ? `<input type="hidden" name="logintoken" value="${escaped(logintoken)}">`
      : '';

    win.document.open();
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<form id="f" method="POST" action="${escaped(loginAction)}">
<input type="hidden" name="username" value="${escaped(username)}">
<input type="hidden" name="password" value="${escaped(password)}">
<input type="hidden" name="anchor" value="">
<input type="hidden" name="wantsurl" value="${escaped(url)}">
${tokenField}
</form>
<script>document.getElementById('f').submit();<\/script>
</body></html>`);
    win.document.close();
  }).catch(() => {
    win.location.href = url;
  });
}
