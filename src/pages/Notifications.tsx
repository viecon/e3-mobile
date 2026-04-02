import { useState, useEffect } from 'react';
import { getNotifications, type Notification } from '@/api/moodle';
import { PullToRefresh } from '@/components/PullToRefresh';
import { formatDateTime } from '@/lib/time';

let cachedNotifs: Notification[] | null = null;

export function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>(cachedNotifs ?? []);
  const [loading, setLoading] = useState(cachedNotifs === null);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const refresh = async () => {
    try {
      const n = await getNotifications();
      cachedNotifs = n;
      setNotifs(n);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (!cachedNotifs) setLoading(true);
    refresh();
  }, []);

  const courseNames = [...new Set(notifs.map(n => n.courseName).filter(Boolean))] as string[];

  const filtered = filter === 'all'
    ? notifs
    : filter === 'system'
      ? notifs.filter(n => !n.courseName)
      : notifs.filter(n => n.courseName === filter);

  const chipLabel = (fullname: string) => fullname.split('.').pop()?.trim() || fullname;

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="px-4 pt-2 pb-4">
      <h1 className="text-[28px] font-bold text-e3-text mb-3">通知</h1>

      {/* Filter chips */}
      {courseNames.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setFilter('all')}
            className={`shrink-0 px-3 py-1 rounded-full text-[13px] font-medium cursor-pointer transition-colors ${
              filter === 'all' ? 'bg-e3-accent text-white' : 'bg-e3-card text-e3-muted'
            }`}
          >
            全部
          </button>
          {courseNames.map(name => (
            <button
              key={name}
              onClick={() => setFilter(name)}
              className={`shrink-0 px-3 py-1 rounded-full text-[13px] font-medium cursor-pointer transition-colors ${
                filter === name ? 'bg-e3-accent text-white' : 'bg-e3-card text-e3-muted'
              }`}
            >
              {chipLabel(name)}
            </button>
          ))}
          <button
            onClick={() => setFilter('system')}
            className={`shrink-0 px-3 py-1 rounded-full text-[13px] font-medium cursor-pointer transition-colors ${
              filter === 'system' ? 'bg-e3-accent text-white' : 'bg-e3-card text-e3-muted'
            }`}
          >
            系統
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-e3-card rounded-xl overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="px-4 py-3 animate-pulse">
              <div className="h-4 bg-e3-bg rounded w-3/4 mb-1.5" />
              <div className="h-3 bg-e3-bg rounded w-1/2" />
              {i < 4 && <div className="border-b border-e3-separator mt-3 -mx-4 ml-0" />}
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-e3-card rounded-xl px-4 py-8">
          <p className="text-[15px] text-e3-muted text-center">沒有通知</p>
        </div>
      ) : (
        <div className="bg-e3-card rounded-xl overflow-hidden divide-y divide-e3-separator">
          {filtered.map(n => {
            const isOpen = expanded.has(n.id);
            return (
              <div
                key={n.id}
                onClick={() => setExpanded(prev => {
                  const next = new Set(prev);
                  if (next.has(n.id)) next.delete(n.id); else next.add(n.id);
                  return next;
                })}
                className={`px-4 py-3 cursor-pointer active:bg-e3-bg transition-colors ${!n.read ? 'bg-e3-accent/5' : ''}`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <div className="w-2 h-2 rounded-full bg-e3-accent mt-1.5 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className={`text-[15px] ${n.read ? 'text-e3-text' : 'text-e3-text font-medium'}`}>
                      {n.subject}
                    </p>
                    {n.courseName && (
                      <p className="text-[13px] text-e3-accent mt-0.5">
                        {n.courseName.split('.').pop()?.trim()}
                      </p>
                    )}
                    {isOpen && n.body ? (
                      <p className="text-[13px] text-e3-muted mt-2 whitespace-pre-line leading-relaxed border-t border-e3-separator pt-2">{n.body}</p>
                    ) : (
                      <p className="text-[13px] text-e3-muted mt-0.5 line-clamp-1">{n.message}</p>
                    )}
                    <p className="text-[11px] text-e3-muted mt-1">{formatDateTime(n.time)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}
