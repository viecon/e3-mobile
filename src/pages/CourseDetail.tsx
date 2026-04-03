import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseNews, getCourseAssignments, getCourseContent, type CourseAssignment, type CourseSection } from '@/api/moodle';
import { PullToRefresh } from '@/components/PullToRefresh';
import { formatDate, formatDateTime, timeLeft, urgencyColor } from '@/lib/time';
import * as storage from '@/lib/storage';
import { stripHtml } from '@/lib/html';
import { openMoodle } from '@/lib/openMoodle';

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExt(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

type Tab = 'news' | 'assignments' | 'content';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const courseid = Number(id);
  const courseName = new URLSearchParams(location.hash.split('?')[1] || '').get('name') || '';

  const [tab, setTab] = useState<Tab>('news');
  const [news, setNews] = useState<{ subject: string; message: string; author: string; time: number }[]>([]);
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNews, setExpandedNews] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const [n, a, c] = await Promise.all([
        getCourseNews(courseid).catch(() => []),
        getCourseAssignments(courseid).catch(() => []),
        getCourseContent(courseid).catch(() => []),
      ]);
      setNews(n);
      setAssignments(a);
      setSections(c);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [courseid]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'news', label: `公告 (${news.length})` },
    { key: 'assignments', label: `作業 (${assignments.length})` },
    { key: 'content', label: '教材' },
  ];

  return (
    <PullToRefresh onRefresh={load}>
    <div className="px-4 pt-2 pb-4">
      {/* Back + Title */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => navigate('/courses')} className="text-e3-accent text-[15px] cursor-pointer">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold text-e3-text truncate">{courseName}</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-e3-card rounded-lg p-0.5 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 text-[13px] font-medium rounded-md cursor-pointer transition-colors ${
              tab === t.key ? 'bg-e3-bg text-e3-text' : 'text-e3-muted'
            }`}
          >
            {loading ? t.key === 'content' ? '教材' : t.key === 'news' ? '公告' : '作業' : t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-e3-card rounded-xl overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="px-4 py-3 animate-pulse">
              <div className="h-4 bg-e3-bg rounded w-3/4 mb-1.5" />
              <div className="h-3 bg-e3-bg rounded w-1/2" />
              {i < 3 && <div className="border-b border-e3-separator mt-3" />}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* News tab */}
          {tab === 'news' && (
            news.length === 0 ? (
              <div className="bg-e3-card rounded-xl px-4 py-8">
                <p className="text-[15px] text-e3-muted text-center">沒有公告</p>
              </div>
            ) : (
              <div className="bg-e3-card rounded-xl overflow-hidden divide-y divide-e3-separator">
                {news.map((n) => {
                  const key = `${n.time}-${n.subject}`;
                  const isOpen = expandedNews.has(key);
                  const body = stripHtml(n.message);
                  return (
                    <div
                      key={key}
                      className="px-4 py-3 cursor-pointer active:bg-e3-bg transition-colors"
                      onClick={() => setExpandedNews(prev => {
                        const next = new Set(prev);
                        if (next.has(key)) next.delete(key); else next.add(key);
                        return next;
                      })}
                    >
                      <p className="text-[15px] text-e3-text">{n.subject}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[13px] text-e3-muted">{n.author}</span>
                        <span className="text-[13px] text-e3-muted">{formatDate(n.time)}</span>
                      </div>
                      {isOpen && body && (
                        <p className="text-[13px] text-e3-muted mt-2 whitespace-pre-line leading-relaxed border-t border-e3-separator pt-2">{body}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Assignments tab */}
          {tab === 'assignments' && (
            assignments.length === 0 ? (
              <div className="bg-e3-card rounded-xl px-4 py-8">
                <p className="text-[15px] text-e3-muted text-center">沒有作業</p>
              </div>
            ) : (
              <div className="bg-e3-card rounded-xl overflow-hidden divide-y divide-e3-separator">
                {assignments.map(a => {
                  const due = a.duedate > 0 ? timeLeft(a.duedate) : null;
                  const color = a.submitted ? 'text-e3-success' : a.duedate > 0 ? urgencyColor(a.duedate) : 'text-e3-muted';
                  return (
                    <div key={a.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] text-e3-text">{a.name}</p>
                          <p className="text-[13px] text-e3-muted mt-0.5">
                            {a.duedate > 0 ? formatDateTime(a.duedate) : '無截止日'}
                          </p>
                        </div>
                        <span className={`text-[13px] font-medium shrink-0 ${color}`}>
                          {a.submitted ? '已繳交' : due ? due.text : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Content tab */}
          {tab === 'content' && (() => {
            const token = storage.getToken() || '';
            const nonEmpty = sections.filter(s => s.modules.length > 0);
            return nonEmpty.length === 0 ? (
              <div className="bg-e3-card rounded-xl px-4 py-8">
                <p className="text-[15px] text-e3-muted text-center">沒有教材</p>
              </div>
            ) : (
              <div className="space-y-4">
                {nonEmpty.map(s => (
                  <div key={s.id}>
                    {s.name && (
                      <h3 className="text-[13px] font-medium text-e3-muted uppercase tracking-wide mb-2 px-1">{s.name}</h3>
                    )}
                    <div className="bg-e3-card rounded-xl overflow-hidden divide-y divide-e3-separator">
                      {s.modules.map(m => {
                        const files = m.contents?.filter(c => c.filesize > 0) || [];
                        if (files.length > 0) {
                          return files.map((f, fi) => {
                            const url = f.fileurl.includes('?')
                              ? `${f.fileurl}&token=${token}`
                              : `${f.fileurl}?token=${token}`;
                            const ext = fileExt(f.filename);
                            return (
                              <a
                                key={`${m.id}-${fi}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer active:bg-e3-bg transition-colors"
                              >
                                <span className={`text-[11px] font-medium rounded px-1.5 py-0.5 shrink-0 uppercase ${
                                  ext === 'pdf' ? 'bg-e3-danger/10 text-e3-danger' :
                                  ['pptx', 'ppt'].includes(ext) ? 'bg-e3-warning/10 text-e3-warning' :
                                  ['doc', 'docx'].includes(ext) ? 'bg-e3-accent/10 text-e3-accent' :
                                  'bg-e3-bg text-e3-muted'
                                }`}>{ext || 'file'}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[15px] text-e3-text truncate">{files.length > 1 ? f.filename : m.name || f.filename}</p>
                                  <p className="text-[11px] text-e3-muted">{fileSize(f.filesize)}</p>
                                </div>
                                <svg className="w-4 h-4 text-e3-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </a>
                            );
                          });
                        }
                        return (
                          <div
                            key={m.id}
                            onClick={() => m.url && openMoodle(m.url)}
                            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer active:bg-e3-bg transition-colors"
                          >
                            <span className="text-[11px] text-e3-muted bg-e3-bg rounded px-1.5 py-0.5 shrink-0">{m.modname}</span>
                            <span className="text-[15px] text-e3-text min-w-0 flex-1">{m.name}</span>
                            <svg className="w-4 h-4 text-e3-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </>
      )}
    </div>
    </PullToRefresh>
  );
}
