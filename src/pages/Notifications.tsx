import { useState, useEffect } from 'react';

import { getNotifications } from '@/api/moodle';
import { formatDateTime } from '@/lib/time';

export function NotificationsPage() {
  const [notifs, setNotifs] = useState<{ id: number; subject: string; message: string; time: number; read: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications().then(setNotifs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold text-e3-text mb-4">通知</h1>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-e3-card rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-e3-border rounded w-3/4 mb-2" />
              <div className="h-3 bg-e3-border rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <p className="text-sm text-e3-muted text-center py-12">沒有通知</p>
      ) : (
        <div className="space-y-1">
          {notifs.map(n => (
            <div
              key={n.id}
              className={`p-4 rounded-xl transition-colors ${n.read ? 'bg-e3-card' : 'bg-e3-accent/10'}`}
            >
              <p className={`text-sm ${n.read ? 'text-e3-muted' : 'text-e3-text font-medium'}`}>
                {n.subject}
              </p>
              <p className="text-xs text-e3-muted mt-1 line-clamp-1">{n.message}</p>
              <p className="text-[10px] text-e3-muted/60 mt-1.5">{formatDateTime(n.time)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
