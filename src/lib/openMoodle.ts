import { getAutoLoginUrl } from '@/api/moodle';

export async function openMoodle(url: string) {
  const loginUrl = await getAutoLoginUrl(url);
  window.open(loginUrl, '_blank', 'noopener,noreferrer');
}
