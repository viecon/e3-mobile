import { getAutoLoginUrl } from '@/api/moodle';

export function openMoodle(url: string) {
  // Must open window synchronously within user gesture to avoid popup blocker
  // Cannot use noopener here because we need the reference to redirect later
  const win = window.open('about:blank', '_blank');
  if (!win) { window.location.href = url; return; }
  // Show original URL immediately as fallback
  win.location.href = url;
  // Then try to upgrade to autologin URL
  getAutoLoginUrl(url).then(loginUrl => {
    if (loginUrl !== url) {
      win.location.href = loginUrl;
    }
  }).catch(() => {});
}
