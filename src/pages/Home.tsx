import { useState, useEffect } from 'react';

import { getPendingAssignments, getNews, type Assignment } from '@/api/moodle';
import { AssignmentCard } from '@/components/AssignmentCard';
import { PullToRefresh } from '@/components/PullToRefresh';
import { formatDate } from '@/lib/time';
import { cycleTheme, getTheme, themeLabel } from '@/lib/theme';
import * as storage from '@/lib/storage';
import { getCached, setCache } from '@/lib/cache';

function stripHtml(html: string): string {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

type NewsItem = { subject: string; message: string; author: string; time: number; courseName: string };
let cachedAssignments: Assignment[] | null = getCached('home_assignments');
let cachedNews: NewsItem[] | null = getCached('home_news');

export function HomePage() {
  const [assignments, setAssignments] = useState<Assignment[]>(cachedAssignments ?? []);
  const [news, setNews] = useState<NewsItem[]>(cachedNews ?? []);
  const [loading, setLoading] = useState(cachedAssignments === null);
  const [expandedNews, setExpandedNews] = useState<Set<number>>(new Set());
  const [theme, setThemeState] = useState(getTheme());
  const fullname = storage.get('fullname') || '';

  useEffect(() => { load(); }, []);

  const load = async () => {
    if (!cachedAssignments) setLoading(true);
    try {
      const [a, n] = await Promise.all([
        getPendingAssignments(),
        getNews().catch(() => []),
      ]);
      cachedAssignments = a;
      cachedNews = n;
      setCache('home_assignments', a);
      setCache('home_news', n);
      setAssignments(a);
      setNews(n);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  return (
    <PullToRefresh onRefresh={load}>
    <div className="px-4 pt-2 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[28px] font-bold text-e3-text">{fullname}</p>
        <button
          onClick={() => setThemeState(cycleTheme())}
          className="text-[13px] text-e3-muted bg-e3-card px-2.5 py-1 rounded-full cursor-pointer active:opacity-60"
        >
          {themeLabel[theme]}
        </button>
      </div>

      {/* Assignments */}
      <section>
        <div className="flex items-baseline justify-between mb-2 px-1">
          <h2 className="text-[13px] font-medium text-e3-muted uppercase tracking-wide">
            未繳作業
          </h2>
          {assignments.length > 0 && (
            <span className="text-[13px] font-medium text-e3-danger">
              {assignments.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-e3-card rounded-xl overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="px-4 py-3.5 animate-pulse">
                <div className="h-4 bg-e3-bg rounded w-3/4 mb-2" />
                <div className="h-3 bg-e3-bg rounded w-1/2" />
                {i < 3 && <div className="border-b border-e3-separator mt-3.5 -mx-4 ml-0" />}
              </div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-e3-card rounded-xl px-4 py-6">
            <p className="text-[15px] text-e3-muted text-center">沒有未繳作業</p>
          </div>
        ) : (
          <div className="bg-e3-card rounded-xl overflow-hidden divide-y divide-e3-separator">
            {assignments.map(a => <AssignmentCard key={a.id} a={a} />)}
          </div>
        )}
      </section>

      {/* News */}
      {news.length > 0 && (
        <section>
          <h2 className="text-[13px] font-medium text-e3-muted uppercase tracking-wide mb-2 px-1">
            最新公告
          </h2>
          <div className="bg-e3-card rounded-xl overflow-hidden divide-y divide-e3-separator">
            {news.map((n, i) => {
              const isOpen = expandedNews.has(i);
              const body = stripHtml(n.message);
              return (
                <div
                  key={i}
                  className="px-4 py-3 cursor-pointer active:bg-e3-bg transition-colors"
                  onClick={() => setExpandedNews(prev => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i); else next.add(i);
                    return next;
                  })}
                >
                  <p className="text-[15px] text-e3-text">{n.subject}</p>
                  {n.courseName && (
                    <p className="text-[13px] text-e3-accent mt-0.5">{n.courseName.split('.').pop()?.trim()}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[13px] text-e3-muted">{n.author}</span>
                    <span className="text-[13px] text-e3-muted">{formatDate(n.time)}</span>
                  </div>
                  {isOpen && body && (
                    <p className="text-[13px] text-e3-muted mt-2 whitespace-pre-line leading-relaxed border-t border-e3-separator pt-2">
                      {body}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
    </PullToRefresh>
  );
}
