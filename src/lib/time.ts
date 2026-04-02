export function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeLeft(dueTs: number): { text: string; urgent: boolean; overdue: boolean } {
  const now = Date.now() / 1000;
  const diff = dueTs - now;

  if (diff < 0) return { text: '已逾期', urgent: true, overdue: true };

  const hours = Math.floor(diff / 3600);
  if (hours < 24) return { text: `${hours}h`, urgent: true, overdue: false };

  const days = Math.floor(hours / 24);
  return { text: `${days}d`, urgent: days < 3, overdue: false };
}

export function urgencyColor(dueTs: number): string {
  const now = Date.now() / 1000;
  const hours = (dueTs - now) / 3600;
  if (hours < 0) return 'text-e3-danger';
  if (hours < 24) return 'text-e3-danger';
  if (hours < 72) return 'text-e3-warning';
  return 'text-e3-success';
}
