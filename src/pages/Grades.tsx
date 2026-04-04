import { useState, useEffect } from 'react';
import { getGrades, type CourseGrade } from '@/api/moodle';
import { PullToRefresh } from '@/components/PullToRefresh';
import { getCached, setCache } from '@/lib/cache';
import { shortCourseName } from '@/lib/course';

export function GradesPage() {
  const [grades, setGrades] = useState<CourseGrade[]>(() => getCached('grades') ?? []);
  const [loading, setLoading] = useState(() => getCached('grades') === null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const refresh = async () => {
    try {
      const g = await getGrades();
      setCache('grades', g);
      setGrades(g);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (!getCached('grades')) setLoading(true);
    refresh();
  }, []);

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="px-4 pt-2 pb-4">
      <h1 className="text-[28px] font-bold text-e3-text mb-4">成績</h1>

      {loading ? (
        <div className="bg-e3-card rounded-xl overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="px-4 py-3 animate-pulse">
              <div className="h-4 bg-e3-bg rounded w-3/4 mb-1.5" />
              <div className="h-3 bg-e3-bg rounded w-1/3" />
              {i < 3 && <div className="border-b border-e3-separator mt-3 -mx-4 ml-0" />}
            </div>
          ))}
        </div>
      ) : grades.length === 0 ? (
        <div className="bg-e3-card rounded-xl px-4 py-8">
          <p className="text-[15px] text-e3-muted text-center">沒有成績資料</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grades.map(g => {
            const isOpen = expanded.has(g.courseid);
            return (
              <div key={g.courseid} className="bg-e3-card rounded-xl overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-e3-bg transition-colors"
                  onClick={() => setExpanded(prev => {
                    const next = new Set(prev);
                    if (next.has(g.courseid)) next.delete(g.courseid); else next.add(g.courseid);
                    return next;
                  })}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] text-e3-text">{shortCourseName(g.courseName)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[15px] font-medium text-e3-accent">{g.total}</span>
                    <svg className={`w-4 h-4 text-e3-muted transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-e3-separator divide-y divide-e3-separator">
                    {g.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-[13px] text-e3-text min-w-0 flex-1 mr-3">{item.itemname}</span>
                        <span className="text-[13px] text-e3-muted shrink-0">
                          {item.grade === '-' ? '-' : `${item.grade} / ${item.grademax}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}
