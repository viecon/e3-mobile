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

  // Unique course names for filter chips
  const courseNames = [...new Set(notifs.map(n => n.courseName).filter(Boolean))] as string[];

  const filtered = filter === 'all'
    ? notifs
    : filter === 'system'
      ? notifs.filter(n => !n.courseName)
      : notifs.filter(n => n.courseName === filter);

  // Extract short Chinese name for chip label
  const chipLabel = (fullname: string) => {
    const last = fullname.split('.').pop() || fullname;
    return last.match(/[\u4e00-\u9fff]+/g)?.join('').slice(0, 6) || last.slice(0, 10);
  };

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="p-4">
      <h1 className="text-lg font-bold text-e3-text mb-3">通知</h1>

      {/* Filter chips */}
      {courseNames.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setFilter('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === 'all' ? 'bg-e3-accent text-white' : 'bg-e3-card text-e3-muted'
            }`}
          >
            全部
          </button>
          {courseNames.map(name => (
            <button
              key={name}
              onClick={() => setFilter(name)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === name ? 'bg-e3-accent text-white' : 'bg-e3-card text-e3-muted'
              }`}
            >
              {chipLabel(name)}
            </button>
          ))}
          <button
            onClick={() => setFilter('system')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === 'system' ? 'bg-e3-accent text-white' : 'bg-e3-card text-e3-muted'
            }`}
          >
            系統
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-e3-card rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-e3-border rounded w-3/4 mb-2" />
              <div className="h-3 bg-e3-border rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-e3-muted text-center py-12">沒有通知</p>
      ) : (
        <div className="space-y-1">
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
                className={`p-4 rounded-xl transition-colors cursor-pointer active:bg-e3-border ${n.read ? 'bg-e3-card' : 'bg-e3-accent/10'}`}
              >
                <p className={`text-sm ${n.read ? 'text-e3-muted' : 'text-e3-text font-medium'}`}>
                  {n.subject}
                </p>
                {n.courseName && (
                  <p className="text-xs text-e3-accent mt-1">
                    {n.courseName.split('.').pop()?.trim()}
                  </p>
                )}
                {isOpen && n.body ? (
                  <p className="text-xs text-e3-muted mt-2 whitespace-pre-line leading-relaxed border-t border-e3-border pt-2">{n.body}</p>
                ) : (
                  <p className="text-xs text-e3-muted mt-1 line-clamp-1">{n.message}</p>
                )}
                <p className="text-[10px] text-e3-muted/60 mt-1.5">{formatDateTime(n.time)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}
