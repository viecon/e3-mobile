import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getCourses } from '@/api/moodle';
import { PullToRefresh } from '@/components/PullToRefresh';

type Course = { id: number; shortname: string; fullname: string };
let cachedCourses: Course[] | null = null;

export function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>(cachedCourses ?? []);
  const [loading, setLoading] = useState(cachedCourses === null);

  const refresh = async () => {
    try {
      const c = await getCourses();
      cachedCourses = c;
      setCourses(c);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (!cachedCourses) setLoading(true);
    refresh();
  }, []);

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="px-4 pt-2 pb-4">
      <h1 className="text-[28px] font-bold text-e3-text mb-4">課程</h1>

      {loading ? (
        <div className="bg-e3-card rounded-xl overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="px-4 py-3 animate-pulse">
              <div className="h-4 bg-e3-bg rounded w-3/4 mb-1.5" />
              <div className="h-3 bg-e3-bg rounded w-1/3" />
              {i < 5 && <div className="border-b border-e3-separator mt-3 -mx-4 ml-0" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-e3-card rounded-xl overflow-hidden divide-y divide-e3-separator">
          {courses.map(c => (
            <div
              key={c.id}
              onClick={() => navigate(`/course/${c.id}?name=${encodeURIComponent(c.fullname)}`)}
              className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-e3-bg transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[15px] text-e3-text">{c.fullname}</p>
                <p className="text-[13px] text-e3-muted mt-0.5">{c.shortname}</p>
              </div>
              <svg className="w-4 h-4 text-e3-muted shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}
