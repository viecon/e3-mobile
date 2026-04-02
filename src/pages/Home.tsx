import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getPendingAssignments, getNews, type Assignment } from '@/api/moodle';
import { AssignmentCard } from '@/components/AssignmentCard';
import { PullToRefresh } from '@/components/PullToRefresh';
import { formatDate } from '@/lib/time';
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
  const navigate = useNavigate();
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/search')}
            className="text-e3-muted bg-e3-card w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:opacity-60"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className="text-e3-muted bg-e3-card w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:opacity-60"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="text-e3-muted bg-e3-card w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:opacity-60"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
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
