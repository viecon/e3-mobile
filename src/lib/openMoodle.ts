import { getAutoLoginUrl } from '@/api/moodle';

export function openMoodle(url: string) {
  // Open window synchronously within user gesture to avoid popup blocker
  const win = window.open('about:blank', '_blank');
  if (!win) { window.location.href = url; return; }

  // Show loading while trying autologin
  win.document.title = '載入中...';
  win.document.body.innerHTML = '<p style="font-family:system-ui;text-align:center;margin-top:40vh;color:#888">載入中...</p>';

  // Try autologin, with a short timeout so it doesn't hang
  const timeout = new Promise<string>(resolve => setTimeout(() => resolve(url), 3000));
  Promise.race([getAutoLoginUrl(url), timeout]).then(loginUrl => {
    win.location.href = loginUrl;
  }).catch(() => {
    win.location.href = url;
  });
}
