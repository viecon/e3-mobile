import { useState, useEffect } from 'react';

import { getPendingAssignments, getNews, type Assignment } from '@/api/moodle';
import { AssignmentCard } from '@/components/AssignmentCard';
import { formatDate } from '@/lib/time';
import * as storage from '@/lib/storage';

function stripHtml(html: string): string {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

type NewsItem = { subject: string; message: string; author: string; time: number; courseName: string };
let cachedAssignments: Assignment[] | null = null;
let cachedNews: NewsItem[] | null = null;

export function HomePage() {
  const [assignments, setAssignments] = useState<Assignment[]>(cachedAssignments ?? []);
  const [news, setNews] = useState<NewsItem[]>(cachedNews ?? []);
  const [loading, setLoading] = useState(cachedAssignments === null);
  const [expandedNews, setExpandedNews] = useState<Set<number>>(new Set());
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
      setAssignments(a);
      setNews(n);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <p className="text-e3-muted text-xs">NYCU E3</p>
        <h1 className="text-xl font-bold text-e3-text mt-0.5">{fullname}</h1>
      </div>

      {/* Assignments */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-e3-text">
            未繳作業
            {assignments.length > 0 && (
              <span className="ml-2 bg-e3-danger/20 text-e3-danger text-xs px-1.5 py-0.5 rounded-full">
                {assignments.length}
              </span>
            )}
          </h2>
          <button onClick={load} className="text-xs text-e3-accent active:text-blue-400">
            重新整理
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-e3-card rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-e3-border rounded w-3/4 mb-2" />
                <div className="h-3 bg-e3-border rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-e3-muted text-center py-8">沒有未繳作業</p>
        ) : (
          <div className="space-y-2">
            {assignments.map(a => <AssignmentCard key={a.id} a={a} />)}
          </div>
        )}
      </section>

      {/* News */}
      {news.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-e3-text mb-3">最新公告 ({news.length})</h2>
          <div className="space-y-2">
            {news.map((n, i) => {
              const isOpen = expandedNews.has(i);
              const body = stripHtml(n.message);
              return (
                <div
                  key={i}
                  className="bg-e3-card rounded-xl p-4 cursor-pointer active:bg-e3-border transition-colors"
                  onClick={() => setExpandedNews(prev => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i); else next.add(i);
                    return next;
                  })}
                >
                  <p className="text-sm text-e3-text">{n.subject}</p>
                  {n.courseName && (
                    <p className="text-xs text-e3-accent mt-1">{n.courseName.split('.').pop()?.trim()}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-e3-muted">{n.author}</span>
                    <span className="text-xs text-e3-muted">{formatDate(n.time)}</span>
                  </div>
                  {isOpen && body && (
                    <p className="text-xs text-e3-muted mt-2 whitespace-pre-line leading-relaxed border-t border-e3-border pt-2">
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
  );
}
