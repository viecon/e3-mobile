import { useState, useMemo } from 'react';
import { getCached } from '@/lib/cache';
import { formatDate } from '@/lib/time';
import type { Notification } from '@/api/moodle';

type NewsItem = { subject: string; message: string; author: string; time: number; courseName: string };

interface SearchResult {
  type: 'news' | 'notification';
  title: string;
  subtitle: string;
  time: number;
  body?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    const news = getCached<NewsItem[]>('home_news') ?? [];
    for (const n of news) {
      if (n.subject.toLowerCase().includes(q) || n.message.toLowerCase().includes(q) || n.courseName.toLowerCase().includes(q)) {
        items.push({
          type: 'news',
          title: n.subject,
          subtitle: n.courseName ? `${n.courseName.split('.').pop()?.trim()} · ${n.author}` : n.author,
          time: n.time,
          body: stripHtml(n.message),
        });
      }
    }

    const notifs = getCached<Notification[]>('notifications') ?? [];
    for (const n of notifs) {
      if (n.subject.toLowerCase().includes(q) || n.message.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)) {
        items.push({
          type: 'notification',
          title: n.subject,
          subtitle: n.courseName ? n.courseName.split('.').pop()?.trim() || '' : '系統',
          time: n.time,
          body: n.body,
        });
      }
    }

    return items.sort((a, b) => b.time - a.time);
  }, [query]);

  return (
    <div className="px-4 pt-2 pb-4">
      <h1 className="text-[28px] font-bold text-e3-text mb-3">搜尋</h1>

      <div className="bg-e3-card rounded-lg px-3 py-2 mb-4">
        <input
          type="text"
          placeholder="搜尋公告、通知..."
          value={query}
          onChange={e => { setQuery(e.target.value); setExpanded(new Set()); }}
          className="w-full bg-transparent text-[15px] text-e3-text placeholder:text-e3-muted focus:outline-none"
          autoFocus
        />
      </div>

      {query.trim() && results.length === 0 ? (
        <div className="bg-e3-card rounded-xl px-4 py-8">
          <p className="text-[15px] text-e3-muted text-center">沒有搜尋結果</p>
        </div>
      ) : results.length > 0 ? (
        <div className="bg-e3-card rounded-xl overflow-hidden divide-y divide-e3-separator">
          {results.map((r, i) => {
            const isOpen = expanded.has(i);
            return (
              <div
                key={i}
                className="px-4 py-3 cursor-pointer active:bg-e3-bg transition-colors"
                onClick={() => setExpanded(prev => {
                  const next = new Set(prev);
                  if (next.has(i)) next.delete(i); else next.add(i);
                  return next;
                })}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                    r.type === 'news' ? 'bg-e3-accent/10 text-e3-accent' : 'bg-e3-warning/10 text-e3-warning'
                  }`}>
                    {r.type === 'news' ? '公告' : '通知'}
                  </span>
                  <span className="text-[11px] text-e3-muted">{formatDate(r.time)}</span>
                </div>
                <p className="text-[15px] text-e3-text">{r.title}</p>
                <p className="text-[13px] text-e3-muted mt-0.5">{r.subtitle}</p>
                {isOpen && r.body && (
                  <p className="text-[13px] text-e3-muted mt-2 whitespace-pre-line leading-relaxed border-t border-e3-separator pt-2">
                    {r.body}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[13px] text-e3-muted text-center py-8">輸入關鍵字搜尋公告和通知</p>
      )}
    </div>
  );
}
