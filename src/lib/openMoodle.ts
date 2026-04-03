import { getAutoLoginUrl } from '@/api/moodle';

export function openMoodle(url: string) {
  // Must open window synchronously within user gesture to avoid popup blocker
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  // Then try to upgrade to autologin URL
  getAutoLoginUrl(url).then(loginUrl => {
    if (loginUrl !== url && win) {
      win.location.href = loginUrl;
    }
  }).catch(() => {});
}
